import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Point, StickFigurePose, JointName, StickFigureData } from '../types';
import { LIMBS } from '../constants';

// --- HELPER FUNCTIONS ---
const calculateBoundingBox = (pose: StickFigurePose) => {
  const points = Object.values(pose);
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const minX = Math.min(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxX = Math.max(...points.map(p => p.x));
  const maxY = Math.max(...points.map(p => p.y));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

const getCenter = (box: { x: number, y: number, width: number, height: number }) => {
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

// --- PROPS INTERFACE ---
interface StickFigureEditorProps {
  stickFigures: StickFigureData[];
  selectedFigureId: string | null;
  onSelectFigure: (id: string | null) => void;
  onPoseChange: (figureId: string, newPose: StickFigurePose) => void;
  canvasSize: { width: number, height: number };
  onCanvasResize: (newSize: { width: number, height: number }) => void;
  viewBox: string;
  theme: 'light' | 'dark';
  onZoom: (factor: number) => void;
}

const StickFigureEditor: React.FC<StickFigureEditorProps> = ({ 
  stickFigures, 
  selectedFigureId, 
  onSelectFigure,
  onPoseChange,
  canvasSize,
  onCanvasResize,
  viewBox,
  theme,
  onZoom
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Interaction States
  const [draggingInfo, setDraggingInfo] = useState<{ figureId: string; joint: JointName; initialPose: StickFigurePose; } | null>(null);
  const [selectedJoints, setSelectedJoints] = useState<Set<JointName>>(new Set());
  const [selectionBox, setSelectionBox] = useState<{ start: Point; current: Point } | null>(null);
  const [scalingInfo, setScalingInfo] = useState<{ figureId: string; startPose: StickFigurePose; center: Point; startPoint: Point; } | null>(null);
  const [movingInfo, setMovingInfo] = useState<{ figureId: string; startPose: StickFigurePose; startPoint: Point } | null>(null);
  
  const getSVGCoordinates = useCallback((clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const screenCTM = svg.getScreenCTM();
    return screenCTM ? pt.matrixTransform(screenCTM.inverse()) : null;
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getSVGCoordinates(e.clientX, e.clientY);
    if(!coords) return;
    
    const target = e.target as SVGElement;
    const { joint, figureId, scaleHandle, moveHandle } = target.dataset;

    if (moveHandle && selectedFigureId) {
        e.stopPropagation();
        const figure = stickFigures.find(f => f.id === selectedFigureId);
        if (!figure) return;
        setMovingInfo({
            figureId: selectedFigureId,
            startPose: figure.pose,
            startPoint: coords,
        });
    } else if (joint && figureId) {
      e.stopPropagation();
      onSelectFigure(figureId);
      const jointName = joint as JointName;
      const figure = stickFigures.find(f => f.id === figureId);
      if(!figure) return;
      
      if (e.shiftKey) {
        setSelectedJoints(prev => {
          const newSet = new Set(prev);
          if (newSet.has(jointName)) newSet.delete(jointName);
          else newSet.add(jointName);
          return newSet;
        });
      } else {
        if (!selectedJoints.has(jointName)) {
          setSelectedJoints(new Set([jointName]));
        }
      }
      setDraggingInfo({ figureId, joint: jointName, initialPose: figure.pose });
    } else if (scaleHandle && selectedFigureId) {
        e.stopPropagation();
        const figure = stickFigures.find(f => f.id === selectedFigureId);
        if (!figure) return;
        const box = calculateBoundingBox(figure.pose);
        setScalingInfo({
            figureId: selectedFigureId,
            startPose: figure.pose,
            center: getCenter(box),
            startPoint: coords
        });
    } else if (figureId) {
      e.stopPropagation();
      if(selectedFigureId !== figureId) {
        onSelectFigure(figureId);
        setSelectedJoints(new Set());
      }
    } else {
      // Don't deselect the figure immediately. This allows drag-selection to work.
      // Deselection is handled in handleMouseUp to distinguish a click from a drag.
      setSelectedJoints(new Set());
      setSelectionBox({ start: coords, current: coords });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getSVGCoordinates(e.clientX, e.clientY);
    if (!coords) return;

    if (movingInfo) {
        const { figureId, startPose, startPoint } = movingInfo;
        const dx = coords.x - startPoint.x;
        const dy = coords.y - startPoint.y;
        const newPose = { ...startPose };
        for(const key in startPose) {
            const jointName = key as JointName;
            newPose[jointName] = {
                x: startPose[jointName].x + dx,
                y: startPose[jointName].y + dy,
            }
        }
        onPoseChange(figureId, newPose);
    } else if (draggingInfo) {
      const { figureId, joint, initialPose } = draggingInfo;
      const originalJointPos = initialPose[joint];
      const dx = coords.x - originalJointPos.x;
      const dy = coords.y - originalJointPos.y;

      const newPose = { ...initialPose };
      
      const primaryJoint = joint;
      const jointsToUpdate = new Set<JointName>(
          selectedJoints.size > 1 && selectedJoints.has(primaryJoint) ? selectedJoints : [primaryJoint]
      );

      // Hierarchical movement
      if (primaryJoint === 'neck') {
          ['head', 'leftShoulder', 'rightShoulder'].forEach(j => jointsToUpdate.add(j as JointName));
      }
      if (primaryJoint === 'pelvis') {
          ['leftHip', 'rightHip'].forEach(j => jointsToUpdate.add(j as JointName));
      }

      jointsToUpdate.forEach(j => {
        newPose[j] = { x: initialPose[j].x + dx, y: initialPose[j].y + dy };
      });
      
      // Constraints for single-joint adjustments (non-hierarchical)
      if (jointsToUpdate.size === 1) {
          const movedJoint = jointsToUpdate.values().next().value;
          const constrain = (center: Point, point: Point, maxDist: number) => {
              const vecX = point.x - center.x;
              const vecY = point.y - center.y;
              const dist = Math.sqrt(vecX * vecX + vecY * vecY);
              if (dist > maxDist) {
                  return {
                      x: center.x + (vecX / dist) * maxDist,
                      y: center.y + (vecY / dist) * maxDist
                  };
              }
              return point;
          };

          if (movedJoint === 'head') {
              newPose['head'] = constrain(newPose['neck'], newPose['head'], 40);
          } else if (movedJoint === 'leftShoulder' || movedJoint === 'rightShoulder') {
              newPose[movedJoint] = constrain(newPose['neck'], newPose[movedJoint], 50);
          } else if (movedJoint === 'leftHip' || movedJoint === 'rightHip') {
              newPose[movedJoint] = constrain(newPose['pelvis'], newPose[movedJoint], 30);
          }
      }
      onPoseChange(figureId, newPose);

    } else if (scalingInfo) {
        const { figureId, startPose, center, startPoint } = scalingInfo;
        const distCurrent = Math.sqrt(Math.pow(coords.x - center.x, 2) + Math.pow(coords.y - center.y, 2));
        const distStart = Math.sqrt(Math.pow(startPoint.x - center.x, 2) + Math.pow(startPoint.y - center.y, 2));

        if (distStart === 0) return;
        const scaleFactor = distCurrent / distStart;
        
        const newPose = { ...startPose };
        for (const key in startPose) {
            const jointName = key as JointName;
            const originalPos = startPose[jointName];
            const vecX = originalPos.x - center.x;
            const vecY = originalPos.y - center.y;
            newPose[jointName] = {
                x: center.x + vecX * scaleFactor,
                y: center.y + vecY * scaleFactor
            }
        }
        onPoseChange(figureId, newPose);

    } else if (selectionBox) {
      setSelectionBox({ ...selectionBox, current: coords });
    }
  };
  
  const handleMouseUp = () => {
    if (selectionBox) {
      const { start, current } = selectionBox;
      // Check if it was a drag or a click
      const dragDistance = Math.sqrt(Math.pow(current.x - start.x, 2) + Math.pow(current.y - start.y, 2));
      
      // If the drag distance is significant, treat as a selection
      if (dragDistance > 5 && selectedFigureId) {
        const figure = stickFigures.find(f => f.id === selectedFigureId);
        if (figure) {
          const x1 = Math.min(start.x, current.x);
          const y1 = Math.min(start.y, current.y);
          const x2 = Math.max(start.x, current.x);
          const y2 = Math.max(start.y, current.y);
          
          const jointsInBox = Object.entries(figure.pose)
            // FIX: Explicitly type the `point` parameter to resolve TypeScript errors.
            .filter(([, point]: [string, Point]) => point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2)
            .map(([name]) => name as JointName);

          setSelectedJoints(new Set(jointsInBox));
        }
      } else if (dragDistance <= 5) {
        // If it's a click, deselect the figure
        onSelectFigure(null);
      }
    }

    setDraggingInfo(null);
    setSelectionBox(null);
    setScalingInfo(null);
    setMovingInfo(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // deltaY < 0 is scroll up (zoom in), > 0 is scroll down (zoom out)
        // Zoom in should make the viewBox smaller (factor < 1)
        const factor = e.deltaY < 0 ? 0.9 : 1.1;
        onZoom(factor);
    }
  };
  
  useEffect(() => {
    if(selectedFigureId && !stickFigures.find(f => f.id === selectedFigureId)) {
      onSelectFigure(stickFigures[0]?.id ?? null);
    }
  }, [selectedFigureId, stickFigures, onSelectFigure]);


  const selectedFigure = stickFigures.find(f => f.id === selectedFigureId);
  const boundingBox = selectedFigure ? calculateBoundingBox(selectedFigure.pose) : null;
  const padding = 25;

  return (
    <div className="w-full h-full cursor-auto relative">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full select-none"
      >
        {theme === 'dark' && (
          <defs>
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}

        {stickFigures.map(figure => {
          const isSelectedFigure = figure.id === selectedFigureId;
          return (
            <g key={figure.id} filter={theme === 'dark' ? "url(#neon-glow)" : "none"} opacity={!selectedFigureId || isSelectedFigure ? 1 : 0.3} className="transition-opacity">
              {LIMBS.map(([start, end], i) => (
                <line 
                  key={i} 
                  x1={figure.pose[start].x} y1={figure.pose[start].y} 
                  x2={figure.pose[end].x} y2={figure.pose[end].y} 
                  stroke={theme === 'dark' ? figure.color : (figure.color || 'black')}
                  strokeWidth="5" 
                  strokeLinecap="round" 
                  data-figure-id={figure.id} 
                  className="cursor-pointer" 
                />
              ))}
              <circle 
                cx={figure.pose.head.x} cy={figure.pose.head.y} r="20" 
                stroke={theme === 'dark' ? figure.color : (figure.color || 'black')}
                strokeWidth="5" fill="none" data-figure-id={figure.id} className="cursor-pointer" 
              />
              {/* FIX: Explicitly type the `p` parameter to resolve TypeScript errors. */}
              {isSelectedFigure && Object.entries(figure.pose).map(([name, p]: [string, Point]) => {
                const jointName = name as JointName;
                const isSelectedJoint = selectedJoints.has(jointName);
                const jointColor = theme === 'dark' ? (isSelectedJoint ? '#f0f' : 'white') : (isSelectedJoint ? '#0891b2' : 'black');
                const jointStroke = theme === 'dark' ? '#67e8f9' : (isSelectedJoint ? '#67e8f9' : 'white');

                return (
                  <g key={name}>
                     <circle cx={p.x} cy={p.y} r={jointName === 'head' ? 20 : 15} fill="transparent" data-joint={jointName} data-figure-id={figure.id} aria-label={`Drag to move ${name}`} className="cursor-grab active:cursor-grabbing" />
                     {jointName !== 'head' && (
                       <circle cx={p.x} cy={p.y} r={isSelectedJoint ? 8 : 6} fill={jointColor} stroke={jointStroke} strokeWidth="2" className="pointer-events-none transition-all" />
                     )}
                  </g>
                );
              })}
            </g>
          )
        })}

        {boundingBox && (
          <g>
            <rect x={boundingBox.x - padding} y={boundingBox.y - padding} width={boundingBox.width + padding*2} height={boundingBox.height + padding*2} fill="none" stroke={theme === 'dark' ? 'cyan' : '#0891b2'} strokeWidth="1" strokeDasharray="4 4" className="pointer-events-none" />
            {/* Move Handle */}
            <circle cx={boundingBox.x + boundingBox.width / 2} cy={boundingBox.y - padding} r="8" fill={theme === 'dark' ? 'cyan' : '#0891b2'} stroke={theme === 'dark' ? 'black' : 'white'} strokeWidth="1.5" data-move-handle="true" className="cursor-move" />
            {/* Scale Handles */}
            {[
                [boundingBox.x - padding, boundingBox.y - padding], 
                [boundingBox.x + boundingBox.width + padding, boundingBox.y - padding], 
                [boundingBox.x - padding, boundingBox.y + boundingBox.height + padding], 
                [boundingBox.x + boundingBox.width + padding, boundingBox.y + boundingBox.height + padding]
            ].map(([x,y], i) => (
              <rect key={i} x={x-5} y={y-5} width="10" height="10" fill={theme === 'dark' ? 'cyan' : '#0891b2'} data-scale-handle={i} className="cursor-nwse-resize" />
            ))}
          </g>
        )}
        
        {selectionBox && (
          <rect
            x={Math.min(selectionBox.start.x, selectionBox.current.x)}
            y={Math.min(selectionBox.start.y, selectionBox.current.y)}
            width={Math.abs(selectionBox.start.x - selectionBox.current.x)}
            height={Math.abs(selectionBox.start.y - selectionBox.current.y)}
            fill={theme === 'dark' ? 'rgba(0, 255, 255, 0.2)' : 'rgba(8, 145, 178, 0.2)'}
            stroke={theme === 'dark' ? 'rgba(0, 255, 255, 0.7)' : 'rgba(8, 145, 178, 0.7)'}
            strokeWidth="1"
            className="pointer-events-none"
          />
        )}
      </svg>
    </div>
  );
};

export default StickFigureEditor;