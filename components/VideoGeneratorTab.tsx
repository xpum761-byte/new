
import React, { ChangeEvent } from 'react';
import { ImageDropzone } from './ImageDropzone';

interface VideoGeneratorTabProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  startImage?: File;
  setStartImage: (image?: File) => void;
  endImage?: File;
  setEndImage: (image?: File) => void;
  videoUrl: string | null;
  isGenerating: boolean;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
}

export const VideoGeneratorTab: React.FC<VideoGeneratorTabProps> = ({ prompt, setPrompt, startImage, setStartImage, endImage, setEndImage, videoUrl, isGenerating, aspectRatio, setAspectRatio }) => {
  const handleDownload = () => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `synthv-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const videoAspectRatios = ['16:9', '9:16', '4:3'];

  return (
    <div className="grid md:grid-cols-2 gap-8 h-full">
      <div className="flex flex-col gap-6">
        <div>
          <label htmlFor="video-prompt" className="block text-sm font-medium text-brand-text-muted mb-2">
            Prompt
          </label>
          <textarea
            id="video-prompt"
            value={prompt}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            placeholder="e.g., A majestic lion roaring on a rocky outcrop at sunset, slowly transitioning into a starry night sky"
            rows={5}
            className="w-full bg-brand-surface border border-white/10 rounded-md p-3 text-brand-text focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
          />
        </div>
        <div>
            <label className="block text-sm font-medium text-brand-text-muted mb-2">
                Aspect Ratio
            </label>
            <div className="flex gap-2 flex-wrap">
            {videoAspectRatios.map(ratio => (
                <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${aspectRatio === ratio ? 'bg-brand-primary text-white' : 'bg-brand-surface hover:bg-white/10'}`}>
                    {ratio}
                </button>
            ))}
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-2">
                Start Image (Optional)
                </label>
                <ImageDropzone 
                    imageFile={startImage}
                    onFileChange={setStartImage}
                    onFileRemove={() => setStartImage(undefined)}
                    promptText="Drag & drop Start Image"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-text-muted mb-2">
                End Image (Optional)
                </label>
                <ImageDropzone 
                    imageFile={endImage}
                    onFileChange={setEndImage}
                    onFileRemove={() => setEndImage(undefined)}
                    promptText="Drag & drop End Image"
                />
            </div>
        </div>
      </div>
      <div className="bg-brand-surface rounded-lg flex items-center justify-center p-4 min-h-[300px] md:min-h-0 relative">
        {isGenerating ? (
          <div className="text-center text-brand-text-muted flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p>Generating video...</p>
            <p className="text-xs mt-1">This may take a few minutes.</p>
          </div>
        ) : videoUrl ? (
          <div className="w-full h-full">
            <video src={videoUrl} controls loop className="w-full h-full object-contain rounded-lg" />
            <button
                onClick={handleDownload}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-brand-primary transition-colors"
                aria-label="Download video"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            </button>
          </div>
        ) : (
          <div className="text-center text-brand-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="mt-2">Your generated video will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};