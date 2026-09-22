import React from 'react';

export interface BucketData {
  buckets?: { id?: string | number; values?: any[]; items?: any[] }[];
}

interface BucketsDisplayProps {
  data: BucketData;
  width?: number;
  height?: number;
}

export function BucketsDisplay({ data, width = 400, height = 150 }: BucketsDisplayProps) {
  const buckets = data.buckets;

  if (!buckets || !Array.isArray(buckets) || buckets.length === 0) {
    return (
      <svg width={width} height={height} className="mx-auto block">
        <text x={width / 2} y={height / 2} textAnchor="middle" fill="#888" fontSize={12}>
          Invalid buckets data
        </text>
      </svg>
    );
  }

  const bucketW = 40;
  const bucketH = 80;
  const gap = 20;
  const totalW = buckets.length * bucketW + (buckets.length - 1) * gap;
  const startX = Math.max((width - totalW) / 2, 10);
  const startY = (height - bucketH) / 2 - 10;
  const actualW = Math.max(width, totalW + 20);

  return (
    <svg width={actualW} height={height} className="mx-auto block" style={{ background: 'transparent' }}>
      {buckets.map((b, i) => {
        const x = startX + i * (bucketW + gap);
        const y = startY;
        const vals = Array.isArray(b.values) ? b.values : (Array.isArray(b.items) ? b.items : []);
        const id = b.id !== undefined ? b.id : i;

        return (
          <g key={i}>
            {/* Bucket U-shape */}
            <path d={`M ${x},${y} L ${x},${y + bucketH} L ${x + bucketW},${y + bucketH} L ${x + bucketW},${y}`} fill="none" stroke="#EBEBEA" strokeWidth="1.5" />
            
            {/* Label below bucket */}
            <text x={x + bucketW / 2} y={y + bucketH + 20} textAnchor="middle" fill="#8C8C8A" fontSize={11}>
              {String(id)}
            </text>

            {/* Values stacked inside the bucket (bottom to top) */}
            {vals.map((v, j) => {
              const itemH = 20;
              const itemY = y + bucketH - (j + 1) * itemH - 2;
              if (itemY < y) return null; // Overflow
              return (
                <text key={j} x={x + bucketW / 2} y={itemY + itemH / 2} dy="4" textAnchor="middle" fill="#EBEBEA" fontSize={11} fontWeight="bold">
                  {String(v)}
                </text>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
