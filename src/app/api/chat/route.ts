import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import pdf from 'pdf-parse';
import { processFileContent as processFileUtility } from '@/lib/utils/fileProcessing';

type ChatRole = 'system' | 'user' | 'assistant';

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  content: string; // base64
}

interface ProcessedFile {
  type: 'text' | 'image' | 'processed';
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
    let skillTitle: string | null = null;
    let context: string | null = null;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      message = body.message;
      conversationId = body.conversationId || null;
      attachments = body.attachments || [];
      skillTitle = body.skillTitle || null;
      context = body.context || null;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      message = formData.get('message')?.toString() || null;
      conversationId = formData.get('conversationId')?.toString() || null;
      skillTitle = formData.get('skillTitle')?.toString() || null;
      context = formData.get('context')?.toString() || null;

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

    // 🔥 ENHANCED: Load comprehensive user educational context
    let userProfileContext = '';
    let studySetsContext = '';
    let notesContext = '';
    let studyKitContext = '';

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('education, country, age')
      .eq('id', user.id)
      .single();

    if (profile) {
      userProfileContext = `
User Profile:
- Education: ${profile.education || 'General'}
- Country: ${profile.country || 'Global'}
- Age: ${profile.age || 'Unknown'}`;
    }

    // Get user's study sets
    const { data: studySets } = await supabase
      .from('skill_graphs')
      .select('id, goal, nodes, edges')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (studySets && studySets.length > 0) {
      studySetsContext = `\n\nUser's Study Sets:\n${studySets.map(set =>
        `- "${set.goal}" (${set.nodes?.length || 0} nodes, ${set.edges?.length || 0} edges)`
      ).join('\n')}`;
    }

    // Get user's notes
    const { data: notes } = await supabase
      .from('notes')
      .select('id, title, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notes && notes.length > 0) {
      notesContext = `\n\nUser's Recent Notes:\n${notes.map(note =>
        `- "${note.title}"${note.content ? `: ${note.content.substring(0, 100)}...` : ''}`
      ).join('\n')}`;
    }

    // 🔥 NEW: Get user's study kit content (flashcards, quizzes, practice problems)
    const { data: studyKits } = await supabase
      .from('study_kit_content')
      .select('id, title, source_type, source_content, content_types, generated_content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (studyKits && studyKits.length > 0) {
      studyKitContext = `\n\nUser's Study Materials:\n${studyKits.map(kit => {
        const contentTypes = Array.isArray(kit.content_types) ? kit.content_types.join(', ') : 'various';
        const generatedContent = kit.generated_content as any;

        // Extract relevant content details
        let contentSummary = '';
        if (generatedContent) {
          if (generatedContent.flashcards && Array.isArray(generatedContent.flashcards)) {
            contentSummary += `${generatedContent.flashcards.length} flashcards`;
          }
          if (generatedContent.quiz && Array.isArray(generatedContent.quiz)) {
            contentSummary += contentSummary ? `, ${generatedContent.quiz.length} quiz questions` : `${generatedContent.quiz.length} quiz questions`;
          }
          if (generatedContent.practice_problems && Array.isArray(generatedContent.practice_problems)) {
            contentSummary += contentSummary ? `, ${generatedContent.practice_problems.length} practice problems` : `${generatedContent.practice_problems.length} practice problems`;
          }
        }

        return `- "${kit.title}" (${contentTypes})${contentSummary ? `: ${contentSummary}` : ''}`;
      }).join('\n')}`;
    }

    // 🔥 Process attachments with enhanced system
    const processedFiles: ProcessedFile[] = await Promise.all(
      attachments.map(async (file) => {
        const result = await processFileUtility(file.content, file.type, file.name);

        // Check if it's an image JSON (utility returns JSON string for images)
        if (typeof result === 'string' && result.startsWith('{"type":"image"')) {
          try {
            const parsed = JSON.parse(result);
            return {
              type: 'image',
              content: parsed.extractedText
                ? `[Image: ${file.name}]\n\n📝 Extracted Text (OCR):\n${parsed.extractedText}`
                : `[Image: ${file.name}]`,
              metadata: {
                name: file.name,
                size: file.size,
                mimeType: file.type,
              },
              imageData: {
                base64: parsed.base64,
                mimeType: parsed.mimeType,
              },
            } as ProcessedFile;
          } catch (e) {
            console.error('Failed to parse image result:', e);
          }
        }

        // Return as processed text/document content
        return {
          type: 'processed',
          content: result,
          metadata: {
            name: file.name,
            size: file.size,
            mimeType: file.type,
          },
        } as ProcessedFile;
      })
    );

    // Separate images from text content
    const imageFiles = processedFiles.filter((f: ProcessedFile) => f.type === 'image' && !!f.imageData);

    // Include all processed content (including OCR from images) in the text block
    const textContent = processedFiles
      .map((f: ProcessedFile) => f.content)
      .join('\n\n');

