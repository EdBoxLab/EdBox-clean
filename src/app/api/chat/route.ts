import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

type ChatRole = 'system' | 'user' | 'assistant';

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  content: string; // base64
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  metadata?: {
    attachments?: Array<{ name: string; type: string; size: number }>;
  };
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

// Process file content with proper encoding
async function processFileContent(file: FileAttachment): Promise<string> {
  try {
    const buffer = Buffer.from(file.content, 'base64');
    
    const isTextFile = 
      file.type.startsWith('text/') ||
      file.type.includes('json') ||
      file.type.includes('javascript') ||
      file.type.includes('typescript') ||
      file.type.includes('xml') ||
      file.type.includes('html') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.js') ||
      file.name.endsWith('.jsx') ||
      file.name.endsWith('.ts') ||
      file.name.endsWith('.tsx') ||
      file.name.endsWith('.py') ||
      file.name.endsWith('.java') ||
      file.name.endsWith('.cpp') ||
      file.name.endsWith('.c') ||
      file.name.endsWith('.h') ||
      file.name.endsWith('.cs') ||
      file.name.endsWith('.php') ||
      file.name.endsWith('.rb') ||
      file.name.endsWith('.go') ||
      file.name.endsWith('.rs') ||
      file.name.endsWith('.swift') ||
      file.name.endsWith('.kt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.xml') ||
      file.name.endsWith('.yaml') ||
      file.name.endsWith('.yml') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.sql') ||
      file.name.endsWith('.sh') ||
      file.name.endsWith('.bat');

    if (isTextFile) {
      let content = buffer.toString('utf-8');
      
      const replacementChars = (content.match(/�/g) || []).length;
      if (replacementChars > content.length * 0.05) {
        content = buffer.toString('latin1');
      }
      
      content = content
        .replace(/\0/g, '')
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
        .trim();
      
      const maxLength = 12000;
      if (content.length > maxLength) {
        return `📄 FILE: ${file.name}\n${'─'.repeat(60)}\n${content.substring(0, maxLength)}\n\n... [Content truncated - showing first ${maxLength} of ${content.length} characters]\n${'─'.repeat(60)}`;
      }
      
      return `📄 FILE: ${file.name}\n${'─'.repeat(60)}\n${content}\n${'─'.repeat(60)}`;
    }
    
    if (file.type.startsWith('image/')) {
      return `🖼️ IMAGE FILE: ${file.name} (${(file.size / 1024).toFixed(2)} KB)\nNote: This is an image file. I cannot view images, but I can help if you describe what's in it or what you need help with.`;
    }
    
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return `📕 PDF FILE: ${file.name} (${(file.size / 1024).toFixed(2)} KB)\nNote: This is a PDF. I cannot extract text from PDFs yet, but I can help if you describe its content or paste relevant sections.`;
    }
    
    return `📎 BINARY FILE: ${file.name} (Type: ${file.type}, Size: ${(file.size / 1024).toFixed(2)} KB)\nNote: This is a binary file that cannot be read as text. Please describe what you need help with.`;
    
  } catch (err) {
    console.error('Error processing file:', file.name, err);
    return `❌ ERROR: Unable to read file "${file.name}". The file may be corrupted.`;
  }
}

