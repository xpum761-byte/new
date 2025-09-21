
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Footer } from './components/Footer';
import { VideoGeneratorTab } from './components/VideoGeneratorTab';
import { BatchGeneratorTab } from './components/BatchGeneratorTab';
import { ImageGeneratorTab } from './components/ImageGeneratorTab';
import { PromptGeneratorTab } from './components/PromptGeneratorTab';
import { SettingsModal } from './components/SettingsModal';
import { Tab } from './types';
import type { GenerationState, BatchSegment } from './types';

// Helper to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result.split(',')[1]);
            } else {
                reject(new Error('Failed to read file as base64 string.'));
            }
        };
        reader.onerror = error => reject(error);
    });
};


// --- Sidebar Component ---
interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onSettingsClick: () => void;
}

const sidebarTabs: { id: Tab; label: string; icon: JSX.Element }[] = [
  {
    id: Tab.VIDEO_GENERATOR,
    label: 'Video Generator',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  },
  {
    id: Tab.BATCH_GENERATOR,
    label: 'Batch Generator',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>,
  },
  {
    id: Tab.IMAGE_GENERATOR,
    label: 'Image Generator',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    id: Tab.PROMPT_GENERATOR,
    label: 'Prompt Generator',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onSettingsClick }) => {
  return (
    <aside className="w-64 bg-brand-surface flex flex-col p-4 border-r border-white/10 shrink-0 h-full">
      <nav className="flex flex-col space-y-2 mt-8">
        {sidebarTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent ${
              activeTab === tab.id
                ? 'bg-brand-primary/20 text-brand-primary'
                : 'text-brand-text-muted hover:bg-white/10 hover:text-brand-text'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto">
        <button onClick={onSettingsClick} className="flex items-center w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-brand-text-muted hover:bg-white/10 hover:text-brand-text transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent" aria-label="Open settings">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
        </button>
      </div>
    </aside>
  );
};


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PROMPT_GENERATOR);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('geminiApiKey') || '');
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Persist API key to local storage
    localStorage.setItem('geminiApiKey', apiKey);
  }, [apiKey]);
  
  const handleSaveSettings = (newApiKey: string) => {
    setApiKey(newApiKey);
    setSettingsOpen(false);
  };

  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    message: '',
    status: 'idle',
  });
  
  // State for single video generator
  const [singlePrompt, setSinglePrompt] = useState('');
  const [singleStartImage, setSingleStartImage] = useState<File | undefined>();
  const [singleEndImage, setSingleEndImage] = useState<File | undefined>();
  const [singleVideoResult, setSingleVideoResult] = useState<string | null>(null);
  const [singleVideoAspectRatio, setSingleVideoAspectRatio] = useState('16:9');


  // State for batch video generator
  const [segments, setSegments] = useState<BatchSegment[]>([
    { id: crypto.randomUUID(), prompt: '', image: undefined, status: 'idle', aspectRatio: '16:9' },
  ]);

  // State for image generator
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageResults, setImageResults] = useState<string[]>([]);
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  
  const handleExportToBatch = (prompts: string[]) => {
    const newSegments: BatchSegment[] = prompts.map(prompt => ({
      id: crypto.randomUUID(),
      prompt,
      image: undefined,
      videoUrl: undefined,
      status: 'idle',
      aspectRatio: '16:9',
    }));
    
    if (newSegments.length > 0) {
      setSegments(newSegments);
    }
    
    setActiveTab(Tab.BATCH_GENERATOR);
  };

  const handleGenerate = useCallback(async () => {
    const effectiveApiKey = apiKey || process.env.API_KEY;
    if (!effectiveApiKey) {
      setGenerationState({
        isGenerating: false,
        progress: 100,
        message: 'API Key not found. Please set it in the settings.',
        status: 'error',
      });
      setSettingsOpen(true); // Open settings if key is missing
      return;
    }

    // Clean up old object URLs to prevent memory leaks
    if (singleVideoResult) URL.revokeObjectURL(singleVideoResult);
    segments.forEach(seg => {
      if (seg.videoUrl) URL.revokeObjectURL(seg.videoUrl);
    });

    // Reset previous results based on active tab
    if (activeTab === Tab.VIDEO_GENERATOR) {
      setSingleVideoResult(null);
    } else if (activeTab === Tab.BATCH_GENERATOR) {
      setSegments(s => s.map(seg => ({ ...seg, videoUrl: undefined, status: 'idle' })));
    } else if (activeTab === Tab.IMAGE_GENERATOR) {
      setImageResults([]);
    }

    setGenerationState({
      isGenerating: true,
      progress: 0,
      message: 'Initializing...',
      status: 'generating',
    });

    try {
      const ai = new GoogleGenAI({ apiKey: effectiveApiKey });
      
      if (activeTab === Tab.IMAGE_GENERATOR) {
        setGenerationState(prevState => ({ ...prevState, progress: 10, message: 'Generating images...' }));
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: imagePrompt,
          config: {
            numberOfImages,
            outputMimeType: 'image/jpeg',
            aspectRatio: imageAspectRatio,
          },
        });
        setGenerationState(prevState => ({ ...prevState, progress: 90, message: 'Finalizing images...' }));
        const imageUrls = response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
        setImageResults(imageUrls);

      } else { // Handle video generation
        const generateVideo = async (prompt: string, startImageFile?: File, endImageFile?: File, aspectRatio: string = '16:9') => {
            if (!prompt.trim() && !startImageFile) {
                throw new Error("A prompt or a start image is required.");
            }
            
            let finalPrompt = prompt;

            // If there's an end image, get its description and amend the prompt
            if (endImageFile) {
              setGenerationState(prevState => ({ ...prevState, progress: 2, message: 'Analyzing end image...' }));
              const endImageBase64 = await fileToBase64(endImageFile);
              const descriptionResponse = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: { parts: [
                      { text: "Describe this image in detail for a video generation AI. Focus on objects, style, and composition." },
                      { inlineData: { mimeType: endImageFile.type, data: endImageBase64 } }
                  ] },
              });
              const endImageDescription = descriptionResponse.text;
              
              const transitionInstruction = `The video should smoothly animate and transition into a new scene that perfectly matches this description: ${endImageDescription}`;
              
              finalPrompt = prompt.trim() ? `${prompt}. ${transitionInstruction}` : transitionInstruction;
            }
            
            const image = startImageFile ? {
                imageBytes: await fileToBase64(startImageFile),
                mimeType: startImageFile.type,
            } : undefined;
    
            let operation = await ai.models.generateVideos({
                model: 'veo-3.0-fast-generate-001',
                prompt: finalPrompt,
                image,
                config: { 
                  numberOfVideos: 1,
                  aspectRatio: aspectRatio,
                }
            });
    
            let pollCount = 0;
            const maxPolls = 30; // ~5 minutes timeout if polling every 10s
    
            while (!operation.done && pollCount < maxPolls) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation });
                pollCount++;
                const progress = 10 + (pollCount / maxPolls) * 80;
                setGenerationState(prevState => ({ ...prevState, progress, message: `Polling for results... (${pollCount})` }));
            }
    
            if (!operation.done) {
                throw new Error("Video generation timed out.");
            }
            
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
                throw new Error("No video URI found in the generation response.");
            }
            
            setGenerationState(prevState => ({ ...prevState, progress: 95, message: 'Downloading video...' }));
            
            const videoResponse = await fetch(`${downloadLink}&key=${effectiveApiKey}`);
            if (!videoResponse.ok) {
                throw new Error(`Failed to download generated video: ${videoResponse.statusText}`);
            }
            const videoBlob = await videoResponse.blob();
            return URL.createObjectURL(videoBlob);
        };
    
        if (activeTab === Tab.VIDEO_GENERATOR) {
            setGenerationState(prevState => ({ ...prevState, progress: 5, message: 'Starting video generation...' }));
            const videoUrl = await generateVideo(singlePrompt, singleStartImage, singleEndImage, singleVideoAspectRatio);
            setSingleVideoResult(videoUrl);
        } else if (activeTab === Tab.BATCH_GENERATOR) {
            const segmentsToGenerate = segments.filter(s => s.prompt.trim());
            if (segmentsToGenerate.length === 0) {
                throw new Error("No prompts provided for batch generation.");
            }

            let hasErrors = false;
            for (const [index, segment] of segmentsToGenerate.entries()) {
                try {
                    setGenerationState(prevState => ({ ...prevState, progress: (index / segmentsToGenerate.length) * 100, message: `Starting segment ${index + 1}...` }));
                    setSegments(prev => prev.map(s => s.id === segment.id ? {...s, status: 'generating'} : s));
                    const videoUrl = await generateVideo(segment.prompt, segment.image, undefined, segment.aspectRatio);
                    setSegments(prev => prev.map(s => s.id === segment.id ? {...s, videoUrl, status: 'success'} : s));
                } catch (err) {
                    hasErrors = true;
                    console.error(`Error generating segment ${index + 1}:`, err);
                    setSegments(prev => prev.map(s => s.id === segment.id ? {...s, status: 'error'} : s));
                }
            }
            if (hasErrors) {
                throw new Error("One or more segments failed to generate. Check individual segments for errors.");
            }
        }
      }
      
      setGenerationState({ isGenerating: false, progress: 100, message: 'Generation complete!', status: 'success' });
    } catch (error) {
      console.error("Generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setGenerationState({ isGenerating: false, progress: 100, message: errorMessage, status: 'error' });
    }
  }, [activeTab, apiKey, singlePrompt, singleStartImage, singleEndImage, singleVideoAspectRatio, segments, imagePrompt, numberOfImages, imageAspectRatio]);

  const getTabTitle = (tab: Tab) => {
    const tabInfo = sidebarTabs.find(t => t.id === tab);
    return tabInfo ? tabInfo.label : 'Synth V';
  };
  
  const getButtonText = () => {
    switch(activeTab) {
      case Tab.VIDEO_GENERATOR: return 'Generate Video';
      case Tab.BATCH_GENERATOR: return 'Generate All';
      case Tab.IMAGE_GENERATOR: return 'Generate Images';
      default: return 'Generate';
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case Tab.VIDEO_GENERATOR:
        return <VideoGeneratorTab 
                    prompt={singlePrompt}
                    setPrompt={setSinglePrompt}
                    startImage={singleStartImage}
                    setStartImage={setSingleStartImage}
                    endImage={singleEndImage}
                    setEndImage={setSingleEndImage}
                    videoUrl={singleVideoResult}
                    isGenerating={generationState.isGenerating && activeTab === Tab.VIDEO_GENERATOR}
                    aspectRatio={singleVideoAspectRatio}
                    setAspectRatio={setSingleVideoAspectRatio}
                />;
      case Tab.BATCH_GENERATOR:
        return <BatchGeneratorTab segments={segments} setSegments={setSegments} />;
      case Tab.IMAGE_GENERATOR:
        return <ImageGeneratorTab 
                    prompt={imagePrompt}
                    setPrompt={setImagePrompt}
                    images={imageResults}
                    aspectRatio={imageAspectRatio}
                    setAspectRatio={setImageAspectRatio}
                    numberOfImages={numberOfImages}
                    setNumberOfImages={setNumberOfImages}
                    isGenerating={generationState.isGenerating && activeTab === Tab.IMAGE_GENERATOR}
                />;
      case Tab.PROMPT_GENERATOR:
        return <PromptGeneratorTab onExportToBatch={handleExportToBatch} isSidebarOpen={isSidebarOpen} />;
      default:
        return null;
    }
  };
  
  const showFooter = activeTab !== Tab.PROMPT_GENERATOR;

  return (
    <div className="flex h-screen bg-brand-bg text-brand-text font-sans">
      <div className={`fixed inset-y-0 left-0 z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out bg-brand-surface md:translate-x-0`}>
         <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onSettingsClick={() => setSettingsOpen(true)} />
      </div>
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* Header */}
        <header className="bg-brand-surface/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between p-4 border-b border-white/10 shrink-0 h-16">
           <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-white/10 transition-colors md:hidden" aria-label="Toggle sidebar">
                  {isSidebarOpen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                  )}
              </button>
              <h1 className="text-xl font-semibold">{getTabTitle(activeTab)}</h1>
           </div>
           
           <h1 className="text-2xl font-display font-bold text-brand-text tracking-wider">
              Synth <span className="text-brand-primary">V</span>
           </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {renderActiveTab()}
        </main>
        
        {showFooter && (
            <Footer
                onGenerateClick={handleGenerate}
                generationState={generationState}
                buttonText={getButtonText()}
            />
        )}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
        currentApiKey={apiKey}
      />
    </div>
  );
};

export default App;
