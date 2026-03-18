'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAudio, InstrumentType } from '../hooks/useAudio';
import { PianoKey } from './PianoKey';
import { Volume2, Music, Loader2, Footprints, Trash2, History, ChevronLeft, ChevronRight, Play, Square, Timer, Waves } from 'lucide-react';

const CUSTOM_KEY_MAP: Record<string, string> = {
    // Octave 2
    "1": "A1", "!": "A#1", "2": "B1", "@": "C2", "3": "C#2", "4": "D2", "$": "D#2", "5": "E2", "%": "F2", "6": "F#2", "^": "G2", "7": "G#2",
    // Octave 3
    "8": "A2", "*": "A#2", "9": "B2", "(": "C3", "0": "C#3", "q": "D3", "Q": "D#3", "w": "E3", "W": "F3", "e": "F#3", "E": "G3", "r": "G#3",
    // Octave 4
    "t": "A3", "T": "A#3", "y": "B3", "Y": "C4", "u": "C#4", "i": "D4", "I": "D#4", "o": "E4", "O": "F4", "p": "F#4", "P": "G4", "a": "G#4",
    // Octave 5
    "s": "A4", "S": "A#4", "d": "B4", "D": "C5", "f": "C#5", "g": "D5", "G": "D#5", "h": "E5", "H": "F5", "j": "F#5", "J": "G5", "k": "G#5",
    // Octave 6
    "l": "A5", "L": "A#5", "z": "B5", "Z": "C6", "x": "C#6", "c": "D6", "C": "D#6", "v": "E6", "V": "F6", "b": "F#6", "B": "G6", "n": "G#6",
    // Octave 7
    "m": "A6"
};

