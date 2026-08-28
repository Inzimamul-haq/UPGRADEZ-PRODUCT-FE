import React from 'react';

export interface GraphNode {
  id: string;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
}

export interface GraphDefinition {
  nodes: string[];
  edges: GraphEdge[];
  directed?: boolean;
}

interface GraphDisplayProps {
  graph: GraphDefinition;
  className?: string;
  width?: number;
  height?: number;
  nodeColor?: string;
  edgeColor?: string;
  activeNodes?: Set<string>;
  activeEdges?: Set<string>;
  visitedNodes?: Set<string>;
  nodePositions?: Record<string, { x: number; y: number }>;
}

export function generateCircularLayout(nodes: string[], width: number, height: number): Record<string, { x: number; y: number }> {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 30; // 30px padding
  
  const positions: Record<string, { x: number; y: number }> = {};
  const n = nodes.length;
  
  nodes.forEach((node, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2; // Start from top
    positions[node] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
  
  return positions;
}

export function GraphDisplay({ 
  graph, 
  className = "", 
  width = 300, 
  height = 300,
  nodeColor = "#3A3A38",
  edgeColor = "#555",
  activeNodes = new Set(),
  activeEdges = new Set(),
  visitedNodes = new Set(),
  nodePositions
}: GraphDisplayProps) {
  const positions = nodePositions || generateCircularLayout(graph.nodes, width, height);
  const isDirected = graph.directed !== false;
  
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg width={width} height={height} className="overflow-visible font-sans">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="22" // offset to account for node radius (15) + padding
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={edgeColor} />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="7"
            refX="22"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#EAB308" /> {/* Yellow for active */}
          </marker>
        </defs>

        {/* Edges */}
        {graph.edges.map((edge, i) => {
          const fromPos = positions[edge.from];
          const toPos = positions[edge.to];
          if (!fromPos || !toPos) return null;
          
          const edgeId = `${edge.from}-${edge.to}`;
          const isActive = activeEdges.has(edgeId) || activeEdges.has(`${edge.to}-${edge.from}`);
          
          // Calculate midpoint for weight label
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          
          // Shift label slightly up/left to avoid intersecting the line
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = -dy / len;
          const ny = dx / len;

          return (
            <g key={`edge-${i}`}>
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={isActive ? "#EAB308" : edgeColor}
                strokeWidth={isActive ? 3 : 2}
                markerEnd={isDirected ? (isActive ? "url(#arrowhead-active)" : "url(#arrowhead)") : undefined}
                className="transition-all duration-300"
              />
              {edge.weight !== undefined && (
                <text
                  x={midX + nx * 12}
                  y={midY + ny * 12}
                  fill="#A1A1AA"
                  fontSize="12"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-medium"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {graph.nodes.map((node) => {
          const pos = positions[node];
          if (!pos) return null;
          
          const isActive = activeNodes.has(node);
          const isVisited = visitedNodes.has(node);
          
          let bgColor = nodeColor;
          let textColor = "#ECECEA";
          let strokeColor = "#4b4b4b";
          
          if (isActive) {
            bgColor = "#EAB308"; // Yellow
            textColor = "#1C1C1B";
            strokeColor = "#FDE047";
          } else if (isVisited) {
            bgColor = "#16A34A"; // Green
            strokeColor = "#22C55E";
          }

          return (
            <g key={`node-${node}`} className="transition-all duration-300">
              <circle
                cx={pos.x}
                cy={pos.y}
                r={16}
                fill={bgColor}
                stroke={strokeColor}
                strokeWidth={2}
                className="transition-colors duration-300"
              />
              <text
                x={pos.x}
                y={pos.y}
                fill={textColor}
                fontSize="14"
                textAnchor="middle"
                dominantBaseline="central"
                fontWeight="600"
              >
                {node}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
