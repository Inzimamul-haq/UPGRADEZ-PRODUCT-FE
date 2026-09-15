import React from 'react';
import { STRUCTURAL_STYLES } from './constants';

interface DimensionRendererProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label?: string;
  isVertical?: boolean;
}

export function DimensionRenderer({ fromX, fromY, toX, toY, label, isVertical }: DimensionRendererProps) {
  const cx = (fromX + toX) / 2;
  const cy = (fromY + toY) / 2;
  
  if (label) {
    return (
      <g>
        <text 
          x={cx} 
          y={isVertical ? cy : cy - 10} 
          dx={isVertical ? 15 : 0}
          fill="#4ADE80" 
          fontSize={STRUCTURAL_STYLES.FONT_SIZE_DIMENSION} 
          fontWeight={STRUCTURAL_STYLES.FONT_WEIGHT_DIMENSION}
          fontFamily="sans-serif" 
          textAnchor={isVertical ? "start" : "middle"}
        >
          {label}
        </text>
      </g>
    );
  }
  
  return null;
}
