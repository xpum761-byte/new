
import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  PromptGeneratorTabProps,
  Character,
  SceneSettings,
  ClipSegment,
  TimelineEvent,
  ActionEvent,
  DialogueEvent
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
          viewBox="0 0 24 24"
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
export const createNewTimelineEvent = (type: 'action' | 'dialogue'): TimelineEvent => ({
  id: crypto.randomUUID(),
  type,
  start: '',
  end: '',
  description: '',
  text: '',
} as ActionEvent | DialogueEvent);

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
const topics = [
    { name: 'Animasi', icon: '🎨' },
    { name: 'Lagu', icon: '🎵' },
    { name: 'Cerita', icon: '📚' },
    { name: 'Hewan', icon: '🐾' },
    { name: 'Petualangan', icon: '⚡️' },
    { name: 'Edukasi', icon: '🎓' },
];

export const PromptGeneratorTab: React.FC<PromptGeneratorTabProps> = ({ 
  onExportToBatch, 
  characters,
  setCharacters,
  sceneSettings,
  setSceneSettings,
  clipSegments,
  setClipSegments,
  apiKey,
  openSettings,
}) => {
  const [canvasOutput, setCanvasOutput] = useState('');
  const [copyButtonText, setCopyButtonText] = useState('Salin Canvas');
  
  // State for new features
  const [numberOfScenes, setNumberOfScenes] = useState('10');
  const [mainTopic, setMainTopic] = useState('Petualangan');
  const [storyIdea, setStoryIdea] = useState('Kisah si Kancil yang bijak menipu buaya');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isEstimatingScenes, setIsEstimatingScenes] = useState(false);


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
  
  // --- AI GENERATION FUNCTIONS ---
  const handleEstimateScenes = async () => {
    if (!apiKey) { alert("Please set your Gemini API key in the settings first."); openSettings(); return; }
    if (!storyIdea) { alert("Please provide a story idea to estimate scenes."); return; }
    setIsEstimatingScenes(true);
    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Berdasarkan ide cerita berikut, perkirakan berapa banyak segmen video berdurasi 8 detik yang dibutuhkan untuk menceritakannya secara efektif. Berikan hanya angkanya saja, tidak lebih.

Cerita: "${storyIdea}"`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        const estimatedScenes = response.text.trim().match(/\d+/); // Extract the number
        if (estimatedScenes && estimatedScenes[0]) {
            setNumberOfScenes(estimatedScenes[0]);
        } else {
            alert("Could not estimate the number of scenes. Please set it manually.");
        }
    } catch (error) {
        console.error("Error estimating scenes:", error);
        alert("Failed to estimate scenes. See console for details.");
    } finally {
        setIsEstimatingScenes(false);
    }
  };

  const handleGenerateStoryIdea = async () => {
    if (!apiKey) { alert("Please set your Gemini API key in the settings first."); openSettings(); return; }
    setIsGeneratingStory(true);
    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Buatkan ide cerita pendek yang menarik, unik, dan imajinatif dengan topik utama "${mainTopic}". Cerita harus cocok untuk dijadikan video pendek. Berikan hanya paragraf ceritanya saja, tanpa judul atau embel-embel lainnya.`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        setStoryIdea(response.text.trim());
    } catch (error) {
        console.error("Error generating story idea:", error);
        alert("Failed to generate story idea. See console for details.");
    } finally {
        setIsGeneratingStory(false);
    }
  };

  const handleGenerateNarrative = async () => {
    if (!apiKey) { alert("Please set your Gemini API key in the settings first."); openSettings(); return; }
    if (!storyIdea) { alert("Please provide a story idea first."); return; }
    setIsGeneratingNarrative(true);
    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Berdasarkan ide cerita berikut, kembangkan menjadi sebuah narasi cerita pendek yang lengkap dan menarik, cocok untuk sebuah video. Buatlah alur yang jelas (awal, tengah, akhir) dan deskriptif.

Ide Cerita: "${storyIdea}"

Narasi Lengkap:`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        setStoryIdea(response.text.trim());
    } catch (error) {
        console.error("Error generating narrative:", error);
        alert("Failed to generate narrative. See console for details.");
    } finally {
        setIsGeneratingNarrative(false);
    }
  };

  const handleGenerateTitle = async () => {
    if (!apiKey) { alert("Please set your Gemini API key in the settings first."); openSettings(); return; }
    if (!storyIdea) { alert("Please provide a story idea first."); return; }
    setIsGeneratingTitle(true);
    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Based on the following story idea, create a short, descriptive, and catchy title.\n\nStory Idea: "${storyIdea}"\n\nTitle:`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        const title = response.text.trim().replace(/"/g, '');
        setStoryIdea(`Judul: ${title}\n\n${storyIdea}`);
    } catch (error) {
        console.error("Error generating title:", error);
        alert("Failed to generate title. See console for details.");
    } finally {
        setIsGeneratingTitle(false);
    }
  };

  const handleGenerateTimelineFromStory = async () => {
    if (!apiKey) { alert("Please set your Gemini API key in the settings first."); openSettings(); return; }
    if (!storyIdea) { alert("Please provide a story idea first."); return; }
    
    setIsGeneratingTimeline(true);
    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const sceneCount = parseInt(numberOfScenes, 10) || 1;
        const totalDuration = sceneCount * 8;

        const prompt = `Anda adalah seorang penulis naskah AI. Tugas Anda adalah mengubah ide cerita menjadi data karakter dan timeline terstruktur dalam format JSON.

IDE CERITA: "${storyIdea}"

TUGAS:
1.  Identifikasi semua karakter utama dalam cerita.
2.  Untuk setiap karakter, tentukan detail berikut:
    a.  **name**: Nama karakter.
    b.  **character_type**: Jenis karakter. Pilih salah satu: 'manusia', 'hewan', 'benda', atau 'lainnya'.
    c.  **appearance**: Deskripsi penampilan fisik. Contoh untuk hewan: "Seekor singa jantan gagah dengan surai lebat." Contoh untuk benda: "Sebuah mobil balap merah mengkilap dengan stiker api."
    d.  **traits**: Sifat-sifat utama karakter (misalnya: "Pemberani, setia, sedikit ceroboh").
    e.  **voice_description**: Deskripsi singkat suaranya. Contoh untuk hewan: "Auman yang dalam dan menggelegar." Contoh untuk benda: "Deru mesin yang bertenaga." Contoh untuk manusia: "Suara wanita yang lembut dan menenangkan."
    f.  **timeline**: Buat daftar peristiwa (aksi atau dialog) untuk karakter ini, sebarkan secara merata dalam durasi total ${totalDuration} detik.
3.  Pastikan outputnya adalah array JSON yang valid.`;

        const schema = {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                character_type: { type: Type.STRING },
                appearance: { type: Type.STRING },
                traits: { type: Type.STRING },
                voice_description: { type: Type.STRING },
                timeline: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      start: { type: Type.STRING },
                      end: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ["type", "start", "end", "content"],
                  },
                },
              },
              required: ["name", "character_type", "appearance", "traits", "voice_description", "timeline"],
            },
        };
        
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        const generatedData = JSON.parse(response.text.trim());

        const newCharacters: Character[] = generatedData.map((charData: any) => {
            const isHuman = charData.character_type === 'manusia';
            const defaultVoice = createNewCharacter().voice;
    
            return {
                id: crypto.randomUUID(),
                name: charData.name || 'Karakter Tanpa Nama',
                nationality: isHuman ? 'Indonesia' : 'N/A',
                traits: charData.traits || '',
                appearance: charData.appearance || '',
                voice: {
                    type: isHuman ? defaultVoice.type : 'N/A',
                    pitch: isHuman ? defaultVoice.pitch : 'N/A',
                    timbre: isHuman ? defaultVoice.timbre : 'N/A',
                    consistency: charData.voice_description || '',
                },
                timeline: (charData.timeline || []).map((event: any): TimelineEvent => ({
                    id: crypto.randomUUID(),
                    type: event.type === 'dialogue' ? 'dialogue' : 'action',
                    start: event.start || '0',
                    end: event.end || '0',
                    description: event.type === 'action' ? event.content : '',
                    text: event.type === 'dialogue' ? event.content : '',
                })),
            };
        });

        if (newCharacters.length === 0) {
            throw new Error("AI tidak dapat mengidentifikasi karakter apa pun dalam ide cerita. Coba buat cerita lebih spesifik.");
        }

        setCharacters(newCharacters);

        const newClipSegments = Array.from({ length: sceneCount }).map((_, i) => ({
            id: crypto.randomUUID(),
            startTime: (i * 8).toString(),
            endTime: ((i + 1) * 8).toString(),
        }));
        setClipSegments(newClipSegments);

    } catch (error) {
        console.error("Error generating timeline:", error);
        const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
        alert(`Gagal membuat timeline dari cerita. ${errorMessage} Lihat konsol untuk detailnya.`);
    } finally {
        setIsGeneratingTimeline(false);
    }
  };

  const handleAutoGenerateScene = async () => {
    if (!apiKey) { alert("Please set your Gemini API key in the settings first."); openSettings(); return; }
    setIsGeneratingScene(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
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
          content += '\n';
      }

      content += `[TIMELINE UNTUK ${char.name.toUpperCase() || `KARAKTER ${index + 1}`}]\n`;
      char.timeline.sort((a,b) => parseFloat(a.start) - parseFloat(b.start)).forEach(event => {
        const start = event.start || "0";
        const end = event.end || "0";
        if (event.type === 'action') {
          content += `(${start}s - ${end}s) AKSI: ${(event as ActionEvent).description}\n`;
        } else {
          content += `(${start}s - ${end}s) DIALOG: "${(event as DialogueEvent).text}"\n`;
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
      let basePrompt = `[INFO KONTEKS UTAMA]\nBerikut adalah informasi untuk menjaga konsistensi di semua klip video.\n\n[PENGATURAN SUASANA]\n`;
      basePrompt += `Gaya visual harus konsisten sebagai: ${sceneSettings.graphicStyle} dengan pencahayaan ${sceneSettings.lighting}.\n`;
      basePrompt += `Suasana umum adalah ${sceneSettings.mood || 'netral'}.\n`;
      basePrompt += `Terdengar suara latar ${sceneSettings.backgroundSound || 'hening'}.\n\n`;

      characters.forEach((char, index) => {
          basePrompt += `[KARAKTER ${index + 1}: ${char.name.toUpperCase() || 'Tanpa Nama'}]\n`;
          
          let description = `${char.appearance || 'Tidak ada penampilan spesifik'}, ${char.traits || 'Tidak ada ciri dasar'}.`;
          if (char.nationality && char.nationality !== 'N/A') {
              description += ` Kebangsaan ${char.nationality}.`;
          }
          basePrompt += `Deskripsi: ${description}\n`;

          // Use the AI-generated voice description if available
          if (char.voice.consistency) {
              basePrompt += `Deskripsi Suara: ${char.voice.consistency}\n\n`;
          } else if (char.voice.type && char.voice.type !== 'N/A') {
             // Fallback for manually created human characters
             basePrompt += `Suara: Karakter ini memiliki suara ${char.voice.type} dengan pitch ${char.voice.pitch} dan timbre ${char.voice.timbre}.\n\n`;
          }
          else {
              basePrompt += `\n`; // Add a blank line for separation if no voice info
          }
      });

      const allEvents = characters.flatMap(char => char.timeline.map(event => ({ ...event, characterName: char.name || `Karakter ${characters.indexOf(char) + 1}` })));
      const finalPrompts = clipSegments.map(segment => {
          const segStart = parseFloat(segment.startTime);
          const segEnd = parseFloat(segment.endTime);
          
          if (isNaN(segStart) || isNaN(segEnd)) return null;

          // Enforce 8-second max duration per prompt
          const duration = segEnd - segStart;
          if (duration <= 0) return null;
          const actualSegEnd = duration > 8 ? segStart + 8 : segEnd;

          const eventsInSegment = allEvents.filter(event => { const evtStart = parseFloat(event.start); return !isNaN(evtStart) && evtStart >= segStart && evtStart < actualSegEnd; }).sort((a, b) => parseFloat(a.start) - parseFloat(b.start));
          
          let sceneDescription = `[ADEGAN UNTUK KLIP INI (Durasi ${segStart}s hingga ${actualSegEnd}s)]\n`;
          sceneDescription += `Sudut pandang kamera utama adalah ${sceneSettings.cameraAngle}.\n`;
          
          if (eventsInSegment.length > 0) {
              eventsInSegment.forEach(event => {
                  if (event.type === 'action') { sceneDescription += `- Pada detik ke-${event.start}, ${event.characterName} melakukan aksi: ${(event as ActionEvent).description}.\n`; } 
                  else { sceneDescription += `- Pada detik ke-${event.start}, ${event.characterName} berkata: "${(event as DialogueEvent).text}".\n`; }
              });
          } else { sceneDescription += `- Tidak ada aksi atau dialog spesifik dalam segmen ini. Tampilkan suasana sesuai konteks.\n`; }
          
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

  // --- RENDER HELPERS ---
  const renderInputField = (label: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void, placeholder = '', type='text') => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-accent focus:outline-none" />
    </div>
  );
  
  const renderTextareaField = (label: string, value: string, onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void, placeholder = '', rows=2) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-accent focus:outline-none resize-y" />
    </div>
  );

  const renderSelectField = (label: string, value: string, onChange: (e: ChangeEvent<HTMLSelectElement>) => void, options: string[]) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-muted mb-1">{label}</label>
        <select value={value} onChange={onChange} className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-accent focus:outline-none">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
  );
  
  const renderAiButton = (text: string, onClick: () => void, isGenerating: boolean, icon: JSX.Element, className: string, generatingText = "Generating...") => (
      <button onClick={onClick} disabled={isGenerating} className={`w-full mt-2 flex items-center justify-center gap-2 font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
        {isGenerating ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {generatingText}
          </>
        ) : (
          <>
            {icon}
            {text}
          </>
        )}
      </button>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* --- LEFT COLUMN: INPUTS --- */}
        <div className="lg:col-span-3 space-y-6 pb-48 md:pb-28">
            
            {/* --- NEW PROMPT SETTINGS --- */}
            <div className="bg-brand-surface p-4 rounded-lg border border-brand-primary/20 space-y-4">
                <h2 className="text-xl font-bold text-brand-text">Pengaturan Prompt</h2>
                
                <div>
                    <label className="block text-sm font-medium text-brand-text-muted mb-1">Jumlah Scene</label>
                    <div className="flex items-center gap-2">
                        <input type='number' value={numberOfScenes} onChange={e => setNumberOfScenes(e.target.value)} placeholder='10' className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-accent focus:outline-none" />
                        <button 
                            onClick={handleEstimateScenes} 
                            disabled={isEstimatingScenes}
                            className="p-2 bg-brand-accent text-black rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
                            aria-label="Perkirakan jumlah scene dengan AI"
                            title="Perkirakan jumlah scene dengan AI"
                        >
                            {isEstimatingScenes ? 
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> :
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            }
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-brand-text-muted mb-2">Pilih Topik Utama</label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {topics.map(topic => (
                            <button 
                                key={topic.name} 
                                onClick={() => setMainTopic(topic.name)}
                                className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors text-xs gap-1 ${mainTopic === topic.name ? 'bg-brand-primary/80 text-black font-bold' : 'bg-brand-bg hover:bg-brand-secondary'}`}
                            >
                                <span className="text-lg">{topic.icon}</span>
                                <span>{topic.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {renderAiButton(
                    "Generate Ide Cerita Acak", 
                    handleGenerateStoryIdea, 
                    isGeneratingStory, 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
                    "bg-green-500 hover:bg-green-400 text-black",
                    "Generating Ide..."
                )}
                <div className="space-y-2">
                    {renderTextareaField('Ide Cerita (atau buat sendiri)', storyIdea, e => setStoryIdea(e.target.value), 'Contoh: McQueen si mobil balap tersesat di hutan ajaib...', 4)}
                    {renderAiButton(
                        "Kembangkan Cerita dengan AI",
                        handleGenerateNarrative,
                        isGeneratingNarrative,
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
                        "bg-blue-500 hover:bg-blue-400 text-white",
                        "Mengembangkan..."
                    )}
                    {renderAiButton(
                        "Buat Judul Deskriptif dengan AI", 
                        handleGenerateTitle, 
                        isGeneratingTitle, 
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
                        "bg-purple-500 hover:bg-purple-400 text-white",
                        "Generating Judul..."
                    )}
                </div>
            </div>

            {/* --- TIMELINE GENERATOR BUTTON --- */}
            {renderAiButton(
                "Generate Timeline & Klip dari Ide Cerita",
                handleGenerateTimelineFromStory,
                isGeneratingTimeline,
                <span className="text-xl">✨</span>,
                "w-full text-base bg-brand-accent hover:bg-yellow-400 text-black py-3",
                "Generating Timeline..."
            )}

            {/* --- CHARACTERS SECTION --- */}
            <Accordion title={<h2 className="text-xl font-bold text-brand-text">1. Karakter</h2>}>
                <div className="space-y-4">
                    {characters.map((char, charIndex) => (
                        <div key={char.id} className="bg-brand-bg/50 p-3 rounded-lg space-y-4">
                            <div className="flex justify-between items-center w-full">
                                <span className="font-semibold truncate">Karakter {charIndex + 1}: {char.name || 'Tanpa Nama'}</span>
                                {characters.length > 1 && <button onClick={() => removeCharacter(char.id)} className="text-brand-text-muted hover:text-brand-primary text-sm z-10 relative font-normal shrink-0 ml-4 transition-colors" aria-label={`Hapus Karakter ${charIndex + 1}`}>Hapus</button>}
                            </div>
                            <div className="space-y-4">
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
                                    {renderInputField('Deskripsi Suara (dari AI)', char.voice.consistency, e => updateVoiceSetting(char.id, 'consistency', e.target.value), 'Deskripsikan konsistensi...')}
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-brand-text-muted mt-4">Aksi & Dialog Berbasis Timestamp</h4>
                                    {char.timeline.map(event => (
                                        <div key={event.id} className="bg-brand-bg/80 p-3 rounded-lg space-y-2">
                                            <div className="flex justify-between items-center"><span className="text-sm font-bold text-brand-accent">{event.type === 'action' ? 'Aksi' : 'Dialog'}</span><button onClick={() => removeTimelineEvent(char.id, event.id)} className="text-brand-text-muted hover:text-brand-primary text-xl font-bold transition-colors">&times;</button></div>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 items-end">
                                                {renderInputField('Mulai (s)', event.start, e => updateTimelineEvent(char.id, event.id, 'start', e.target.value), '', 'number')}
                                                {renderInputField('Akhir (s)', event.end, e => updateTimelineEvent(char.id, event.id, 'end', e.target.value), '', 'number')}
                                                <span className="text-xs text-brand-text-muted pb-2">Durasi: {calculateDuration(event.start, event.end)}s</span>
                                            </div>
                                            {event.type === 'action' ? renderTextareaField('Deskripsi Aksi', (event as ActionEvent).description, e => updateTimelineEvent(char.id, event.id, 'description', e.target.value)) : renderTextareaField('Teks Dialog', (event as DialogueEvent).text, e => updateTimelineEvent(char.id, event.id, 'text', e.target.value))}
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <button onClick={() => addTimelineEvent(char.id, 'action')} className="flex-1 bg-brand-accent/80 hover:bg-brand-accent text-black text-sm font-bold py-2 px-4 rounded-md transition-colors">+ Tambah Aksi</button>
                                        <button onClick={() => addTimelineEvent(char.id, 'dialogue')} className="flex-1 bg-brand-accent/80 hover:bg-brand-accent text-black text-sm font-bold py-2 px-4 rounded-md transition-colors">+ Tambah Dialog</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addCharacter} className="w-full mt-4 bg-brand-secondary hover:bg-brand-surface text-brand-text-muted font-semibold py-2 px-4 rounded-md transition-colors">+ Tambah Karakter</button>
                </div>
            </Accordion>
            
            <Accordion title={<h2 className="text-xl font-bold text-brand-text">2. Pengaturan Suasana</h2>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInputField('Suasana', sceneSettings.mood, e => updateSceneSetting('mood', e.target.value), 'Contoh: Tegang, Romantis, Menyenangkan')}
                    {renderInputField('Suara Latar Belakang', sceneSettings.backgroundSound, e => updateSceneSetting('backgroundSound', e.target.value), 'Contoh: Hujan deras, Musik klasik')}
                    {renderSelectField('Sudut Pandang Kamera', sceneSettings.cameraAngle, e => updateSceneSetting('cameraAngle', e.target.value), cameraAngles)}
                    {renderSelectField('Gaya Grafis', sceneSettings.graphicStyle, e => updateSceneSetting('graphicStyle', e.target.value), graphicStyles)}
                    {renderSelectField('Pencahayaan', sceneSettings.lighting, e => updateSceneSetting('lighting', e.target.value), lightings)}
                </div>
                {renderAiButton("Generate Otomatis", handleAutoGenerateScene, isGeneratingScene, 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
                    "bg-brand-accent/90 hover:bg-brand-accent text-black", "Generating Suasana..."
                )}
            </Accordion>

            <Accordion title={<h2 className="text-xl font-bold text-brand-text">3. Penggabung Klip</h2>} defaultOpen>
                <div className="space-y-3">
                {clipSegments.map((segment, index) => (
                    <div key={segment.id} className="flex items-end gap-2 bg-brand-bg/50 p-3 rounded-lg">
                        <span className="text-brand-text-muted font-mono text-sm pt-1 mr-2">{index + 1}</span>
                        <div className="flex-grow">{renderInputField('Mulai (detik)', segment.startTime, e => updateClipSegment(segment.id, 'startTime', e.target.value), '', 'number')}</div>
                        <div className="flex-grow">{renderInputField('Akhir (detik)', segment.endTime, e => updateClipSegment(segment.id, 'endTime', e.target.value), '', 'number')}</div>
                        
                        {calculateDuration(segment.startTime, segment.endTime) > 8 && (
                            <div className="text-yellow-400 text-xs pb-2 flex items-center gap-1" title="Durasi lebih dari 8 detik. Video yang dihasilkan mungkin akan dipotong.">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.852-1.21 3.488 0l6.233 11.916c.64 1.222-.27 2.735-1.744 2.735H3.768c-1.474 0-2.384-1.513-1.744-2.735L8.257 3.099zM10 6a1 1 0 011 1v4a1 1 0 11-2 0V7a1 1 0 011-1zm1 8a1 1 0 10-2 0 1 1 0 002 0z" clipRule="evenodd" /></svg>
                                <span>&gt;8d</span>
                            </div>
                        )}

                        <button onClick={() => removeClipSegment(segment.id)} className="p-2 text-brand-text-muted hover:text-brand-primary rounded-md hover:bg-brand-secondary/50 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                ))}
                <button onClick={addClipSegment} className="w-full mt-2 bg-brand-accent/80 hover:bg-brand-accent text-black font-bold py-2 px-4 rounded-md transition-colors">+ Tambah Segmen Klip</button>
                </div>
            </Accordion>
        </div>

        {/* --- RIGHT COLUMN: OUTPUT CANVAS --- */}
        <div className="lg:col-span-2 relative">
            <div className="lg:sticky lg:top-8 h-fit">
                <h2 className="text-xl font-bold text-brand-text mb-4">Prompt Canvas</h2>
                <div className="bg-brand-surface rounded-lg shadow-inner h-[70vh] lg:h-[calc(100vh-18rem)] border border-brand-primary/20">
                    <pre className="whitespace-pre-wrap break-words text-sm p-4 overflow-y-auto text-brand-text-muted h-full w-full rounded-lg">{canvasOutput}</pre>
                </div>
            </div>
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="fixed bottom-0 left-0 right-0 bg-brand-surface/80 backdrop-blur-sm border-t border-brand-primary/20 p-4 z-10">
            <div className="container mx-auto flex flex-col md:flex-row justify-end items-center gap-6 px-4">
                <button onClick={handleCopyCanvas} className="w-full md:w-auto px-6 py-2 bg-brand-secondary text-brand-text-muted font-semibold rounded-md hover:bg-brand-surface transition-colors">{copyButtonText}</button>
                <button onClick={handleExportToBatchClick} className="w-full md:w-auto px-8 py-2 bg-brand-primary text-black font-bold rounded-md hover:opacity-90 transition-colors shadow-lg shadow-brand-primary/20">Ekspor ke Batch</button>
            </div>
        </div>
    </div>
  );
};
