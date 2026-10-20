export default function VideoTile({ videoRef, label, muted, className = '', status }) {
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

      <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs font-medium text-white">
        {label}
      </div>

      {status === 'waiting' && !muted && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 border-4 border-[#2a3142] border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-300 text-sm">Looking for a stranger...</p>
        </div>
      )}

      {status === 'idle' && !muted && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Press Start to begin</p>
        </div>
      )}
    </div>
  );
}