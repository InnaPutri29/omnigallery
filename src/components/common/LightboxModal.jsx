import React, { useEffect, useRef, useMemo } from 'react';

export default function LightboxModal({ item, allMedia = [], onNavigate, onClose }) {
  const videoRef = useRef(null);

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
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [item]);

  if (!item) return null;

  const isVideo = item.type === 'video';
  const isGDriveVideo = isVideo && item.source === 'gdrive';
  const isLocalVideo = isVideo && item.source === 'local';
  // Deteksi file MOV (case-insensitive): cek ext, title, atau path (item.id)
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
      style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(20px) saturate(160%)' }}
    >
      {/* Top bar: counter + buttons */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
        {/* Counter */}
        <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-bold backdrop-blur-sm">
          {currentIndex + 1} / {allMedia.length}
        </div>

        {/* Right: open tab + close */}
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

        {/* Photo — blurred bg + sharp centered image */}
        {!isVideo && (
          <div className="relative w-full h-full">
            {/* Blurred background */}
            <img
              src={item.source === 'gdrive' ? `/gdrive-media?id=${item.id}` : mediaUrl}
              alt=""
              referrerPolicy="no-referrer"
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(28px) brightness(0.45) saturate(1.4)', transform: 'scale(1.08)' }}
            />
            {/* Sharp centered image */}
            <img
              src={item.source === 'gdrive' ? `/gdrive-media?id=${item.id}` : mediaUrl}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="relative z-10 w-full h-full object-contain"
            />
          </div>
        )}

        {/* Google Drive Video */}
        {isGDriveVideo && (
          <iframe
            src={`https://drive.google.com/file/d/${item.id}/preview?autoplay=1`}
            className="w-full h-full"
            style={{ border: 'none' }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={item.title}
          ></iframe>
        )}

        {/* Local Video — blurred bg video + sharp video on top */}
        {isLocalVideo && (
          <div className="relative w-full h-full overflow-hidden">
            {/* Blurred background video */}
            <video
              src={mediaUrl}
              muted
              autoPlay
              loop
              playsInline
              tabIndex={-1}
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ filter: 'blur(24px) brightness(0.4) saturate(1.4)', transform: 'scale(1.08)' }}
            ></video>
            {/* Sharp foreground video with controls */}
            <video
              ref={videoRef}
              src={mediaUrl}
              controls
              autoPlay
              playsInline
              preload="auto"
              className="relative z-10 w-full h-full"
              style={{ objectFit: 'contain' }}
            ></video>
          </div>
        )}

        {/* Prev Arrow — Desktop: sides | Mobile: hidden (use swipe or bottom buttons) */}
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
        {/* Prev — mobile only */}
        <button
          onClick={goPrev}
          disabled={!hasPrev}
          className={`md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white border transition-all cursor-pointer flex-shrink-0 ${hasPrev ? 'bg-white/10 border-white/10 hover:bg-blue-600' : 'opacity-20 border-transparent bg-transparent cursor-default'}`}
        >
          <i className="fa-solid fa-chevron-left text-sm"></i>
        </button>

        {/* Caption */}
        <div className="flex-1 text-center min-w-0">
          <p className="text-white font-bold text-xs truncate">{item.title}</p>
          <p className="text-slate-400 text-[10px] truncate">{item.accountName || 'Storage Gateway'}</p>
        </div>

        {/* Next — mobile only */}
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
