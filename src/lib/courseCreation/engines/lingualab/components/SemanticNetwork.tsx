import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SemanticGraph } from '../types';

interface SemanticNetworkProps {
  data: SemanticGraph | null;
}

export const SemanticNetwork: React.FC<SemanticNetworkProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current || !wrapperRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = wrapperRef.current.getBoundingClientRect();

    // Simulation
    const simulation = d3.forceSimulation(data.nodes as any)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Arrow markers
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25) // Position of arrow relative to node center
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#9ca3af");

    // Links
    const link = svg.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", "#9ca3af")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)");

    // Link Labels
    const linkLabel = svg.append("g")
        .selectAll("text")
        .data(data.links)
        .join("text")
        .text((d: any) => d.relation)
        .attr("font-size", "10px")
        .attr("fill", "#9ca3af")
        .attr("text-anchor", "middle");

    // Nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended) as any);

    node.append("circle")
      .attr("r", (d: any) => 10 + (d.value || 1) * 2)
      .attr("fill", (d: any) => d.type === 'entity' ? '#34d399' : d.type === 'concept' ? '#60a5fa' : '#f472b6')
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    node.append("text")
      .text((d: any) => d.label)
      .attr("x", 15)
      .attr("y", 4)
      .attr("fill", "#e5e7eb")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("pointer-events", "none"); // Prevent text from interfering with drag

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

    linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [data]);

  return (
    <div ref={wrapperRef} className="w-full h-full min-h-[400px] bg-[#25252b] rounded-lg overflow-hidden border border-gray-700 relative">
      <div className="absolute top-2 left-4 text-xs text-gray-400 font-mono">SEMANTIC NETWORK</div>
      <div className="absolute bottom-2 right-4 flex gap-2 text-xs font-mono">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Entity</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Concept</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-400"></span> Attribute</span>
      </div>
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};