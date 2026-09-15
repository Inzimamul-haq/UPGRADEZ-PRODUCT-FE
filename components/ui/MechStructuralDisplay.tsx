import React from 'react';
import { BeamRenderer } from './structural/BeamRenderer';
import { TrussRenderer } from './structural/TrussRenderer';
import { FrameRenderer } from './structural/FrameRenderer';
import { FreeBodyRenderer } from './structural/FreeBodyRenderer';

export function MechStructuralDisplay({ data, subtype, width = '100%', height = 500 }: any) {
  if (!data) return null;
  const nodes = data.nodes || [];
  const edges = data.edges || [];
  const supports = data.supports || [];
  const loads = data.loads || [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach((n: any) => {
    if (typeof n.x === 'number' && typeof n.y === 'number') {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }
  });

  if (minX === Infinity) {
    return (
      <div className="w-full flex justify-center items-center overflow-hidden bg-[#131312] border border-red-900 rounded-xl my-4 text-red-500" style={{ height }}>
        Diagram data incomplete (missing coordinates)
      </div>
    );
  }

  // Ensure minimum dimensions to prevent divide-by-zero or extreme scale factors
  let origWidth = maxX - minX;
  let origHeight = maxY - minY;

  if (origWidth === 0) origWidth = 2;
  if (origHeight === 0) origHeight = 2;

  const canvasW = 800;
  const canvasH = 400;
  
  // Tighter padding to maximize usable diagram area
  const padX = 60;
  const padY = 60;
  
  const usableW = canvasW - padX * 2;
  const usableH = canvasH - padY * 2;

  const scaleX = usableW / origWidth;
  const scaleY = usableH / origHeight;
  
  // Apply a balanced uniform scale factor
  const scale = Math.min(scaleX, scaleY);

  const drawW = origWidth * scale;
  const drawH = origHeight * scale;
  const offsetX = padX + (usableW - drawW) / 2;
  const offsetY = padY + (usableH - drawH) / 2;

  // Map coordinates: Flip Y so positive Y renders upwards on SVG
  const mapX = (x: number) => offsetX + (x - minX) * scale;
  const mapY = (y: number) => canvasH - (offsetY + (y - minY) * scale);

  const getNode = (id: string | number) => nodes.find((n: any) => String(n.id) === String(id));
  const props = { nodes, edges, supports, loads, mapX, mapY, getNode };

  return (
    <div className="w-full flex justify-center items-center overflow-hidden bg-[#131312] border border-[#2A2A28] rounded-xl my-4" style={{ height }}>
      <svg width={width} height="100%" viewBox={`0 0 ${canvasW} ${canvasH}`} preserveAspectRatio="xMidYMid meet">
        {subtype === 'beam' && <BeamRenderer {...props} />}
        {subtype === 'truss' && <TrussRenderer {...props} />}
        {subtype === 'frame' && <FrameRenderer {...props} />}
        {subtype === 'free_body' && <FreeBodyRenderer {...props} />}
        {!['beam', 'truss', 'frame', 'free_body'].includes(subtype) && <BeamRenderer {...props} />}
      </svg>
    </div>
  );
}
