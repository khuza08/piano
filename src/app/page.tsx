import { Piano } from "@/components/Piano";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#303030] via-[#1a1a1a] to-black flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

      <div className="z-10 text-center mb-12">
        <h1 className="text-6xl font-black tracking-tighter mb-2">
          VIRTUAL PIANO
        </h1>

      </div>

      <div className="z-10 w-full max-w-5xl">
        <Piano />
      </div>

      <footer className="z-10 mt-16 text-[#595959] text-[10px] tracking-[0.2em] uppercase font-bold">
        foo
      </footer>
    </main>
  );
}
