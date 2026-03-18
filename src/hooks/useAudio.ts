'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

export type InstrumentType = 'classic' | 'fat' | 'metal';

export const useAudio = () => {
    const samplerRef = useRef<Tone.Sampler | null>(null);
    const synthRef = useRef<Tone.PolySynth | null>(null);
    const metroRef = useRef<Tone.Sampler | null>(null);
    const chorusRef = useRef<Tone.Chorus | null>(null);
    const reverbRef = useRef<Tone.Reverb | null>(null);
    const eqRef = useRef<Tone.EQ3 | null>(null);
    const compressorRef = useRef<Tone.Compressor | null>(null);
    
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMetroLoaded, setIsMetroLoaded] = useState(false);
    const [volume, setVolume] = useState(0); 
    const [sustain, setSustain] = useState(true);
    const [transpose, setTranspose] = useState(0);
    const [bpm, setBpm] = useState(120);
    const [isMetroPlaying, setIsMetroPlaying] = useState(false);
    const [instrumentType, setInstrumentType] = useState<InstrumentType>('classic');
    
    const sustainedNotes = useRef<Map<string, string>>(new Map());

    useEffect(() => {
        // 1. MASTER CHAIN (Last to First)
        const compressor = new Tone.Compressor({ threshold: -20, ratio: 3 }).toDestination();
        const eq = new Tone.EQ3({ low: 3, mid: 0, high: 1 }).connect(compressor);

        // 2. FX BUSSES
        // Reverb for depth
        const reverb = new Tone.Reverb({
            decay: 2.5,
            preDelay: 0.01,
            wet: 0.2
        }).connect(eq);

        // Chorus for width and movement
        const chorus = new Tone.Chorus({
            frequency: 1.5,
            delayTime: 3.5,
            depth: 0.7,
            wet: 0.15 // Default wetness
        }).connect(reverb);
        chorus.start(); // Standard Tone.js requirement for Chorus

        // 3. INSTRUMENTS
        // Piano Sampler
        const sampler = new Tone.Sampler({
            urls: {
                "A0": "A0.mp3", "A1": "A1.mp3", "A2": "A2.mp3", "A3": "A3.mp3", "A4": "A4.mp3", "A5": "A5.mp3", "A6": "A6.mp3", "A7": "A7.mp3",
                "C1": "C1.mp3", "C2": "C2.mp3", "C3": "C3.mp3", "C4": "C4.mp3", "C5": "C5.mp3", "C6": "C6.mp3", "C7": "C7.mp3", "C8": "C8.mp3",
                "D#1": "Ds1.mp3", "D#2": "Ds2.mp3", "D#3": "Ds3.mp3", "D#4": "Ds4.mp3", "D#5": "Ds5.mp3", "D#6": "Ds6.mp3", "D#7": "Ds7.mp3",
                "F#1": "Fs1.mp3", "F#2": "Fs2.mp3", "F#3": "Fs3.mp3", "F#4": "Fs4.mp3", "F#5": "Fs5.mp3", "F#6": "Fs6.mp3", "F#7": "Fs7.mp3"
            },
            baseUrl: "/notes/classic/",
            curve: "exponential", attack: 0.01, release: 1.2, sustain: 1, decay: 1,
            onload: () => setIsLoaded(true)
        }).connect(chorus);

        // Metronome
        const metronom = new Tone.Sampler({
            urls: { "C4": "metronome.wav" },
            baseUrl: "/notes/",
            onload: () => setIsMetroLoaded(true)
        }).toDestination();
        metronom.volume.value = -10;

        samplerRef.current = sampler;
        metroRef.current = metronom;
        chorusRef.current = chorus;
        reverbRef.current = reverb;
        eqRef.current = eq;
        compressorRef.current = compressor;

        const repeatId = Tone.Transport.scheduleRepeat((time) => {
            if (metronom.loaded) metronom.triggerAttackRelease("C4", "8n", time);
        }, "4n");

        return () => {
            sampler.dispose();
            metronom.dispose();
            chorus.dispose();
            reverb.dispose();
            eq.dispose();
            compressor.dispose();
            synthRef.current?.dispose();
            Tone.Transport.clear(repeatId);
            Tone.Transport.stop();
        };
    }, []);

    // Instrument Switcher
    useEffect(() => {
        if (!chorusRef.current) return;
        if (synthRef.current) synthRef.current.dispose();

        if (instrumentType === 'fat') {
            synthRef.current = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
                envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 2 }
            }).connect(chorusRef.current);
        } else if (instrumentType === 'metal') {
            synthRef.current = new Tone.PolySynth(Tone.MetalSynth, {
                harmonicity: 12, resonance: 800, modulationIndex: 20,
                envelope: { decay: 0.4, release: 0.5 }
            }).connect(chorusRef.current);
        }
    }, [instrumentType]);

    useEffect(() => {
        if (samplerRef.current) samplerRef.current.volume.value = volume;
        if (synthRef.current) synthRef.current.volume.value = volume;
    }, [volume]);

    useEffect(() => {
        Tone.Transport.bpm.value = bpm;
    }, [bpm]);

    const playNote = useCallback(async (note: string) => {
        if (Tone.getContext().state !== 'running') await Tone.start();
        const transposedNote = Tone.Frequency(note).transpose(transpose).toNote();
        sustainedNotes.current.delete(note);

        if (instrumentType === 'classic' && isLoaded && samplerRef.current) {
            samplerRef.current.triggerAttack(transposedNote);
        } else if (synthRef.current) {
            if (sustain) {
                synthRef.current.triggerAttackRelease(transposedNote, "2n");
            } else {
                synthRef.current.triggerAttack(transposedNote);
            }
        }
    }, [isLoaded, transpose, instrumentType, sustain]);

    const stopNote = useCallback((note: string) => {
        const transposedNote = Tone.Frequency(note).transpose(transpose).toNote();
        if (sustain) {
            sustainedNotes.current.set(note, transposedNote);
        } else {
            if (instrumentType === 'classic' && samplerRef.current) {
                samplerRef.current.triggerRelease(transposedNote);
            } else if (synthRef.current) {
                synthRef.current.triggerRelease(transposedNote);
            }
        }
    }, [sustain, transpose, instrumentType]);

    useEffect(() => {
        if (!sustain) {
            sustainedNotes.current.forEach((transposedNote) => {
                samplerRef.current?.triggerRelease(transposedNote);
                synthRef.current?.triggerRelease(transposedNote);
            });
            sustainedNotes.current.clear();
        }
    }, [sustain]);

    const toggleMetronome = useCallback(async () => {
        if (Tone.getContext().state !== 'running') await Tone.start();
        if (isMetroPlaying) Tone.Transport.stop(); else Tone.Transport.start();
        setIsMetroPlaying(!isMetroPlaying);
    }, [isMetroPlaying]);

    return {
        playNote, stopNote, isLoaded: isLoaded && isMetroLoaded, volume, setVolume,
        sustain, toggleSustain: () => setSustain(!sustain),
        transpose, setTranspose, bpm, setBpm, isMetroPlaying, toggleMetronome,
        instrumentType, setInstrumentType
    };
};
