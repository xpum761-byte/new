

import React, { ChangeEvent } from 'react';
import { ImageDropzone } from '../ImageDropzone';

interface ImageGeneratorTabProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  images: string[];
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  numberOfImages: number;
  setNumberOfImages: (num: number) => void;
  isGenerating: boolean;
  referenceImage: File | undefined;
  setReferenceImage: (file: File | undefined) => void;
}

// FIX: Updated to only include supported aspect ratios for imagen-4.0-generate-001
const aspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];

export const ImageGeneratorTab: React.FC<ImageGeneratorTabProps> = ({ prompt, setPrompt, images, aspectRatio, setAspectRatio, numberOfImages, setNumberOfImages, isGenerating, referenceImage, setReferenceImage }) => {
  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `synthv-image-${index + 1}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
           <label htmlFor="image-prompt" className="block text-sm font-medium text-brand-text-muted mb-2">Prompt</label>
           <textarea
              id="image-prompt"
              value={prompt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
              placeholder="e.g., A photorealistic image of a futuristic city at night, with flying cars"
              rows={4}
              className="w-full bg-brand-surface border border-brand-primary/20 rounded-md p-3 text-brand-text focus:ring-2 focus:ring-brand-accent focus:outline-none transition"
            />
        </div>
        <div className="lg:col-span-1">
             <label className="block text-sm font-medium text-brand-text-muted mb-2">Reference Image (for editing)</label>
             <ImageDropzone
                imageFile={referenceImage}
                onFileChange={setReferenceImage}
                onFileRemove={() => setReferenceImage(undefined)}
                promptText="Drop image here to edit"
                containerClassName="h-full min-h-[116px]"
             />
        </div>
        <div className='flex flex-col gap-4 lg:col-span-1'>
            {!referenceImage ? (
                <>
                    <div>
                         <label className="block text-sm font-medium text-brand-text-muted mb-2">Aspect Ratio</label>
                         <div className="flex gap-2 flex-wrap">
                            {aspectRatios.map(ratio => (
                                <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${aspectRatio === ratio ? 'bg-brand-primary text-black font-semibold' : 'bg-brand-bg hover:bg-brand-secondary'}`}>
                                    {ratio}
                                </button>
                            ))}
                         </div>
                    </div>
                     <div>
                         <label htmlFor="num-images" className="block text-sm font-medium text-brand-text-muted mb-2">Number of Images ({numberOfImages})</label>
                         <input 
                            type="range"
                            id="num-images"
                            min="1"
                            max="4"
                            step="1"
                            value={numberOfImages}
                            onChange={e => setNumberOfImages(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-brand-surface rounded-lg appearance-none cursor-pointer accent-brand-primary"
                         />
                    </div>
                </>
            ) : (
                <div className="bg-brand-surface border border-dashed border-brand-primary/20 rounded-lg p-4 h-full flex items-center justify-center">
                    <p className="text-sm text-center text-brand-text-muted">Aspect ratio & image count are set by the reference image in edit mode.</p>
                </div>
            )}
        </div>
      </div>

      <div className="flex-grow bg-brand-surface rounded-lg p-4 border border-brand-primary/10">
        {isGenerating ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: referenceImage ? 1: numberOfImages }).map((_, i) => (
              <div key={i} className="bg-brand-secondary/50 animate-pulse rounded-md" style={{ aspectRatio: aspectRatio.replace(':', ' / ') }}></div>
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((img, i) => (
                <div key={i} className='overflow-hidden rounded-md relative group'>
                    <img src={img} alt={`Generated image ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                        <button
                            onClick={() => handleDownload(img, i)}
                            className="text-white p-3 rounded-full bg-brand-surface/50 hover:bg-brand-primary hover:text-black transition-colors"
                            aria-label={`Download image ${i + 1}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-brand-text-muted border-2 border-dashed border-brand-primary/20 rounded-lg">
             <div className="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="mt-4 text-base">Your generated images will appear here.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
