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
            if (e.code === 'Space') { e.preventDefault(); toggleSustain(); return; }
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
            <div className="flex items-center justify-between px-6 py-2 bg-black/40 border-b border-white/5 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                        <Music className="w-3 h-3 text-[#B5B5B5]" />
                        <span className="text-[10px] text-white uppercase tracking-[0.2em] font-black whitespace-nowrap">Classic Piano</span>
                    </div>

                    {/* Metronome */}
                    <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                        <button 
                            onClick={toggleMetronome}
                            className={`p-1.5 rounded-md transition-all ${isMetroPlaying ? 'bg-white/20 text-white' : 'text-[#595959]'}`}
                        >
                            {isMetroPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                        </button>
                        <div className="flex items-center gap-2">
                            <Timer className={`w-3 h-3 ${isMetroPlaying ? 'text-white animate-pulse' : 'text-[#595959]'}`} />
                            <input 
                                type="number" value={bpm} 
                                onChange={(e) => setBpm(Math.min(240, Math.max(40, parseInt(e.target.value) || 0)))}
                                className="bg-transparent text-[10px] text-white w-8 focus:outline-none font-black"
                            />
                            <span className="text-[7px] text-[#595959] font-black">BPM</span>
                        </div>
                    </div>

                    {/* Transpose */}
                    <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                        <span className="text-[7px] text-[#595959] uppercase tracking-widest font-black">Key</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setTranspose(Math.max(-10, transpose - 1))} className="text-[#B5B5B5] hover:text-white leading-none">‹</button>
                            <span className="text-[10px] font-black text-white w-4 text-center">{transpose > 0 ? `+${transpose}` : transpose}</span>
                            <button onClick={() => setTranspose(Math.min(10, transpose + 1))} className="text-[#B5B5B5] hover:text-white leading-none">›</button>
                        </div>
                    </div>

                    <button 
                        onClick={toggleSustain}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${sustain ? 'bg-white/10 border-[#B5B5B5] text-white shadow-lg' : 'bg-transparent border-white/5 text-[#595959]'}`}
                    >
                        <Footprints className="w-3 h-3" />
                        <span className="text-[8px] uppercase tracking-[0.2em] font-bold">Sustain</span>
                    </button>
                </div>

                <div className="flex items-center gap-4 w-32 ml-4">
                    <Volume2 className="w-3 h-3 text-[#B5B5B5]" />
                    <input type="range" min="-40" max="0" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#B5B5B5]" />
                </div>
            </div>

            {/* Note History */}
            <div className="bg-black/20 h-10 border-b border-white/5 flex items-center px-6 justify-between overflow-hidden">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 flex-1">
                    <History className="w-3 h-3 text-[#595959]" />
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
                        <PianoKey key={`${k.note}${k.octave}`} note={k.note} active={heldNotes.has(`${k.note}${k.octave}`)} onPlay={() => handlePlay(k.note, k.octave)} onStop={() => handleStop(k.note, k.octave)} label={k.label} />
                    ))}
                    {blackKeys.map((k) => (
                        <div key={`${k.note}${k.octave}`} style={{ '--black-key-pos': (k.pos / 36) * 100 } as any}>
                            <PianoKey note={k.note} isBlack active={heldNotes.has(`${k.note}${k.octave}`)} onPlay={() => handlePlay(k.note, k.octave)} onStop={() => handleStop(k.note, k.octave)} label={k.label} />
                        </div>
                    ))}
                </div>
            </div>
            <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};
