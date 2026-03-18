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
    if (isBlack) {
        return (
            <button
                onMouseDown={() => onPlay(note)}
                onMouseUp={() => onStop(note)}
                onMouseLeave={() => onStop(note)}
                onTouchStart={(e) => { e.preventDefault(); onPlay(note); }}
                onTouchEnd={(e) => { e.preventDefault(); onStop(note); }}
                className={`
                    absolute top-0 z-20 h-[60%] transition-all duration-75 flex flex-col items-center justify-end pb-2
                    bg-gradient-to-b from-[#303030] to-[#000000] border border-black rounded-b-sm shadow-lg active:scale-95
                    ${active ? 'bg-gradient-to-b from-[#595959] to-[#303030] border-[#B5B5B5]' : ''}
                `}
                style={{ 
                    width: '1.8%',
                    left: 'calc(var(--black-key-pos) * 1%)',
                    transform: 'translateX(-50%)' 
                }}
            >
                <span className={`text-[8px] font-bold pointer-events-none ${active ? 'text-white' : 'text-[#B5B5B5]'}`}>
                    {label}
                </span>
            </button>
        );
    }

    return (
        <button
            onMouseDown={() => onPlay(note)}
            onMouseUp={() => onStop(note)}
            onMouseLeave={() => onStop(note)}
            onTouchStart={(e) => { e.preventDefault(); onPlay(note); }}
            onTouchEnd={(e) => { e.preventDefault(); onStop(note); }}
            className={`
                flex-1 h-full min-w-0 transition-all duration-75 flex flex-col items-center justify-end pb-4
                bg-gradient-to-b from-white to-[#E0E0E0] border border-[#B5B5B5] rounded-b-md shadow-md active:translate-y-1
                ${active ? 'bg-gradient-to-b from-[#B5B5B5] to-[#E0E0E0] text-[#303030] translate-y-1 shadow-[#B5B5B5]/50' : ''}
            `}
        >
            <span className={`text-[8px] font-bold pointer-events-none ${active ? 'text-black' : 'text-[#303030]'}`}>
                {label}
            </span>
        </button>
    );
};
