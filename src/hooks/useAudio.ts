'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

export type InstrumentType = 'synth' | 'am' | 'fm' | 'duo';

export const useAudio = () => {
    const polySynthRef = useRef<Tone.PolySynth | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [volume, setVolume] = useState(-12); // Decibels
    const [instrument, setInstrument] = useState<InstrumentType>('synth');

    useEffect(() => {
        // Initialize PolySynth for polyphonic sound
        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 1
            }
        }).toDestination();

        polySynthRef.current = synth;
        setIsLoaded(true);

        return () => {
            synth.dispose();
        };
    }, []);

    useEffect(() => {
        if (polySynthRef.current) {
            polySynthRef.current.volume.value = volume;
        }
    }, [volume]);

    const playNote = useCallback(async (note: string) => {
        if (Tone.getContext().state !== 'running') {
            await Tone.start();
        }
        polySynthRef.current?.triggerAttack(note);
    }, []);

    const stopNote = useCallback((note: string) => {
        polySynthRef.current?.triggerRelease(note);
    }, []);

    const updateInstrument = useCallback((type: InstrumentType) => {
        if (!polySynthRef.current) return;

        let newSynth;
        const options = { volume };

        switch (type) {
            case 'am':
                newSynth = new Tone.PolySynth(Tone.AMSynth, options).toDestination();
                break;
            case 'fm':
                newSynth = new Tone.PolySynth(Tone.FMSynth, options).toDestination();
                break;
            case 'duo':
                newSynth = new Tone.PolySynth(Tone.DuoSynth, options).toDestination();
                break;
            default:
                newSynth = new Tone.PolySynth(Tone.Synth, options).toDestination();
        }

        polySynthRef.current.dispose();
        polySynthRef.current = newSynth;
        setInstrument(type);
    }, [volume]);

    return {
        playNote,
        stopNote,
        isLoaded,
        volume,
        setVolume,
        instrument,
        updateInstrument
    };
};
