import React from 'react';
import type { SavedPose, StickFigurePose } from '../types';
import StickFigureThumbnail from './StickFigureThumbnail';

interface PoseLibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  poses: SavedPose[];
  onApplyPose: (pose: StickFigurePose) => void;
  onDeletePose: (poseId: string) => void;
  theme: 'light' | 'dark';
}

const PoseLibraryPanel: React.FC<PoseLibraryPanelProps> = ({
  isOpen,
  onClose,
  poses,
  onApplyPose,
  onDeletePose,
  theme
}) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-100/95 dark:bg-gray-800/90 border-l border-gray-300 dark:border-cyan-500/30 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pose-library-heading"
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-cyan-500/20 flex-shrink-0">
          <h2 id="pose-library-heading" className="text-2xl font-bold text-cyan-600 dark:text-cyan-300">Pose Library</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-3xl leading-none"
            aria-label="Close pose library"
          >
            &times;
          </button>
        </header>
        
        <main className="p-4 flex-grow overflow-y-auto">
          {poses.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 dark:text-gray-400">No poses saved yet. Go create some!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {poses.map(savedPose => (
                <div key={savedPose.id} className="relative group aspect-square">
                  <button 
                    onClick={() => onApplyPose(savedPose.pose)}
                    className="w-full h-full bg-white dark:bg-black/30 rounded-lg border-2 border-transparent hover:border-cyan-500 dark:hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 transition-all"
                    title="Apply this pose"
                  >
                    <StickFigureThumbnail pose={savedPose.pose} theme={theme} />
                  </button>
                  {savedPose.isDefault && (
                    <span className="absolute top-1 left-1 bg-cyan-500 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10 pointer-events-none">
                      Default
                    </span>
                  )}
                  {!savedPose.isDefault && (
                    <button 
                      onClick={() => onDeletePose(savedPose.id)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 rounded-full text-white flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-opacity"
                      title="Delete pose"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default PoseLibraryPanel;