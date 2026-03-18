'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAudio } from '../hooks/useAudio';
import { PianoKey } from './PianoKey';
import { Volume2, Music, Loader2, Footprints, Trash2, History, ChevronLeft, ChevronRight, Play, Square, Timer } from 'lucide-react';

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_NOTES: Record<string, string> = { 'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#' };

const WHITE_LABELS = "1234567890qwertyuiopasdfghjklzxcvbnm".split("");
const BLACK_LABELS: Record<string, string> = {
    "1": "!", "2": "@", "4": "#", "5": "$", "6": "%", 
    "8": "*", "9": "(", "q": "Q", "w": "W", "e": "E",
    "r": "R", "t": "T", "y": "Y", "i": "I", "o": "O", "p": "P",
    "a": "A", "s": "S", "d": "D", "f": "F", "g": "G", "h": "H",
    "j": "J", "k": "K", "l": "L", "z": "Z", "x": "X", "c": "C", "v": "V", "b": "B", "n": "N"
};

const generatePianoKeys = () => {
    const whiteKeys = [];
    const blackKeys = [];
    let whiteIdx = 0;

    for (let oct = 2; oct <= 6; oct++) {
        WHITE_NOTES.forEach(note => {
            const label = WHITE_LABELS[whiteIdx] || "";
            whiteKeys.push({ note, octave: oct, idx: whiteIdx, label });
            if (BLACK_NOTES[note]) {
                const blackLabel = BLACK_LABELS[label] || "";
                blackKeys.push({ note: BLACK_NOTES[note], octave: oct, pos: whiteIdx + 1, label: blackLabel });
            }
            whiteIdx++;
        });
    }
    whiteKeys.push({ note: 'C', octave: 7, idx: whiteIdx, label: WHITE_LABELS[whiteIdx] || "m" });
    return { whiteKeys, blackKeys };
};

const { whiteKeys, blackKeys } = generatePianoKeys();

const KEYBOARD_TO_NOTE: Record<string, { note: string, octave: number }> = {};
whiteKeys.forEach(k => { if (k.label) KEYBOARD_TO_NOTE[k.label] = { note: k.note, octave: k.octave }; });
blackKeys.forEach(k => { if (k.label) KEYBOARD_TO_NOTE[k.label] = { note: k.note, octave: k.octave }; });

