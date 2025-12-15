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

// 🔥 FIXED: Better file content processing with proper encoding detection
async function processFileContent(file: FileAttachment): Promise<string> {
  try {
    // Decode base64 to buffer
    const buffer = Buffer.from(file.content, 'base64');
    
    // Check if it's a text-based file by extension or mime type
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
      // Try to decode as UTF-8 first
      let content = buffer.toString('utf-8');
      
      // Check if the content looks valid (no replacement characters)
      // If we see too many � characters, the encoding might be wrong
      const replacementChars = (content.match(/�/g) || []).length;
      const totalChars = content.length;
      
      // If more than 5% are replacement characters, try different encoding
      if (replacementChars > totalChars * 0.05) {
        // Try latin1 encoding as fallback
        content = buffer.toString('latin1');
      }
      
      // Clean up any null bytes or control characters that might confuse the AI
      content = content
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except newlines/tabs
        .trim();
      
      // Limit content size to prevent token overflow
      const maxLength = 10000;
      if (content.length > maxLength) {
        return `File: ${file.name}\n${'='.repeat(50)}\n${content.substring(0, maxLength)}\n\n[... Content truncated due to length. Showing first ${maxLength} characters of ${content.length} total ...]`;
      }
      
      return `File: ${file.name}\n${'='.repeat(50)}\n${content}\n${'='.repeat(50)}`;
    }
    
    // Handle images
    if (file.type.startsWith('image/')) {
      return `[Image: ${file.name} - ${(file.size / 1024).toFixed(2)} KB. Image content cannot be displayed as text.]`;
    }
    
    // Handle PDFs
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return `[PDF Document: ${file.name} - ${(file.size / 1024).toFixed(2)} KB. PDF text extraction is not currently supported. Please describe what you need help with regarding this PDF.]`;
    }
    
    // Handle other binary files
    return `[Binary File: ${file.name}, Type: ${file.type}, Size: ${(file.size / 1024).toFixed(2)} KB. This file type cannot be read as text. Please describe what you need help with.]`;
    
  } catch (err) {
    console.error('Error processing file:', file.name, err);
    return `[Error: Unable to read file "${file.name}". The file may be corrupted or in an unsupported format.]`;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request
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
          const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 3. Create or validate conversation
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
      const { data: existingConv, error: convCheckError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convCheckError || !existingConv) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 403 }
        );
      }
    }

    // 4. Process attachments - THIS IS THE KEY PART
    let enhancedMessage = message;
    if (attachments.length > 0) {
      const fileContents = await Promise.all(
        attachments.map(file => processFileContent(file))
      );
      
      // Add files to the message with clear formatting
      enhancedMessage = `${message}\n\n${'*'.repeat(60)}\nATTACHED FILES:\n${'*'.repeat(60)}\n\n${fileContents.join('\n\n')}\n\n${'*'.repeat(60)}\nEND OF ATTACHED FILES\n${'*'.repeat(60)}`;
    }

    // 5. Save user message
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

    // 6. Fetch conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content, metadata, created_at')
      .eq('conversation_id', conversationId)
      .neq('id', userMessageId)
      .order('created_at', { ascending: true })
      .limit(15); // Keep last 15 messages for context

    // 7. Build conversation context
    const conversationHistory: Array<{ role: ChatRole; content: string }> = (
      history || []
    ).map((msg: any) => ({
      role: msg.role as ChatRole,
      content: String(msg.content || ''),
    }));

    // 8. Enhanced system prompt
    const systemPrompt = `You are EdBox AI, an intelligent tutoring assistant. 

IMPORTANT INSTRUCTIONS:
- When files are attached, they will appear clearly marked between "ATTACHED FILES" sections
- Read and analyze the FULL content of any attached files carefully
- Reference specific parts of the files in your responses
- If code is shared, provide detailed explanations and suggestions
- If you see garbled text or symbols, indicate that the file may be corrupted
- Always acknowledge when you're working with attached files

Your goals:
- Provide clear, educational explanations
- Break down complex topics
- Encourage learning and understanding
- Be patient and supportive`;

    // 9. Call Groq API
    const groqApiKey =
      process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY_3 ||
      process.env.GROQ_API_KEY_4;

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 500 }
      );
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
        max_tokens: 3000, // Increased for longer responses
        top_p: 1,
      });

      aiResponse =
        completion.choices?.[0]?.message?.content ||
        "I couldn't generate a response. Please try again.";
    } catch (groqError: any) {
      console.error('Groq error:', groqError);
      
      if (groqError.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment.' },
          { status: 429 }
        );
      }
      
      throw new Error('AI service error');
    }

    // 10. Save AI response
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      role: 'assistant' as ChatRole,
      content: aiResponse,
    });

    return NextResponse.json({
      conversationId,
      response: aiResponse,
      messageId: userMessageId,
    });
    
  } catch (err: any) {
    console.error('Chat error:', err);
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}