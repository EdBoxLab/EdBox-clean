// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'developer' | 'function';

interface FileAttachment {
    name: string;
    type: string;
    size: number;
    content: string; // base64 encoded content
}

interface ChatMessage {
    role: ChatRole;
    content: string;
    attachments?: FileAttachment[];
}

// Helper function to process different file types
async function processFileContent(file: FileAttachment): Promise<string> {
    const { name, type, content } = file;

    try {
        // Decode base64 content
        const buffer = Buffer.from(content, 'base64');

        // Handle text files
        if (type.startsWith('text/') ||
            type === 'application/json' ||
            type === 'application/javascript' ||
            type === 'application/typescript') {
            return buffer.toString('utf-8');
        }

        // Handle PDFs (basic text extraction - you may want to use pdf-parse library)
        if (type === 'application/pdf') {
            return `[PDF file: ${name}] - Content extraction requires additional processing. File size: ${file.size} bytes`;
        }

        // Handle images
        if (type.startsWith('image/')) {
            return `[Image file: ${name}] - Image analysis available. Type: ${type}, Size: ${file.size} bytes`;
        }

        // Handle documents
        if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            type === 'application/msword') {
            return `[Word document: ${name}] - Document processing available. Size: ${file.size} bytes`;
        }

        if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            type === 'application/vnd.ms-excel') {
            return `[Excel file: ${name}] - Spreadsheet analysis available. Size: ${file.size} bytes`;
        }

        // Default fallback
        return `[File: ${name}] - Type: ${type}, Size: ${file.size} bytes`;
    } catch (error) {
        console.error('Error processing file:', error);
        return `[Error processing file: ${name}]`;
    }
}