    // Build enhanced message
    let enhancedMessage = message;
    if (textContent) {
      // Note: The utility already wraps content in headers, but we add a master section
      enhancedMessage += `\n\n${'═'.repeat(70)}\n📎 ATTACHED MATERIALS\n${'═'.repeat(70)}\n\n${textContent}\n\n${'═'.repeat(70)}`;
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

    // 🔥 ENHANCED: Detect interactive course mode
    const isInteractiveCourse = context && (
      context.includes('Currently learning:') ||
      context.includes('comprehension level') ||
      context.includes('mastered:')
    );

    // 🔥 ENHANCED: Build context-aware system prompt with asterisk prevention
    let systemPrompt;

    const BREVITY_GUIDELINE = `
TOKEN OPTIMIZATION & BREVITY:
- Analyze user query complexity:
  - Simple greeting/question: max 15-20 words.
  - Concept explanation: max 50-70 words using direct language.
  - Complex multi-part query: max 150 words using concise bullet points.
- Avoid flowery language, repetitive affirmations ("That's a great question!"), or unnecessary preambles.
- Get straight to the point.
- Efficiency is priority.`;

    if (isInteractiveCourse && skillTitle) {
      systemPrompt = `You are Genie, an enthusiastic AI learning companion guiding users through an interactive course on "${skillTitle}".
${userProfileContext}${studySetsContext}${notesContext}${studyKitContext}

INTERACTIVE COURSE CONTEXT: ${context}

INTERACTIVE COURSE GUIDELINES:
- You are conducting a conversational learning session
- Build on the user's current learning context and mastered concepts
- Adapt explanations to their comprehension level
- Use a natural, conversational tone
- Transform static content into engaging dialogue
- Connect new concepts to what they already know
- Ask follow-up questions to check understanding
- Reference multimedia elements naturally
- Celebrate progress and achievements
- NEVER use asterisks (*) for emphasis, actions, or formatting
- Use natural language for emphasis: "really important" instead of "*important*"
- If showing actions or emotions, describe them naturally without asterisks
${BREVITY_GUIDELINE}

🎯 YOUR CAPABILITIES:
- ✅ View and analyze images (screenshots, diagrams, charts, handwritten notes)
- ✅ Extract and analyze text from PDFs and PowerPoint files
- ✅ Understand code in multiple programming languages
- ✅ Provide detailed explanations with visual analysis
- ✅ Reference user's flashcards, quizzes, and practice problems

FORMATTING RULES:
- Do NOT use asterisks (*) anywhere in your response
- Use bold markdown (**text**) sparingly, only for critical terms
- Use natural language for all emphasis and expression
- Write clearly and directly without asterisk-based formatting

Respond as their learning companion:`;
    } else {
      systemPrompt = `You are Genie, an intelligent tutoring assistant${skillTitle ? ` helping with "${skillTitle}"` : ''}.
${userProfileContext}${studySetsContext}${notesContext}${studyKitContext}

${context ? `Context: ${context}` : ''}

${BREVITY_GUIDELINE}

🎯 YOUR CAPABILITIES:
- ✅ Read and analyze text files (code, documents, data)
- ✅ View and analyze images (screenshots, diagrams, charts, handwritten notes)
- ✅ Extract and analyze text from PDFs and PowerPoint presentations
- ✅ Understand code in multiple programming languages
- ✅ Provide detailed explanations and debugging help
- ✅ Reference user's flashcards, quizzes, and practice problems from their study materials

📸 WHEN IMAGES ARE SHARED:
- Carefully analyze all visual elements
- Describe what you see in detail
- Answer questions about the image content
- Help with code screenshots, diagrams, or handwritten notes

📄 WHEN FILES ARE SHARED:
- The complete file content is provided
- Analyze thoroughly and provide specific feedback
- Point out issues and suggest improvements

🎓 YOUR TEACHING APPROACH:
- Adapt to the user's education level and region
- Be clear, educational, and supportive
- Break down complex topics with examples
- Reference their study materials (notes, flashcards, quizzes) when relevant
- Encourage understanding over memorization
- Be patient and celebrate their progress

FORMATTING RULES:
- NEVER use asterisks (*) anywhere in your response
- Do NOT use asterisks for emphasis, actions, or emotions
- Use bold markdown (**text**) sparingly for critical terms only
- Use natural language: say "This is very important" not "*very important*"
- Write clearly and directly without asterisk-based formatting`;
    }

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
      // 🔥 Choose model based on content type
      const hasImages = imageFiles.length > 0;

      // 🔥 Integration: Select model and provider
      // Groq vision models are decommissioned. Use OpenRouter for vision.
      const useOpenRouter = hasImages;

      // 🔥 Build messages array
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ];

      // Add user message content
      if (hasImages) {
        const userContent: any[] = [
          { type: 'text', text: enhancedMessage }
        ];

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

      if (useOpenRouter) {
        console.log(`🤖 Using OpenRouter for ${imageFiles.length} images...`);

        // Import OpenRouter helper
        const { getNextOpenRouterKey } = await import('@/lib/ai-providers');
        const openRouterKey = getNextOpenRouterKey();

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://edbox.app',
            'X-Title': 'EdBox',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'allenai/molmo-2-8b:free',
            messages,
            temperature: 0.7,
            max_tokens: isInteractiveCourse ? 800 : 500,
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenRouter error details:', errorData);
          throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || "I couldn't analyze the images. Please try again.";
      } else {
        // Use Groq for text-only
        const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        console.log(`🤖 Using Groq model: ${model}`);

        const completion = await groq.chat.completions.create({
          messages,
          model,
          temperature: 0.7,
          max_tokens: isInteractiveCourse ? 800 : 500,
          top_p: 1,
        });

        aiResponse = completion.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
      }

      // 🔥 POST-PROCESSING: Remove any asterisks that might have slipped through
      aiResponse = aiResponse.replace(/\*/g, '');

    } catch (apiError: any) {
      console.error('AI Processing Error:', apiError);

      if (apiError.status === 429 || apiError.message?.includes('429')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Genie is currently overloaded: ${apiError.message || 'Service unreachable'}` },
        { status: 500 }
      );
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