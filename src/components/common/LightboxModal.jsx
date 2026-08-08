import React, { useEffect, useRef, useMemo, useState } from 'react';

export default function LightboxModal({ item, allMedia = [], onNavigate, onClose }) {
  const videoRef = useRef(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const currentIndex = useMemo(() =>
    allMedia.findIndex(m => m.id === item.id), [allMedia, item]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;

  const goPrev = () => { if (hasPrev) onNavigate(allMedia[currentIndex - 1]); };
  const goNext = () => { if (hasNext) onNavigate(allMedia[currentIndex + 1]); };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allMedia]);

  useEffect(() => {
    setIsVideoLoading(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [item]);

  if (!item) return null;

  const isVideo = item.type === 'video';
  const isGDriveVideo = isVideo && item.source === 'gdrive';
  const isLocalVideo = isVideo && item.source === 'local';
  const isMov = [item?.ext, item?.title, item?.id]
    .filter(Boolean)
    .some(s => s.toLowerCase().endsWith('.mov'));

  const mediaUrl = item.source === 'local'
    ? isMov
      ? `/transcode-video?path=${encodeURIComponent(item.id)}`
      : `/media-file?path=${encodeURIComponent(item.id)}`
    : `/gdrive-media?id=${item.id}`;

  const viewUrl = item.source === 'gdrive'
    ? `https://drive.google.com/file/d/${item.id}/view`
    : mediaUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(2, 6, 23, 0.82)', backdropFilter: 'blur(18px)' }}
    >
      {/* Top bar: counter + buttons */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
        <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-bold backdrop-blur-sm">
          {currentIndex + 1} / {allMedia.length}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={viewUrl}
            target="_blank"
            rel="noreferrer"
            title="Buka Tab Baru"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-blue-600 text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer"
          >
            <i className="fa-solid fa-up-right-from-square text-xs"></i>
          </a>
          <button
            onClick={onClose}
            title="Tutup (Esc)"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* Media — fills all remaining space */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative min-h-0">

        {/* Photo */}
        {!isVideo && (
          <img
            src={item.source === 'gdrive' ? `/gdrive-media?id=${item.id}` : mediaUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain"
          />
        )}

        {/* Google Drive Video — iframe tanpa frame hitam */}
        {isGDriveVideo && (
          <iframe
            src={`https://drive.google.com/file/d/${item.id}/preview?autoplay=1`}
            className="max-w-full max-h-full"
            style={{
              border: 'none',
              background: 'transparent',
              width: '100%',
              height: '100%',
            }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={item.title}
          ></iframe>
        )}

        {/* Local Video — transparan bg, ukuran natural (tidak paksa penuh) */}
        {isLocalVideo && (
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Loading indicator kecil di tengah, muncul hanya saat buffering */}
            {isVideoLoading && (
              <div className="absolute z-10 flex flex-col items-center gap-2 pointer-events-none">
                <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin"></div>
                <p className="text-white/50 text-[11px] font-medium">Memuat video...</p>
              </div>
            )}
            <video
              ref={videoRef}
              src={mediaUrl}
              controls
              autoPlay
              playsInline
              preload="auto"
              onCanPlay={() => setIsVideoLoading(false)}
              onWaiting={() => setIsVideoLoading(true)}
              onPlaying={() => setIsVideoLoading(false)}
              className="max-w-full max-h-full"
              style={{
                objectFit: 'contain',
                background: 'transparent',  // ← tidak ada bar hitam!
                opacity: isVideoLoading ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            ></video>
          </div>
        )}

        {/* Prev Arrow — Desktop only */}
        {hasPrev && (
          <button
            onClick={goPrev}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-black/60 hover:bg-blue-600/90 text-white items-center justify-center transition-all border border-white/10 cursor-pointer"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}
        {hasNext && (
          <button
            onClick={goNext}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-black/60 hover:bg-blue-600/90 text-white items-center justify-center transition-all border border-white/10 cursor-pointer"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        )}
      </div>

      {/* Bottom bar: caption + mobile prev/next */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0 gap-2">
        <button
          onClick={goPrev}
          disabled={!hasPrev}
          className={`md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white border transition-all cursor-pointer flex-shrink-0 ${hasPrev ? 'bg-white/10 border-white/10 hover:bg-blue-600' : 'opacity-20 border-transparent bg-transparent cursor-default'}`}
        >
          <i className="fa-solid fa-chevron-left text-sm"></i>
        </button>

        <div className="flex-1 text-center min-w-0">
          <p className="text-white font-bold text-xs truncate">{item.title}</p>
          <p className="text-slate-400 text-[10px] truncate">{item.accountName || 'Storage Gateway'}</p>
        </div>

        <button
          onClick={goNext}
          disabled={!hasNext}
          className={`md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white border transition-all cursor-pointer flex-shrink-0 ${hasNext ? 'bg-white/10 border-white/10 hover:bg-blue-600' : 'opacity-20 border-transparent bg-transparent cursor-default'}`}
        >
          <i className="fa-solid fa-chevron-right text-sm"></i>
        </button>
      </div>
    </div>
  );
}
