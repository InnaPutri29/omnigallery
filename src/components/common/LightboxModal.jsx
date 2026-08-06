import React, { useEffect, useRef, useMemo } from 'react';

export default function LightboxModal({ item, allMedia = [], onNavigate, onClose }) {
  const videoRef = useRef(null);

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
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [item]);

  if (!item) return null;

  const isVideo = item.type === 'video';
  const isGDriveVideo = isVideo && item.source === 'gdrive';
  const isLocalVideo = isVideo && item.source === 'local';
  const isMov = (item?.ext || '').toLowerCase() === '.mov';
  const isHevc = isMov; // MOV dari iPhone = HEVC/H.265

  // URL video: MOV/HEVC pakai transcode endpoint, lainnya stream langsung
  const mediaUrl = item.source === 'local'
    ? isHevc
      ? `/transcode-video?path=${encodeURIComponent(item.id)}`  // Transcode HEVC → H.264
      : `/media-file?path=${encodeURIComponent(item.id)}`       // Stream langsung
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

        {/* Google Drive Video — iframe direct */}
        {isGDriveVideo && (
          <iframe
            src={`https://drive.google.com/file/d/${item.id}/preview?autoplay=1`}
            className="rounded-2xl shadow-2xl"
            style={{
              width: 'min(900px, calc(100vw - 140px))',
              height: 'calc(100vh - 100px)',
              border: 'none'
            }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={item.title}
          ></iframe>
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
