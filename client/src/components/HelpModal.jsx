export default function HelpModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#131823] border border-[#1f2534] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#1f2534] sticky top-0 bg-[#131823]">
          <h2 className="text-lg font-bold text-white">❓ Help & Rules</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#1f2534] flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-6 text-sm text-gray-300">
          <section>
            <h3 className="font-semibold text-white mb-2">📖 How to use</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click <b className="text-white">Start</b> to find a stranger</li>
              <li>Allow camera & microphone when asked</li>
              <li>Click <b className="text-white">Next</b> for a new partner</li>
              <li>Click <b className="text-white">Stop</b> to end the chat</li>
            </ol>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">⚠️ Rules</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>You must be <b>18 years or older</b></li>
              <li>No nudity or sexual content</li>
              <li>No harassment, hate speech, or abuse</li>
              <li>No recording without consent</li>
              <li>Violators will be permanently banned</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">🚩 Report abuse</h3>
            <p>
              Click the <span className="text-red-400">🚩 report button</span> during the chat to report inappropriate behavior.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-white mb-2">🔒 Privacy</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Video is peer-to-peer (P2P) — not stored</li>
              <li>We do not record conversations</li>
              <li>Chat messages are not saved</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}