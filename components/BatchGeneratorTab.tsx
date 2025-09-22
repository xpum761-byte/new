


import React, { ChangeEvent, useRef } from 'react';
import type { BatchSegment } from '../types';
import { ImageDropzone } from '../ImageDropzone';

interface BatchGeneratorTabProps {
  segments: BatchSegment[];
  setSegments: React.Dispatch<React.SetStateAction<BatchSegment[]>>;
}

const StatusIcon: React.FC<{ status: BatchSegment['status'] }> = ({ status }) => {
    switch (status) {
        case 'generating':
            return <svg className="animate-spin h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
        case 'success':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
        case 'error':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
        default:
            return <div className="h-5 w-5"></div>;
    }
};

export const BatchGeneratorTab: React.FC<BatchGeneratorTabProps> = ({ segments, setSegments }) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const videoAspectRatios = ['16:9', '9:16', '4:3'];

  const addSegment = () => {
    setSegments([...segments, { id: crypto.randomUUID(), prompt: '', image: undefined, status: 'idle', aspectRatio: '16:9' }]);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const updateSegment = (id: string, newValues: Partial<BatchSegment>) => {
    setSegments(segments.map(s => (s.id === id ? { ...s, ...newValues } : s)));
  };
  
  const handleDragSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const newSegments = [...segments];
    const draggedItemContent = newSegments.splice(dragItem.current, 1)[0];
    newSegments.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setSegments(newSegments);
  };
  
  const handleDownload = (url: string, prompt: string) => {
    const filename = prompt.substring(0, 20).replace(/\s+/g, '_') || 'segment';
    const link = document.createElement('a');
    link.href = url;
    link.download = `synthv_${filename}_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-brand-text">Video Segments</h2>
        <button onClick={addSegment} className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-md hover:bg-gray-600 transition-colors">
          Add Segment
        </button>
      </div>
      {segments.length > 0 ? (
        <div className="flex-grow overflow-y-auto space-y-3 pr-2">
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              className="bg-brand-surface p-4 rounded-lg flex items-start gap-4 cursor-grab active:cursor-grabbing"
              draggable
              onDragStart={() => dragItem.current = index}
              onDragEnter={() => dragOverItem.current = index}
              onDragEnd={handleDragSort}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="flex flex-col items-center gap-2 pt-1 text-brand-text-muted">
                <span className="font-mono text-sm">{index + 1}</span>
                <StatusIcon status={segment.status} />
              </div>
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <textarea
                        value={segment.prompt}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateSegment(segment.id, { prompt: e.target.value })}
                        placeholder="Enter prompt for this segment"
                        rows={3}
                        className="w-full bg-brand-bg/50 border border-white/10 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-primary focus:outline-none"
                    />
                     <div>
                        <div className="flex gap-2 flex-wrap">
                            {videoAspectRatios.map(ratio => (
                                <button key={ratio} onClick={() => updateSegment(segment.id, { aspectRatio: ratio })} className={`px-2 py-1 text-xs rounded-md transition-colors ${segment.aspectRatio === ratio ? 'bg-brand-primary text-black' : 'bg-brand-bg/50 hover:bg-white/10'}`}>
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ImageDropzone 
                        imageFile={segment.image}
                        onFileChange={(file) => updateSegment(segment.id, { image: file })}
                        onFileRemove={() => updateSegment(segment.id, { image: undefined })}
                        containerClassName="h-24"
                        promptText="Add optional image"
                    />
                </div>
                <div className="bg-brand-bg/50 rounded flex items-center justify-center min-h-[100px] relative">
                    {segment.videoUrl ? (
                        <>
                         <video src={segment.videoUrl} controls loop className="w-full h-full object-contain rounded" />
                         <button
                            onClick={() => handleDownload(segment.videoUrl!, segment.prompt)}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-brand-primary transition-colors"
                            aria-label="Download video segment"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         </button>
                        </>
                    ) : (
                        <p className="text-xs text-brand-text-muted">Video output</p>
                    )}
                </div>
              </div>
              <button onClick={() => removeSegment(segment.id)} className="text-brand-text-muted hover:text-white transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-brand-text-muted border-2 border-dashed border-white/10 rounded-lg">
          <div className="text-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            <p className="mt-2">Click "Add Segment" to start building your video.</p>
          </div>
        </div>
      )}
    </div>
  );
};
