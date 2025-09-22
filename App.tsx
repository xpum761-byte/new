

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Footer } from './components/Footer';
import { VideoGeneratorTab } from './VideoGeneratorTab';
import { ImageGeneratorTab } from './components/ImageGeneratorTab';
import { PromptGeneratorTab, createNewCharacter, initialSceneSettings } from './components/PromptGeneratorTab';
import { SettingsModal } from './components/SettingsModal';
import { Tab, Character, SceneSettings, ClipSegment } from './types';
import type { GenerationState, VideoSegment } from './types';
import { Header } from './components/Header';

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


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PROMPT_GENERATOR);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('geminiApiKey') || '');
  const [isSettingsOpen, setSettingsOpen] = useState(false);

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
  
  // State for video generator segments
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([
    { id: crypto.randomUUID(), prompt: '', startImage: undefined, videoUrl: undefined, status: 'idle', aspectRatio: '16:9', mode: 'transition' },
  ]);

  // State for image generator
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageResults, setImageResults] = useState<string[]>([]);
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [imageReference, setImageReference] = useState<File | undefined>();

  // State for prompt generator
  const [promptGenCharacters, setPromptGenCharacters] = useState<Character[]>([createNewCharacter()]);
  const [promptGenSceneSettings, setPromptGenSceneSettings] = useState<SceneSettings>(initialSceneSettings);
  const [promptGenClipSegments, setPromptGenClipSegments] = useState<ClipSegment[]>([
      { id: crypto.randomUUID(), startTime: '0', endTime: '8' }
  ]);
  
  const handleExportToBatch = (prompts: string[]) => {
    const newSegments: VideoSegment[] = prompts.map(prompt => ({
      id: crypto.randomUUID(),
      prompt,
      startImage: undefined,
      videoUrl: undefined,
      status: 'idle',
      aspectRatio: '16:9',
      mode: 'transition',
    }));
    
    if (newSegments.length > 0) {
      setVideoSegments(newSegments);
    }
    
    setActiveTab(Tab.VIDEO_GENERATOR);
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
    videoSegments.forEach(seg => {
      if (seg.videoUrl) URL.revokeObjectURL(seg.videoUrl);
    });

    // Reset previous results based on active tab
    if (activeTab === Tab.VIDEO_GENERATOR) {
        setVideoSegments(s => s.map(seg => ({ ...seg, videoUrl: undefined, status: 'idle' })));
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
        if (imageReference) {
            // --- Image Editing Logic ---
            setGenerationState(prevState => ({ ...prevState, progress: 10, message: 'Editing image...' }));
            const imageBase64 = await fileToBase64(imageReference);
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        {
                            inlineData: {
                                data: imageBase64,
                                mimeType: imageReference.type,
                            },
                        },
                        {
                            text: imagePrompt,
                        },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            
            setGenerationState(prevState => ({ ...prevState, progress: 90, message: 'Finalizing edited image...' }));
    
            const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
            if (imagePart && imagePart.inlineData) {
                const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                setImageResults([imageUrl]);
            } else {
                throw new Error("No image was returned from the editing model.");
            }
        } else {
             // --- Image Generation Logic ---
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
        }

      } else { // Handle video generation
        const generateVideo = async (prompt: string, startImageFile?: File, aspectRatio?: string) => {
            if (!prompt.trim() && !startImageFile) {
                throw new Error("A prompt or a start image is required.");
            }
            
            const finalPrompt = prompt;
            
            const image = startImageFile ? {
                imageBytes: await fileToBase64(startImageFile),
                mimeType: startImageFile.type,
            } : undefined;
    
            let operation = await ai.models.generateVideos({
                model: 'veo-2.0-generate-001',
                prompt: finalPrompt,
                image,
                config: { 
                  numberOfVideos: 1,
                  aspectRatio,
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
            const segmentsToGenerate = videoSegments.filter(s => s.prompt.trim() || s.startImage);
            if (segmentsToGenerate.length === 0) {
                throw new Error("No prompts or start images provided for generation.");
            }

            let hasErrors = false;
            for (const [index, segment] of segmentsToGenerate.entries()) {
                try {
                    const segmentMessage = `Generating segment ${index + 1} of ${segmentsToGenerate.length}...`;
                    setGenerationState(prevState => ({ ...prevState, progress: (index / segmentsToGenerate.length) * 100, message: segmentMessage }));
                    setVideoSegments(prev => prev.map(s => s.id === segment.id ? {...s, status: 'generating'} : s));
                    
                    const videoUrl = await generateVideo(segment.prompt, segment.startImage, segment.aspectRatio);
                    
                    setVideoSegments(prev => prev.map(s => s.id === segment.id ? {...s, videoUrl, status: 'success'} : s));
                } catch (err) {
                    hasErrors = true;
                    console.error(`Error generating segment ${index + 1}:`, err);
                    setVideoSegments(prev => prev.map(s => s.id === segment.id ? {...s, status: 'error'} : s));
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
  }, [activeTab, apiKey, imagePrompt, numberOfImages, imageAspectRatio, imageReference, videoSegments]);

  const buttonText = () => {
    switch (activeTab) {
      case Tab.VIDEO_GENERATOR: return 'Generate Video';
      case Tab.IMAGE_GENERATOR: return 'Generate Image';
      default: return 'Generate';
    }
  }

  return (
    <div className="flex flex-col h-screen bg-brand-bg text-brand-text font-sans">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onSettingsClick={() => setSettingsOpen(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === Tab.VIDEO_GENERATOR && <VideoGeneratorTab segments={videoSegments} setSegments={setVideoSegments} />}
          {activeTab === Tab.IMAGE_GENERATOR && <ImageGeneratorTab prompt={imagePrompt} setPrompt={setImagePrompt} images={imageResults} aspectRatio={imageAspectRatio} setAspectRatio={setImageAspectRatio} numberOfImages={numberOfImages} setNumberOfImages={setNumberOfImages} isGenerating={generationState.isGenerating} referenceImage={imageReference} setReferenceImage={setImageReference} />}
          {activeTab === Tab.PROMPT_GENERATOR && (
            <PromptGeneratorTab 
              onExportToBatch={handleExportToBatch}
              characters={promptGenCharacters}
              setCharacters={setPromptGenCharacters}
              sceneSettings={promptGenSceneSettings}
              setSceneSettings={setPromptGenSceneSettings}
              clipSegments={promptGenClipSegments}
              setClipSegments={setPromptGenClipSegments}
            />
          )}
        </main>
        
        {/* Footer is not shown on prompt generator tab as it has its own fixed footer */}
        {activeTab !== Tab.PROMPT_GENERATOR && (
            <Footer onGenerateClick={handleGenerate} generationState={generationState} buttonText={buttonText()} />
        )}
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} onSave={handleSaveSettings} currentApiKey={apiKey} />
    </div>
  );
};

export default App;
