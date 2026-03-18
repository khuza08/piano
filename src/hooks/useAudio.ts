'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

export const useAudio = () => {
    const samplerRef = useRef<Tone.Sampler | null>(null);
    const eqRef = useRef<Tone.EQ3 | null>(null);
    const compressorRef = useRef<Tone.Compressor | null>(null);
    const reverbRef = useRef<Tone.Reverb | null>(null);
    const limiterRef = useRef<Tone.Limiter | null>(null);
    
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMetroLoaded, setIsMetroLoaded] = useState(false);
    const [volume, setVolume] = useState(0); 
    const [sustain, setSustain] = useState(true);
    const [transpose, setTranspose] = useState(0);
    const [bpm, setBpm] = useState(120);
    const [isMetroPlaying, setIsMetroPlaying] = useState(false);
    
    const sustainedNotes = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        // 1. LIMITER: Final stage to prevent clipping/harsh distortion
        const limiter = new Tone.Limiter(-1).toDestination();

        // 2. COMPRESSOR: Glue the sound together
        const compressor = new Tone.Compressor({
            threshold: -24,
            ratio: 4,
            attack: 0.01, // Quick attack to catch the "plucky" spikes
            release: 0.2
        }).connect(limiter);

        // 3. EQ: The magic for "Bassy but Crisp"
        const eq = new Tone.EQ3({
            low: 4,      // Solid bass
            mid: -1,     // Slightly scooped for clarity
            high: 2,     // BOOST highs instead of cutting them to remove "mellow" feel
            lowFrequency: 450,
            highFrequency: 3000
        }).connect(compressor);

        // 4. REVERB: For air and space
        const reverb = new Tone.Reverb({
            decay: 1.5,
            wet: 0.1
        }).connect(eq);

        // 5. PIANO SAMPLER
        const sampler = new Tone.Sampler({
            urls: {
                "A0": "A0.mp3", "A1": "A1.mp3", "A2": "A2.mp3", "A3": "A3.mp3", "A4": "A4.mp3", "A5": "A5.mp3", "A6": "A6.mp3", "A7": "A7.mp3",
                "C1": "C1.mp3", "C2": "C2.mp3", "C3": "C3.mp3", "C4": "C4.mp3", "C5": "C5.mp3", "C6": "C6.mp3", "C7": "C7.mp3", "C8": "C8.mp3",
                "D#1": "Ds1.mp3", "D#2": "Ds2.mp3", "D#3": "Ds3.mp3", "D#4": "Ds4.mp3", "D#5": "Ds5.mp3", "D#6": "Ds6.mp3", "D#7": "Ds7.mp3",
                "F#1": "Fs1.mp3", "F#2": "Fs2.mp3", "F#3": "Fs3.mp3", "F#4": "Fs4.mp3", "F#5": "Fs5.mp3", "F#6": "Fs6.mp3", "F#7": "Fs7.mp3"
            },
            baseUrl: "/notes/classic/",
            curve: "exponential",
            attack: 0.01,  // Slight attack to remove the "clicky" transient
            release: 1.2,
            sustain: 1,
            decay: 1,
            onload: () => setIsLoaded(true)
        }).connect(reverb);

        const metronom = new Tone.Sampler({
            urls: { "C4": "metronome.wav" },
            baseUrl: "/notes/",
            onload: () => setIsMetroLoaded(true)
        }).toDestination();
        metronom.volume.value = -10;

        samplerRef.current = sampler;
        eqRef.current = eq;
        compressorRef.current = compressor;
        reverbRef.current = reverb;
        limiterRef.current = limiter;

        const repeatId = Tone.Transport.scheduleRepeat((time) => {
            if (metronom.loaded) metronom.triggerAttackRelease("C4", "8n", time);
        }, "4n");

        return () => {
            sampler.dispose();
            metronom.dispose();
            eq.dispose();
            compressor.dispose();
            reverb.dispose();
            limiter.dispose();
            Tone.Transport.clear(repeatId);
            Tone.Transport.stop();
        };
    }, []);

    useEffect(() => {
        if (samplerRef.current) samplerRef.current.volume.value = volume;
    }, [volume]);

    useEffect(() => {
        Tone.Transport.bpm.value = bpm;
    }, [bpm]);

    const toggleMetronome = useCallback(async () => {
        if (Tone.getContext().state !== 'running') await Tone.start();
        if (isMetroPlaying) Tone.Transport.stop(); else Tone.Transport.start();
        setIsMetroPlaying(!isMetroPlaying);
    }, [isMetroPlaying]);

    const playNote = useCallback(async (note: string) => {
        if (Tone.getContext().state !== 'running') await Tone.start();
        if (isLoaded && samplerRef.current) {
            const transposedNote = Tone.Frequency(note).transpose(transpose).toNote();
            sustainedNotes.current.delete(note);
            samplerRef.current.triggerAttack(transposedNote);
        }
    }, [isLoaded, transpose]);

    const stopNote = useCallback((note: string) => {
        const transposedNote = Tone.Frequency(note).transpose(transpose).toNote();
        if (sustain) {
            sustainedNotes.current.set(note, transposedNote);
        } else if (samplerRef.current) {
            samplerRef.current.triggerRelease(transposedNote);
        }
    }, [sustain, transpose]);

    return {
        playNote, stopNote, isLoaded: isLoaded && isMetroLoaded, volume, setVolume,
        sustain, toggleSustain: () => setSustain(!sustain),
        transpose, setTranspose, bpm, setBpm, isMetroPlaying, toggleMetronome
    };
};
