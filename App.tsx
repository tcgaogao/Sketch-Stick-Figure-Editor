import React, { useState, useCallback, useEffect, useRef } from 'react';
import StickFigureEditor from './components/StickFigureEditor';
import PoseLibraryPanel from './components/PoseLibraryPanel';
import type { StickFigureData, StickFigurePose, SavedPose, JointName, Point } from './types';
import { INITIAL_POSE, DEFAULT_POSES, STICK_FIGURE_COLORS, t, setLanguage, getLanguage, LANGUAGES, Language } from './constants';

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

/**
 * Normalizes a pose by making all joint positions relative to the pelvis.
 * This removes the absolute position of the figure, allowing the pose itself to be saved.
 * @param pose The absolute pose of a stick figure.
 * @returns A new pose object where the pelvis is at {x: 0, y: 0}.
 */
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

/**
 * Applies a normalized pose to a specific anchor point.
 * This positions the new pose on the canvas without changing the figure's root location.
 * @param normalizedPose A pose where the pelvis is at {x: 0, y: 0}.
 * @param anchorPoint The target {x, y} coordinate for the pose's pelvis.
 * @returns A new pose object with absolute coordinates.
 */
const applyPoseRelativeToPoint = (normalizedPose: StickFigurePose, anchorPoint: Point): StickFigurePose => {
  const newPose: Partial<StickFigurePose> = {};
  for (const key in normalizedPose) {
    const jointName = key as JointName;
    newPose[jointName] = {
      x: normalizedPose[jointName].x + anchorPoint.x,
      y: normalizedPose[jointName].y + anchorPoint.y,
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
      color: isDark ? '#67e8f9' : 'black' // Use a theme-appropriate default
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
  
  const [language, setLanguageState] = useState<Language>(getLanguage);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

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
            // Only update the color if it's the default black/cyan, to avoid overwriting user colors
            if (firstFigure.color === 'black' || firstFigure.color === '#67e8f9') {
                const newColor = theme === 'dark' ? '#67e8f9' : 'black';
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
            setIsLangMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setLanguageState(lang); // This forces a re-render
    setIsLangMenuOpen(false);
  };

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

    // Keep the figure's current position by using its pelvis as the anchor.
    const anchorPoint = selectedFigure.pose.pelvis;
    const newPose = applyPoseRelativeToPoint(pose, anchorPoint);

    handlePoseChange(selectedFigureId, newPose);
  };

  const handleFlipFigure = () => {
    if (!selectedFigureId) return;

    const figure = stickFigures.find(f => f.id === selectedFigureId);
    if (!figure) return;

    const oldPose = figure.pose;

    const points = Object.values(oldPose);
    // FIX: Explicitly type the `p` parameter to resolve `p.x` access error.
    const minX = Math.min(...points.map((p: Point) => p.x));
    // FIX: Explicitly type the `p` parameter to resolve `p.x` access error.
    const maxX = Math.max(...points.map((p: Point) => p.x));
    const centerX = minX + (maxX - minX) / 2;

    const reflectedPose: Partial<StickFigurePose> = {};
    for (const key in oldPose) {
        const jointName = key as JointName;
        const point = oldPose[jointName];
        reflectedPose[jointName] = {
            x: centerX * 2 - point.x,
            y: point.y,
        };
    }

    const newPose = reflectedPose as StickFigurePose;
    const swap = (key1: JointName, key2: JointName) => {
        const temp = { ...newPose[key1] };
        newPose[key1] = { ...newPose[key2] };
        newPose[key2] = temp;
    };

    swap('leftShoulder', 'rightShoulder');
    swap('leftElbow', 'rightElbow');
    swap('leftHand', 'rightHand');
    swap('leftHip', 'rightHip');
    swap('leftKnee', 'rightKnee');
    swap('leftAnkle', 'rightAnkle');

    handlePoseChange(selectedFigureId, newPose);
  };


  return (
    <>
      <div className="h-full flex flex-col items-center p-4 font-sans relative bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-200">
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <div ref={langMenuRef} className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label={t('language.change.tooltip')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </button>
            {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                language === lang.code
                                ? 'bg-cyan-600 text-white'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
                            }`}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            )}
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label={t('theme.toggle.tooltip')}
          >
            {theme === 'light' ? (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>
        </div>
        <div className="w-full max-w-7xl flex flex-col flex-1">
          <header className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-600 dark:text-cyan-400 tracking-wide">
              {t('app.title')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">{t('app.description')}</p>
          </header>

          <div className="w-full flex flex-1 items-stretch gap-4">
            <div className="w-56 flex-shrink-0 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">{t('figures.title')} ({stickFigures.length}/5)</h3>
                   <div className="flex items-stretch gap-2">
                      <button 
                        onClick={addFigure} 
                        disabled={stickFigures.length >= 5} 
                        className="flex-grow text-sm flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 text-white font-semibold py-2 px-3 rounded-md transition-colors disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                        {t('figures.add')}
                      </button>
                      <button 
                        onClick={deleteSelectedFigure} 
                        disabled={stickFigures.length <= 1 || !selectedFigureId} 
                        className="flex-shrink-0 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 p-2 rounded-md transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:cursor-not-allowed" 
                        title={t('figures.delete.tooltip')}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                      </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">{t('actions.title')}</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSavePose} 
                      disabled={!selectedFigureId} 
                      className="w-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 px-3 rounded-md transition-colors"
                      title={t('actions.save.tooltip')}
                    >
                      {t('actions.save')}
                    </button>
                    <button 
                      onClick={() => setIsPosePanelOpen(true)} 
                      disabled={!selectedFigureId} 
                      className="w-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 px-3 rounded-md transition-colors"
                      title={t('actions.library.tooltip')}
                    >
                      {t('actions.library')}
                    </button>
                    <button 
                      onClick={handleFlipFigure} 
                      disabled={!selectedFigureId} 
                      className="w-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 px-3 rounded-md transition-colors"
                      title={t('actions.flip.tooltip')}
                    >
                      {t('actions.flip')}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">{t('aspectRatio.title')}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['Screen', '1:1', '16:9', '9:16', '4:3', '3:4'].map(r => {
                      const isSelected = aspectRatio === r;
                      return (
                        <button 
                          key={r} 
                          onClick={() => handleSetAspectRatio(r)} 
                          className={`flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md transition-colors font-medium ${
                            isSelected
                              ? 'bg-cyan-600 dark:bg-cyan-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {r === 'Screen' ? t('aspectRatio.screen') : r}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 uppercase tracking-wider">{t('zoom.title')}</h3>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleZoom(1.1)} className="flex-1 text-lg font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md py-1 transition-colors" title={t('zoom.in.tooltip')}>-</button>
                    <button onClick={resetZoom} className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors" title={t('zoom.reset.tooltip')}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M23 4v6h-6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                    </button>
                    <button onClick={() => handleZoom(0.9)} className="flex-1 text-lg font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md py-1 transition-colors" title={t('zoom.out.tooltip')}>+</button>
                  </div>
                </div>

              </div>
            </div>

            <main 
              ref={mainContainerRef} 
              className="flex-1 bg-slate-200/50 dark:bg-black/20 rounded-xl p-4 relative flex items-center justify-center"
            >
                <div 
                  className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg"
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
                 {showZoom && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">{zoomLevel}%</div>}
            </main>
          </div>
        </div>
      </div>
      
       {saveNotification && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold py-2 px-5 rounded-lg z-50 transition-opacity duration-300">
          {t('notification.poseSaved')}
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