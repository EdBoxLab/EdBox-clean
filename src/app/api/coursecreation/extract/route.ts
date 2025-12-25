import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { extractContextFromText } from '@/lib/ai-providers';
import { processFileContent } from '@/lib/utils/fileProcessing';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { fileContent, fileType, fileName } = body;

    if (!fileContent) {
      return NextResponse.json({ error: 'Missing file content' }, { status: 400 });
    }

    console.log(`📄 Extracting context for course creation: ${fileName} (${fileType})`);
    
    // 1. Process file to get raw text
    const extractedText = await processFileContent(fileContent, fileType || '', fileName || '');
    
    // 2. Use AI to extract meaningful context
    const contextSummary = await extractContextFromText(extractedText);
    
    // 3. Generate a suggested title/goal if it's too generic
    let suggestedGoal = contextSummary.split('\n')[0].replace(/#/g, '').trim();
    
    // Safety check: if suggestedGoal looks like base64, raw PDF binary, or is too long/messy
    const isMessy = (str: string) => {
        if (str.length < 5) return true;
        if (str.includes('%PDF')) return true;
        if (str.includes('')) return true;
        // Check for base64-like strings (long strings of chars without spaces)
        if (str.length > 20 && !str.includes(' ')) return true;
        return /^[A-Za-z0-9+/]*={0,2}$/.test(str.replace(/\s/g, '')) && str.length > 30;
    };

    if (isMessy(suggestedGoal) || suggestedGoal.length > 100) {
        suggestedGoal = fileName.split('.')[0].replace(/[-_]/g, ' ');
        // Capitalize first letter of each word
        suggestedGoal = suggestedGoal.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    return NextResponse.json({ 
      success: true, 
      context: contextSummary,
      suggestedGoal: suggestedGoal
    });

  } catch (error: any) {
    console.error('❌ Context extraction failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
