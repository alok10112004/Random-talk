export default function HeroAnimation() {
  return (
    <div className="flex items-center justify-center gap-4 mb-2 relative">
      {/* Left Card */}
      <div className="relative w-16 h-24 bg-pink-900/40 rounded-xl border border-pink-400/50 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.3)] backdrop-blur-sm">
        <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 bg-pink-300 rounded-full" />
          <div className="w-8 h-4 bg-pink-300 rounded-t-full" />
        </div>
      </div>

      {/* Connecting Line */}
      <div className="w-6 h-0.5 bg-pink-400/50" />

      {/* Right Card */}
      <div className="relative w-16 h-24 bg-pink-900/40 rounded-xl border border-pink-400/50 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(244,114,182,0.3)] backdrop-blur-sm">
        <div className="absolute top-2 right-2 text-pink-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-5 h-5 bg-pink-300 rounded-full" />
          <div className="w-8 h-4 bg-pink-300 rounded-t-full" />
        </div>
      </div>
    </div>
  );
}