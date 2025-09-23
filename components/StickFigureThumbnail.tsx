import React, { useMemo } from 'react';
import type { StickFigurePose, Point } from '../types';
import { LIMBS } from '../constants';

const calculateBoundingBox = (pose: StickFigurePose) => {
  const points = Object.values(pose);
  if (points.length === 0) return { x: 0, y: 0, width: 100, height: 100 };
  
  let minX = Math.min(...points.map(p => p.x));
  let minY = Math.min(...points.map(p => p.y));
  let maxX = Math.max(...points.map(p => p.x));
  let maxY = Math.max(...points.map(p => p.y));
  
  let width = maxX - minX;
  let height = maxY - minY;

  // Bug Fix: Ensure a minimum dimension for the viewBox to prevent lines 
  // on the same axis from becoming invisible in the thumbnail.
  const minDimension = 20; 
  if (width < minDimension) {
    const expansion = (minDimension - width) / 2;
    minX -= expansion;
    width = minDimension;
  }
  if (height < minDimension) {
    const expansion = (minDimension - height) / 2;
    minY -= expansion;
    height = minDimension;
  }

  return { 
    x: minX, 
    y: minY, 
    width: width,
    height: height
  };
};


interface StickFigureThumbnailProps {
  pose: StickFigurePose;
  theme: 'light' | 'dark';
}

const StickFigureThumbnail: React.FC<StickFigureThumbnailProps> = ({ pose, theme }) => {
  const uniqueId = useMemo(() => `thumb-${crypto.randomUUID()}`, []);
  const box = calculateBoundingBox(pose);
  const padding = 40; // Add padding to avoid clipping at edges

  return (
    <svg 
      viewBox={`${box.x - padding} ${box.y - padding} ${box.width + padding * 2} ${box.height + padding * 2}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {theme === 'dark' ? (
        <>
          <defs>
            {LIMBS.map(([start, end], i) => {
                const p1 = pose[start];
                const p2 = pose[end];
                const gradId = `${uniqueId}-${i}`;
                return (
                  <linearGradient key={gradId} id={gradId} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#67e8f9" />
                      <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>
                );
            })}
          </defs>
          <g>
              {LIMBS.map(([start, end], i) => (
                <line key={i} x1={pose[start].x} y1={pose[start].y} x2={pose[end].x} y2={pose[end].y} stroke={`url(#${uniqueId}-${i})`} strokeWidth="8" strokeLinecap="round"/>
              ))}
              <circle cx={pose.head.x} cy={pose.head.y} r="20" stroke="cyan" strokeWidth="8" fill="none"/>
              {/* FIX: Explicitly type the `p` parameter to resolve TypeScript errors. */}
              {Object.entries(pose).map(([name, p]: [string, Point]) => {
                if (name === 'head') return null;
                return (
                  <circle key={name} cx={p.x} cy={p.y} r="8" fill="white" stroke="#67e8f9" strokeWidth="2" />
                );
              })}
          </g>
        </>
      ) : (
        <g>
            {LIMBS.map(([start, end], i) => (
              <line key={i} x1={pose[start].x} y1={pose[start].y} x2={pose[end].x} y2={pose[end].y} stroke="black" strokeWidth="8" strokeLinecap="round"/>
            ))}
            <circle cx={pose.head.x} cy={pose.head.y} r="20" stroke="black" strokeWidth="8" fill="none"/>
            {/* FIX: Explicitly type the `p` parameter to resolve TypeScript errors. */}
            {Object.entries(pose).map(([name, p]: [string, Point]) => {
              if (name === 'head') return null;
              return (
                 <circle key={name} cx={p.x} cy={p.y} r="8" fill="black" stroke="white" strokeWidth="2" />
              );
            })}
        </g>
      )}
    </svg>
  );
};

export default StickFigureThumbnail;