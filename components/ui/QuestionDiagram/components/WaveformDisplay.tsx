import React from 'react';

export function WaveformDisplay({ data, subtype, width = 500, height = 260 }: any) {
  const points = data?.points || [];
  const axes = data?.axes || { xLabel: 'Time', yLabel: 'Value' };

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md mt-2 bg-[#1C1C1B]" style={{ width, height }}>
        <div className="text-xs text-[#6C6C6A] italic">
          [Waveform Diagram{subtype ? `: ${subtype}` : ''} - No Data]
        </div>
      </div>
    );
  }

  const numWidth = typeof width === 'number' ? width : 500;
  const numHeight = typeof height === 'number' ? height : 260;
  
  const padding = 40;
  const chartW = numWidth - padding * 2;
  const chartH = numHeight - padding * 2;

  // Find min/max to scale points
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  points.forEach((p: any) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  if (minX === maxX) maxX = minX + 1;
  if (minY === maxY) {
    minY = minY - 1;
    maxY = maxY + 1;
  }

  // Add margin to Y axis
  const yRange = maxY - minY;
  minY -= yRange * 0.1;
  maxY += yRange * 0.1;

  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * chartW;
  const scaleY = (y: number) => padding + chartH - ((y - minY) / (maxY - minY)) * chartH;

  // Build step-function points
  let stepPoints = '';
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const x = scaleX(p.x);
    const y = scaleY(p.y);
    
    if (i === 0) {
      stepPoints += `${x},${y} `;
    } else {
      const prevX = scaleX(points[i-1].x);
      // Horizontal line to current X, then vertical line to current Y
      stepPoints += `${x},${scaleY(points[i-1].y)} ${x},${y} `;
    }
  }

  return (
    <div className="relative mt-2" style={{ width: numWidth, height: numHeight }}>
      <svg width={numWidth} height={numHeight} viewBox={`0 0 ${numWidth} ${numHeight}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block', maxWidth: '100%' }} className="overflow-visible block bg-[#1C1C1B] rounded-lg border border-[#3A3A38]">
        {/* Grid and Axes */}
        <line x1={padding} y1={padding + chartH} x2={padding + chartW} y2={padding + chartH} stroke="#4C4C4A" strokeWidth="2" />
        <line x1={padding} y1={padding} x2={padding} y2={padding + chartH} stroke="#4C4C4A" strokeWidth="2" />
        
        {/* Labels */}
        <text x={padding + chartW / 2} y={numHeight - 10} fill="#A1A1AA" fontSize="11" textAnchor="middle">{axes.xLabel}</text>
        <text x={10} y={padding + chartH / 2} fill="#A1A1AA" fontSize="11" textAnchor="middle" transform={`rotate(-90 15,${padding + chartH / 2})`}>{axes.yLabel}</text>

        {/* The Waveform */}
        <polyline 
          points={stepPoints} 
          fill="none" 
          stroke="#F59E0B" 
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data points (optional dots) */}
        {points.map((p: any, i: number) => (
          <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={3} fill="#F59E0B" />
        ))}
      </svg>
    </div>
  );
}
