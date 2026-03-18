import { Piano } from "@/components/Piano";

export default function Home() {
  return (
    <main className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      {/* Background Subtle Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      
      {/* 80vw x 60vh Container */}
      <div className="z-10 w-[80vw] h-[60vh] bg-[#1a1a1a] rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col overflow-hidden relative">
        
        {/* Compact Header inside the 80% container */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-white/5 bg-gradient-to-b from-[#303030] to-[#1a1a1a]">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#B5B5B5] leading-none">
              VIRTUAL PIANO <span className="text-[8px] font-light text-[#B5B5B5]/50 align-top ml-1">V2</span>
            </h1>
            <p className="text-[#B5B5B5] font-medium tracking-[0.4em] text-[7px] uppercase mt-1">
              Monochrome Industrial
            </p>
          </div>
          <div className="text-[#595959] text-[8px] tracking-[0.2em] uppercase font-bold hidden sm:block">
            61 Keys • Professional Layout
          </div>
        </div>

        {/* Piano Component fills the rest of the 80% container */}
        <div className="flex-1 w-full relative">
          <Piano />
        </div>

        {/* Status Bar at the bottom of the 80% container */}
        <div className="px-6 py-2 bg-black/40 flex justify-between items-center border-t border-white/5">
          <div className="text-[#595959] text-[7px] tracking-[0.2em] uppercase font-bold">
            Standard QWERTY Mapping (1-M)
          </div>
          <div className="text-[#B5B5B5]/30 text-[7px] tracking-[0.2em] uppercase font-bold">
            80% Viewport Mode
          </div>
        </div>
      </div>
    </main>
  );
}
