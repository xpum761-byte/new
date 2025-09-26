



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
  dialogue?: string;
  startImage?: File;
  videoUrl?: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  aspectRatio: string;
  mode: 'transition';
}

// --- Prompt Generator Types ---
export interface ActionEvent {
  id: string;
  type: 'action';
  start: string;
  end: string;
  description: string;
}

export interface DialogueEvent {
  id: string;
  type: 'dialogue';
  start: string;
  end: string;
  text: string;
}

export type TimelineEvent = ActionEvent | DialogueEvent;

export interface Character {
  id: string;
  name: string;
  nationality: string;
  traits: string;
  appearance: string;
  voice: {
    type: string;
    pitch: string;
    timbre: string;
    consistency: string;
  };
  timeline: TimelineEvent[];
}

export interface SceneSettings {
  mood: string;
  backgroundSound: string;
  cameraAngle: string;
  graphicStyle: string;
  lighting: string;
}

export interface ClipSegment {
  id: string;
  startTime: string;
  endTime: string;
}

export interface PromptGeneratorTabProps {
  onExportToBatch: (segments: Omit<VideoSegment, 'id' | 'status' | 'videoUrl'>[]) => void;
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  sceneSettings: SceneSettings;
  setSceneSettings: React.Dispatch<React.SetStateAction<SceneSettings>>;
  clipSegments: ClipSegment[];
  setClipSegments: React.Dispatch<React.SetStateAction<ClipSegment[]>>;
}

export interface BatchSegment {
  id: string;
  prompt: string;
  image?: File;
  videoUrl?: string;
  status: 'idle' | 'generating' | 'success' | 'error';
  aspectRatio: string;
}
