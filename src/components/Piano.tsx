'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAudio } from '../hooks/useAudio';
import { PianoKey } from './PianoKey';
import { Volume2, Music, Loader2, Footprints } from 'lucide-react';

const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const BLACK_NOTES: Record<string, string> = { 'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#' };

const WHITE_LABELS = "1234567890qwertyuiopasdfghjklzxcvbnm".split("");
const BLACK_LABELS: Record<string, string> = {
    "1": "!", "2": "@", "4": "#", "5": "$", "6": "%", 
    "8": "*", "9": "(", "q": "Q", "w": "W", "e": "E",
    "t": "T", "y": "Y", "i": "I", "o": "O", "p": "P",
    "a": "A", "s": "S", "f": "F", "g": "G", "h": "H",
    "k": "K", "l": "L", "z": "Z", "x": "X", "c": "C"
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
    const { playNote, stopNote, volume, setVolume, isLoaded, sustain, toggleSustain } = useAudio();
    const [heldNotes, setHeldNotes] = useState<Set<string>>(new Set());

    const handlePlay = useCallback((noteName: string, octave: number) => {
        const fullNote = `${noteName}${octave}`;
        playNote(fullNote);
        setHeldNotes(prev => new Set(prev).add(fullNote));
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
            const data = KEYBOARD_TO_NOTE[e.key];
            if (data) handlePlay(data.note, data.octave);
        };
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') return;
            const data = KEYBOARD_TO_NOTE[e.key];
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
            <div className="flex items-center justify-between px-6 py-2 bg-black/40 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Music className="w-3 h-3 text-[#B5B5B5]" />
                        <span className="text-[10px] text-white uppercase tracking-[0.2em] font-black">Classic Grand Piano</span>
                    </div>

                    {/* Sustain Pedal Toggle */}
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
                        <span className="text-[7px] opacity-40 ml-1">(SPACE)</span>
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

            {/* PIANO BOARD */}
            <div className="relative flex-1 w-full bg-[#111111] flex flex-col p-2">
                {!isLoaded && (
                    <div className="absolute inset-0 bg-black/60 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 text-[#B5B5B5] animate-spin mb-4" />
                        <span className="text-[10px] text-[#B5B5B5] uppercase tracking-[0.4em] font-bold">Loading Samples...</span>
                    </div>
                )}
                
                <div className="relative w-full h-full flex items-start">
                    {/* Render White Keys (Flex) */}
                    {whiteKeys.map((k) => {
                        const fullNote = `${k.note}${k.octave}`;
                        return (
                            <PianoKey
                                key={fullNote}
                                note={k.note}
                                active={heldNotes.has(fullNote)}
                                onPlay={() => handlePlay(k.note, k.octave)}
                                onStop={() => handleStop(k.note, k.octave)}
                                label={k.label}
                            />
                        );
                    })}

                    {/* Render Black Keys (Absolute) */}
                    {blackKeys.map((k) => {
                        const fullNote = `${k.note}${k.octave}`;
                        return (
                            <div key={fullNote} style={{ '--black-key-pos': (k.pos / 36) * 100 } as any}>
                                <PianoKey
                                    note={k.note}
                                    isBlack
                                    active={heldNotes.has(fullNote)}
                                    onPlay={() => handlePlay(k.note, k.octave)}
                                    onStop={() => handleStop(k.note, k.octave)}
                                    label={k.label}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