// 🔥 NEW: GET endpoint to fetch conversations and messages
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    // If conversationId provided, fetch messages for that conversation
    if (conversationId) {
      console.log('📨 Fetching messages for conversation:', conversationId);
      
      // Verify user owns this conversation
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convError || !conversation) {
        console.error('❌ Conversation not found or access denied:', convError);
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        );
      }

      // Fetch all messages for this conversation
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('❌ Error fetching messages:', messagesError);
        return NextResponse.json(
          { error: 'Failed to fetch messages' },
          { status: 500 }
        );
      }

      console.log('✅ Found messages:', messages?.length || 0);

      return NextResponse.json({
        conversation,
        messages: messages || [],
      });
    }

    // Otherwise, fetch all conversations for the user
    console.log('📋 Fetching all conversations for user:', user.id);
    
    const { data: conversations, error: conversationsError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (conversationsError) {
      console.error('❌ Error fetching conversations:', conversationsError);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    console.log('✅ Found conversations:', conversations?.length || 0);

    // Optionally, fetch the last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      (conversations || []).map(async (conv) => {
        const { data: lastMessage } = await supabase
          .from('chat_messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conv,
          lastMessage: lastMessage?.content || null,
          lastMessageAt: lastMessage?.created_at || conv.created_at,
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithLastMessage,
    });
    
  } catch (err: any) {
    console.error('❌ GET error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

// POST endpoint for sending messages
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let message: string | null = null;
    let conversationId: string | null = null;
    let attachments: FileAttachment[] = [];

    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await req.json();
      message = body.message;
      conversationId = body.conversationId || null;
      attachments = body.attachments || [];
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      message = formData.get('message')?.toString() || null;
      conversationId = formData.get('conversationId')?.toString() || null;

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          const MAX_FILE_SIZE = 10 * 1024 * 1024;
          if (value.size > MAX_FILE_SIZE) {
            return NextResponse.json(
              { error: `File "${value.name}" exceeds 10MB limit` },
              { status: 400 }
            );
          }

          const buffer = Buffer.from(await value.arrayBuffer());
          attachments.push({
            name: value.name,
            type: value.type,
            size: value.size,
            content: buffer.toString('base64'),
          });
        }
      }
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create or validate conversation
    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: message.slice(0, 50).trim() || 'New conversation',
        })
        .select()
        .single();

      if (convError) throw new Error('Failed to create conversation');
      conversationId = (newConv as Conversation).id;
    } else {
      const { data: existingConv } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (!existingConv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 403 });
      }
    }

    // Process attachments
    let enhancedMessage = message;
    if (attachments.length > 0) {
      const fileContents = await Promise.all(
        attachments.map(file => processFileContent(file))
      );
      
      enhancedMessage = `${message}

${'═'.repeat(70)}
📎 ATTACHED FILES (${attachments.length})
${'═'.repeat(70)}

${fileContents.join('\n\n')}

${'═'.repeat(70)}`;
    }

    // Save user message
    const { data: userMessageData, error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user' as ChatRole,
        content: message,
        metadata:
          attachments.length > 0
            ? {
                attachments: attachments.map(a => ({
                  name: a.name,
                  type: a.type,
                  size: a.size,
                })),
              }
            : null,
      })
      .select('id')
      .single();

    if (userMsgError) throw new Error('Failed to save message');
    const userMessageId = (userMessageData as { id: string }).id;

    // Fetch conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content, metadata, created_at')
      .eq('conversation_id', conversationId)
      .neq('id', userMessageId)
      .order('created_at', { ascending: true })
      .limit(15);

    const conversationHistory: Array<{ role: ChatRole; content: string }> = (
      history || []
    ).map((msg: any) => ({
      role: msg.role as ChatRole,
      content: String(msg.content || ''),
    }));

    const systemPrompt = `You are EdBox AI, an intelligent tutoring assistant.

🔥 CRITICAL: When users attach text files (code, documents, etc.), the COMPLETE file content is extracted and provided to you as plain text within the user's message. You CAN and MUST read and analyze these files.

When you see sections marked "📎 ATTACHED FILES" in the user's message:
- These are NOT external files you can't access
- The full text content IS ALREADY in the message
- You MUST read and analyze the file content thoroughly
- Reference specific parts of the code/text in your response
- Provide detailed explanations, debugging help, or improvements

For text files (.txt, .js, .py, .java, .cpp, .html, .css, .json, etc.):
✅ YOU CAN READ THEM - the content is right there in the message
✅ Analyze the code/text in detail
✅ Point out specific lines, errors, or improvements
✅ Provide code examples and explanations

For images/PDFs:
❌ You genuinely cannot view these - ask the user to describe them

Your teaching approach:
- Be clear and educational
- Break down complex topics
- Provide examples and explanations
- Encourage understanding
- Be patient and supportive

NEVER say "I cannot read files" when text file content is clearly provided in the message. You CAN read it because it's text in the prompt.`;

    const groqApiKey =
      process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY_3 ||
      process.env.GROQ_API_KEY_4;

    if (!groqApiKey) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    let aiResponse: string;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: enhancedMessage },
        ] as any,
        model,
        temperature: 0.7,
        max_tokens: 3000,
        top_p: 1,
      });

      aiResponse = completion.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
    } catch (groqError: any) {
      console.error('Groq error:', groqError);
      
      if (groqError.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait.' },
          { status: 429 }
        );
      }
      
      throw new Error('AI service error');
    }

    // Save AI response
    const { data: aiMessageData } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant' as ChatRole,
        content: aiResponse,
      })
      .select('id')
      .single();

    return NextResponse.json({
      conversationId,
      response: aiResponse,
      messageId: userMessageId,
      aiMessageId: (aiMessageData as any)?.id,
    });
    
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}