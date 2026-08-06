import React, { useEffect, useRef } from 'react';

export default function LightboxModal({ item, onClose }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [item]);

  if (!item) return null;

  const isVideo = item.type === 'video';
  const isGDriveVideo = isVideo && item.source === 'gdrive';

  // Best quality URL: local = full stream, gdrive = direct media proxy
  const mediaUrl = item.source === 'local'
    ? `/media-file?path=${encodeURIComponent(item.id)}`
    : `/gdrive-media?id=${item.id}`;

  const viewUrl = item.source === 'gdrive'
    ? `https://drive.google.com/file/d/${item.id}/view`
    : mediaUrl;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/97 flex flex-col"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Top bar with close button */}
      <div className="flex items-center justify-between px-5 py-3 bg-black/60 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isVideo ? 'bg-rose-600/30' : 'bg-purple-600/30'}`}>
            <i className={`text-sm ${isVideo ? 'fa-solid fa-film text-rose-400' : 'fa-solid fa-image text-purple-400'}`}></i>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{item.title}</p>
            <p className="text-slate-400 text-xs truncate">{item.accountName || 'Storage Gateway'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {isVideo && (
            <a
              href={viewUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
            >
              <i className="fa-solid fa-up-right-from-square text-[10px]"></i>
              Buka Tab Baru
            </a>
          )}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all border border-white/10 hover:border-rose-500 cursor-pointer"
            title="Tutup (Esc)"
          >
            <i className="fa-solid fa-xmark text-base"></i>
          </button>
        </div>
      </div>

      {/* Media content - fills remaining space */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {!isVideo ? (
          <img
            src={item.source === 'gdrive' ? `/gdrive-media?id=${item.id}` : mediaUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: 'calc(100vh - 64px)' }}
          />
        ) : isGDriveVideo ? (
          <iframe
            src={`https://drive.google.com/file/d/${item.id}/preview?autoplay=1`}
            className="w-full"
            style={{ height: 'calc(100vh - 64px)', border: 'none' }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={item.title}
          ></iframe>
        ) : (
          <video
            ref={videoRef}
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            className="max-w-full"
            style={{ maxHeight: 'calc(100vh - 64px)' }}
          ></video>
        )}
      </div>
    </div>
  );
}
