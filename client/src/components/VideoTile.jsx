export default function VideoTile({ videoRef, label, muted, className = '', status, onStop, onReport }) {
  return (
    <div
      className={`relative bg-black rounded-xl overflow-hidden border border-[#1f2534] ${className}`}
    >
      <video
        ref={videoRef}
        autoPlay
        muted={muted}
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Label (You / Stranger) */}
      <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-medium text-white z-10">
        {label}
      </div>

      {/* 🔴 STRANGER PR FLAG BUTTON */}
      {/* Agar 'muted' false hai (matlab stranger ka video hai) aur status 'connected' hai, tabhi flag dikhega */}
      {!muted && status === 'connected' && onReport && (
        <button 
          onClick={onReport}
          className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500/80 text-white/70 hover:text-white rounded-md transition-all z-20"
          title="Report Stranger"
        >
          {/* Simple SVG Flag Icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
          </svg>
        </button>
      )}

      {/* ⏹️ 'YOU' PR STOP BUTTON */}
      {/* Agar 'muted' true hai (matlab apna video hai) aur status 'connected' ya 'waiting' hai, tabhi stop dikhega */}
      {muted && (status === 'connected' || status === 'waiting') && onStop && (
        <button 
          onClick={onStop}
          className="absolute bottom-2 right-2 px-2 py-1 bg-red-500/80 hover:bg-red-600 text-white text-[10px] font-bold rounded-md backdrop-blur-sm transition-all z-20 flex items-center gap-1"
          title="Stop Camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
          </svg>
          STOP
        </button>
      )}

      {status === 'waiting' && !muted && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-0">
          <div className="w-14 h-14 border-4 border-[#2a3142] border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-300 text-sm">Looking for a stranger...</p>
        </div>
      )}

      {status === 'idle' && !muted && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-0">
          <p className="text-gray-400 text-sm">Press Start to begin</p>
        </div>
      )}
    </div>
  );
}