
import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  PromptGeneratorTabProps,
  Character,
  SceneSettings,
  ClipSegment,
  TimelineEvent,
  ActionEvent,
  DialogueEvent,
  VideoSegment
} from '../types';

// --- ACCORDION COMPONENT ---
const Accordion: React.FC<{ title: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-brand-primary/20 rounded-lg bg-brand-surface overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-brand-text hover:bg-brand-secondary/50"
        aria-expanded={isOpen}
      >
        <div className="w-full">{title}</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-5 h-5 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-brand-primary/20 bg-brand-bg/20">
          {children}
        </div>
      )}
    </div>
  );
};


// --- INITIAL STATE HELPERS (EXPORTED) ---
export const createNewTimelineEvent = (type: 'action' | 'dialogue'): TimelineEvent => {
  if (type === 'action') {
    return {
      id: crypto.randomUUID(),
      type: 'action',
      start: '',
      end: '',
      description: '',
    };
  }
  return {
    id: crypto.randomUUID(),
    type: 'dialogue',
    start: '',
    end: '',
    text: '',
  };
};

export const createNewCharacter = (): Character => ({
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

export const initialSceneSettings: SceneSettings = {
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
    return parseFloat((e - s).toFixed(2));
  }
  return 0;
};

const voiceTypes = ["Pria Dewasa", "Wanita Dewasa", "Anak Laki-laki", "Anak Perempuan", "Remaja", "Lansia"];
const pitches = ["Sangat Rendah", "Rendah", "Sedang", "Tinggi", "Sangat Tinggi"];
const timbres = ["Jernih", "Serak", "Hangat", "Nasal", "Berat"];
const cameraAngles = ["Normal (Eye-level)", "High-angle", "Low-angle", "Dutch Angle", "Point of View (POV)", "Drone", "Crane", "Diam (Static)", "Berjalan Mengikuti (Following Shot)"];
const graphicStyles = ["Realistic", "Cartoon", "Anime", "Fantasy", "Cyberpunk", "Vintage"];
const lightings = ["Siang Hari (Cerah)", "Malam Hari", "Mendung", "Golden Hour", "Blue Hour", "Neon"];

export const PromptGeneratorTab: React.FC<PromptGeneratorTabProps> = ({ 
  apiKey,
  onExportToBatch, 
  characters,
  setCharacters,
  sceneSettings,
  setSceneSettings,
  clipSegments,
  setClipSegments,
}) => {
  const [canvasOutput, setCanvasOutput] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Salin Canvas');
  
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [isPreparingSegments, setIsPreparingSegments] = useState(false);
  const [storyIdeaPrompt, setStoryIdeaPrompt] = useState('');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

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
    const lastSegment = clipSegments.sort((a,b) => parseFloat(a.startTime) - parseFloat(b.startTime))[clipSegments.length - 1];
    const newStartTime = lastSegment ? lastSegment.endTime : '0';
    const newEndTime = (parseFloat(newStartTime) + 8).toString();
    setClipSegments([...clipSegments, { id: crypto.randomUUID(), startTime: newStartTime, endTime: newEndTime }]);
  };
  const removeClipSegment = (id: string) => setClipSegments(clipSegments.filter(s => s.id !== id));
  const updateClipSegment = (id: string, field: keyof ClipSegment, value: string) => {
      setClipSegments(clipSegments.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAutoGenerateSegments = () => {
    let maxEndTime = 0;
    characters.forEach((char: Character) => {
        char.timeline.forEach((event: TimelineEvent) => {
            const eventEnd = parseFloat(event.end);
            if (!isNaN(eventEnd) && eventEnd > maxEndTime) {
                maxEndTime = eventEnd;
            }
        });
    });

    if (maxEndTime === 0) {
        alert("Tidak ada timeline untuk membuat segmen. Silakan buat cerita atau tambahkan event di timeline karakter.");
        return;
    }

    const newClipSegments: ClipSegment[] = [];
    for (let startTime = 0; startTime < maxEndTime; startTime += 8) {
        const endTime = Math.min(startTime + 8, maxEndTime);
        if (startTime < endTime) { 
            newClipSegments.push({
                id: crypto.randomUUID(),
                startTime: String(startTime),
                endTime: String(endTime),
            });
        }
    }
    setClipSegments(newClipSegments);
  };
  
  // --- AI GENERATION FUNCTIONS ---
  const handleGenerateStoryIdea = async () => {
    if (!apiKey) { alert("Please set your API Key in the settings."); return; }
    if (!storyIdeaPrompt) { alert("Please enter a story idea."); return; }
    setIsGeneratingStory(true);

    try {
        const ai = new GoogleGenAI({ apiKey });

        const storySchema = {
          type: Type.OBJECT,
          properties: {
            characters: {
              type: Type.ARRAY,
              description: "List of characters in the story.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  nationality: { type: Type.STRING },
                  traits: { type: Type.STRING },
                  appearance: { type: Type.STRING },
                  timeline: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING },
                        start: { type: Type.STRING },
                        end: { type: Type.STRING },
                        description: { type: Type.STRING },
                        text: { type: Type.STRING }
                      },
                      required: ['type', 'start', 'end']
                    }
                  }
                },
                required: ['name', 'nationality', 'traits', 'appearance', 'timeline']
              }
            },
            sceneSettings: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING },
                backgroundSound: { type: Type.STRING },
                cameraAngle: { type: Type.STRING },
                graphicStyle: { type: Type.STRING },
                lighting: { type: Type.STRING }
              },
              required: ['mood', 'backgroundSound', 'cameraAngle', 'graphicStyle', 'lighting']
            }
          },
          required: ['characters', 'sceneSettings']
        };

        const prompt = `Berdasarkan ide berikut: "${storyIdeaPrompt}", buatlah struktur cerita yang lengkap dalam format JSON.

Isi JSON harus mencakup:
1.  **Karakter**: Detail tentang setiap karakter, termasuk nama, penampilan, dan urutan waktu tindakan (aksi) dan dialog mereka.
2.  **Pengaturan Adegan**: Suasana keseluruhan, suara latar, sudut pandang kamera, gaya grafis, dan pencahayaan. Pastikan nilai untuk kamera, gaya, dan pencahayaan dipilih dari daftar yang tersedia:
    *   Kamera: ${cameraAngles.join(', ')}
    *   Gaya: ${graphicStyles.join(', ')}
    *   Pencahayaan: ${lightings.join(', ')}

Buatlah cerita yang logis dengan awal, tengah, dan akhir. Pastikan semua waktu konsisten dan kronologis. Dialog harus dalam Bahasa Indonesia.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: storySchema,
            },
        });
        
        const parsedResponse = JSON.parse(response.text.trim());

        const charactersWithIds = (parsedResponse.characters || []).map((char: any) => ({
            ...createNewCharacter(),
            ...char,
            id: crypto.randomUUID(),
            timeline: (char.timeline || []).map((event: any) => ({
                ...event,
                id: crypto.randomUUID(),
            })),
        }));
        
        const validatedSceneSettings = {
            ...initialSceneSettings,
            ...parsedResponse.sceneSettings,
            cameraAngle: cameraAngles.includes(parsedResponse.sceneSettings?.cameraAngle) ? parsedResponse.sceneSettings.cameraAngle : cameraAngles[0],
            graphicStyle: graphicStyles.includes(parsedResponse.sceneSettings?.graphicStyle) ? parsedResponse.sceneSettings.graphicStyle : graphicStyles[0],
            lighting: lightings.includes(parsedResponse.sceneSettings?.lighting) ? parsedResponse.sceneSettings.lighting : lightings[0],
        };
        
        // Update state so the UI is consistent
        setCharacters(charactersWithIds);
        setSceneSettings(validatedSceneSettings);
        setClipSegments([]); // Clear previous segments to avoid confusion

    } catch (error) {
        console.error("Error generating story idea:", error);
        alert("Gagal membuat ide cerita. Periksa konsol untuk detail.");
    } finally {
        setIsGeneratingStory(false);
    }
};

  const handleAutoGenerateScene = async () => {
    if (!apiKey) { alert("Please set your API Key in the settings."); return; }
    setIsGeneratingScene(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const prompt = `Buatkan satu set pengaturan suasana yang kreatif dan konsisten untuk sebuah prompt video. Berikan objek JSON dengan kunci-kunci berikut: "mood", "backgroundSound", "cameraAngle", "graphicStyle", dan "lighting". Nilai untuk cameraAngle, graphicStyle, dan lighting HARUS dipilih dari daftar yang tersedia.

