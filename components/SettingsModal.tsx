
import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string) => void;
  currentApiKey: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
  const [apiKey, setApiKey] = useState(currentApiKey);

  useEffect(() => {
    setApiKey(currentApiKey);
  }, [currentApiKey, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(apiKey);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-brand-surface rounded-lg shadow-glow w-full max-w-md p-6 m-4 border border-brand-primary/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-brand-text">Settings</h2>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-primary" aria-label="Close settings">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-brand-text-muted mb-2">
            Gemini API Key
          </label>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API Key"
            className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-md p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
          />
           <p className="text-xs text-brand-text-muted mt-2">
            Your key is stored securely in your browser's local storage and is never sent to our servers.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-brand-text-muted hover:bg-brand-secondary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-brand-primary text-black font-semibold rounded-md hover:opacity-90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};