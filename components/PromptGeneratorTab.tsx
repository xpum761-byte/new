

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
const topics = [
    { name: 'Animasi', icon: '🎨' },
    { name: 'Lagu', icon: '🎵' },
    { name: 'Cerita', icon: '📚' },
    { name: 'Hewan', icon: '🐾' },
    { name: 'Petualangan', icon: '⚡️' },
    { name: 'Edukasi', icon: '🎓' },
];

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
  
  // State for new features
  const [numberOfScenes, setNumberOfScenes] = useState('10');
  const [mainTopic, setMainTopic] = useState('Petualangan');
  const [storyIdea, setStoryIdea] = useState('Kisah si Kancil yang bijak menipu buaya');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isEstimatingScenes, setIsEstimatingScenes] = useState(false);
  const [isPreparingSegments, setIsPreparingSegments] = useState(false);


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
    if (!storyIdea) { alert("Please provide a story idea to estimate scenes."); return; }
    if (!apiKey) { alert("Please set your API Key in the settings."); return; }
    setIsEstimatingScenes(true);
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
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

  const handleGenerateNarrative = async () => {
    if (!storyIdea) { alert("Please provide a story idea first."); return; }
    if (!apiKey) { alert("Please set your API Key in the settings."); return; }
    setIsGeneratingNarrative(true);
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
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
    if (!storyIdea) { alert("Please provide a story idea first."); return; }
    if (!apiKey) { alert("Please set your API Key in the settings."); return; }
    setIsGeneratingTitle(true);
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const prompt = `Berdasarkan ide cerita berikut, buatlah sebuah judul yang singkat, deskriptif, dan menarik.\n\nIde Cerita: "${storyIdea}"\n\nJudul:`;
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
    if (!storyIdea) { alert("Please provide a story idea first."); return; }
    if (!apiKey) { alert("Please set your API Key in the settings."); return; }
    
    setIsGeneratingTimeline(true);
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const sceneCount = parseInt(numberOfScenes, 10) || 1;
        const totalDuration = sceneCount * 8;

        const prompt = `Anda adalah seorang sutradara dan penulis naskah AI. Tugas Anda adalah mengubah ide cerita menjadi data karakter dan timeline yang terstruktur secara KRONOLOGIS dan BERURUTAN dalam format JSON, dibagi menjadi segmen-segmen berdurasi 8 detik.

GAYA/GENRE CERITA (berdasarkan topik utama): "${mainTopic}"

IDE CERITA: "${storyIdea}"
JUMLAH SEGMEN (KLIP): ${sceneCount}
DURASI TOTAL: ${totalDuration} detik

TUGAS:
1.  **Identifikasi Karakter**: Identifikasi semua karakter utama. Untuk setiap karakter, berikan detail berikut:
    a.  **name**: Nama karakter.
    b.  **character_type**: Jenis karakter. Pilih dari: 'manusia', 'hewan', 'benda', atau 'lainnya'.
    c.  **appearance**: Deskripsi penampilan fisik yang detail.
    d.  **traits**: Sifat-sifat utama karakter.
    e.  **voice_description**: Deskripsi singkat suaranya.
2.  **Buat Alur Cerita Berurutan**: Bagi keseluruhan cerita menjadi ${sceneCount} adegan/segmen yang berurutan. Setiap segmen merepresentasikan durasi waktu 8 detik.
3.  **Buat Timeline per Karakter**: Untuk setiap karakter, buat daftar timeline (aksi atau dialog) yang terjadi di dalam setiap segmen. Pastikan timestamp 'start' dan 'end' untuk setiap event berada dalam rentang 8 detik segmen tersebut (misalnya, segmen 1: 0-8s, segmen 2: 8-16s, dst.). Kejadian harus terjadi secara kronologis.
4.  **Pastikan Konten Timeline**:
    a.  Untuk event tipe 'action', 'content' harus berisi deskripsi aksi.
    b.  Untuk event tipe 'dialogue', 'content' harus berisi teks dialog.
5.  **Output JSON**: Pastikan outputnya adalah array JSON yang valid sesuai skema yang diberikan. Seluruh cerita harus terwakili dalam timeline yang dibuat.`;


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
    clipSegments.forEach((seg, index) => {
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

 const handleExportToBatchClick = async () => {
    if (isPreparingSegments) return;
    if (!apiKey) { alert("Please set your API Key in the settings."); return; }

    if (clipSegments.length === 0) {
        alert("Silakan tambahkan segmen klip terlebih dahulu.");
        return;
    }

    setIsPreparingSegments(true);
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });

        const segmentPromises = clipSegments.map(async (clip) => {
            const startTime = parseFloat(clip.startTime);
            const endTime = parseFloat(clip.endTime);

            let visualActions: string[] = [];
            let dialogueLines: string[] = [];

            characters.forEach(char => {
                char.timeline.forEach(event => {
                    const eventStart = parseFloat(event.start);
                    const eventEnd = parseFloat(event.end);
                    if (Math.max(startTime, eventStart) < Math.min(endTime, eventEnd)) {
                        if (event.type === 'action' && event.description) {
                            visualActions.push(`${char.name} ${event.description}.`);
                        } else if (event.type === 'dialogue' && (event as DialogueEvent).text) {
                            dialogueLines.push(`${char.name}: "${(event as DialogueEvent).text}"`);
                        }
                    }
                });
            });

            const sceneDescription = `Gaya visual: ${sceneSettings.graphicStyle}. Pencahayaan: ${sceneSettings.lighting}. Sudut pandang kamera: ${sceneSettings.cameraAngle}. Suasana: ${sceneSettings.mood}.`;
            const actionDescription = visualActions.join(' ');
            const dialogueContext = dialogueLines.join(' ');

            const directorPrompt = `Anda adalah seorang sutradara video AI. Tugas Anda adalah menulis satu prompt visual yang sinematik, deskriptif, dan koheren untuk segmen video berdurasi 8 detik. HANYA FOKUS PADA VISUAL. Jangan mendeskripsikan suara atau dialog.
Berdasarkan konteks berikut, buatlah prompt visual yang menarik.

**Konteks:**
*   **Pengaturan Adegan:** ${sceneDescription}
*   **Aksi Karakter:** ${actionDescription || 'Tidak ada aksi spesifik, fokus pada suasana.'}
*   **Konteks Dialog (sebagai referensi untuk ekspresi/mood visual, jangan dimasukkan ke dalam prompt):** ${dialogueContext || 'Tidak ada'}

Tulis HANYA prompt visualnya saja.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: directorPrompt,
            });

            const finalPrompt = response.text.trim();
            const finalDialogue = dialogueLines.join('\n');

            const segmentData: Omit<VideoSegment, 'id' | 'status' | 'videoUrl'> = {
                prompt: finalPrompt,
                dialogue: finalDialogue,
                aspectRatio: '16:9',
                mode: 'transition',
            };
            return segmentData;
        });

        const resolvedSegments = await Promise.all(segmentPromises);
        const validSegments = resolvedSegments.filter((segment): segment is Omit<VideoSegment, 'id' | 'status' | 'videoUrl'> => segment !== null);

        if (validSegments.length === 0 && clipSegments.length > 0) {
            alert("Tidak ada aksi atau informasi yang cukup ditemukan dalam segmen waktu yang ditentukan untuk menghasilkan prompt. Pastikan timeline karakter Anda sudah terisi dengan aksi atau suasana adegan sudah diatur.");
            return;
        }

        onExportToBatch(validSegments);

    } catch (error) {
        console.error("Error preparing video segments:", error);
        alert(`Gagal mempersiapkan segmen video. ${error instanceof Error ? error.message : 'Unknown error'}. Lihat konsol untuk detail.`);
    } finally {
        setIsPreparingSegments(false);
    }
};


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* --- LEFT & MIDDLE: SETTINGS --- */}
      <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 pb-16">
        
        {/* Story Idea Section */}
        <div className="bg-brand-surface p-4 rounded-lg border border-brand-primary/20">
          <h2 className="text-lg font-semibold text-brand-text mb-3">1. Ide Cerita</h2>
          <div className="flex gap-2 mb-2 flex-wrap">
              {topics.map(topic => (
                  <button key={topic.name} onClick={() => setMainTopic(topic.name)} className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-2 ${mainTopic === topic.name ? 'bg-brand-primary text-black font-semibold' : 'bg-brand-bg hover:bg-brand-secondary'}`}>
                      <span>{topic.icon}</span> {topic.name}
                  </button>
              ))}
          </div>
          <textarea
            value={storyIdea}
            onChange={(e) => setStoryIdea(e.target.value)}
            placeholder="Tuliskan ide cerita singkat di sini..."
            rows={4}
            className="w-full bg-brand-bg/50 border border-brand-primary/20 rounded-md p-2 text-sm text-brand-text focus:ring-1 focus:ring-brand-accent focus:outline-none resize-y"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <button onClick={handleGenerateNarrative} disabled={isGeneratingNarrative} className="text-xs px-2 py-2 bg-brand-secondary hover:bg-brand-primary/20 rounded-md transition-colors disabled:opacity-50">
              {isGeneratingNarrative ? 'Membuat...' : 'Kembangkan Narasi'}
            </button>
             <button onClick={handleGenerateTitle} disabled={isGeneratingTitle} className="text-xs px-2 py-2 bg-brand-secondary hover:bg-brand-primary/20 rounded-md transition-colors disabled:opacity-50">
                {isGeneratingTitle ? 'Membuat...' : 'Buat Judul'}
            </button>
            <div className="flex items-center col-span-2 sm:col-span-2 bg-brand-secondary rounded-md">
                 <input
                    type="number"
                    value={numberOfScenes}
                    onChange={e => setNumberOfScenes(e.target.value)}
                    className="w-full bg-transparent p-2 text-xs text-center appearance-none"
                    placeholder="Jumlah"
                />
                 <label className="text-xs pr-2 text-brand-text-muted whitespace-nowrap">Klip (8s)</label>
                <button onClick={handleEstimateScenes} disabled={isEstimatingScenes} className="text-xs px-2 py-2 h-full bg-brand-secondary/50 hover:bg-brand-primary/20 rounded-r-md transition-colors disabled:opacity-50">
                    {isEstimatingScenes ? '...' : 'Auto'}
                </button>
            </div>
           
          </div>
          <button onClick={handleGenerateTimelineFromStory} disabled={isGeneratingTimeline} className="w-full mt-3 px-4 py-3 bg-brand-accent text-black font-bold rounded-md hover:opacity-90 transition-colors disabled:opacity-50">
            {isGeneratingTimeline ? 'Sedang Membuat Timeline...' : 'Generate Timeline & Karakter dari Ide Cerita'}
          </button>
        </div>

        {/* Characters Section */}
        <Accordion title={<h2 className="text-lg font-semibold text-brand-text">2. Karakter</h2>} defaultOpen>
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
        <Accordion title={<h2 className="text-lg font-semibold text-brand-text">3. Pengaturan Suasana (Scene)</h2>} defaultOpen>
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

        <button
            onClick={handleExportToBatchClick}
            disabled={characters.length === 0 || clipSegments.length === 0 || isPreparingSegments}
            className="w-full mt-4 px-6 py-4 bg-brand-primary text-black font-bold text-lg rounded-md hover:opacity-90 transition-all duration-200 disabled:bg-brand-secondary disabled:text-brand-text-muted/50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20 flex items-center justify-center"
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
      
      {/* --- RIGHT: CANVAS/OUTPUT --- */}
      <div className="hidden lg:flex flex-col h-full">
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
    </div>
  );
};