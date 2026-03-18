"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAudio, InstrumentType } from "../hooks/useAudio";
import { PianoKey } from "./PianoKey";
import { Volume2, Music, Layers } from "lucide-react";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEYBOARD_MAP: Record<string, string> = {
  a: "C",
  w: "C#",
  s: "D",
  e: "D#",
  d: "E",
  f: "F",
  t: "F#",
  g: "G",
  y: "G#",
  h: "A",
  u: "A#",
  j: "B",
};

export const Piano = () => {
  const {
    playNote,
    stopNote,
    volume,
    setVolume,
    instrument,
    updateInstrument,
  } = useAudio();
  const [octave, setOctave] = useState(4);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

  const handlePlay = useCallback(
    (noteName: string) => {
      const fullNote = `${noteName}${octave}`;
      playNote(fullNote);
      setActiveNotes((prev) => new Set(prev).add(noteName));
    },
    [octave, playNote],
  );

  const handleStop = useCallback(
    (noteName: string) => {
      const fullNote = `${noteName}${octave}`;
      stopNote(fullNote);
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteName);
        return next;
      });
    },
    [octave, stopNote],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const note = KEYBOARD_MAP[e.key.toLowerCase()];
      if (note) handlePlay(note);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const note = KEYBOARD_MAP[e.key.toLowerCase()];
      if (note) handleStop(note);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [handlePlay, handleStop]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-6 w-full max-w-2xl px-4">
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
          <Music className="w-5 h-5 text-[#B5B5B5]" />
          <select
            value={instrument}
            onChange={(e) => updateInstrument(e.target.value as InstrumentType)}
            className="bg-transparent text-sm focus:outline-none text-white cursor-pointer"
          >
            <option value="synth">Classic Synth</option>
            <option value="am">AM Synth</option>
            <option value="fm">FM Synth</option>
            <option value="duo">Duo Synth</option>
          </select>
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
          <Layers className="w-5 h-5 text-[#B5B5B5]" />
          <select
            value={octave}
            onChange={(e) => setOctave(Number(e.target.value))}
            className="bg-transparent text-sm focus:outline-none text-white cursor-pointer"
          >
            {[2, 3, 4, 5, 6].map((o) => (
              <option key={o} value={o}>
                Octave {o}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 flex-1 min-w-[200px]">
          <Volume2 className="w-5 h-5 text-[#B5B5B5]" />
          <input
            type="range"
            min="-40"
            max="0"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#B5B5B5]"
          />
        </div>
      </div>

      {/* Piano Board */}
      <div className="relative flex justify-center p-6 bg-black/40 rounded-2xl shadow-inner border border-white/5">
        {NOTES.map((note) => {
          const isBlack = note.includes("#");
          return (
            <PianoKey
              key={note}
              note={note}
              isBlack={isBlack}
              active={activeNotes.has(note)}
              onPlay={handlePlay}
              onStop={handleStop}
              label={Object.keys(KEYBOARD_MAP)
                .find((k) => KEYBOARD_MAP[k] === note)
                ?.toUpperCase()}
            />
          );
        })}
      </div>

      {/* Hint */}
      <div className="text-white text-xs font-medium tracking-widest uppercase">
        Use your keyboard: A W S E D F T G Y H U J
      </div>
    </div>
  );
};
