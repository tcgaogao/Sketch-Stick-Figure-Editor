import React from 'react';
import type { SavedPose, StickFigurePose } from '../types';
import StickFigureThumbnail from './StickFigureThumbnail';
import { t } from '../constants';

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
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pose-library-heading"
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 id="pose-library-heading" className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{t('library.title')}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1 rounded-full"
            aria-label={t('library.close.tooltip')}
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        
        <main className="p-4 flex-grow overflow-y-auto">
          {poses.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500 dark:text-slate-400">{t('library.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {poses.map(savedPose => (
                <div key={savedPose.id} className="relative group aspect-square">
                  <button 
                    onClick={() => onApplyPose(savedPose.pose)}
                    className="w-full h-full bg-slate-100 dark:bg-slate-900/50 rounded-lg border-2 border-transparent hover:border-cyan-500 dark:hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-all"
                    title={t('library.apply.tooltip')}
                  >
                    <StickFigureThumbnail pose={savedPose.pose} theme={theme} />
                  </button>
                  {savedPose.isDefault && (
                    <span className="absolute top-1.5 left-1.5 bg-cyan-600 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10 pointer-events-none">
                      {t('library.default')}
                    </span>
                  )}
                  {!savedPose.isDefault && (
                    <button 
                      onClick={() => onDeletePose(savedPose.id)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-slate-700 hover:bg-red-500 dark:bg-slate-600 dark:hover:bg-red-500 rounded-full text-white flex items-center justify-center text-lg opacity-0 group-hover:opacity-100 transition-all"
                      title={t('library.delete.tooltip')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
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