import React from 'react';

export function IsometricDiagram({ data, width = 500, height = 320 }: any) {
  const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
  const edges = Array.isArray(data?.edges) ? data.edges : [];

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Isometric Diagram - No Data]
        </div>
      </div>
    );
  }

  // 1. Project 3D coordinates (x, y, z) into 2D isometric coordinates
  const projectedNodes = nodes.map((n: any) => {
    const x = typeof n.x === 'number' ? n.x : 0;
    const y = typeof n.y === 'number' ? n.y : 0;
    const z = typeof n.z === 'number' ? n.z : 0;
    
    // Standard isometric math (X right-down, Z left-down, Y up)
    const isoX = (x - z) * Math.cos(Math.PI / 6);
    const isoY = -y + (x + z) * Math.sin(Math.PI / 6);
    
    return { ...n, isoX, isoY };
  });

  // 2. Compute bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  projectedNodes.forEach((n: any) => {
    if (n.isoX < minX) minX = n.isoX;
    if (n.isoX > maxX) maxX = n.isoX;
    if (n.isoY < minY) minY = n.isoY;
    if (n.isoY > maxY) maxY = n.isoY;
  });

  const padding = 40;
  const drawingWidth = Math.max(maxX - minX, 1);
  const drawingHeight = Math.max(maxY - minY, 1);

  // 3. Compute uniform scale to fit exactly within bounding box (capped at 2x zoom)
  const scaleX = (width - padding * 2) / drawingWidth;
  const scaleY = (height - padding * 2) / drawingHeight;
  const scale = Math.min(scaleX, scaleY, 2);

  // 4. Center drawing
  const scaledWidth = drawingWidth * scale;
  const scaledHeight = drawingHeight * scale;
  const offsetX = (width - scaledWidth) / 2 - (minX * scale);
  const offsetY = (height - scaledHeight) / 2 - (minY * scale);

  const nodeMap = new Map<string, any>(projectedNodes.map((n: any) => [n.id, n]));

  // Separate hidden and visible edges to draw hidden behind visible
  const hiddenEdges = edges.filter((e: any) => e.hidden);
  const visibleEdges = edges.filter((e: any) => !e.hidden);

  const renderEdge = (e: any, isHidden: boolean, idx: number) => {
    const fromNode = nodeMap.get(e.from);
    const toNode = nodeMap.get(e.to);
    if (!fromNode || !toNode) return null;

    const x1 = fromNode.isoX * scale + offsetX;
    const y1 = fromNode.isoY * scale + offsetY;
    const x2 = toNode.isoX * scale + offsetX;
    const y2 = toNode.isoY * scale + offsetY;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dimensionText = e.dimension ? `${e.dimension.value}${e.dimension.unit || ''}` : '';

    return (
      <g key={`edge-${isHidden ? 'h' : 'v'}-${idx}`}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isHidden ? "#52525B" : "#D4D4D8"}
          strokeWidth={isHidden ? "1.5" : "2"}
          strokeDasharray={isHidden ? "6 4" : "none"}
        />
        {dimensionText && (
          <text
            x={midX}
            y={midY - 8}
            fill="#A1A1AA"
            fontSize="10"
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-medium bg-[#1C1C1B]"
          >
            {dimensionText}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="relative mt-2" style={{ width, height }}>
      <div className="absolute top-2 right-2 px-2 py-1 bg-[#2C2C2A] text-[#E5A05F] text-[10px] rounded border border-[#3A3A38] uppercase tracking-wider font-semibold shadow-sm z-10 pointer-events-none">
        ISOMETRIC
      </div>
      <svg width={width} height={height} className="overflow-visible block">
        {/* Edges */}
        {hiddenEdges.map((e: any, i: number) => renderEdge(e, true, i))}
        {visibleEdges.map((e: any, i: number) => renderEdge(e, false, i))}

        {/* Nodes (Optional: only draw if explicitly labeled or debugging) */}
        {/* In engineering drawing, we generally just want the solid body lines, but drawing tiny dots at vertices can look nice */}
        {projectedNodes.map((n: any, i: number) => {
          const cx = n.isoX * scale + offsetX;
          const cy = n.isoY * scale + offsetY;
          return (
            <g key={`node-${n.id || i}`}>
              <circle
                cx={cx}
                cy={cy}
                r="3"
                fill="#E5A05F"
              />
              {n.label && (
                <text
                  x={cx + 6}
                  y={cy - 6}
                  fill="#E5A05F"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
