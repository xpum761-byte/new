
export enum Tab {
  VIDEO_GENERATOR = 'video_generator',
  IMAGE_GENERATOR = 'image_generator',
  PROMPT_GENERATOR = 'prompt_generator',
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  message: string;
  status: 'idle' | 'generating' | 'success' | 'error';
}

export interface VideoSegment {
  id: string;
  prompt: string;
  startImage?: File;
  endImage?: File;
  videoUrl?: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  aspectRatio: string;
  mode: 'transition' | 'combine';
}

export interface PromptGeneratorTabProps {
  onExportToBatch: (prompts: string[]) => void;
  isSidebarOpen: boolean;
}

// FIX: Added missing BatchSegment type definition.
export interface BatchSegment {
  id: string;
  prompt: string;
  image?: File;
  videoUrl?: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  aspectRatio: string;
}
