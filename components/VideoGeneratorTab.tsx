

import React, { ChangeEvent, useRef } from 'react';
import type { VideoSegment } from '../types';
import { ImageDropzone } from './ImageDropzone';

interface VideoGeneratorTabProps {
  segments: VideoSegment[];
  setSegments: React.Dispatch<React.SetStateAction<VideoSegment[]>>;
  onGenerateSegment: (segmentId: string) => void;
  isGenerating: boolean;
}

const StatusIcon: React.FC<{ status: VideoSegment['status'] }> = ({ status }) => {
    switch (status) {
        case 'generating':
            return <svg className="animate-spin h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
        case 'success':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
        case 'error':
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
        default:
            return <div className="h-5 w-5 border-2 border-brand-text-muted/50 rounded-full"></div>;
    }
};


export const VideoGeneratorTab: React.FC<VideoGeneratorTabProps> = ({ segments, setSegments, onGenerateSegment, isGenerating }) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const videoAspectRatios = ['16:9', '9:16', '4:3', '1:1', '4:5'];

  const addSegment = () => {
    setSegments([...segments, { id: crypto.randomUUID(), prompt: '', startImage: undefined, videoUrl: undefined, status: 'idle', aspectRatio: '16:9', mode: 'transition' }]);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const updateSegment = (id: string, newValues: Partial<VideoSegment>) => {
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
  
  const handleDownload = (url: string, prompt: string, segmentNumber: number) => {
    const promptSnippet = prompt.substring(0, 20).replace(/\s+/g, '_') || 'video';
    const filename = `synthv_segment_${segmentNumber}_${promptSnippet}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-brand-text">Video Segments</h2>
        <button onClick={addSegment} className="px-4 py-2 bg-brand-accent text-black font-bold rounded-md hover:opacity-90 transition-colors">
          Add Segment
        </button>
      </div>
      {segments.length > 0 ? (
        <div className="flex-grow space-y-4 pr-2 pb-28">
          {segments.map((segment, index) => (
            <div
              key={segment.id}
              className="bg-brand-surface p-4 rounded-lg flex flex-col gap-4 border border-brand-primary/10"
              draggable
              onDragStart={() => dragItem.current = index}
              onDragEnter={() => dragOverItem.current = index}
              onDragEnd={handleDragSort}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* --- Segment Header --- */}
              <div className="flex items-center gap-4 cursor-grab active:cursor-grabbing">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                  <span className="font-mono text-lg text-brand-text">Segment {index + 1}</span>
                  <StatusIcon status={segment.status} />
                  <div className="flex-grow"></div>
                  <button onClick={() => removeSegment(segment.id)} className="text-brand-text-muted hover:text-brand-primary transition-colors p-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
              </div>

              {/* --- Segment Body --- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Side: Prompt & Settings */}
                  <div className="flex flex-col gap-4">
                      <textarea
                        value={segment.prompt}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateSegment(segment.id, { prompt: e.target.value })}
                        placeholder="Enter prompt for this segment, including any dialogue in quotes. E.g., A man says, 'Hello world.'"
                        rows={5}
                        className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-accent focus:outline-none resize-y"
                      />
                      
                      {(segment.status === 'idle' || segment.status === 'error') && (
                        <button
                          onClick={() => onGenerateSegment(segment.id)}
                          disabled={isGenerating}
                          className="w-full px-4 py-2 bg-brand-accent/90 text-black font-bold rounded-md hover:bg-brand-accent transition-colors disabled:bg-brand-secondary disabled:text-brand-text-muted/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {segment.status === 'error' ? 'Retry Generation' : 'Generate Segment'}
                        </button>
                      )}

                      <ImageDropzone 
                          imageFile={segment.startImage}
                          onFileChange={(file) => updateSegment(segment.id, { startImage: file })}
                          onFileRemove={() => updateSegment(segment.id, { startImage: undefined })}
                          containerClassName="h-32"
                          promptText="Add optional start image"
                      />
                      <div>
                        <label className="block text-xs font-medium text-brand-text-muted mb-2">Aspect Ratio</label>
                        <div className="flex gap-2 flex-wrap">
                            {videoAspectRatios.map(ratio => (
                                <button key={ratio} onClick={() => updateSegment(segment.id, { aspectRatio: ratio })} className={`px-2 py-1 text-xs rounded-md transition-colors ${segment.aspectRatio === ratio ? 'bg-brand-primary text-black font-semibold' : 'bg-brand-bg hover:bg-brand-secondary'}`}>
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                  </div>

                  {/* Right Side: Video Output */}
                   <div 
                    className="bg-brand-bg/50 rounded-lg flex items-center justify-center relative overflow-hidden"
                    style={segment.videoUrl ? { aspectRatio: segment.aspectRatio.replace(':', ' / ') } : { minHeight: '200px' }}
                   >
                    {segment.videoUrl ? (
                        <>
                         <video src={segment.videoUrl} controls loop className="w-full h-full object-contain bg-black" />
                         <button
                            onClick={() => handleDownload(segment.videoUrl!, segment.prompt, index + 1)}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-brand-primary transition-colors"
                            aria-label="Download video segment"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         </button>
                        </>
                    ) : (
                        <p className="text-sm text-brand-text-muted">Video output will appear here</p>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-center text-brand-text-muted border-2 border-dashed border-brand-primary/20 rounded-lg">
          <div className="text-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <p className="mt-2">Click "Add Segment" to start building your video.</p>
          </div>
        </div>
      )}
    </div>
  );
};