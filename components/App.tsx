

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Footer } from './Footer';
import { VideoGeneratorTab } from './VideoGeneratorTab';
import { ImageGeneratorTab } from './ImageGeneratorTab';
import { PromptGeneratorTab, createNewCharacter, initialSceneSettings } from './PromptGeneratorTab';
import { Tab, Character, SceneSettings, ClipSegment, VideoSegment } from '../types';
import type { GenerationState } from '../types';
import { Header } from './Header';
import { SettingsModal } from './SettingsModal';

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
  const [apiKey, setApiKey] = useState<string>('');
  const [openSettings, setOpenSettings] = useState<boolean>(false);

  // State for VideoGeneratorTab
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([]);

  // State for ImageGeneratorTab
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [numberOfImages, setNumberOfImages] = useState(1);
  const [referenceImage, setReferenceImage] = useState<File | undefined>();

  // State for PromptGeneratorTab
  const [characters, setCharacters] = useState<Character[]>([createNewCharacter()]);
  const [sceneSettings, setSceneSettings] = useState<SceneSettings>(initialSceneSettings);
  const [clipSegments, setClipSegments] = useState<ClipSegment[]>([]);

  // State for generation
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    message: '',
    status: 'idle',
  });
  
  useEffect(() => {
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
        setApiKey(storedApiKey);
    } else {
        setOpenSettings(true);
    }
  }, []);

  const handleSaveSettings = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem('gemini-api-key', newApiKey);
    setOpenSettings(false);
  };

  const handleExportToBatch = (segmentData: Omit<VideoSegment, 'id' | 'status' | 'videoUrl'>[]) => {
    const newSegments: VideoSegment[] = segmentData.map(data => ({
        ...data,
        id: crypto.randomUUID(),
        status: 'idle',
    }));
    setVideoSegments(newSegments);
    setActiveTab(Tab.VIDEO_GENERATOR);
  };

  const handleGenerate = async () => {
    if (generationState.isGenerating) {
        return;
    }
    
    if (!apiKey) {
        alert("Please set your API Key in the settings.");
        setOpenSettings(true);
        return;
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // --- VIDEO GENERATOR LOGIC ---
    if (activeTab === Tab.VIDEO_GENERATOR) {
        setGenerationState({ isGenerating: true, progress: 0, message: 'Initializing video generation...', status: 'generating' });

        try {
            const totalSegments = videoSegments.length;
            let successfulGenerations = 0;

            for (let i = 0; i < totalSegments; i++) {
                const segment = videoSegments[i];
                setVideoSegments(prev => prev.map(s => s.id === segment.id ? { ...s, status: 'generating' } : s));
                setGenerationState(prev => ({ ...prev, message: `Generating video ${i + 1} of ${totalSegments}...` }));

                try {
                    const generationPayload: {
                        model: string;
                        prompt: string;
                        image?: { imageBytes: string; mimeType: string; };
                        speech?: { tts: { text: string; } };
                        config: { 
                            numberOfVideos: number;
                            aspectRatio: string;
                        };
                    } = {
                        model: 'veo-3.0-fast-generate-001',
                        prompt: segment.prompt,
                        config: { 
                            numberOfVideos: 1,
                            aspectRatio: segment.aspectRatio,
                        }
                    };
                    
                    if (segment.dialogue && segment.dialogue.trim() !== '') {
                        generationPayload.speech = { tts: { text: segment.dialogue } };
                    }

                    if (segment.startImage) {
                        setGenerationState(prev => ({ ...prev, message: `Processing image for segment ${i + 1}...` }));
                        const base64Image = await fileToBase64(segment.startImage);
                        generationPayload.image = {
                            imageBytes: base64Image,
                            mimeType: segment.startImage.type,
                        };
                    }
                    
                    let operation = await ai.models.generateVideos(generationPayload);

                    setGenerationState(prev => ({ ...prev, message: `Processing video ${i + 1}... This may take a few minutes.` }));

                    while (!operation.done) {
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        operation = await ai.operations.getVideosOperation({ operation: operation });
                    }

                    if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                        const downloadLink = operation.response.generatedVideos[0].video.uri;
                        const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
                        if (!videoResponse.ok) throw new Error(`Failed to download video from URI. Status: ${videoResponse.status}`);
                        
                        const videoBlob = await videoResponse.blob();
                        const videoUrl = URL.createObjectURL(videoBlob);
                        
                        setVideoSegments(prev => prev.map(s => s.id === segment.id ? { ...s, status: 'success', videoUrl } : s));
                        successfulGenerations++;
                    } else {
                        throw new Error('Video generation operation completed but no video URI was found.');
                    }
                } catch (error) {
                    console.error(`Error generating video for segment ${i + 1}:`, error);
                    setVideoSegments(prev => prev.map(s => s.id === segment.id ? { ...s, status: 'error' } : s));
                }
                setGenerationState(prev => ({ ...prev, progress: ((i + 1) / totalSegments) * 100 }));
            }

            if (successfulGenerations === totalSegments) {
                setGenerationState({ isGenerating: false, progress: 100, message: 'All videos generated successfully!', status: 'success' });
            } else {
                throw new Error(`${totalSegments - successfulGenerations} video(s) failed to generate.`);
            }
        } catch (error) {
            console.error("Video generation process failed:", error);
            setGenerationState({
                isGenerating: false, progress: generationState.progress, message: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`, status: 'error',
            });
        }
    } 
    // --- IMAGE GENERATOR LOGIC ---
    else if (activeTab === Tab.IMAGE_GENERATOR) {
        setGenerationState({ isGenerating: true, progress: 0, message: 'Initializing image generation...', status: 'generating' });
        setGeneratedImages([]);

        try {
            if (referenceImage) {
                // --- Image Editing ---
                setGenerationState(prev => ({ ...prev, message: 'Editing image...', progress: 20 }));
                const base64Data = await fileToBase64(referenceImage);
                const imagePart = { inlineData: { mimeType: referenceImage.type, data: base64Data } };
                const textPart = { text: imagePrompt };

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: { parts: [imagePart, textPart] },
                    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
                });

                const newImages: string[] = [];
                if (response.candidates && response.candidates.length > 0) {
                     for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            newImages.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                        }
                    }
                }
                if (newImages.length === 0) throw new Error("The model did not return an image. It may have refused the request.");
                
                setGeneratedImages(newImages);
                setGenerationState({ isGenerating: false, progress: 100, message: 'Image edited successfully!', status: 'success' });

            } else {
                // --- Image Generation ---
                setGenerationState(prev => ({ ...prev, message: 'Generating new images...', progress: 20 }));
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: imagePrompt,
                    config: {
                        numberOfImages: numberOfImages,
                        outputMimeType: 'image/jpeg',
                        aspectRatio: imageAspectRatio,
                    },
                });

                const newImages = response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
                setGeneratedImages(newImages);
                setGenerationState({ isGenerating: false, progress: 100, message: 'Images generated successfully!', status: 'success' });
            }
        } catch (error) {
            console.error("Image generation process failed:", error);
            setGenerationState({
                isGenerating: false, progress: generationState.progress, message: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`, status: 'error',
            });
        }
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case Tab.VIDEO_GENERATOR:
        return <VideoGeneratorTab segments={videoSegments} setSegments={setVideoSegments} />;
      case Tab.IMAGE_GENERATOR:
        return <ImageGeneratorTab
          prompt={imagePrompt}
          setPrompt={setImagePrompt}
          images={generatedImages}
          aspectRatio={imageAspectRatio}
          setAspectRatio={setImageAspectRatio}
          numberOfImages={numberOfImages}
          setNumberOfImages={setNumberOfImages}
          isGenerating={generationState.isGenerating && activeTab === Tab.IMAGE_GENERATOR}
          referenceImage={referenceImage}
          setReferenceImage={setReferenceImage}
        />;
      case Tab.PROMPT_GENERATOR:
        return (
          <PromptGeneratorTab
            apiKey={apiKey}
            onExportToBatch={handleExportToBatch}
            characters={characters}
            setCharacters={setCharacters}
            sceneSettings={sceneSettings}
            setSceneSettings={setSceneSettings}
            clipSegments={clipSegments}
            setClipSegments={setClipSegments}
          />
        );
      default:
        return null;
    }
  };

  const getFooterButtonText = () => {
      switch(activeTab) {
          case Tab.VIDEO_GENERATOR: return "Generate Videos";
          case Tab.IMAGE_GENERATOR: return "Generate Images";
          default: return "";
      }
  }

  return (
    <div className="flex flex-col h-screen font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} onSettingsClick={() => setOpenSettings(true)} />
      
      <main className="flex-grow container mx-auto p-4 overflow-y-auto">
        {renderActiveTab()}
      </main>

      {activeTab !== Tab.PROMPT_GENERATOR && (
         <Footer
          onGenerateClick={handleGenerate}
          generationState={generationState}
          buttonText={getFooterButtonText()}
         />
      )}

      <SettingsModal
        isOpen={openSettings}
        onClose={() => setOpenSettings(false)}
        onSave={handleSaveSettings}
        currentApiKey={apiKey}
      />
      
    </div>
  );
};

export default App;
