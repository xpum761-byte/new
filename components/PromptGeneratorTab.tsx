

import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import type { PromptGeneratorTabProps } from '../types';

// --- TYPE DEFINITIONS ---
interface ActionEvent {
  id: string;
  type: 'action';
  start: string;
  end: string;
  description: string;
}

interface DialogueEvent {
  id: string;
  type: 'dialogue';
  start: string;
  end: string;
  text: string;
}

type TimelineEvent = ActionEvent | DialogueEvent;

interface Character {
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

interface SceneSettings {
  mood: string;
  backgroundSound: string;
  cameraAngle: string;
  graphicStyle: string;
  lighting: string;
}

interface ClipSegment {
  id: string;
  startTime: string;
  endTime: string;
}

// --- ACCORDION COMPONENT ---
const Accordion: React.FC<{ title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-white/10 rounded-lg bg-brand-surface overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-brand-text hover:bg-white/5"
        aria-expanded={isOpen}
      >
        <div className="w-full">{title}</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-5 h-5 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-white/10 bg-brand-bg/20">
          {children}
        </div>
      )}
    </div>
  );
};


// --- INITIAL STATE ---
const createNewTimelineEvent = (type: 'action' | 'dialogue'): TimelineEvent => ({
  id: crypto.randomUUID(),
  type,
  start: '',
  end: '',
  description: '',
  text: '',
} as ActionEvent | DialogueEvent);

const createNewCharacter = (): Character => ({
  id: crypto.randomUUID(),
  name: '',
  nationality: 'Indonesia',
  traits: '',
  appearance: '',
  voice: {
    type: 'Pria Dewasa',
    pitch: 'Sedang',
    timbre: 'Jernih',
    consistency: '',
  },
  timeline: [],
});

const initialSceneSettings: SceneSettings = {
  mood: '',
  backgroundSound: '',
  cameraAngle: 'Normal (Eye-level)',
  graphicStyle: 'Realistic',
  lighting: 'Siang Hari (Cerah)',
};

// --- HELPER & DUMMY DATA ---
const calculateDuration = (start: string, end: string): number => {
  const s = parseFloat(start);
  const e = parseFloat(end);
  if (!isNaN(s) && !isNaN(e) && e > s) {
    return e - s;
  }
  return 0;
};

const voiceTypes = ["Pria Dewasa", "Wanita Dewasa", "Anak Laki-laki", "Anak Perempuan", "Remaja", "Lansia"];
const pitches = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];
const timbres = ["Jernih", "Serak", "Hangat", "Nasal", "Berat"];
const cameraAngles = ["Normal (Eye-level)", "High-angle", "Low-angle", "Dutch Angle", "Point of View (POV)", "Drone", "Crane", "Diam (Static)", "Berjalan Mengikuti (Following Shot)"];
const graphicStyles = ["Realistic", "Cartoon", "Anime", "Fantasy", "Cyberpunk", "Vintage"];
const lightings = ["Siang Hari (Cerah)", "Malam Hari", "Mendung", "Golden Hour", "Blue Hour", "Neon"];