// Helper to format message with attachments
function formatMessageWithAttachments(message: string, attachments?: FileAttachment[]): string {
    if (!attachments || attachments.length === 0) {
        return message;
    }

    return `${message}\n\n[User attached ${attachments.length} file(s)]`;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        // Secure auth
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request JSON safely
        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const { conversationId, message, attachments } = body ?? {};

        if (!message || !(typeof message === 'string') || !message.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Validate attachments if present
        if (attachments && !Array.isArray(attachments)) {
            return NextResponse.json({ error: 'Attachments must be an array' }, { status: 400 });
        }

        // Create Supabase conversation if missing
        let currentConversationId = conversationId;
        if (!currentConversationId) {
            const { data: newConversation, error: convError } = await supabase
                .from('chat_conversations')
                .insert({
                    user_id: user.id,
                    title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
                })
                .select()
                .single();

            if (convError) throw convError;
            currentConversationId = (newConversation as any).id;
        }

        // Process attachments and build enhanced message content
        let enhancedMessage = message;
        const processedFiles: string[] = [];

        if (attachments && attachments.length > 0) {
            for (const attachment of attachments) {
                const fileContent = await processFileContent(attachment);
                processedFiles.push(`\n--- File: ${attachment.name} ---\n${fileContent}\n--- End of ${attachment.name} ---`);
            }

            if (processedFiles.length > 0) {
                enhancedMessage = `${message}\n\nAttached files:\n${processedFiles.join('\n')}`;
            }
        }

        // Save user message (store original message + metadata about attachments)
        const messageData: any = {
            conversation_id: currentConversationId,
            role: 'user',
            content: message,
        };

        // Store attachment metadata as JSONB
        if (attachments && attachments.length > 0) {
            messageData.metadata = {
                attachments: attachments.map((file: FileAttachment) => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                }))
            };
        }

        const { data: userMessageData, error: userMsgError } = await supabase
            .from('chat_messages')
            .insert(messageData)
            .select('id')
            .single();

        if (userMsgError) throw userMsgError;

        // Fetch profile for personalization
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('education, country, age')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.warn('Profile fetch error:', profileError);
        }

        const educationLevel = (profile as any)?.education || 'General Learner';
        const userCountry = (profile as any)?.country || 'Global';
        const userAge = (profile as any)?.age ? `, Age: ${(profile as any).age}` : '';

        // Get recent conversation history
        const { data: recentHistory } = await supabase
            .from('chat_messages')
            .select('role, content, metadata, id, created_at')
            .eq('conversation_id', currentConversationId)
            .neq('id', (userMessageData as any).id)
            .order('created_at', { ascending: false })
            .limit(30);

        const history = recentHistory ? [...recentHistory].reverse() : [];

        // Build messages array with context from previous attachments
        const conversationHistory: Array<{ role: ChatRole; content: string }> = history.map((msg: any) => {
            const role: ChatRole = msg.role === 'user' ? 'user' : 'assistant';
            let content = String(msg.content ?? '');

            // Add context about attachments in previous messages
            if (msg.metadata?.attachments && msg.metadata.attachments.length > 0) {
                const fileNames = msg.metadata.attachments.map((a: any) => a.name).join(', ');
                content += `\n[Previously attached: ${fileNames}]`;
            }

            return { role, content };
        });

        const systemPrompt = `Role: Act as a student companion for EdBox — part mentor, part friend, part challenger.
User education: ${educationLevel}
User country: ${userCountry}${userAge}

When users share files (code, documents, images, PDFs):
- Analyze the content carefully and provide specific, helpful feedback
- For code files: review for bugs, suggest improvements, explain concepts
- For documents: summarize, answer questions, provide insights
- For images: describe what you see and relate it to the learning context
- Always reference specific parts of the uploaded content in your response

Be concise, help with code and curriculum, ask clarifying questions only when necessary.`;

        // Create Groq client
        const groqApiKey =
            process.env.GROQ_API_KEY ??
            process.env.GROQ_API_KEY_3 ??
            process.env.GROQ_API_KEY_4;

        if (!groqApiKey) {
            return NextResponse.json(
                { error: 'GROQ API key not configured. Set up your GROQ API key in your .env.local.' },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey: groqApiKey });
        const model = process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

        // Build final messages array with enhanced message (includes file content)
        const messages: Array<{ role: ChatRole; content: string }> = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: enhancedMessage },
        ];

        const completion = await groq.chat.completions.create({
            messages: messages as any,
            model,
            temperature: 0.7,
            max_tokens: 2000, // Increased for file analysis
        } as any);

        const aiResponse =
            (completion as any)?.choices?.[0]?.message?.content ??
            "I apologize, I couldn't generate a response.";

        // Save AI response
        const { error: aiMsgError } = await supabase.from('chat_messages').insert({
            conversation_id: currentConversationId,
            role: 'assistant',
            content: aiResponse,
        });

        if (aiMsgError) throw aiMsgError;

        return NextResponse.json({
            conversationId: currentConversationId,
            response: aiResponse,
        });
    } catch (error: any) {
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        console.error('Chat API error:', error);
        const status = error?.status ?? 500;
        return NextResponse.json(
            { error: error?.message ?? 'Failed to process chat message' },
            { status }
        );
    }
}

// GET endpoint to fetch conversation history
export async function GET(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (conversationId) {
            const { data: messages, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return NextResponse.json({ messages });
        } else {
            const { data: conversations, error } = await supabase
                .from('chat_conversations')
                .select('*, chat_messages(count)')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ conversations });
        }
    } catch (error: any) {
        console.error('Chat GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

// DELETE endpoint to delete a conversation
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
        }

        // Verify ownership
        const { data: conversation } = await supabase
            .from('chat_conversations')
            .select('user_id')
            .eq('id', conversationId)
            .single();

        if (!conversation || conversation.user_id !== user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Delete messages first
        await supabase
            .from('chat_messages')
            .delete()
            .eq('conversation_id', conversationId);

        // Delete conversation
        const { error } = await supabase
            .from('chat_conversations')
            .delete()
            .eq('id', conversationId)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Chat DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
}

// PATCH endpoint to rename a conversation
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const { conversationId, title } = body ?? {};

        if (!conversationId || !title || typeof title !== 'string' || !title.trim()) {
            return NextResponse.json({ error: 'conversationId and title are required' }, { status: 400 });
        }

        // Update conversation title with ownership check
        const { error } = await supabase
            .from('chat_conversations')
            .update({ title: title.trim() })
            .eq('id', conversationId)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Chat PATCH error:', error);
        return NextResponse.json({ error: 'Failed to rename conversation' }, { status: 500 });
    }
}