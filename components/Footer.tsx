
import React from 'react';
import type { GenerationState } from '../types';

interface FooterProps {
  onGenerateClick: () => void;
  generationState: GenerationState;
  buttonText: string;
}

export const Footer: React.FC<FooterProps> = ({ onGenerateClick, generationState, buttonText }) => {
  const { isGenerating, progress, message, status } = generationState;

  const getProgressBarColor = () => {
    if (status === 'error') return 'bg-red-500';
    if (status === 'success') return 'bg-green-500';
    return 'bg-brand-primary';
  };

  return (
    <footer className="bg-brand-surface/80 backdrop-blur-sm border-t border-white/10 p-4 shrink-0">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <button
            onClick={onGenerateClick}
            disabled={isGenerating}
            className="px-8 py-3 bg-brand-primary text-white font-bold rounded-md hover:bg-purple-500 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 flex items-center justify-center w-full md:w-48"
            aria-label={isGenerating ? 'Generating, please wait' : buttonText}
          >
            {isGenerating ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span>{buttonText}</span>
            )}
          </button>
          <div className="w-full flex flex-col md:flex-row items-center gap-4">
            {(isGenerating || status === 'error' || status === 'success') && (
                 <div className="w-full bg-brand-surface rounded-full h-2.5 relative overflow-hidden">
                    <div
                        className={`${getProgressBarColor()} h-2.5 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
            {message && <p className="text-sm text-brand-text-muted w-full md:w-1/3 truncate text-center md:text-left" title={message}>{message}</p>}
          </div>
        </div>
      </div>
    </footer>
  );
};
