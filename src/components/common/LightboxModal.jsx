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

  const mediaUrl = item.source === 'local'
    ? `/media-file?path=${encodeURIComponent(item.id)}`
    : `/gdrive-media?id=${item.id}`;

  const viewUrl = item.source === 'gdrive'
    ? `https://drive.google.com/file/d/${item.id}/view`
    : mediaUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button - overlaid top right */}
      <button
        onClick={onClose}
        title="Tutup (Esc)"
        className="absolute top-5 right-5 z-20 w-10 h-10 rounded-2xl bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all border border-white/15 hover:border-rose-500 cursor-pointer backdrop-blur-sm shadow-xl"
      >
        <i className="fa-solid fa-xmark text-lg"></i>
      </button>

      {/* Open in new tab button - top right, beside close */}
      <a
        href={viewUrl}
        target="_blank"
        rel="noreferrer"
        title="Buka Tab Baru"
        className="absolute top-5 right-16 z-20 w-10 h-10 rounded-2xl bg-white/10 hover:bg-blue-600 text-white flex items-center justify-center transition-all border border-white/15 hover:border-blue-500 cursor-pointer backdrop-blur-sm shadow-xl"
      >
        <i className="fa-solid fa-up-right-from-square text-sm"></i>
      </a>

      {/* Media */}
      <div className="relative flex items-center justify-center w-full h-full px-4 py-16">
        {!isVideo ? (
          <img
            src={item.source === 'gdrive' ? `/gdrive-media?id=${item.id}` : mediaUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            style={{ maxHeight: 'calc(100vh - 130px)' }}
          />
        ) : isGDriveVideo ? (
          <iframe
            src={`https://drive.google.com/file/d/${item.id}/preview?autoplay=1`}
            className="rounded-2xl shadow-2xl"
            style={{
              width: 'min(900px, calc(100vw - 32px))',
              height: 'calc(100vh - 130px)',
              border: 'none'
            }}
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
            className="rounded-2xl shadow-2xl"
            style={{
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 130px)'
            }}
          ></video>
        )}
      </div>

      {/* Caption bottom */}
      <div className="absolute bottom-4 left-0 right-0 text-center px-4 pointer-events-none">
        <p className="text-white font-bold text-sm drop-shadow-md truncate">
          {item.title}
          <span className="text-slate-400 font-normal text-xs ml-2">({item.accountName || 'Storage Gateway'})</span>
        </p>
      </div>
    </div>
  );
}