const KEY_TO_PHYSICAL_NOTE: Record<string, string> = {
    "1": "C2", "!": "C#2", "2": "D2", "@": "D#2", "3": "E2", "4": "F2", "$": "F#2", "5": "G2", "%": "G#2", "6": "A2", "^": "A#2", "7": "B2",
    "8": "C3", "*": "C#3", "9": "D3", "(": "D#3", "0": "E3", "q": "F3", "Q": "F#3", "w": "G3", "W": "G#3", "e": "A3", "E": "A#3", "r": "B3",
    "t": "C4", "T": "C#4", "y": "D4", "Y": "D#4", "u": "E4", "i": "F4", "I": "F#4", "o": "G4", "O": "G#4", "p": "A4", "P": "A#4", "a": "B4",
    "s": "C5", "S": "C#5", "d": "D5", "D": "D#5", "f": "E5", "g": "F5", "G": "F#5", "h": "G5", "H": "G#5", "j": "A5", "J": "A#5", "k": "B5",
    "l": "C6", "L": "C#6", "z": "D6", "Z": "D#6", "x": "E6", "c": "F6", "C": "F#6", "v": "G6", "V": "G#6", "b": "A6", "B": "A#6", "n": "B6",
    "m": "C7"
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const generatePianoKeys = () => {
    const whiteKeys: any[] = [];
    const blackKeys: any[] = [];
    let whiteIdx = 0;
    const allNotes = [];
    
    // Physical range: C2 to C7 (61 keys)
    for (let oct = 2; oct <= 6; oct++) {
        NOTE_NAMES.forEach(note => allNotes.push({ note, octave: oct }));
    }
    allNotes.push({ note: 'C', octave: 7 });

    allNotes.forEach(k => {
        const fullNote = `${k.note}${k.octave}`;
        const isBlack = k.note.includes('#');
        
        // Find label by checking which label is mapped to trigger the corresponding audio note
        // In our new scheme, the labels are correctly aligned to the physical keys.
        const labels = Object.keys(CUSTOM_KEY_MAP).filter(key => {
            // We find the audio note for this physical position
            const noteIndex = NOTE_NAMES.indexOf(k.note);
            // Calculate audio note: physical - 3 semitones
            let audioNote;
            let audioOctave = k.octave;
            let audioNoteIndex = noteIndex - 3;
            if (audioNoteIndex < 0) {
                audioNoteIndex += 12;
                audioOctave -= 1;
            }
            audioNote = `${NOTE_NAMES[audioNoteIndex]}${audioOctave}`;
            return CUSTOM_KEY_MAP[key] === audioNote;
        });

        const label = labels.join(" ");
        if (isBlack) {
            blackKeys.push({ ...k, fullNote, label, pos: whiteIdx });
        } else {
            whiteKeys.push({ ...k, fullNote, label, idx: whiteIdx });
            whiteIdx++;
        }
    });
    return { whiteKeys, blackKeys, totalWhite: whiteIdx };
};

const { whiteKeys, blackKeys, totalWhite } = generatePianoKeys();

export const Piano = () => {
    const { playNote, stopNote, volume, setVolume, isLoaded, sustain, toggleSustain, transpose, setTranspose, bpm, setBpm, isMetroPlaying, toggleMetronome, instrumentType, setInstrumentType } = useAudio();
    const [heldNotes, setHeldNotes] = useState<Set<string>>(new Set());
    const [noteHistory, setNoteHistory] = useState<string[]>([]);
    const historyEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [noteHistory]);

    const handlePlay = useCallback((audioNote: string, physicalNote: string) => {
        playNote(audioNote);
        setHeldNotes(prev => new Set(prev).add(physicalNote));
        setNoteHistory(prev => [...prev, audioNote].slice(-50));
    }, [playNote]);

    const handleStop = useCallback((audioNote: string, physicalNote: string) => {
        stopNote(audioNote);
        setHeldNotes(prev => {
            const next = new Set(prev);
            next.delete(physicalNote);
            return next;
        });
    }, [stopNote]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            if (e.code === 'Space') { e.preventDefault(); toggleSustain(); return; }
            
            let key = e.key;
            if (!e.shiftKey && key.length === 1 && /[a-zA-Z]/.test(key)) {
                key = key.toLowerCase();
            }
            if (e.shiftKey && !CUSTOM_KEY_MAP[key]) {
                key = key.toLowerCase();
            }

            const audioNote = CUSTOM_KEY_MAP[key];
            const physicalNote = KEY_TO_PHYSICAL_NOTE[key];
            if (audioNote && physicalNote) handlePlay(audioNote, physicalNote);
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') return;
            
            let key = e.key;
            if (!e.shiftKey && key.length === 1 && /[a-zA-Z]/.test(key)) {
                key = key.toLowerCase();
            }
            if (e.shiftKey && !CUSTOM_KEY_MAP[key]) {
                key = key.toLowerCase();
            } else if (!e.shiftKey && !CUSTOM_KEY_MAP[key]) {
                const lowercaseKey = key.toLowerCase();
                if (CUSTOM_KEY_MAP[lowercaseKey]) key = lowercaseKey;
            }

            const audioNote = CUSTOM_KEY_MAP[key];
            const physicalNote = KEY_TO_PHYSICAL_NOTE[key];
            if (audioNote && physicalNote) handleStop(audioNote, physicalNote);
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [handlePlay, handleStop, toggleSustain]);

    return (
        <div className="flex flex-col w-full h-full overflow-hidden">
            {/* Header Controls */}
            <div className="flex items-center justify-between px-6 py-2 bg-black/40 border-b border-white/5 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                        <Waves className="w-4 h-4 text-[#B5B5B5]" />
                        <select 
                            value={instrumentType}
                            onChange={(e) => setInstrumentType(e.target.value as InstrumentType)}
                            className="bg-transparent text-[10px] text-white focus:outline-none font-black uppercase tracking-widest cursor-pointer"
                        >
                            <option value="classic">Classic Piano</option>
                            <option value="fat">Fat Synth</option>
                            <option value="metal">Metal Synth</option>
                        </select>
                    </div>

                    {/* Metronome Control with Arrows */}
                    <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                        <button onClick={toggleMetronome} className={`p-1.5 rounded-md transition-all ${isMetroPlaying ? 'bg-white/20 text-white' : 'text-[#595959]'}`}>
                            {isMetroPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                        </button>
                        <div className="flex items-center gap-3">
                            <Timer className={`w-4 h-4 ${isMetroPlaying ? 'text-white animate-pulse' : 'text-[#595959]'}`} />
                            <div className="flex items-center gap-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                <button onClick={() => setBpm(Math.max(40, bpm - 1))} className="text-[#B5B5B5] hover:text-white leading-none px-1">‹</button>
                                <span className="text-[10px] font-black text-white w-7 text-center">{bpm}</span>
                                <button onClick={() => setBpm(Math.min(240, bpm + 1))} className="text-[#B5B5B5] hover:text-white leading-none px-1">›</button>
                            </div>
                            <span className="text-[10px] text-[#595959] font-black uppercase tracking-tighter">BPM</span>
                        </div>
                    </div>

                    {/* Transpose Control */}
                    <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                        <span className="text-[10px] text-[#595959] uppercase tracking-widest font-black">Key</span>
                        <div className="flex items-center gap-2 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                            <button onClick={() => setTranspose(Math.max(-10, transpose - 1))} className="text-[#B5B5B5] hover:text-white px-1">‹</button>
                            <span className="text-[10px] font-black text-white w-4 text-center">{transpose > 0 ? `+${transpose}` : transpose}</span>
                            <button onClick={() => setTranspose(Math.min(10, transpose + 1))} className="text-[#B5B5B5] hover:text-white px-1">›</button>
                        </div>
                    </div>

                    <button onClick={toggleSustain} className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${sustain ? 'bg-white/10 border-[#B5B5B5] text-white shadow-lg' : 'bg-transparent border-white/5 text-[#595959]'}`}>
                        <Footprints className="w-4 h-4" /><span className="text-[8px] uppercase tracking-[0.2em] font-bold">Sustain</span>
                    </button>
                </div>

                <div className="flex items-center gap-4 w-32 ml-4">
                    <Volume2 className="w-4 h-4 text-[#B5B5B5]" /><input type="range" min="-40" max="6" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#B5B5B5]" />
                </div>
            </div>

            {/* Note History */}
            <div className="bg-black/20 h-10 border-b border-white/5 flex items-center px-6 justify-between overflow-hidden">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 flex-1 scroll-smooth">
                    <History className="w-3 h-3 text-[#595959] flex-shrink-0" />
                    {noteHistory.length === 0 ? <span className="text-[8px] text-[#595959] uppercase tracking-[0.3em] font-bold italic">Ready...</span> : 
                        noteHistory.map((note, idx) => <span key={idx} className={`text-[10px] font-black transition-all ${idx === noteHistory.length - 1 ? 'text-white scale-125 mx-1' : 'text-[#595959]'}`}>{note}</span>)}
                    <div ref={historyEndRef} />
                </div>
                {noteHistory.length > 0 && <button onClick={() => setNoteHistory([])} className="text-[#595959] hover:text-white"><Trash2 className="w-3 h-3" /></button>}
            </div>

            {/* PIANO BOARD */}
            <div className="relative flex-1 w-full bg-[#111111] flex flex-col p-2">
                {!isLoaded && <div className="absolute inset-0 bg-black/60 z-50 flex flex-col items-center justify-center backdrop-blur-sm"><Loader2 className="w-8 h-8 text-[#B5B5B5] animate-spin mb-4" /><span className="text-[10px] text-[#B5B5B5] uppercase tracking-[0.4em] font-bold">Loading Samples...</span></div>}
                <div className="relative w-full h-full flex items-start">
                    {whiteKeys.map((k) => (
                        <PianoKey key={k.fullNote} note={k.note} active={heldNotes.has(k.fullNote)} onPlay={() => handlePlay(CUSTOM_KEY_MAP[k.label] || k.fullNote, k.fullNote)} onStop={() => handleStop(CUSTOM_KEY_MAP[k.label] || k.fullNote, k.fullNote)} label={k.label} />
                    ))}
                    {blackKeys.map((k) => (
                        <div key={k.fullNote} style={{ '--black-key-pos': (k.pos / totalWhite) * 100 } as any}>
                            <PianoKey note={k.note} isBlack active={heldNotes.has(k.fullNote)} onPlay={() => handlePlay(CUSTOM_KEY_MAP[k.label] || k.fullNote, k.fullNote)} onStop={() => handleStop(CUSTOM_KEY_MAP[k.label] || k.fullNote, k.fullNote)} label={k.label} />
                        </div>
                    ))}
                </div>
            </div>
            <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};