export const PromptGeneratorTab: React.FC<PromptGeneratorTabProps> = ({ onExportToBatch, isSidebarOpen }) => {
  const [characters, setCharacters] = useState<Character[]>([createNewCharacter()]);
  const [sceneSettings, setSceneSettings] = useState<SceneSettings>(initialSceneSettings);
  const [canvasOutput, setCanvasOutput] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Salin Canvas');
  const [clipSegments, setClipSegments] = useState<ClipSegment[]>([
    { id: crypto.randomUUID(), startTime: '0', endTime: '8' }
  ]);


  // --- CHARACTER HANDLERS ---
  const addCharacter = () => setCharacters([...characters, createNewCharacter()]);
  const removeCharacter = (id: string) => setCharacters(characters.filter(c => c.id !== id));
  const updateCharacter = (id: string, field: keyof Character, value: any) => {
    setCharacters(characters.map(c => c.id === id ? { ...c, [field]: value } : c));
  };
  const updateVoiceSetting = (charId: string, field: keyof Character['voice'], value: string) => {
    setCharacters(characters.map(c => c.id === charId ? { ...c, voice: { ...c.voice, [field]: value } } : c));
  };

  // --- TIMELINE HANDLERS ---
  const addTimelineEvent = (charId: string, type: 'action' | 'dialogue') => {
    const newEvent = createNewTimelineEvent(type);
    setCharacters(characters.map(c => c.id === charId ? { ...c, timeline: [...c.timeline, newEvent] } : c));
  };
  const removeTimelineEvent = (charId: string, eventId: string) => {
    setCharacters(characters.map(c => c.id === charId ? { ...c, timeline: c.timeline.filter(e => e.id !== eventId) } : c));
  };
  
  const updateTimelineEvent = (charId: string, eventId: string, field: keyof ActionEvent | keyof DialogueEvent, value: string) => {
    setCharacters(characters.map(c => {
      if (c.id !== charId) return c;
      return {
        ...c,
        timeline: c.timeline.map(e => e.id === eventId ? ({ ...e, [field]: value } as TimelineEvent) : e),
      };
    }));
  };
  
  // --- SCENE SETTINGS HANDLER ---
  const updateSceneSetting = (field: keyof SceneSettings, value: string) => {
    setSceneSettings(prev => ({ ...prev, [field]: value }));
  };

  // --- CLIP SEGMENT HANDLERS ---
  const addClipSegment = () => {
    const lastSegment = clipSegments[clipSegments.length - 1];
    const newStartTime = lastSegment ? lastSegment.endTime : '0';
    const newEndTime = (parseFloat(newStartTime) + 8).toString();
    setClipSegments([...clipSegments, { id: crypto.randomUUID(), startTime: newStartTime, endTime: newEndTime }]);
  };
  const removeClipSegment = (id: string) => setClipSegments(clipSegments.filter(s => s.id !== id));
  const updateClipSegment = (id: string, field: keyof ClipSegment, value: string) => {
      setClipSegments(clipSegments.map(s => s.id === id ? { ...s, [field]: value } : s));
  };


  // --- FINAL ACTIONS ---
  const generateFullCanvas = useCallback(() => {
    let content = `[PENGATURAN SUASANA]\n`;
    content += `Suasana: ${sceneSettings.mood || 'Tidak ditentukan'}\n`;
    content += `Suara Latar Belakang: ${sceneSettings.backgroundSound || 'Tidak ada'}\n`;
    content += `Sudut Pandang Kamera: ${sceneSettings.cameraAngle}\n`;
    content += `Gaya Grafis: ${sceneSettings.graphicStyle}\n`;
    content += `Pencahayaan: ${sceneSettings.lighting}\n\n`;

    characters.forEach((char, index) => {
      content += `[KARAKTER ${index + 1}]\n`;
      content += `Nama: ${char.name || 'Tidak ada'}\n`;
      content += `Kebangsaan: ${char.nationality}\n`;
      content += `Ciri Dasar: ${char.traits || 'Tidak ada'}\n`;
      content += `Penampilan: ${char.appearance || 'Tidak ada'}\n`;
      content += `Suara: ${char.voice.type}, Pitch: ${char.voice.pitch}, Timbre: ${char.voice.timbre}\n`;
      content += `Konsistensi Suara: ${char.voice.consistency || 'Tidak ada'}\n\n`;
      content += `[TIMELINE UNTUK ${char.name.toUpperCase() || `KARAKTER ${index + 1}`}]\n`;
      char.timeline.sort((a,b) => parseFloat(a.start) - parseFloat(b.start)).forEach(event => {
        const start = event.start || "0";
        const end = event.end || "0";
        if (event.type === 'action') {
          content += `(${start}s - ${end}s) AKSI: ${event.description}\n`;
        } else {
          content += `(${start}s - ${end}s) DIALOG: "${event.text}"\n`;
        }
      });
      content += `\n`;
    });
    return content;
  }, [characters, sceneSettings]);

  useEffect(() => {
    const content = generateFullCanvas();
    setCanvasOutput(content);
  }, [generateFullCanvas]);


  const handleExportToBatchClick = () => {
      // 1. Generate base prompt (scene + characters)
      let basePrompt = `[INFO KONTEKS UTAMA]\nBerikut adalah informasi untuk menjaga konsistensi di semua klip video.\n\n[PENGATURAN SUASANA]\n`;
      basePrompt += `Gaya visual harus konsisten sebagai: ${sceneSettings.graphicStyle} dengan pencahayaan ${sceneSettings.lighting}.\n`;
      basePrompt += `Suasana umum adalah ${sceneSettings.mood || 'netral'}.\n`;
      basePrompt += `Terdengar suara latar ${sceneSettings.backgroundSound || 'hening'}.\n\n`;

      characters.forEach((char, index) => {
          basePrompt += `[KARAKTER ${index + 1}: ${char.name.toUpperCase() || 'Tanpa Nama'}]\n`;
          basePrompt += `Deskripsi: ${char.appearance}, ${char.traits}. Kebangsaan ${char.nationality}.\n`;
          basePrompt += `Suara: Karakter ini memiliki suara ${char.voice.type} dengan pitch ${char.voice.pitch} dan timbre ${char.voice.timbre}.\n\n`;
      });

      // 2. Get all timeline events from all characters
      const allEvents = characters.flatMap(char =>
          char.timeline.map(event => ({
              ...event,
              characterName: char.name || `Karakter ${characters.indexOf(char) + 1}`,
          }))
      );

      // 3. Create a prompt for each clip segment
      const finalPrompts = clipSegments.map(segment => {
          const segStart = parseFloat(segment.startTime);
          const segEnd = parseFloat(segment.endTime);

          if (isNaN(segStart) || isNaN(segEnd)) return null;

          const eventsInSegment = allEvents
              .filter(event => {
                  const evtStart = parseFloat(event.start);
                  return !isNaN(evtStart) && evtStart >= segStart && evtStart < segEnd;
              })
              .sort((a, b) => parseFloat(a.start) - parseFloat(b.start));

          let sceneDescription = `[ADEGAN UNTUK KLIP INI (Durasi ${segStart}s hingga ${segEnd}s)]\n`;
          sceneDescription += `Sudut pandang kamera utama adalah ${sceneSettings.cameraAngle}.\n`;
          
          if (eventsInSegment.length > 0) {
              eventsInSegment.forEach(event => {
                  if (event.type === 'action') {
                      sceneDescription += `- Pada detik ke-${event.start}, ${event.characterName} melakukan aksi: ${event.description}.\n`;
                  } else {
                      sceneDescription += `- Pada detik ke-${event.start}, ${event.characterName} berkata: "${event.text}".\n`;
                  }
              });
          } else {
              sceneDescription += `- Tidak ada aksi atau dialog spesifik dalam segmen ini. Tampilkan suasana sesuai konteks.\n`;
          }

          return basePrompt + sceneDescription;
      }).filter((p): p is string => p !== null);

      onExportToBatch(finalPrompts);
  };
    
  const handleCopyCanvas = () => {
    navigator.clipboard.writeText(canvasOutput).then(() => {
        setCopyButtonText('Disalin!');
        setTimeout(() => setCopyButtonText('Salin Canvas'), 2000);
    });
  };

  const renderInputField = (label: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void, placeholder = '', type='text') => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-brand-bg/50 border border-white/10 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-primary focus:outline-none" />
    </div>
  );
  
  const renderTextareaField = (label: string, value: string, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void, placeholder = '') => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={2} className="w-full bg-brand-bg/50 border border-white/10 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-primary focus:outline-none resize-y" />
    </div>
  );

  const renderSelectField = (label: string, value: string, onChange: (e: ChangeEvent<HTMLSelectElement>) => void, options: string[]) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg/50 border border-white/10 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-primary focus:outline-none">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* --- LEFT COLUMN: INPUTS --- */}
        <div className="lg:col-span-3 space-y-6 pb-48 md:pb-28">
            {/* --- CHARACTERS SECTION --- */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-brand-text px-1">1. Karakter</h2>
                {characters.map((char, charIndex) => (
                    <Accordion 
                        key={char.id}
                        defaultOpen={charIndex === characters.length - 1}
                        title={
                            <div className="flex justify-between items-center w-full pr-2">
                                <span className="truncate">Karakter {charIndex + 1}: {char.name || 'Tanpa Nama'}</span>
                                {characters.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeCharacter(char.id);
                                        }}
                                        className="text-red-500 hover:text-red-400 text-sm z-10 relative font-normal shrink-0 ml-4"
                                        aria-label={`Hapus Karakter ${charIndex + 1}`}
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            {/* Character Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderInputField('Nama', char.name, e => updateCharacter(char.id, 'name', e.target.value), 'Nama Karakter')}
                                {renderInputField('Kebangsaan', char.nationality, e => updateCharacter(char.id, 'nationality', e.target.value))}
                                {renderTextareaField('Ciri Dasar', char.traits, e => updateCharacter(char.id, 'traits', e.target.value), 'Contoh: Pemberani, Cerdas, Pemalu')}
                                {renderTextareaField('Penampilan', char.appearance, e => updateCharacter(char.id, 'appearance', e.target.value), 'Deskripsi penampilan fisik karakter...')}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {renderSelectField('Jenis Suara', char.voice.type, e => updateVoiceSetting(char.id, 'type', e.target.value), voiceTypes)}
                                {renderSelectField('Pitch Nada', char.voice.pitch, e => updateVoiceSetting(char.id, 'pitch', e.target.value), pitches)}
                                {renderSelectField('Timbre', char.voice.timbre, e => updateVoiceSetting(char.id, 'timbre', e.target.value), timbres)}
                                {renderInputField('Konsistensi Suara', char.voice.consistency, e => updateVoiceSetting(char.id, 'consistency', e.target.value), 'Deskripsikan konsistensi...')}
                            </div>

                            {/* Timeline Events */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-brand-text-muted mt-4">Aksi & Dialog Berbasis Timestamp</h4>
                                {char.timeline.map(event => (
                                    <div key={event.id} className="bg-brand-bg/50 p-3 rounded-lg space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-brand-accent">{event.type === 'action' ? 'Aksi' : 'Dialog'}</span>
                                            <button onClick={() => removeTimelineEvent(char.id, event.id)} className="text-red-500 hover:text-red-400 text-xl font-bold">&times;</button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 items-end">
                                            {renderInputField('Mulai (s)', event.start, e => updateTimelineEvent(char.id, event.id, 'start', e.target.value), '', 'number')}
                                            {renderInputField('Akhir (s)', event.end, e => updateTimelineEvent(char.id, event.id, 'end', e.target.value), '', 'number')}
                                            <span className="text-xs text-brand-text-muted pb-2">Durasi: {calculateDuration(event.start, event.end)}s</span>
                                        </div>
                                        {event.type === 'action' ? (
                                            renderTextareaField('Deskripsi Aksi', event.description, e => updateTimelineEvent(char.id, event.id, 'description', e.target.value))
                                        ) : (
                                            renderTextareaField('Teks Dialog', event.text, e => updateTimelineEvent(char.id, event.id, 'text', e.target.value))
                                        )}
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <button onClick={() => addTimelineEvent(char.id, 'action')} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 px-4 rounded-md transition-colors">+ Tambah Aksi</button>
                                    <button onClick={() => addTimelineEvent(char.id, 'dialogue')} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-2 px-4 rounded-md transition-colors">+ Tambah Dialog</button>
                                </div>
                            </div>
                        </div>
                    </Accordion>
                ))}
                <button onClick={addCharacter} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">+ Tambah Karakter</button>
            </div>
            
            {/* --- SCENE SETTINGS SECTION --- */}
            <Accordion title={<h2 className="text-xl font-bold text-brand-text">2. Pengaturan Suasana</h2>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInputField('Suasana', sceneSettings.mood, e => updateSceneSetting('mood', e.target.value), 'Contoh: Tegang, Romantis, Menyenangkan')}
                    {renderInputField('Suara Latar Belakang', sceneSettings.backgroundSound, e => updateSceneSetting('backgroundSound', e.target.value), 'Contoh: Hujan deras, Musik klasik')}
                    {renderSelectField('Sudut Pandang Kamera', sceneSettings.cameraAngle, e => updateSceneSetting('cameraAngle', e.target.value), cameraAngles)}
                    {renderSelectField('Gaya Grafis', sceneSettings.graphicStyle, e => updateSceneSetting('graphicStyle', e.target.value), graphicStyles)}
                    {renderSelectField('Pencahayaan', sceneSettings.lighting, e => updateSceneSetting('lighting', e.target.value), lightings)}
                </div>
            </Accordion>

            {/* --- CLIP COMBINER SECTION --- */}
            <Accordion title={<h2 className="text-xl font-bold text-brand-text">3. Penggabung Klip</h2>} defaultOpen>
                <div className="space-y-3">
                {clipSegments.map((segment, index) => (
                    <div key={segment.id} className="flex items-end gap-2 bg-brand-bg/50 p-3 rounded-lg">
                    <span className="text-brand-text-muted font-mono text-sm pt-1 mr-2">{index + 1}</span>
                    <div className="flex-grow">
                        {renderInputField('Mulai (detik)', segment.startTime, e => updateClipSegment(segment.id, 'startTime', e.target.value), '', 'number')}
                    </div>
                    <div className="flex-grow">
                        {renderInputField('Akhir (detik)', segment.endTime, e => updateClipSegment(segment.id, 'endTime', e.target.value), '', 'number')}
                    </div>
                    <button onClick={() => removeClipSegment(segment.id)} className="p-2 text-red-500 hover:text-red-400 rounded-md hover:bg-white/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    </div>
                ))}
                <button onClick={addClipSegment} className="w-full mt-2 bg-brand-accent/80 hover:bg-brand-accent text-white font-semibold py-2 px-4 rounded-md transition-colors">
                    + Tambah Segmen Klip
                </button>
                </div>
            </Accordion>
        </div>

        {/* --- RIGHT COLUMN: OUTPUT CANVAS --- */}
        <div className="lg:col-span-2 relative">
            <div className="lg:sticky lg:top-24 h-fit">
                <h2 className="text-xl font-bold text-brand-text mb-4">Prompt Canvas</h2>
                <div className="bg-brand-surface rounded-lg shadow-inner h-[calc(100vh-20rem)] max-h-[700px]">
                    <pre className="whitespace-pre-wrap break-words text-sm p-4 overflow-y-auto text-brand-text-muted h-full w-full rounded-lg">
                        {canvasOutput}
                    </pre>
                </div>
            </div>
        </div>


        {/* --- FOOTER ACTIONS --- */}
        <div className={`fixed bottom-0 right-0 bg-brand-surface/80 backdrop-blur-sm border-t border-white/10 p-4 z-10 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:left-64' : 'left-0'}`}>
            <div className="container mx-auto flex flex-col md:flex-row justify-end items-center gap-4">
                <button onClick={handleCopyCanvas} className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-500 transition-colors">
                    {copyButtonText}
                </button>
                <button onClick={handleExportToBatchClick} className="w-full md:w-auto px-8 py-2 bg-brand-primary text-white font-bold rounded-md hover:bg-purple-500 transition-colors shadow-lg shadow-brand-primary/20">
                    Ekspor ke Batch
                </button>
            </div>
        </div>
    </div>
  );
};
