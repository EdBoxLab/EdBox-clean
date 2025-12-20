import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import pdf from 'pdf-parse';

type ChatRole = 'system' | 'user' | 'assistant';

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  content: string; // base64
}

interface ProcessedFile {
  type: 'text' | 'image' | 'pdf' | 'unsupported';
  content: string;
  metadata: {
    name: string;
    size: number;
    mimeType: string;
  };
  imageData?: {
    base64: string;
    mimeType: string;
  };
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

// 🔥 NEW: Enhanced file processing with Vision support
async function processFileContent(file: FileAttachment): Promise<ProcessedFile> {
  try {
    const buffer = Buffer.from(file.content, 'base64');

    // ===== IMAGE FILES (USE VISION API) =====
    if (file.type.startsWith('image/')) {
      return {
        type: 'image',
        content: `[Image: ${file.name}]`,
        metadata: {
          name: file.name,
          size: file.size,
          mimeType: file.type,
        },
        imageData: {
          base64: file.content,
          mimeType: file.type,
        },
      };
    }

    // ===== PDF FILES (EXTRACT TEXT) =====
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      try {
        const pdfData = await pdf(buffer);
        const text = pdfData.text.trim();

        if (text && text.length > 50) {
          // Successfully extracted meaningful text
          const maxLength = 15000;
          const truncatedText = text.length > maxLength
            ? text.substring(0, maxLength) + '\n\n[... Content truncated ...]'
            : text;

          return {
            type: 'pdf',
            content: `📕 PDF: ${file.name}\n${'═'.repeat(60)}\n${truncatedText}\n${'═'.repeat(60)}`,
            metadata: {
              name: file.name,
              size: file.size,
              mimeType: file.type,
            },
          };
        } else {
          // PDF has minimal text (likely scanned/image-based)
          return {
            type: 'pdf',
            content: `📕 PDF: ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n\nThis PDF appears to be image-based or has minimal text. Text extraction found limited content. If you need help with this PDF, please describe its contents or take screenshots of specific pages.`,
            metadata: {
              name: file.name,
              size: file.size,
              mimeType: file.type,
            },
          };
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return {
          type: 'pdf',
          content: `📕 PDF: ${file.name} - Could not extract text. The file may be password-protected, corrupted, or image-based. Please describe what you need help with.`,
          metadata: {
            name: file.name,
            size: file.size,
            mimeType: file.type,
          },
        };
      }
    }

    // ===== TEXT FILES =====
    const isTextFile =
      file.type.startsWith('text/') ||
      file.type.includes('json') ||
      file.type.includes('javascript') ||
      file.type.includes('typescript') ||
      file.type.includes('xml') ||
      file.type.includes('html') ||
      ['.txt', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c',
        '.h', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.md',
        '.json', '.xml', '.yaml', '.yml', '.csv', '.sql', '.sh', '.bat']
        .some(ext => file.name.toLowerCase().endsWith(ext));

    if (isTextFile) {
      let content = buffer.toString('utf-8');

      // Check for encoding issues
      const replacementChars = (content.match(/�/g) || []).length;
      if (replacementChars > content.length * 0.05) {
        content = buffer.toString('latin1');
      }

      content = content
        .replace(/\0/g, '')
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
        .trim();

      const maxLength = 12000;
      const truncatedContent = content.length > maxLength
        ? content.substring(0, maxLength) + '\n\n[... Content truncated ...]'
        : content;

      return {
        type: 'text',
        content: `📄 FILE: ${file.name}\n${'─'.repeat(60)}\n${truncatedContent}\n${'─'.repeat(60)}`,
        metadata: {
          name: file.name,
          size: file.size,
          mimeType: file.type,
        },
      };
    }

    // ===== UNSUPPORTED FILES =====
    return {
      type: 'unsupported',
      content: `📎 FILE: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)\nThis file type is not supported for content analysis. Please describe what you need help with.`,
      metadata: {
        name: file.name,
        size: file.size,
        mimeType: file.type,
      },
    };

  } catch (err) {
    console.error('Error processing file:', file.name, err);
    return {
      type: 'unsupported',
      content: `❌ ERROR: Unable to process file "${file.name}"`,
      metadata: {
        name: file.name,
        size: file.size,
        mimeType: file.type,
      },
    };
  }
}

// GET endpoint for fetching conversations and messages
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

    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
      }

      return NextResponse.json({
        conversation,
        messages: messages || [],
      });
    }

    const { data: conversations, error: conversationsError } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (conversationsError) {
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

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

    return NextResponse.json({ conversations: conversationsWithLastMessage });

  } catch (err: any) {
    console.error('GET error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
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

    // 🔥 Process attachments with new system
    const processedFiles = await Promise.all(
      attachments.map(file => processFileContent(file))
    );

    // Separate images from text content
    const imageFiles = processedFiles.filter(f => f.type === 'image' && f.imageData);
    const textContent = processedFiles
      .filter(f => f.type !== 'image')
      .map(f => f.content)
      .join('\n\n');

    // Build enhanced message
    let enhancedMessage = message;
    if (textContent) {
      enhancedMessage += `\n\n${'═'.repeat(70)}\n📎 ATTACHED FILES\n${'═'.repeat(70)}\n\n${textContent}\n\n${'═'.repeat(70)}`;
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

    // System prompt
    const systemPrompt = `You are Genie, an intelligent tutoring assistant with advanced capabilities.

🎯 YOUR CAPABILITIES:
- ✅ Read and analyze text files (code, documents, data)
- ✅ View and analyze images (screenshots, diagrams, charts, handwritten notes)
- ✅ Extract and analyze text from PDFs
- ✅ Understand code in multiple programming languages
- ✅ Provide detailed explanations and debugging help

📸 WHEN IMAGES ARE SHARED:
- Carefully analyze all visual elements
- Describe what you see
- Answer questions about the image content
- Help with code screenshots, diagrams, or handwritten notes

📄 WHEN TEXT FILES ARE SHARED:
- The complete file content is provided as text
- Analyze code thoroughly
- Point out specific issues and improvements
- Provide detailed explanations

📕 WHEN PDFs ARE SHARED:
- Text content has been extracted and provided
- Analyze the content thoroughly
- Help with understanding and questions

🎓 YOUR TEACHING APPROACH:
- Be clear and educational
- Break down complex topics
- Provide examples
- Encourage understanding
- Be patient and supportive`;

    const groqApiKey =
      process.env.GROQ_API_KEY ||
      process.env.GROQ_API_KEY_3 ||
      process.env.GROQ_API_KEY_10 ||
      process.env.GROQ_API_KEY_15 ||
      process.env.GROQ_API_KEY_32 ||
      process.env.GROQ_API_KEY_4;

    if (!groqApiKey) {
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqApiKey });

    let aiResponse: string;

    try {
      // 🔥 CHOOSE MODEL BASED ON CONTENT TYPE
      const hasImages = imageFiles.length > 0;
      const model = hasImages
        ? 'llama-3.2-90b-vision-preview'  // Use vision model for images
        : (process.env.GROQ_MODEL || 'llama-3.1-8b-instant'); // Use text model otherwise

      // 🔥 BUILD MESSAGES ARRAY WITH VISION SUPPORT
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ];

      // Add user message with images if present
      if (hasImages) {
        const userContent: any[] = [
          { type: 'text', text: enhancedMessage }
        ];

        // Add all images
        for (const imgFile of imageFiles) {
          if (imgFile.imageData) {
            userContent.push({
              type: 'image_url',
              image_url: {
                url: `data:${imgFile.imageData.mimeType};base64,${imgFile.imageData.base64}`
              }
            });
          }
        }

        messages.push({
          role: 'user',
          content: userContent
        });
      } else {
        messages.push({
          role: 'user',
          content: enhancedMessage
        });
      }

      console.log(`🤖 Using model: ${model} (${hasImages ? 'with vision' : 'text only'})`);

      const completion = await groq.chat.completions.create({
        messages,
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