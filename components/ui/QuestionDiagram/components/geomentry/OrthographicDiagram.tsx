import React from 'react';

export function OrthographicDiagram({ data, width = 500, height = 320 }: any) {
  const views = Array.isArray(data?.views) ? data.views : [];

  if (views.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Orthographic Diagram - No Data]
        </div>
      </div>
    );
  }

  // 1. Calculate global bounding box across all views (since we want a shared scale)
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  views.forEach((view: any) => {
    const points = Array.isArray(view.points) ? view.points : [];
    points.forEach((p: any) => {
      const px = typeof p.x === 'number' ? p.x : 0;
      const py = typeof p.y === 'number' ? p.y : 0;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      // In typical 2D, Y grows downwards, but for engineering it often grows upwards.
      // Assuming y is standard cartesian (up is positive), we need to invert it for SVG later.
      // For bounding box, just find min/max.
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    });
  });

  const drawingWidth = Math.max(maxX - minX, 1);
  const drawingHeight = Math.max(maxY - minY, 1);

  // Each quadrant is half the width and half the height
  const quadWidth = width / 2;
  const quadHeight = height / 2;
  const padding = 30;

  // 2. Shared scale computation
  // We need to fit the drawing inside a single quadrant
  const scaleX = (quadWidth - padding * 2) / drawingWidth;
  const scaleY = (quadHeight - padding * 2) / drawingHeight;
  const sharedScale = Math.min(scaleX, scaleY, 3); // cap at 3x zoom

  const scaledWidth = drawingWidth * sharedScale;
  const scaledHeight = drawingHeight * sharedScale;

  // 3. Grid positions for each quadrant (Third-angle projection standard)
  // FV: Top-Left (x: 0, y: 0)
  // TV: Bottom-Left (x: 0, y: quadHeight)
  // SV: Top-Right (x: quadWidth, y: 0)
  const getQuadrantOrigin = (label: string) => {
    switch (label) {
      case 'FV': return { qx: 0, qy: 0 };
      case 'TV': return { qx: 0, qy: quadHeight };
      case 'SV': return { qx: quadWidth, qy: 0 };
      default: return { qx: quadWidth, qy: quadHeight }; // fallback to bottom-right
    }
  };

  const renderView = (view: any, i: number) => {
    const { label } = view;
    const { qx, qy } = getQuadrantOrigin(label);

    const points = Array.isArray(view.points) ? view.points : [];
    const edges = Array.isArray(view.edges) ? view.edges : [];
    const pointMap = new Map<string, any>(points.map((p: any) => [p.id, p]));

    // Center this view within its quadrant
    const offsetX = qx + (quadWidth - scaledWidth) / 2 - (minX * sharedScale);
    // Y axis in engineering drawing is typically UP = positive.
    // To flip Y for SVG, we subtract the scaled Y from the quadrant's max Y.
    const offsetY = qy + (quadHeight + scaledHeight) / 2 + (minY * sharedScale);

    return (
      <g key={`view-${label || i}`}>
        {/* Quadrant Divider (optional subtle background) */}
        <text x={qx + 10} y={qy + 20} fill="#E5A05F" fontSize="12" fontWeight="bold">
          {label}
        </text>

        {/* Edges */}
        {edges.map((e: any, idx: number) => {
          const fromNode = pointMap.get(e.from);
          const toNode = pointMap.get(e.to);
          if (!fromNode || !toNode) return null;

          const x1 = fromNode.x * sharedScale + offsetX;
          const y1 = offsetY - (fromNode.y * sharedScale);
          const x2 = toNode.x * sharedScale + offsetX;
          const y2 = offsetY - (toNode.y * sharedScale);

          const isHidden = e.hidden;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const dimensionText = e.dimension ? `${e.dimension.value}${e.dimension.unit || ''}` : '';

          return (
            <g key={`edge-${idx}`}>
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
                  className="font-medium"
                >
                  {dimensionText}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes (optional display for labels) */}
        {points.map((p: any, idx: number) => {
          if (!p.label) return null;
          const px = p.x * sharedScale + offsetX;
          const py = offsetY - (p.y * sharedScale);
          return (
            <text
              key={`node-label-${idx}`}
              x={px + 4}
              y={py - 4}
              fill="#E5A05F"
              fontSize="10"
              fontWeight="bold"
            >
              {p.label}
            </text>
          );
        })}
      </g>
    );
  };

  return (
    <div className="relative mt-2" style={{ width, height }}>
      <div className="absolute top-2 right-2 px-2 py-1 bg-[#2C2C2A] text-[#E5A05F] text-[10px] rounded border border-[#3A3A38] uppercase tracking-wider font-semibold shadow-sm z-10 pointer-events-none">
        ORTHOGRAPHIC
      </div>
      <svg width={width} height={height} className="overflow-visible block">
        {/* Draw subtle crosshairs to divide the quadrants */}
        <line x1={quadWidth} y1={0} x2={quadWidth} y2={height} stroke="#3A3A38" strokeWidth="1" strokeDasharray="4 4" />
        <line x1={0} y1={quadHeight} x2={width} y2={quadHeight} stroke="#3A3A38" strokeWidth="1" strokeDasharray="4 4" />

        {views.map((view: any, i: number) => renderView(view, i))}
      </svg>
    </div>
  );
}
