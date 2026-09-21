import React from 'react';
import { SmartGuideLine } from '../types/editor';

interface SmartGuidesProps {
  guides: SmartGuideLine[];
  zoom: number;
}

export const SmartGuides: React.FC<SmartGuidesProps> = ({ guides, zoom }) => {
  if (guides.length === 0) return null;

  const strokeWidth = Math.max(1, 1 / zoom);

  return (
    <g className="pointer-events-none" style={{ zIndex: 100 }}>
      {guides.map((guide, idx) => {
        if (guide.type === 'vertical') {
          return (
            <line
              key={idx}
              x1={guide.position}
              y1={guide.start}
              x2={guide.position}
              y2={guide.end}
              stroke="#f43f5e"
              strokeWidth={strokeWidth}
              strokeDasharray="4 4"
            />
          );
        } else {
          return (
            <line
              key={idx}
              x1={guide.start}
              y1={guide.position}
              x2={guide.end}
              y2={guide.position}
              stroke="#f43f5e"
              strokeWidth={strokeWidth}
              strokeDasharray="4 4"
            />
          );
        }
      })}
    </g>
  );
};
