import React, { useState, useCallback, useEffect, useRef } from 'react';
import StickFigureEditor from './components/StickFigureEditor';
import PoseLibraryPanel from './components/PoseLibraryPanel';
import type { StickFigureData, StickFigurePose, SavedPose, JointName } from './types';
import { INITIAL_POSE, DEFAULT_POSES, STICK_FIGURE_COLORS } from './constants';

type Theme = 'light' | 'dark';

const saveLibraryToStorage = (poses: SavedPose[]) => {
  try {
    localStorage.setItem('stickFigurePoseLibrary', JSON.stringify(poses));
  } catch (error)
 {
    console.error("Failed to save poses to localStorage", error);
    alert("Could not save pose library. Your browser's storage might be full.");
  }
};

const normalizePose = (pose: StickFigurePose): StickFigurePose => {
  const pelvis = pose.pelvis;
  const normalized: Partial<StickFigurePose> = {};
  for (const key in pose) {
    const jointName = key as JointName;
    normalized[jointName] = {
      x: pose[jointName].x - pelvis.x,
      y: pose[jointName].y - pelvis.y,
    };
  }
  return normalized as StickFigurePose;
};

const applyNormalizedPose = (normalizedPose: StickFigurePose, targetPose: StickFigurePose): StickFigurePose => {
  const targetPelvis = targetPose.pelvis;
  const newPose: Partial<StickFigurePose> = {};
  for (const key in normalizedPose) {
    const jointName = key as JointName;
    newPose[jointName] = {
      x: normalizedPose[jointName].x + targetPelvis.x,
      y: normalizedPose[jointName].y + targetPelvis.y,
    };
  }
  return newPose as StickFigurePose;
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('stickFigureTheme') === 'dark' || (!('stickFigureTheme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
      }
    }
    return 'light';
  });

  const [stickFigures, setStickFigures] = useState<StickFigureData[]>(() => {
    const isDark = typeof window !== 'undefined' && (localStorage.getItem('stickFigureTheme') === 'dark' || (!('stickFigureTheme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));
    return [{
      id: crypto.randomUUID(),
      pose: INITIAL_POSE,
      color: isDark ? 'white' : 'black'
    }];
  });

  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(stickFigures[0]?.id ?? null);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [viewBox, setViewBox] = useState('0 0 500 500');
  const [poseLibrary, setPoseLibrary] = useState<SavedPose[]>([]);
  const [isPosePanelOpen, setIsPosePanelOpen] = useState(false);
  
  const [saveNotification, setSaveNotification] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showZoom, setShowZoom] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('Screen');
  const zoomTimeoutRef = useRef<number | null>(null);
  const mainContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('stickFigureTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('stickFigureTheme', 'light');
    }

    setStickFigures(prev => {
      if (prev.length > 0) {
        const firstFigure = prev[0];
        if (firstFigure.color === 'black' || firstFigure.color === 'white') {
          const newColor = theme === 'dark' ? 'white' : 'black';
          if (firstFigure.color !== newColor) {
            return [{ ...firstFigure, color: newColor }, ...prev.slice(1)];
          }
        }
      }
      return prev;
    });
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    try {
      const savedPoses = localStorage.getItem('stickFigurePoseLibrary');
      if (savedPoses) {
        setPoseLibrary(JSON.parse(savedPoses));
      } else {
        setPoseLibrary(DEFAULT_POSES);
      }
    } catch (error) {
      console.error("Failed to load poses from localStorage", error);
      setPoseLibrary(DEFAULT_POSES);
    }
  }, []);

  const addFigure = () => {
    if (stickFigures.length >= 5) return;
    
    const offset = (stickFigures.length % 5) * 40;
    const newPose: StickFigurePose = JSON.parse(JSON.stringify(INITIAL_POSE));
    for (const key in newPose) {
        const jointName = key as JointName;
        newPose[jointName].x += offset;
    }

    const usedColors = new Set(stickFigures.map(f => f.color));
    const availableColors = STICK_FIGURE_COLORS.filter(c => !usedColors.has(c));
    
    let newColor: string;
    if (availableColors.length > 0) {
      newColor = availableColors[0];
    } else {
      // Fallback: all palette colors are used, so cycle through them.
      const paletteFiguresCount = stickFigures.filter(f => STICK_FIGURE_COLORS.includes(f.color)).length;
      newColor = STICK_FIGURE_COLORS[paletteFiguresCount % STICK_FIGURE_COLORS.length];
    }

    const newFigure: StickFigureData = {
      id: crypto.randomUUID(),
      pose: newPose,
      color: newColor,
    };

    const newFigures = [...stickFigures, newFigure];
    setStickFigures(newFigures);
    setSelectedFigureId(newFigure.id);
  };

  const deleteSelectedFigure = () => {
    if (stickFigures.length <= 1 || !selectedFigureId) return;
    const newFigures = stickFigures.filter(f => f.id !== selectedFigureId);
    setStickFigures(newFigures);
    setSelectedFigureId(newFigures[0]?.id ?? null);
  };
  
  const handlePoseChange = useCallback((figureId: string, newPose: StickFigurePose) => {
    setStickFigures(prev => prev.map(f => f.id === figureId ? { ...f, pose: newPose } : f));
  }, []);

  const handleSetAspectRatio = useCallback((ratio: string) => {
    if (!mainContainerRef.current) return;
    const padding = 32; // p-4 on the container, so 16px * 2
    const { width: maxWidth, height: maxHeight } = mainContainerRef.current.getBoundingClientRect();
    const availableWidth = maxWidth - padding;
    const availableHeight = maxHeight - padding;

    if (ratio === 'Screen') {
        setCanvasSize({ width: availableWidth, height: availableHeight });
        setAspectRatio(ratio);
        return;
    }

    const [w, h] = ratio.split(':').map(Number);
    
    let newWidth = availableWidth;
    let newHeight = (availableWidth * h) / w;

    if (newHeight > availableHeight) {
        newHeight = availableHeight;
        newWidth = (availableHeight * w) / h;
    }
    
    setCanvasSize({ width: newWidth, height: newHeight });
    setAspectRatio(ratio);
  }, []);

  useEffect(() => {
    const updateCanvasToFit = () => handleSetAspectRatio(aspectRatio);
    updateCanvasToFit();
    window.addEventListener('resize', updateCanvasToFit);
    return () => window.removeEventListener('resize', updateCanvasToFit);
  }, [handleSetAspectRatio, aspectRatio]);
  
  const updateZoomDisplay = (newZoomLevel: number) => {
    setZoomLevel(newZoomLevel);
    setShowZoom(true);

    if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
    }
    zoomTimeoutRef.current = window.setTimeout(() => {
        setShowZoom(false);
    }, 1500);
  }

  const handleZoom = (factor: number) => {
    const vb = viewBox.split(' ').map(Number);
    const [x, y, w, h] = vb;
    const newW = w * factor;
    const newH = h * factor;
    const newX = x + (w - newW) / 2;
    const newY = y + (h - newH) / 2;
    setViewBox(`${newX} ${newY} ${newW} ${newH}`);
    updateZoomDisplay(Math.round((500 / newW) * 100));
  };

  const resetZoom = () => {
    setViewBox('0 0 500 500');
    updateZoomDisplay(100);
  }

  const handleSavePose = () => {
    const selectedFigure = stickFigures.find(f => f.id === selectedFigureId);
    if (!selectedFigure) return;

    const newSavedPose: SavedPose = {
      id: crypto.randomUUID(),
      pose: normalizePose(selectedFigure.pose),
    };
    const newLibrary = [...poseLibrary, newSavedPose];
    setPoseLibrary(newLibrary);
    saveLibraryToStorage(newLibrary);
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 2000);
  };

  const handleDeletePose = (poseId: string) => {
    const newLibrary = poseLibrary.filter(p => p.id !== poseId);
    setPoseLibrary(newLibrary);
    saveLibraryToStorage(newLibrary);
  };

  const handleApplyPose = (pose: StickFigurePose) => {
    if (!selectedFigureId) return;
    const selectedFigure = stickFigures.find(f => f.id === selectedFigureId);
    if (!selectedFigure) return;
    const newPose = applyNormalizedPose(pose, selectedFigure.pose);
    handlePoseChange(selectedFigureId, newPose);
  };

  return (
    <>
      <div className="h-full flex flex-col items-center p-4 font-sans relative bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
        <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors z-10"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>
        <div className="w-full max-w-7xl flex flex-col flex-1">
          <header className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-600 dark:text-cyan-300 tracking-wider dark:text-shadow-[0_0_8px_rgba(0,255,255,0.5)] flex items-center justify-center">
              Sketch Stick Figure Editor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Create, pose, and arrange multiple stick figures.</p>
          </header>

          <div className="w-full flex flex-1 items-stretch gap-4">
            <div className="w-48 flex-shrink-0 bg-white/80 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-cyan-500/20 shadow-md">
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Stickmen {stickFigures.length}/5</h3>
                   <div className="flex items-stretch gap-2">
                      <button 
                        onClick={addFigure} 
                        disabled={stickFigures.length >= 5} 
                        className="flex-grow text-sm flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-500/20 dark:hover:bg-cyan-500/40 text-white dark:text-cyan-200 py-2 px-3 rounded-md transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        Add
                      </button>
                      <button 
                        onClick={deleteSelectedFigure} 
                        disabled={stickFigures.length <= 1 || !selectedFigureId} 
                        className="flex-shrink-0 text-sm bg-red-500 hover:bg-red-600 dark:bg-red-500/20 dark:hover:bg-red-500/40 text-white dark:text-red-200 p-2 rounded-md transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" 
                        title="Delete Selected Figure"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                      </button>
                  </div>
                </div>
                
                <div>
                   <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Pose Library</h3>
                   <button onClick={handleSavePose} disabled={!selectedFigureId} className="w-full mb-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600 dark:bg-green-500/20 dark:hover:bg-green-500/40 text-white dark:text-green-200 py-2 px-3 rounded-md transition-colors">Save Current Pose</button>
                   <button onClick={() => setIsPosePanelOpen(true)} disabled={!selectedFigureId} className="w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 dark:bg-blue-500/20 dark:hover:bg-blue-500/40 text-white dark:text-blue-200 py-2 px-3 rounded-md transition-colors">Apply from Library</button>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Aspect Ratio</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Screen', '1:1', '16:9', '9:16', '4:3', '3:4'].map(r => {
                      const isSelected = aspectRatio === r;
                      return (
                        <button 
                          key={r} 
                          onClick={() => handleSetAspectRatio(r)} 
                          disabled={isSelected}
                          className={`flex items-center justify-center gap-1 text-xs py-1.5 rounded-md transition-colors ${
                            isSelected
                              ? 'bg-cyan-600 dark:bg-cyan-400 text-white dark:text-gray-900 font-semibold'
                              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Zoom</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleZoom(1.1)} className="flex-1 text-lg font-bold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md py-1 transition-colors" title="Zoom Out">-</button>
                    <button onClick={resetZoom} className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors" title="Reset Zoom">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3a9 9 0 11-5.657 14.343" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3l4 4H9V3z" />
                      </svg>
                    </button>
                    <button onClick={() => handleZoom(0.9)} className="flex-1 text-lg font-bold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md py-1 transition-colors" title="Zoom In">+</button>
                  </div>
                </div>

              </div>
            </div>

            <main 
              ref={mainContainerRef} 
              className="flex-1 bg-gray-200 dark:bg-gray-950 rounded-lg p-4 relative flex items-center justify-center"
            >
                <div 
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 shadow-inner"
                  style={{ width: canvasSize.width, height: canvasSize.height }}
                >
                  <StickFigureEditor 
                      stickFigures={stickFigures} 
                      selectedFigureId={selectedFigureId}
                      onSelectFigure={setSelectedFigureId}
                      onPoseChange={handlePoseChange}
                      canvasSize={canvasSize}
                      onCanvasResize={() => {}} // This is handled by aspect ratio now
                      viewBox={viewBox}
                      theme={theme}
                      onZoom={handleZoom}
                  />
                </div>
                 {showZoom && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{zoomLevel}%</div>}
            </main>
          </div>
        </div>
      </div>
      
       {saveNotification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-500/80 dark:bg-green-400/80 text-white dark:text-black font-bold py-2 px-5 rounded-lg shadow-xl animate-bounce z-50">
          Pose Saved!
        </div>
      )}

      <PoseLibraryPanel
        isOpen={isPosePanelOpen}
        onClose={() => setIsPosePanelOpen(false)}
        poses={poseLibrary}
        onApplyPose={handleApplyPose}
        onDeletePose={handleDeletePose}
        theme={theme}
      />
    </>
  );
};

export default App;