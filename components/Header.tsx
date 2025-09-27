
import React from 'react';
import { Tab } from '../types';

interface HeaderProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    onSettingsClick: () => void;
}

// FIX: Changed JSX.Element to React.ReactElement to resolve missing JSX namespace error.
const headerTabs: { id: Tab; label: string; icon: React.ReactElement }[] = [
  {
    id: Tab.VIDEO_GENERATOR,
    label: 'Video Generator',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  },
  {
    id: Tab.IMAGE_GENERATOR,
    label: 'Image Generator',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    id: Tab.PROMPT_GENERATOR,
    label: 'Prompt Generator',
    icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  },
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onSettingsClick }) => {
  return (
    <header className="bg-brand-surface/80 backdrop-blur-sm sticky top-0 z-20 border-b border-brand-primary/20 shrink-0">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        {/* Left: Title */}
        <h1 className="text-2xl font-display font-bold text-brand-text tracking-wider whitespace-nowrap">
          Synth <span className="text-brand-primary">V</span>
        </h1>
        
        {/* Center: Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {headerTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent ${
                  activeTab === tab.id
                    ? 'bg-brand-primary/20 text-brand-primary'
                    : 'text-brand-text-muted hover:bg-brand-secondary/50 hover:text-brand-text'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {React.cloneElement(tab.icon, { className: "h-5 w-5 shrink-0 mr-2" })}
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
        </nav>

        {/* Right: Settings */}
        <div className="flex items-center">
            <button
                onClick={onSettingsClick}
                className="text-brand-text-muted hover:text-brand-accent transition-colors p-2 rounded-full"
                aria-label="Open settings"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
      </div>
       {/* Tabs (Mobile) */}
       <nav className="md:hidden flex items-center justify-around border-t border-brand-primary/10">
            {headerTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center px-1 py-2 text-xs font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-brand-text-muted hover:bg-brand-secondary/30'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {React.cloneElement(tab.icon, { className: "h-5 w-5 shrink-0 mb-1" })}
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
        </nav>
    </header>
  );
};