Daftar Sudut Pandang Kamera: ${cameraAngles.join(', ')}
Daftar Gaya Grafis: ${graphicStyles.join(', ')}
Daftar Pencahayaan: ${lightings.join(', ')}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT, properties: { mood: { type: Type.STRING }, backgroundSound: { type: Type.STRING }, cameraAngle: { type: Type.STRING }, graphicStyle: { type: Type.STRING }, lighting: { type: Type.STRING },},
            required: ["mood", "backgroundSound", "cameraAngle", "graphicStyle", "lighting"]
          },
        },
      });

      const generatedSettings = JSON.parse(response.text.trim());
      const validatedSettings = {
        mood: generatedSettings.mood || '',
        backgroundSound: generatedSettings.backgroundSound || '',
        cameraAngle: cameraAngles.includes(generatedSettings.cameraAngle) ? generatedSettings.cameraAngle : cameraAngles[0],
        graphicStyle: graphicStyles.includes(generatedSettings.graphicStyle) ? generatedSettings.graphicStyle : graphicStyles[0],
        lighting: lightings.includes(generatedSettings.lighting) ? generatedSettings.lighting : lightings[0],
      };
      setSceneSettings(validatedSettings);
    } catch (error) {
      console.error("Error generating scene settings:", error);
      alert("Failed to generate scene settings. Check console for details.");
    } finally {
      setIsGeneratingScene(false);
    }
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
      
      if (char.voice.consistency) {
          content += `Deskripsi Suara: ${char.voice.consistency}\n\n`;
      } else if (char.voice.type && char.voice.type !== 'N/A') {
          content += `Suara: ${char.voice.type}, Pitch: ${char.voice.pitch}, Timbre: ${char.voice.timbre}\n\n`;
      } else {
          content += `Suara: Tidak ditentukan\n\n`;
      }

      content += `[TIMELINE KARAKTER ${index + 1}]\n`;
      char.timeline
        .sort((a, b) => parseFloat(a.start) - parseFloat(b.start))
        .forEach(event => {
          const duration = calculateDuration(event.start, event.end);
          if (event.type === 'action') {
            content += `Aksi (${event.start}s - ${event.end}s, durasi: ${duration}s): ${event.description || 'Tidak ada'}\n`;
          } else {
            content += `Dialog (${event.start}s - ${event.end}s, durasi: ${duration}s): "${event.text || 'Tidak ada'}"\n`;
          }
      });
      content += '\n';
    });

    content += '[SEGMEN KLIP VIDEO]\n';
    clipSegments
      .sort((a,b) => parseFloat(a.startTime) - parseFloat(b.startTime))
      .forEach((seg, index) => {
        content += `Klip ${index + 1}: ${seg.startTime}s - ${seg.endTime}s\n`;
    });

    setCanvasOutput(content);
  }, [characters, sceneSettings, clipSegments]);

  useEffect(() => {
    generateFullCanvas();
  }, [generateFullCanvas]);

  const copyCanvasToClipboard = () => {
    navigator.clipboard.writeText(canvasOutput).then(() => {
      setCopyButtonText('Berhasil disalin!');
      setTimeout(() => setCopyButtonText('Salin Canvas'), 2000);
    }).catch(err => {
      console.error('Could not copy text: ', err);
      alert('Gagal menyalin canvas.');
    });
  };

 const handleExportToBatchClick = () => {
    if (isPreparingSegments) return;

    if (clipSegments.length === 0) {
        alert("Silakan buat segmen klip terlebih dahulu.");
        return;
    }

    setIsPreparingSegments(true);

    try {
        const segmentsToExport = clipSegments
        .sort((a,b) => parseFloat(a.startTime) - parseFloat(b.startTime))
        .map(clip => {
            const startTime = parseFloat(clip.startTime);
            const endTime = parseFloat(clip.endTime);
            const duration = calculateDuration(clip.startTime, clip.endTime);

            const visualActions: string[] = [];
            const dialogueLines: string[] = [];
            const speakers: string[] = [];

            characters.forEach(char => {
                char.timeline.forEach(event => {
                    const eventStart = parseFloat(event.start);
                    const eventEnd = parseFloat(event.end);
                    // Check if the event overlaps with the clip's time range
                    if (Math.max(startTime, eventStart) < Math.min(endTime, eventEnd)) {
                        if (event.type === 'action' && event.description) {
                            visualActions.push(`${char.name} ${event.description}`);
                        } else if (event.type === 'dialogue' && (event as DialogueEvent).text) {
                            dialogueLines.push((event as DialogueEvent).text);
                            // Simple speaker detection
                            if (!speakers.includes(char.name)) {
                                speakers.push(char.name);
                            }
                        }
                    }
                });
            });

            // Construct a direct, non-AI prompt
            const scenePrompt = `gaya visual ${sceneSettings.graphicStyle}, pencahayaan ${sceneSettings.lighting}, sudut pandang kamera ${sceneSettings.cameraAngle}, suasana ${sceneSettings.mood}`;
            const actionPrompt = visualActions.join('. ');
            
            // Add duration information at the beginning of the prompt.
            const durationText = duration > 0 ? `Sebuah video berdurasi ${duration.toFixed(1)} detik. ` : '';

            let finalPrompt = '';
            if (actionPrompt) {
                finalPrompt = `${durationText}${actionPrompt}. Ini terjadi dalam sebuah adegan dengan ${scenePrompt}.`;
            } else {
                // If no specific actions, create a general scene prompt
                finalPrompt = `${durationText}Sebuah adegan yang menunjukkan: ${scenePrompt}.`;
            }

            if (sceneSettings.backgroundSound) {
                finalPrompt += ` Terdengar suara latar: ${sceneSettings.backgroundSound}.`;
            }

            const segment: Omit<VideoSegment, 'id' | 'status' | 'videoUrl'> = {
                prompt: finalPrompt.trim().replace(/\s\s+/g, ' '),
                dialogue: dialogueLines.join('\n'),
                speaker: speakers.join(', '), // List all speakers in the segment
                aspectRatio: '16:9',
                mode: 'transition',
            };
            return segment;
        });

        onExportToBatch(segmentsToExport);

    } catch (error) {
        console.error("Error preparing video segments:", error);
        alert(`Gagal mempersiapkan segmen video. ${error instanceof Error ? error.message : 'Unknown error'}. Lihat konsol untuk detail.`);
    } finally {
        setIsPreparingSegments(false);
    }
};


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* --- LEFT: CANVAS/OUTPUT --- */}
      <div className="lg:col-span-1 flex flex-col h-full min-h-[400px] lg:min-h-0">
         <div className="bg-brand-surface rounded-lg border border-brand-primary/20 flex flex-col flex-grow">
            <div className="flex justify-between items-center p-4 border-b border-brand-primary/20">
                 <h2 className="text-lg font-semibold text-brand-text">Canvas Prompt</h2>
                 <button onClick={copyCanvasToClipboard} className="text-sm px-3 py-1 bg-brand-secondary rounded-md hover:bg-brand-primary/20 transition-colors">{copyButtonText}</button>
            </div>
            <textarea
                readOnly
                value={canvasOutput}
                className="w-full h-full bg-brand-bg/50 p-4 text-xs font-mono text-brand-text-muted resize-none focus:outline-none"
                placeholder="Hasil prompt akan muncul di sini..."
            />
         </div>
      </div>
      
      {/* --- RIGHT: SETTINGS --- */}
      <div className="lg:col-span-2 flex flex-col h-full">
        <div className="flex-grow overflow-y-auto pr-2">
            <div className="flex flex-col gap-6 pb-6">
                
                 {/* Story Idea Section */}
                <Accordion title={<h2 className="text-lg font-semibold text-brand-text">Buat Ide Cerita (AI)</h2>} defaultOpen>
                    <div className="flex flex-col gap-4">
                        <textarea
                            placeholder="Tuliskan ide cerita singkat Anda di sini... contoh: petualangan 2 anak menemukan anak kucing di hutan"
                            value={storyIdeaPrompt}
                            onChange={(e) => setStoryIdeaPrompt(e.target.value)}
                            className="w-full bg-brand-bg p-2 rounded-md border border-brand-primary/10 resize-y text-sm"
                            rows={3}
                        />
                        <button
                            onClick={handleGenerateStoryIdea}
                            disabled={isGeneratingStory}
                            className="text-sm px-4 py-2 bg-brand-accent text-black font-bold rounded-md hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isGeneratingStory ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Membuat Cerita...
                                </>
                            ) : (
                                'Buat Cerita dari Ide'
                            )}
                        </button>
                    </div>
                </Accordion>
                
                {/* Characters Section */}
                <Accordion title={<h2 className="text-lg font-semibold text-brand-text">1. Karakter</h2>}>
                  <div className="space-y-4">
                    {characters.map((char, index) => (
                      <div key={char.id} className="bg-brand-bg/50 p-4 rounded-lg border border-brand-secondary">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-brand-text">Karakter {index + 1}</h3>
                          <button onClick={() => removeCharacter(char.id)} className="text-brand-text-muted hover:text-brand-primary transition-colors text-xs">Hapus</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <input type="text" placeholder="Nama" value={char.name} onChange={(e) => updateCharacter(char.id, 'name', e.target.value)} className="bg-brand-bg p-2 rounded-md border border-brand-primary/10" />
                          <input type="text" placeholder="Kebangsaan" value={char.nationality} onChange={(e) => updateCharacter(char.id, 'nationality', e.target.value)} className="bg-brand-bg p-2 rounded-md border border-brand-primary/10" />
                          <textarea placeholder="Ciri Dasar (Traits)" value={char.traits} onChange={(e) => updateCharacter(char.id, 'traits', e.target.value)} className="md:col-span-2 bg-brand-bg p-2 rounded-md border border-brand-primary/10 resize-y" rows={2}></textarea>
                          <textarea placeholder="Penampilan" value={char.appearance} onChange={(e) => updateCharacter(char.id, 'appearance', e.target.value)} className="md:col-span-2 bg-brand-bg p-2 rounded-md border border-brand-primary/10 resize-y" rows={2}></textarea>
                        
                          {/* Voice Settings */}
                          <h4 className="md:col-span-2 text-xs font-semibold uppercase text-brand-text-muted mt-2">Pengaturan Suara</h4>
                           <textarea placeholder="Atau, deskripsikan suara secara natural di sini..." value={char.voice.consistency} onChange={(e) => updateVoiceSetting(char.id, 'consistency', e.target.value)} className="md:col-span-2 bg-brand-bg p-2 rounded-md border border-brand-primary/10 resize-y" rows={2}></textarea>

                          <select value={char.voice.type} onChange={(e) => updateVoiceSetting(char.id, 'type', e.target.value)} className="bg-brand-bg p-2 rounded-md border border-brand-primary/10">
                            {voiceTypes.map(v => <option key={v} value={v}>{v}</option>)}
                            <option value="N/A">N/A (Bukan Manusia)</option>
                          </select>
                          <select value={char.voice.pitch} onChange={(e) => updateVoiceSetting(char.id, 'pitch', e.target.value)} className="bg-brand-bg p-2 rounded-md border border-brand-primary/10">
                            {pitches.map(p => <option key={p} value={p}>{p}</option>)}
                            <option value="N/A">N/A (Bukan Manusia)</option>
                          </select>
                           <select value={char.voice.timbre} onChange={(e) => updateVoiceSetting(char.id, 'timbre', e.target.value)} className="md:col-span-2 bg-brand-bg p-2 rounded-md border border-brand-primary/10">
                            {timbres.map(t => <option key={t} value={t}>{t}</option>)}
                             <option value="N/A">N/A (Bukan Manusia)</option>
                          </select>
                        </div>
                         {/* Timeline Section */}
                        <div className="mt-4 pt-4 border-t border-brand-secondary">
                            <h4 className="text-sm font-semibold uppercase text-brand-text-muted mb-2">Timeline</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {char.timeline.length === 0 && (
                                <p className="text-xs text-brand-text-muted text-center py-4">Belum ada event. Tambahkan aksi atau dialog.</p>
                            )}
                            {char.timeline
                                .sort((a, b) => parseFloat(a.start) - parseFloat(b.start))
                                .map(event => (
                                <div key={event.id} className="bg-brand-bg p-3 rounded-md border border-brand-primary/10">
                                    <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">{event.type}</span>
                                    <button onClick={() => removeTimelineEvent(char.id, event.id)} className="text-brand-text-muted hover:text-red-500 transition-colors p-1 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        placeholder="Mulai (d)" 
                                        value={event.start} 
                                        onChange={(e) => updateTimelineEvent(char.id, event.id, 'start', e.target.value)} 
                                        className="w-full bg-brand-bg/50 border border-brand-primary/10 rounded-md p-2 text-xs" 
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Selesai (d)" 
                                        value={event.end} 
                                        onChange={(e) => updateTimelineEvent(char.id, event.id, 'end', e.target.value)} 
                                        className="w-full bg-brand-bg/50 border border-brand-primary/10 rounded-md p-2 text-xs" 
                                    />
                                    </div>
                                    {event.type === 'action' ? (
                                    <textarea 
                                        placeholder="Deskripsi aksi..." 
                                        value={(event as ActionEvent).description} 
                                        onChange={(e) => updateTimelineEvent(char.id, event.id, 'description', e.target.value)}
                                        rows={2}
                                        className="w-full bg-brand-bg/50 border border-brand-primary/10 rounded-md p-2 text-xs resize-y"
                                    />
                                    ) : (
                                    <textarea 
                                        placeholder="Teks dialog..." 
                                        value={(event as DialogueEvent).text} 
                                        onChange={(e) => updateTimelineEvent(char.id, event.id, 'text', e.target.value)}
                                        rows={2}
                                        className="w-full bg-brand-bg/50 border border-brand-primary/10 rounded-md p-2 text-xs resize-y"
                                    />
                                    )}
                                </div>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-3">
                            <button onClick={() => addTimelineEvent(char.id, 'action')} className="flex-1 text-xs py-2 bg-brand-secondary hover:bg-brand-primary/20 rounded-md transition-colors">
                                + Tambah Aksi
                            </button>
                            <button onClick={() => addTimelineEvent(char.id, 'dialogue')} className="flex-1 text-xs py-2 bg-brand-secondary hover:bg-brand-primary/20 rounded-md transition-colors">
                                + Tambah Dialog
                            </button>
                            </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addCharacter} className="w-full text-sm py-2 bg-brand-secondary hover:bg-brand-primary/20 rounded-md transition-colors">Tambah Karakter</button>
                  </div>
                </Accordion>

                {/* Scene Settings Section */}
                <Accordion title={<h2 className="text-lg font-semibold text-brand-text">2. Pengaturan Suasana (Scene)</h2>}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <input type="text" placeholder="Suasana (Mood)" value={sceneSettings.mood} onChange={(e) => updateSceneSetting('mood', e.target.value)} className="bg-brand-bg p-2 rounded-md border border-brand-primary/10" />
                        <input type="text" placeholder="Suara Latar Belakang" value={sceneSettings.backgroundSound} onChange={(e) => updateSceneSetting('backgroundSound', e.target.value)} className="bg-brand-bg p-2 rounded-md border border-brand-primary/10" />
                        <select value={sceneSettings.cameraAngle} onChange={(e) => updateSceneSetting('cameraAngle', e.target.value)} className="bg-brand-bg p-2 rounded-md border border-brand-primary/10">
                            {cameraAngles.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <select value={sceneSettings.graphicStyle} onChange={(e) => updateSceneSetting('graphicStyle', e.target.value)} className="bg-brand-bg p-2 rounded-md border border-brand-primary/10">
                            {graphicStyles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                         <select value={sceneSettings.lighting} onChange={(e) => updateSceneSetting('lighting', e.target.value)} className="bg-brand-bg p-2 rounded-md border border-brand-primary/10">
                            {lightings.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <button onClick={handleAutoGenerateScene} disabled={isGeneratingScene} className="text-sm px-2 py-2 bg-brand-secondary hover:bg-brand-primary/20 rounded-md transition-colors disabled:opacity-50">
                            {isGeneratingScene ? 'Membuat...' : 'Generate Otomatis'}
                        </button>
                    </div>
                </Accordion>

                 {/* Clip Segments Section */}
                <Accordion title={<h2 className="text-lg font-semibold text-brand-text">3. Segmen Klip</h2>}>
                    <div className="space-y-3">
                        {clipSegments
                          .sort((a,b) => parseFloat(a.startTime) - parseFloat(b.startTime))
                          .map((segment, index) => (
                            <div key={segment.id} className="bg-brand-bg p-3 rounded-md border border-brand-primary/10 flex items-center gap-2">
                                <span className="text-sm font-mono text-brand-text-muted whitespace-nowrap">Klip {index + 1}:</span>
                                <input 
                                    type="text" 
                                    placeholder="Mulai (d)" 
                                    value={segment.startTime} 
                                    onChange={(e) => updateClipSegment(segment.id, 'startTime', e.target.value)} 
                                    className="w-full bg-brand-bg/50 border border-brand-primary/10 rounded-md p-2 text-xs text-center" 
                                />
                                <span className="text-brand-text-muted">-</span>
                                <input 
                                    type="text" 
                                    placeholder="Selesai (d)" 
                                    value={segment.endTime} 
                                    onChange={(e) => updateClipSegment(segment.id, 'endTime', e.target.value)} 
                                    className="w-full bg-brand-bg/50 border border-brand-primary/10 rounded-md p-2 text-xs text-center" 
                                />
                                <button onClick={() => removeClipSegment(segment.id)} className="text-brand-text-muted hover:text-red-500 transition-colors p-1 rounded-full">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                        {clipSegments.length === 0 && (
                             <p className="text-xs text-brand-text-muted text-center py-4">Generate segmen secara otomatis atau tambahkan satu per satu.</p>
                        )}
                        <div className="flex gap-2 mt-2">
                             <button onClick={handleAutoGenerateSegments} className="flex-1 text-sm py-2 bg-brand-accent text-black font-bold rounded-md hover:opacity-90 transition-colors">
                                Generate Segmen Otomatis (8d)
                            </button>
                            <button onClick={addClipSegment} className="flex-1 text-sm py-2 bg-brand-secondary hover:bg-brand-primary/20 rounded-md transition-colors">
                                + Tambah Segmen Manual
                            </button>
                        </div>
                    </div>
                </Accordion>
            </div>
        </div>
        <div className="shrink-0 p-4 bg-brand-surface/80 backdrop-blur-sm border-t border-brand-primary/20">
             <button
                onClick={handleExportToBatchClick}
                disabled={characters.length === 0 || clipSegments.length === 0 || isPreparingSegments}
                className="w-full px-6 py-4 bg-brand-primary text-black font-bold text-lg rounded-md hover:opacity-90 transition-all duration-200 disabled:bg-brand-secondary disabled:text-brand-text-muted/50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 flex items-center justify-center"
            >
              {isPreparingSegments ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mempersiapkan Segmen...
                  </>
              ) : (
                'Siapkan Segmen Video'
              )}
            </button>
        </div>
      </div>
    </div>
  );
};
