// ============================================
// Skill Graph Optimizer
// Optimizes skill graph rendering and processing for large graphs
// ============================================

import type { SkillGraph, SkillNode } from './skill-progression-manager';
import type { SkillState } from '@/types/skill-progression';

/**
 * Optimized skill node for rendering
 */
interface OptimizedSkillNode extends SkillNode {
  level: number; // Depth level in the graph
  position: { x: number; y: number }; // Calculated position
  visible: boolean; // Whether to render this node
  clustered: boolean; // Whether this node is part of a cluster
  clusterSize?: number; // Size of cluster if this is a cluster representative
}

/**
 * Viewport configuration for large graph rendering
 */
interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

/**
 * Graph optimization configuration
 */
interface OptimizationConfig {
  maxVisibleNodes: number;
  clusterThreshold: number; // Minimum nodes to form a cluster
  levelOfDetail: boolean; // Enable level-of-detail rendering
  virtualScrolling: boolean; // Enable virtual scrolling for large graphs
}

/**
 * Skill graph optimization service for performance
 */
export class SkillGraphOptimizer {
  private config: OptimizationConfig = {
    maxVisibleNodes: 100,
    clusterThreshold: 5,
    levelOfDetail: true,
    virtualScrolling: true,
  };

  /**
   * Optimize skill graph for rendering
   */
  optimizeForRendering(
    skillGraph: SkillGraph,
    skillStates: Map<string, SkillState>,
    viewport: Viewport
  ): {
    nodes: OptimizedSkillNode[];
    totalNodes: number;
    clusteredNodes: number;
    renderingStats: {
      visibleNodes: number;
      hiddenNodes: number;
      clusters: number;
    };
  } {
    // Calculate node levels and positions
    const leveledNodes = this.calculateNodeLevels(skillGraph);
    const positionedNodes = this.calculateNodePositions(leveledNodes, skillGraph);
    
    // Apply viewport culling
    const visibleNodes = this.applyViewportCulling(positionedNodes, viewport);
    
    // Apply clustering for dense areas
    const clusteredNodes = this.applyClustering(visibleNodes, skillStates);
    
    // Apply level of detail
    const optimizedNodes = this.applyLevelOfDetail(clusteredNodes, viewport.zoom);
    
    // Calculate statistics
    const stats = this.calculateRenderingStats(optimizedNodes, skillGraph.nodes.length);
    
    return {
      nodes: optimizedNodes,
      totalNodes: skillGraph.nodes.length,
      clusteredNodes: clusteredNodes.filter(n => n.clustered).length,
      renderingStats: stats
    };
  }

  /**
   * Calculate depth levels for each node
   */
  private calculateNodeLevels(skillGraph: SkillGraph): Map<string, number> {
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    
    // Find root nodes (nodes with no prerequisites)
    const rootNodes = skillGraph.nodes.filter(node => node.prerequisites.length === 0);
    
    // BFS to assign levels
    const queue: Array<{ nodeId: string; level: number }> = [];
    
    // Start with root nodes at level 0
    rootNodes.forEach(node => {
      levels.set(node.id, 0);
      visited.add(node.id);
      queue.push({ nodeId: node.id, level: 0 });
    });
    
    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      
      // Find nodes that depend on this node
      const dependentNodes = skillGraph.nodes.filter(node => 
        node.prerequisites.includes(nodeId) && !visited.has(node.id)
      );
      
      dependentNodes.forEach(node => {
        // Check if all prerequisites are at lower levels
        const prereqLevels = node.prerequisites.map(prereqId => levels.get(prereqId) || 0);
        const maxPrereqLevel = Math.max(...prereqLevels);
        const nodeLevel = maxPrereqLevel + 1;
        
        if (!levels.has(node.id) || levels.get(node.id)! < nodeLevel) {
          levels.set(node.id, nodeLevel);
          visited.add(node.id);
          queue.push({ nodeId: node.id, level: nodeLevel });
        }
      });
    }
    
