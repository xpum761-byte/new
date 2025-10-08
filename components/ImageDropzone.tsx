

import React, { useState, useCallback, useEffect, DragEvent, ChangeEvent, useRef } from 'react';

interface ImageDropzoneProps {
  imageFile?: File;
  onFileChange: (file: File) => void;
  onFileRemove: () => void;
  containerClassName?: string;
  promptText?: string;
  disabled?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ imageFile, onFileChange, onFileRemove, containerClassName = '', promptText = 'Drag & drop, or click to select', disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  const handleFileSelect = (files: FileList | null) => {
    if (disabled || !files || files.length === 0) return;
    onFileChange(files[0]);
  };

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const onDragLeave = useCallback(() => {
    if (!disabled) setIsDragOver(false);
  }, [disabled]);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    }
  }, [onFileChange, disabled]);
  
  const triggerFileSelect = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  if (disabled) {
    return (
       <div className={`relative border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center transition-colors duration-200 cursor-not-allowed bg-brand-secondary/10 border-brand-secondary/30 ${containerClassName}`}>
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-brand-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-brand-text-muted/50">Disabled when continuing from previous</p>
        </div>
    );
  }

  if (previewUrl && imageFile) {
    return (
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFileSelect}
        className={`relative w-full h-full group cursor-pointer ${containerClassName}`}
      >
        <img src={previewUrl} alt="Image preview" className="w-full h-full object-cover rounded-lg" />
        
        <div className={`absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDragOver ? 'opacity-100 border-2 border-dashed border-brand-accent' : ''}`}>
           <div className="text-center text-white p-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
             <p className="text-xs font-semibold mt-1">Drop to replace or click to change</p>
           </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent the click from triggering file select
            onFileRemove();
          }}
          className="absolute top-2 right-2 bg-brand-surface/80 text-white rounded-full p-1 hover:bg-brand-primary hover:text-black transition-colors z-10"
          aria-label="Remove image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <input
            type="file"
            accept="image/*"
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files)}
            className="hidden"
            ref={fileInputRef}
          />
      </div>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={triggerFileSelect}
      className={`relative border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center transition-colors duration-200 cursor-pointer ${isDragOver ? 'border-brand-accent bg-brand-accent/10' : 'border-brand-primary/20'} ${containerClassName}`}
    >
       <input
        type="file"
        accept="image/*"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files)}
        className="hidden"
        ref={fileInputRef}
      />
       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-brand-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm text-brand-text-muted">{promptText}</p>
    </div>
  );
};