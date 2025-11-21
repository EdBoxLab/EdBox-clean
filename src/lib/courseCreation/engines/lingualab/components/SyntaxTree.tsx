import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SyntaxNode } from '../types';

interface SyntaxTreeProps {
  data: SyntaxNode | null;
}

export const SyntaxTree: React.FC<SyntaxTreeProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current || !wrapperRef.current) return;

    // Clear previous render
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = wrapperRef.current.getBoundingClientRect();
    const margin = { top: 40, right: 20, bottom: 40, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create hierarchy
    const root = d3.hierarchy(data);
    
    // Create tree layout
    const treeLayout = d3.tree<SyntaxNode>().size([innerWidth, innerHeight - 50]);
    treeLayout(root);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#6b7280")
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkVertical()
        .x((d: any) => d.x)
        .y((d: any) => d.y) as any
      );

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

    // Node Circles
    node.append("circle")
      .attr("r", 20)
      .attr("fill", "#1e1e23")
      .attr("stroke", "#60a5fa")
      .attr("stroke-width", 2);

    // Labels (POS or Phrase tag)
    node.append("text")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .text((d) => d.data.name)
      .attr("fill", "#e5e7eb")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("font-family", "monospace");

  }, [data]);

  return (
    <div ref={wrapperRef} className="w-full h-full min-h-[400px] bg-[#25252b] rounded-lg overflow-hidden border border-gray-700 relative">
      <div className="absolute top-2 left-4 text-xs text-gray-400 font-mono">SYNTAX TREE VISUALIZER</div>
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};