export const Piano = () => {
    const { playNote, stopNote, volume, setVolume, isLoaded, sustain, toggleSustain, transpose, setTranspose, bpm, setBpm, isMetroPlaying, toggleMetronome } = useAudio();
    const [heldNotes, setHeldNotes] = useState<Set<string>>(new Set());
    const [noteHistory, setNoteHistory] = useState<string[]>([]);
    const historyEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [noteHistory]);

    const handlePlay = useCallback((noteName: string, octave: number) => {
        const fullNote = `${noteName}${octave}`;
        playNote(fullNote);
        setHeldNotes(prev => new Set(prev).add(fullNote));
        setNoteHistory(prev => [...prev, fullNote].slice(-50));
    }, [playNote]);

    const handleStop = useCallback((noteName: string, octave: number) => {
        const fullNote = `${noteName}${octave}`;
        stopNote(fullNote);
        setHeldNotes(prev => {
            const next = new Set(prev);
            next.delete(fullNote);
            return next;
        });
    }, [stopNote]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            if (e.code === 'Space') {
                e.preventDefault();
                toggleSustain();
                return;
            }

            let keyToPlay = e.key;
            
            // Check if uppercase key has no mapping, then fallback to lowercase
            if (e.shiftKey && !KEYBOARD_TO_NOTE[e.key]) {
                keyToPlay = e.key.toLowerCase();
            }

            const data = KEYBOARD_TO_NOTE[keyToPlay];
            if (data) handlePlay(data.note, data.octave);
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') return;
            
            let keyToStop = e.key;
            // Apply same fallback logic on KeyUp to properly stop the note
            if (e.shiftKey && !KEYBOARD_TO_NOTE[e.key]) {
                keyToStop = e.key.toLowerCase();
            } else if (!e.shiftKey && !KEYBOARD_TO_NOTE[e.key]) {
                // Also handle case where Shift was released before the key itself
                // We check if the lowercase version exists in our map
                const lowercaseKey = e.key.toLowerCase();
                if (KEYBOARD_TO_NOTE[lowercaseKey]) keyToStop = lowercaseKey;
            }

            const data = KEYBOARD_TO_NOTE[keyToStop];
            if (data) handleStop(data.note, data.octave);
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
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Music className="w-3 h-3 text-[#B5B5B5]" />
                        <span className="text-[10px] text-white uppercase tracking-[0.2em] font-black">Classic Grand Piano</span>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 px-4 py-1 rounded-full border border-white/5">
                        <span className="text-[7px] text-[#595959] uppercase tracking-widest font-black">Transpose</span>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setTranspose(Math.max(-10, transpose - 1))} className="p-1 text-[#B5B5B5] hover:text-white transition-colors">
                                <span className="text-[12px] leading-none">‹</span>
                            </button>
                            <span className="text-[10px] font-black text-white w-4 text-center">{transpose > 0 ? `+${transpose}` : transpose}</span>
                            <button onClick={() => setTranspose(Math.min(10, transpose + 1))} className="p-1 text-[#B5B5B5] hover:text-white transition-colors">
                                <span className="text-[12px] leading-none">›</span>
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={toggleSustain}
                        className={`
                            flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300
                            ${sustain 
                                ? 'bg-white/10 border-[#B5B5B5] text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                : 'bg-transparent border-white/5 text-[#595959] grayscale'}
                        `}
                    >
                        <Footprints className={`w-3 h-3 ${sustain ? 'text-[#B5B5B5]' : ''}`} />
                        <span className="text-[8px] uppercase tracking-[0.2em] font-bold">
                            Sustain {sustain ? 'ON' : 'OFF'}
                        </span>
                    </button>
                </div>

                <div className="flex items-center gap-4 w-32">
                    <Volume2 className="w-3 h-3 text-[#B5B5B5]" />
                    <input 
                        type="range" min="-40" max="0" value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#B5B5B5]"
                    />
                </div>
            </div>

            {/* Note History Display */}
            <div className="bg-black/20 h-12 border-b border-white/5 flex items-center px-6 justify-between overflow-hidden">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 flex-1 scroll-smooth">
                    <History className="w-3 h-3 text-[#595959] flex-shrink-0" />
                    {noteHistory.length === 0 ? (
                        <span className="text-[8px] text-[#595959] uppercase tracking-[0.3em] font-bold italic">Start playing...</span>
                    ) : (
                        noteHistory.map((note, idx) => (
                            <span 
                                key={idx} 
                                className={`
                                    text-[10px] font-black tracking-tighter transition-all duration-300 flex-shrink-0
                                    ${idx === noteHistory.length - 1 ? 'text-white scale-125 mx-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-[#595959]'}
                                `}
                            >
                                {note}
                            </span>
                        ))
                    )}
                    <div ref={historyEndRef} />
                </div>
                
                {noteHistory.length > 0 && (
                    <button 
                        onClick={() => setNoteHistory([])}
                        className="ml-4 p-2 text-[#595959] hover:text-white transition-colors"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* PIANO BOARD */}
            <div className="relative flex-1 w-full bg-[#111111] flex flex-col p-2">
                {!isLoaded && (
                    <div className="absolute inset-0 bg-black/60 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-[#B5B5B5] animate-spin mb-4" />
                        <span className="text-[10px] text-[#B5B5B5] uppercase tracking-[0.4em] font-bold">Loading Samples...</span>
                    </div>
                )}
                
                <div className="relative w-full h-full flex items-start">
                    {whiteKeys.map((k) => (
                        <PianoKey
                            key={`${k.note}${k.octave}`}
                            note={k.note}
                            active={heldNotes.has(`${k.note}${k.octave}`)}
                            onPlay={() => handlePlay(k.note, k.octave)}
                            onStop={() => handleStop(k.note, k.octave)}
                            label={k.label}
                        />
                    ))}

                    {blackKeys.map((k) => (
                        <div key={`${k.note}${k.octave}`} style={{ '--black-key-pos': (k.pos / 36) * 100 } as any}>
                            <PianoKey
                                note={k.note}
                                isBlack
                                active={heldNotes.has(`${k.note}${k.octave}`)}
                                onPlay={() => handlePlay(k.note, k.octave)}
                                onStop={() => handleStop(k.note, k.octave)}
                                label={k.label}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};
