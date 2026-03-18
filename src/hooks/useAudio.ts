'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

export const useAudio = () => {
    const samplerRef = useRef<Tone.Sampler | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [volume, setVolume] = useState(0); // Set to 0dB for original loudness
    const [sustain, setSustain] = useState(false);
    const sustainedNotes = useRef<Set<string>>(new Set());

    useEffect(() => {
        const sampler = new Tone.Sampler({
            urls: {
                "A0": "A0.mp3", "A1": "A1.mp3", "A2": "A2.mp3", "A3": "A3.mp3", "A4": "A4.mp3", "A5": "A5.mp3", "A6": "A6.mp3", "A7": "A7.mp3",
                "C1": "C1.mp3", "C2": "C2.mp3", "C3": "C3.mp3", "C4": "C4.mp3", "C5": "C5.mp3", "C6": "C6.mp3", "C7": "C7.mp3", "C8": "C8.mp3",
                "D#1": "Ds1.mp3", "D#2": "Ds2.mp3", "D#3": "Ds3.mp3", "D#4": "Ds4.mp3", "D#5": "Ds5.mp3", "D#6": "Ds6.mp3", "D#7": "Ds7.mp3",
                "F#1": "Fs1.mp3", "F#2": "Fs2.mp3", "F#3": "Fs3.mp3", "F#4": "Fs4.mp3", "F#5": "Fs5.mp3", "F#6": "Fs6.mp3", "F#7": "Fs7.mp3"
            },
            baseUrl: "/notes/classic/",
            // Set attack to 0 to ensure immediate original sound start
            attack: 0,
            // Set curve to exponential for more natural feel
            curve: "exponential",
            onload: () => {
                setIsLoaded(true);
            }
        }).toDestination();

        samplerRef.current = sampler;

        return () => {
            sampler.dispose();
        };
    }, []);

    useEffect(() => {
        if (samplerRef.current) {
            samplerRef.current.volume.value = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (!sustain && samplerRef.current) {
            sustainedNotes.current.forEach(note => {
                samplerRef.current?.triggerRelease(note);
            });
            sustainedNotes.current.clear();
        }
    }, [sustain]);

    const playNote = useCallback(async (note: string) => {
        if (Tone.getContext().state !== 'running') {
            await Tone.start();
        }
        if (isLoaded && samplerRef.current) {
            sustainedNotes.current.delete(note);
            // Trigger without explicit time to avoid any jitter
            samplerRef.current.triggerAttack(note);
        }
    }, [isLoaded]);

    const stopNote = useCallback((note: string) => {
        if (sustain) {
            sustainedNotes.current.add(note);
        } else if (samplerRef.current) {
            samplerRef.current.triggerRelease(note);
        }
    }, [sustain]);

    const toggleSustain = useCallback(() => {
        setSustain(prev => !prev);
    }, []);

    return {
        playNote,
        stopNote,
        isLoaded,
        volume,
        setVolume,
        sustain,
        toggleSustain
    };
};
