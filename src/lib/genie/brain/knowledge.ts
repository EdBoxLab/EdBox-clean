import { createClient } from '@supabase/supabase-js';
import { KnowledgeNode } from './types';
import { generateWithRetry, cleanJsonResponse } from '@/lib/ai-providers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const KnowledgeManager = {
    /**
     * Extracts a Hierarchical Knowledge Graph (HKG) from course content
     */
    async extractHKG(courseId: string, content: string, timeLimit?: string): Promise<KnowledgeNode[]> {
      const systemPrompt = `You are an expert curriculum designer. Break down the provided educational content into a series of ATOMIC LEARNING NODES. 
      
      STRICT REQUIREMENTS:
      - **Quantity**: You MUST generate between 3 and 10 nodes depending on the complexity of the content. NEVER generate just one node.
      - **Granularity**: Each node MUST be a small, atomic chunk that can be learned and mastered in 2-5 minutes.
      - **Structure**: Each node represents a distinct concept or skill.
      
      TIME-BASED GUIDANCE:
      - Total session time: ${timeLimit || '15min'}.
      - For shorter times, favor more granular, rapid-fire nodes.
      
      Return a JSON object with a 'nodes' array.`;

    const result = await generateWithRetry({
      prompt: `Content to process:\n\n${content}\n\nCourse ID: ${courseId}`,
      systemPrompt,
      schema: {
        type: "object",
        properties: {
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                content: { type: "string" },
                level: { type: "number", minimum: 1, maximum: 5 },
                prerequisite_titles: { type: "array", items: { type: "string" } }
              },
              required: ["title", "description", "content", "level"]
            }
          }
        },
        required: ["nodes"]
      }
    });

    const parsed = JSON.parse(cleanJsonResponse(result.text));
    const extractedNodes = parsed.nodes;

    // Save nodes to both genie_knowledge_nodes (for legacy) and genie_atomic_nodes (as requested)
    const nodesToInsert = extractedNodes.map((n: any, idx: number) => ({
      course_id: courseId,
      skill_id: courseId, // Used in genie_atomic_nodes
      title: n.title,
      description: n.description,
      content: n.content,
      level: n.level,
      order_index: idx
    }));

      // Insert into legacy table
      const { data: savedNodes, error } = await supabase
        .from('genie_knowledge_nodes')
        .insert(nodesToInsert.map(({ skill_id, ...rest }: any) => rest))
        .select();

    if (error) throw error;

    // Insert into NEW atomic nodes table
    await supabase
      .from('genie_atomic_nodes')
      .insert(nodesToInsert);

    // Save the entire skill graph structure
    await supabase
      .from('skill_graphs')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000',
        goal: `Course: ${courseId}`,
        nodes: savedNodes,
        edges: [],
        total_skills: savedNodes.length,
        context: { courseId, timeLimit }
      });

    // Resolve prerequisite IDs (simplified for now)
    return savedNodes;
  },

  async getNodesForCourse(courseId: string): Promise<KnowledgeNode[]> {
    const { data, error } = await supabase
      .from('genie_knowledge_nodes')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  }
};
