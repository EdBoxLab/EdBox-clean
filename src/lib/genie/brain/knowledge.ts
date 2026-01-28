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
      const systemPrompt = `You are an expert curriculum designer. Break down the provided educational content into a Hierarchical Knowledge Graph (HKG). 
      Each node represents a distinct concept or skill. 
      
      TIME-BASED GRANULARITY (REVERSED):
      - User has selected a time limit of: ${timeLimit || '15min'}.
      - **Each node MUST be a small, atomic chunk that can be learned and mastered in AT MOST 5 minutes.**
      - If the time limit is "5min", provide 20-30 ultra-atomic nodes (each ~15 seconds).
      - If the time limit is "15min", provide 15-20 granular nodes (each ~1 minute).
      - If the time limit is "1hour", provide 10-12 granular nodes (each ~5 minutes).
      - HIGHER skill counts are required for SHORTER time limits to ensure maximum granularity and quick wins.
      
      Define prerequisite relationships and mastery levels (1-5).
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

    // Save nodes and resolve prerequisites
    const nodesMap = new Map<string, string>();
    const nodesToInsert = extractedNodes.map((n: any, idx: number) => ({
      course_id: courseId,
      title: n.title,
      description: n.description,
      content: n.content,
      level: n.level,
      order_index: idx
    }));

    const { data: savedNodes, error } = await supabase
      .from('genie_knowledge_nodes')
      .insert(nodesToInsert)
      .select();

    if (error) throw error;

    // Save the entire skill graph structure
    await supabase
      .from('skill_graphs')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000', // Default if no user
        goal: `Course: ${courseId}`,
        nodes: savedNodes,
        edges: [], // Could be populated if relationships are defined
        total_skills: savedNodes.length,
        context: { courseId, timeLimit }
      });

    // Resolve prerequisite IDs
    for (const node of savedNodes) {
      nodesMap.set(node.title, node.id);
    }

    for (const node of savedNodes) {
      const originalNode = extractedNodes.find((n: any) => n.title === node.title);
      if (originalNode?.prerequisite_titles?.length > 0) {
        const prerequisiteIds = originalNode.prerequisite_titles
          .map((title: string) => nodesMap.get(title))
          .filter(Boolean);

        await supabase
          .from('genie_knowledge_nodes')
          .update({ prerequisite_ids: prerequisiteIds })
          .eq('id', node.id);
      }
    }

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
