'use client';

import React from 'react';

interface PianoKeyProps {
    note: string;
    isBlack?: boolean;
    onPlay: (note: string) => void;
    onStop: (note: string) => void;
    label?: string;
    active?: boolean;
}

export const PianoKey: React.FC<PianoKeyProps> = ({ 
    note, 
    isBlack, 
    onPlay, 
    onStop, 
    label,
    active 
}) => {
    return (
        <button
            onMouseDown={() => onPlay(note)}
            onMouseUp={() => onStop(note)}
            onMouseLeave={() => onStop(note)}
            onTouchStart={(e) => { e.preventDefault(); onPlay(note); }}
            onTouchEnd={(e) => { e.preventDefault(); onStop(note); }}
            className={`
                relative transition-all duration-75 flex flex-col items-center justify-end pb-4
                ${isBlack 
                    ? 'w-10 h-44 -mx-5 z-10 bg-gradient-to-b from-[#303030] to-[#000000] border border-black rounded-b-md shadow-lg active:scale-95' 
                    : 'w-14 h-64 bg-gradient-to-b from-white to-[#E0E0E0] border border-[#B5B5B5] rounded-b-lg shadow-md active:translate-y-1'
                }
                ${active && !isBlack ? 'bg-gradient-to-b from-[#B5B5B5] to-[#E0E0E0] text-[#303030] translate-y-1 shadow-[#B5B5B5]/50' : ''}
                ${active && isBlack ? 'bg-gradient-to-b from-[#595959] to-[#303030] border-[#B5B5B5]' : ''}
            `}
        >
            <span className={`
                text-[10px] font-bold tracking-tighter pointer-events-none
                ${isBlack ? 'text-[#B5B5B5]' : 'text-[#303030]'}
                ${active ? 'text-black' : ''}
            `}>
                {label || note}
            </span>
        </button>
    );
};
