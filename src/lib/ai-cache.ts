import crypto from 'crypto';
import { createSupabaseServerClient } from './supabase/server';

export interface CacheOptions {
  requestType: 'course_generation' | 'study_kit_generation' | 'challenge_generation';
  requestData: Record<string, any>;
  category?: string;
}

export interface CachedResponse {
  id: string;
  responseData: any;
  similarity?: number;
}

function generateHash(data: Record<string, any>): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export async function checkCache(options: CacheOptions): Promise<CachedResponse | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const requestHash = generateHash(options.requestData);

    const { data: exactMatch } = await supabase
      .from('ai_response_cache')
      .select('*')
      .eq('request_hash', requestHash)
      .eq('request_type', options.requestType)
      .single();

    if (exactMatch) {
      await supabase
        .from('ai_response_cache')
        .update({
          accessed_count: exactMatch.accessed_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', exactMatch.id);

      console.log('✅ Cache HIT (exact match)');
      return {
        id: exactMatch.id,
        responseData: exactMatch.response_data,
      };
    }

    if (options.requestType === 'course_generation' && options.requestData.goal) {
      const { data: similarMatches, error } = await supabase.rpc('find_similar_course_cache', {
        p_goal: options.requestData.goal,
        p_context: options.requestData.context || 'college',
        p_similarity_threshold: 0.85,
      });

      if (!error && similarMatches && similarMatches.length > 0) {
        const match = similarMatches[0];
        
        await supabase
          .from('ai_response_cache')
          .update({
            accessed_count: (match.accessed_count || 0) + 1,
            last_accessed_at: new Date().toISOString(),
          })
          .eq('id', match.id);

        console.log(`✅ Cache HIT (similar match, ${(match.similarity * 100).toFixed(1)}% similarity)`);
        return {
          id: match.id,
          responseData: match.response_data,
          similarity: match.similarity,
        };
      }
    }

    console.log('❌ Cache MISS');
    return null;
  } catch (error) {
    console.error('Cache check error:', error);
    return null;
  }
}

export async function saveToCache(
  options: CacheOptions,
  responseData: any
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const requestHash = generateHash(options.requestData);

    await supabase.from('ai_response_cache').upsert(
      {
        request_type: options.requestType,
        request_hash: requestHash,
        request_data: options.requestData,
        response_data: responseData,
        category: options.category,
        accessed_count: 1,
        last_accessed_at: new Date().toISOString(),
      },
      {
        onConflict: 'request_hash',
      }
    );

    console.log('✅ Response saved to cache');
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

export async function clearOldCache(daysOld: number = 30): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('ai_response_cache')
      .delete()
      .lt('last_accessed_at', cutoffDate.toISOString())
      .select('id');

    if (error) throw error;

    console.log(`🗑️ Cleared ${data?.length || 0} old cache entries`);
    return data?.length || 0;
  } catch (error) {
    console.error('Cache clear error:', error);
    return 0;
  }
}
