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

// Helper to process different file types
async function processFileContent(file: FileAttachment): Promise<string> {
  try {
    const buffer = Buffer.from(file.content, 'base64');
    if (file.type.startsWith('text/') || file.type.includes('json') || file.type.includes('javascript') || file.type.includes('typescript')) {
      return buffer.toString('utf-8');
    }
    if (file.type.startsWith('image/')) {
      return `[Image file: ${file.name}, size: ${file.size} bytes]`;
    }
    if (file.type === 'application/pdf') {
      return `[PDF file: ${file.name}, size: ${file.size} bytes]`;
    }
    return `[File: ${file.name}, type: ${file.type}, size: ${file.size} bytes]`;
  } catch (err) {
    console.error('Error processing file', err);
    return `[Error processing file: ${file.name}]`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let message: string | null = null;
    let conversationId: string | null = null;
    let attachments: FileAttachment[] = [];

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      message = body.message;
      conversationId = body.conversationId;
      attachments = body.attachments || [];
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      message = formData.get('message')?.toString() || null;
      conversationId = formData.get('conversationId')?.toString() || null;

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
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

    // Create conversation if not exists
    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user.id, title: message.slice(0, 50) })
        .select()
        .single();
      if (convError) throw convError;
      conversationId = (newConv as any).id;
    }

    // Process attachments for AI context
    let enhancedMessage = message;
    if (attachments.length > 0) {
      const fileContents = await Promise.all(attachments.map(processFileContent));
      enhancedMessage += `\n\nAttached files:\n${fileContents.join('\n')}`;
    }

    // Save user message
    const { data: userMessageData, error: userMsgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message,
        metadata: attachments.length > 0 ? { attachments: attachments.map(a => ({ name: a.name, type: a.type, size: a.size })) } : undefined,
      })
      .select('id')
      .single();
    if (userMsgError) throw userMsgError;

    // Fetch conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content, metadata, id')
      .eq('conversation_id', conversationId)
      .neq('id', (userMessageData as any).id)
      .order('created_at', { ascending: true });

    const conversationHistory: Array<{ role: ChatRole; content: string }> = (history || []).map((msg: any) => {
      let content = String(msg.content ?? '');
      if (msg.metadata?.attachments) {
        content += `\n[Previously attached: ${msg.metadata.attachments.map((a: any) => a.name).join(', ')}]`;
      }
      return { role: msg.role, content };
    });

    // System prompt
    const systemPrompt = `You are EdBox AI tutor. Answer concisely. Context: User's previous files and messages will be provided.`;

    // Groq API
    const groqApiKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_3 || process.env.GROQ_API_KEY_4;
    if (!groqApiKey) return NextResponse.json({ error: 'GROQ API key missing' }, { status: 500 });
    const groq = new Groq({ apiKey: groqApiKey });
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...conversationHistory, { role: 'user', content: enhancedMessage }] as any,
      model,
      temperature: 0.7,
      max_tokens: 2000,
    } as any);

    const aiResponse = (completion as any)?.choices?.[0]?.message?.content ?? "I couldn't generate a response.";

    // Save AI response
    const { error: aiError } = await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: aiResponse,
    });
    if (aiError) throw aiError;

    return NextResponse.json({ conversationId, response: aiResponse });
  } catch (err: any) {
    console.error('Chat POST error', err);
    return NextResponse.json({ error: err.message ?? 'Failed' }, { status: 500 });
  }
}
