import { createClient } from '@supabase/supabase-js';
import { embedText } from '@/lib/ai-providers';
import { VectorMatch } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const VectorBrain = {
  /**
   * Index node content for vector search
   */
  async indexNode(nodeId: string, content: string) {
    // Chunker logic could be added here for large nodes
    const embedding = await embedText(content);

    const { error } = await supabase
      .from('genie_node_embeddings')
      .upsert({
        node_id: nodeId,
        content: content,
        embedding: embedding
      }, { onConflict: 'node_id' });

    if (error) throw error;
  },

  /**
   * Find relevant context using vector similarity
   */
  async findRelatedNodes(query: string, matchCount: number = 3): Promise<VectorMatch[]> {
    const embedding = await embedText(query);

    const { data, error } = await supabase.rpc('match_node_embeddings', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: matchCount
    });

    if (error) throw error;
    return data;
  }
};
