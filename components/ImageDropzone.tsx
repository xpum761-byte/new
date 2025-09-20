import React, { useState, useCallback, useEffect, DragEvent, ChangeEvent } from 'react';

interface ImageDropzoneProps {
  imageFile?: File;
  onFileChange: (file: File) => void;
  onFileRemove: () => void;
  containerClassName?: string;
  promptText?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ imageFile, onFileChange, onFileRemove, containerClassName = '', promptText = 'Drag & drop, or click to select' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    if (files && files.length > 0) {
      onFileChange(files[0]);
    }
  };

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [onFileChange]);

  if (previewUrl && imageFile) {
    return (
      <div className={`relative w-full h-full ${containerClassName}`}>
        <img src={previewUrl} alt="Image preview" className="w-full h-full object-cover rounded-lg" />
        <button
          onClick={onFileRemove}
          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/90 transition-colors"
          aria-label="Remove image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center transition-colors duration-200 ${isDragOver ? 'border-brand-primary bg-brand-primary/10' : 'border-white/20'} ${containerClassName}`}
    >
      <input
        type="file"
        accept="image/*"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        id={`image-upload-${crypto.randomUUID()}`}
      />
       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2 text-brand-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="text-sm text-brand-text-muted">{promptText}</p>
    </div>
  );
};
