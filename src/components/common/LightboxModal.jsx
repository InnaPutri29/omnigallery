import React, { useEffect, useRef, useMemo, useState } from 'react';

export default function LightboxModal({ item, allMedia = [], onNavigate, onClose }) {
  const videoRef = useRef(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const isMov = (item?.ext || '').toLowerCase() === '.mov';
  const isHevc = isMov; // MOV files from iPhone are HEVC/H.265

  // Get index in full media list
  const currentIndex = useMemo(() =>
    allMedia.findIndex(m => m.id === item.id), [allMedia, item]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allMedia.length - 1;

  const goPrev = () => { if (hasPrev) onNavigate(allMedia[currentIndex - 1]); };
  const goNext = () => { if (hasNext) onNavigate(allMedia[currentIndex + 1]); };

  useEffect(() => {
    setIframeLoaded(false);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allMedia]);

  useEffect(() => {
    if (videoRef.current && !isHevc) {
      videoRef.current.play().catch(() => {});
    }
  }, [item]);

  if (!item) return null;

  const isVideo = item.type === 'video';
  const isGDriveVideo = isVideo && item.source === 'gdrive';
  const isLocalVideo = isVideo && item.source === 'local';

  const mediaUrl = item.source === 'local'
    ? `/media-file?path=${encodeURIComponent(item.id)}`
    : `/gdrive-media?id=${item.id}`;

  const viewUrl = item.source === 'gdrive'
    ? `https://drive.google.com/file/d/${item.id}/view`
    : mediaUrl;

  // Thumbnail for poster / GDrive loading preview
  const thumbnailUrl = item.source === 'gdrive'
    ? `/gdrive-media?id=${item.id}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(24px) saturate(160%)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        title="Tutup (Esc)"
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-2xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all border border-white/15 hover:border-rose-500 cursor-pointer backdrop-blur-sm shadow-xl"
      >
        <i className="fa-solid fa-xmark text-lg"></i>
      </button>

      {/* Open in new tab */}
      <a
        href={viewUrl}
        target="_blank"
        rel="noreferrer"
        title="Buka Tab Baru"
        className="absolute top-4 right-16 z-20 w-10 h-10 rounded-2xl bg-white/10 hover:bg-blue-600 text-white flex items-center justify-center transition-all border border-white/15 hover:border-blue-500 cursor-pointer backdrop-blur-sm shadow-xl"
      >
        <i className="fa-solid fa-up-right-from-square text-sm"></i>
      </a>

      {/* Counter */}
      {allMedia.length > 0 && (
        <div className="absolute top-4 left-4 z-20 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-bold backdrop-blur-sm">
          {currentIndex + 1} / {allMedia.length}
        </div>
      )}

      {/* Prev Arrow */}
      {hasPrev && (
        <button
          onClick={goPrev}
          title="Sebelumnya (←)"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-black/60 hover:bg-blue-600/90 text-white flex items-center justify-center transition-all border border-white/10 hover:border-blue-400 cursor-pointer backdrop-blur-sm shadow-xl"
        >
          <i className="fa-solid fa-chevron-left text-lg"></i>
        </button>
      )}

      {/* Next Arrow */}
      {hasNext && (
        <button
          onClick={goNext}
          title="Berikutnya (→)"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-black/60 hover:bg-blue-600/90 text-white flex items-center justify-center transition-all border border-white/10 hover:border-blue-400 cursor-pointer backdrop-blur-sm shadow-xl"
        >
          <i className="fa-solid fa-chevron-right text-lg"></i>
        </button>
      )}

      {/* Media content */}
      <div className="relative flex items-center justify-center w-full h-full px-16 py-12">

        {/* Photo */}
        {!isVideo && (
          <img
            src={item.source === 'gdrive' ? `/gdrive-media?id=${item.id}` : mediaUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 100px)', maxWidth: 'calc(100vw - 140px)' }}
          />
        )}

        {/* Google Drive Video — iframe with thumbnail shown while loading */}
        {isGDriveVideo && (
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: 'min(900px, calc(100vw - 140px))', height: 'calc(100vh - 100px)' }}
          >
            {/* Thumbnail shown before iframe loads */}
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 gap-4">
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-rose-600/90 flex items-center justify-center animate-pulse shadow-xl">
                    <i className="fa-solid fa-film text-white text-xl"></i>
                  </div>
                  <p className="text-white text-xs font-bold animate-pulse">Memuat video dari Google Drive...</p>
                </div>
              </div>
            )}
            <iframe
              src={`https://drive.google.com/file/d/${item.id}/preview?autoplay=1`}
              className="w-full h-full"
              style={{ border: 'none' }}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={item.title}
              onLoad={() => setIframeLoaded(true)}
            ></iframe>
          </div>
        )}

        {/* Local Video */}
        {isLocalVideo && !isHevc && (
          <video
            ref={videoRef}
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            preload="auto"
            className="rounded-2xl shadow-2xl"
            style={{ maxWidth: 'calc(100vw - 140px)', maxHeight: 'calc(100vh - 100px)' }}
          ></video>
        )}

        {/* MOV/HEVC — Chrome cannot play H.265, open with system player */}
        {isLocalVideo && isHevc && (
          <div className="flex flex-col items-center gap-5 text-center max-w-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl">
              <i className="fa-solid fa-film text-amber-400"></i>
            </div>
            <div>
              <p className="text-white font-extrabold text-sm mb-1">Format iPhone MOV (HEVC/H.265)</p>
              <p className="text-slate-400 text-xs">Chrome belum mendukung codec ini. Buka dengan media player bawaan laptop untuk memutar video ini.</p>
            </div>
            <a
              href={viewUrl}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center gap-2 transition-all shadow-lg"
            >
              <i className="fa-solid fa-play"></i> Putar di Media Player Laptop
            </a>
          </div>
        )}
      </div>

      {/* Caption bottom */}
      <div className="absolute bottom-4 left-0 right-0 text-center px-20 pointer-events-none">
        <p className="text-white font-bold text-sm drop-shadow-md truncate">
          {item.title}
          <span className="text-slate-400 font-normal text-xs ml-2">({item.accountName || 'Storage Gateway'})</span>
        </p>
      </div>
    </div>
  );
}