    return levels;
  }

  /**
   * Calculate positions for nodes based on levels
   */
  private calculateNodePositions(
    levels: Map<string, number>,
    skillGraph: SkillGraph
  ): OptimizedSkillNode[] {
    const nodes: OptimizedSkillNode[] = [];
    const levelGroups = new Map<number, SkillNode[]>();
    
    // Group nodes by level
    skillGraph.nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });
    
    // Calculate positions
    const levelHeight = 150; // Vertical spacing between levels
    const nodeWidth = 200; // Horizontal spacing between nodes
    
    levelGroups.forEach((levelNodes, level) => {
      const y = level * levelHeight;
      const totalWidth = levelNodes.length * nodeWidth;
      const startX = -totalWidth / 2;
      
      levelNodes.forEach((node, index) => {
        const x = startX + (index * nodeWidth);
        
        nodes.push({
          ...node,
          level,
          position: { x, y },
          visible: true,
          clustered: false
        });
      });
    });
    
    return nodes;
  }

  /**
   * Apply viewport culling to hide nodes outside the visible area
   */
  private applyViewportCulling(
    nodes: OptimizedSkillNode[],
    viewport: Viewport
  ): OptimizedSkillNode[] {
    if (!this.config.virtualScrolling) {
      return nodes;
    }
    
    const margin = 100; // Extra margin for smooth scrolling
    
    return nodes.map(node => ({
      ...node,
      visible: (
        node.position.x >= viewport.x - margin &&
        node.position.x <= viewport.x + viewport.width + margin &&
        node.position.y >= viewport.y - margin &&
        node.position.y <= viewport.y + viewport.height + margin
      )
    }));
  }

  /**
   * Apply clustering for dense areas
   */
  private applyClustering(
    nodes: OptimizedSkillNode[],
    skillStates: Map<string, SkillState>
  ): OptimizedSkillNode[] {
    if (nodes.length <= this.config.maxVisibleNodes) {
      return nodes;
    }
    
    // Group nodes by proximity and state
    const clusters = this.findClusters(nodes, skillStates);
    const clusteredNodes: OptimizedSkillNode[] = [];
    
    clusters.forEach(cluster => {
      if (cluster.length >= this.config.clusterThreshold) {
        // Create cluster representative
        const representative = this.createClusterRepresentative(cluster);
        clusteredNodes.push(representative);
      } else {
        // Keep individual nodes
        clusteredNodes.push(...cluster);
      }
    });
    
    return clusteredNodes;
  }

  /**
   * Find clusters of nearby nodes with similar states
   */
  private findClusters(
    nodes: OptimizedSkillNode[],
    skillStates: Map<string, SkillState>
  ): OptimizedSkillNode[][] {
    const clusters: OptimizedSkillNode[][] = [];
    const visited = new Set<string>();
    const clusterDistance = 150; // Maximum distance for clustering
    
    nodes.forEach(node => {
      if (visited.has(node.id)) return;
      
      const cluster: OptimizedSkillNode[] = [node];
      visited.add(node.id);
      
      const nodeState = skillStates.get(node.id) || 'locked';
      
      // Find nearby nodes with similar state
      nodes.forEach(otherNode => {
        if (visited.has(otherNode.id)) return;
        
        const otherState = skillStates.get(otherNode.id) || 'locked';
        if (nodeState !== otherState) return;
        
        const distance = Math.sqrt(
          Math.pow(node.position.x - otherNode.position.x, 2) +
          Math.pow(node.position.y - otherNode.position.y, 2)
        );
        
        if (distance <= clusterDistance) {
          cluster.push(otherNode);
          visited.add(otherNode.id);
        }
      });
      
      clusters.push(cluster);
    });
    
    return clusters;
  }

  /**
   * Create a representative node for a cluster
   */
  private createClusterRepresentative(cluster: OptimizedSkillNode[]): OptimizedSkillNode {
    // Calculate center position
    const centerX = cluster.reduce((sum, node) => sum + node.position.x, 0) / cluster.length;
    const centerY = cluster.reduce((sum, node) => sum + node.position.y, 0) / cluster.length;
    
    // Use the first node as the base
    const baseNode = cluster[0];
    
    return {
      ...baseNode,
      id: `cluster_${cluster.map(n => n.id).join('_')}`,
      title: `${cluster.length} Skills`,
      description: `Cluster of ${cluster.length} skills`,
      position: { x: centerX, y: centerY },
      visible: true,
      clustered: true,
      clusterSize: cluster.length
    };
  }

  /**
   * Apply level of detail based on zoom level
   */
  private applyLevelOfDetail(
    nodes: OptimizedSkillNode[],
    zoom: number
  ): OptimizedSkillNode[] {
    if (!this.config.levelOfDetail) {
      return nodes;
    }
    
    // At low zoom levels, show fewer details
    if (zoom < 0.5) {
      // Only show mastered and unlocked skills
      return nodes.filter(node => !node.clustered || (node.clusterSize && node.clusterSize > 3));
    } else if (zoom < 0.8) {
      // Show most skills but simplify rendering
      return nodes.map(node => ({
        ...node,
        // Could add simplified rendering flags here
      }));
    }
    
    // At high zoom, show all details
    return nodes;
  }

  /**
   * Calculate rendering statistics
   */
  private calculateRenderingStats(
    optimizedNodes: OptimizedSkillNode[],
    totalNodes: number
  ): {
    visibleNodes: number;
    hiddenNodes: number;
    clusters: number;
  } {
    const visibleNodes = optimizedNodes.filter(n => n.visible).length;
    const clusters = optimizedNodes.filter(n => n.clustered).length;
    
    return {
      visibleNodes,
      hiddenNodes: totalNodes - visibleNodes,
      clusters
    };
  }

  /**
   * Get optimal viewport for a skill graph
   */
  getOptimalViewport(skillGraph: SkillGraph): Viewport {
    const levels = this.calculateNodeLevels(skillGraph);
    const maxLevel = Math.max(...Array.from(levels.values()));
    
    // Calculate bounds
    const width = Math.max(800, skillGraph.nodes.length * 50);
    const height = Math.max(600, maxLevel * 150 + 200);
    
    return {
      x: -width / 2,
      y: -100,
      width,
      height,
      zoom: 1.0
    };
  }

  /**
   * Update optimization configuration
   */
  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current optimization configuration
   */
  getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const skillGraphOptimizer = new SkillGraphOptimizer();