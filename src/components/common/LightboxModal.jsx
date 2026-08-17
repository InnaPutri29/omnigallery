import React, { useEffect, useRef, useMemo, useState } from 'react';
import ConfirmModal from './ConfirmModal.jsx';

export default function LightboxModal({ item, allMedia = [], onNavigate, onClose, onDelete }) {
  const videoRef = useRef(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState({ isOpen: false, item: null, sourceLabel: '' });

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
      className="fixed inset-0 z-50 flex flex-col bg-slate-100/90 dark:bg-[rgba(2,6,23,0.82)] backdrop-blur-md"
    >
      {/* Top bar: counter + buttons */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
        <div className="px-3 py-1.5 rounded-xl bg-white/50 dark:bg-black/50 border border-slate-300/50 dark:border-white/10 text-slate-800 dark:text-white text-xs font-bold backdrop-blur-sm">
          {currentIndex + 1} / {allMedia.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(viewUrl, '_blank')}
            title="Buka File Asli"
            className="w-9 h-9 rounded-xl bg-white/50 dark:bg-white/10 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-white hover:text-white flex items-center justify-center transition-all border border-slate-300/50 dark:border-white/10 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-[11px]"></i>
          </button>
          <button
            onClick={() => setConfirmDeleteConfig({ isOpen: true, item, sourceLabel: item.source === 'gdrive' ? 'Google Drive' : 'Local Disk' })}
            title="Hapus File"
            className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-600 text-rose-500 dark:text-rose-300 hover:text-white flex items-center justify-center transition-all border border-rose-500/30 cursor-pointer"
          >
            <i className="fa-solid fa-trash-can text-[11px]"></i>
          </button>
          <button
            onClick={onClose}
            title="Tutup (Esc)"
            className="w-9 h-9 rounded-xl bg-white/50 dark:bg-white/10 hover:bg-rose-600 dark:hover:bg-rose-600 text-slate-700 dark:text-white hover:text-white flex items-center justify-center transition-all border border-slate-300/50 dark:border-white/10 cursor-pointer"
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

        {/* Google Drive Video */}
        {isGDriveVideo && (
          <div className="relative flex items-center justify-center w-full h-full">
            <iframe
              src={`https://drive.google.com/file/d/${item.id}/preview?autoplay=1`}
              className="w-full h-full"
              style={{
                border: 'none',
                background: 'transparent',
              }}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={item.title}
            ></iframe>
          </div>
        )}

        {/* Local Video */}
        {isLocalVideo && (
          <div className="relative flex items-center justify-center w-full h-full">
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
                background: 'transparent',
                opacity: isVideoLoading ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            ></video>
          </div>
        )}

        {/* Prev Arrow — Desktop only */}
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-white/60 dark:bg-black/60 hover:bg-blue-600/90 dark:hover:bg-blue-600/90 text-slate-800 dark:text-white hover:text-white items-center justify-center transition-all border border-slate-300/50 dark:border-white/10 cursor-pointer shadow-lg"
          >
            <i className="fa-solid fa-chevron-left text-lg"></i>
          </button>
        )}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-2xl bg-white/60 dark:bg-black/60 hover:bg-blue-600/90 dark:hover:bg-blue-600/90 text-slate-800 dark:text-white hover:text-white items-center justify-center transition-all border border-slate-300/50 dark:border-white/10 cursor-pointer shadow-lg"
          >
            <i className="fa-solid fa-chevron-right text-lg"></i>
          </button>
        )}
      </div>

      {/* Bottom bar: caption + mobile prev/next */}
      <div className="flex items-center justify-between gap-4 max-w-4xl mx-auto w-full px-4 pt-1 border-t border-slate-300/30 dark:border-white/10 mt-auto">
        <button
          onClick={goPrev}
          className={`md:hidden w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer flex-shrink-0 ${hasPrev ? 'bg-white/50 dark:bg-white/10 text-slate-700 dark:text-white border-slate-300/50 dark:border-white/10 hover:bg-blue-600 hover:text-white' : 'opacity-20 border-transparent bg-transparent cursor-default text-slate-700 dark:text-white'}`}
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>

        <div className="flex-1 text-center min-w-0 pb-3">
          <div className="text-slate-800 dark:text-white text-sm font-bold truncate" title={item.title || 'Media File'}>
            {item.title || 'Media File'}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-extrabold truncate mt-0.5">
            {item.subfolder || item.accountName || 'Unknown Storage'}
          </div>
        </div>

        <button
          onClick={goNext}
          className={`md:hidden w-10 h-10 rounded-xl flex items-center justify-center border transition-all cursor-pointer flex-shrink-0 ${hasNext ? 'bg-white/50 dark:bg-white/10 text-slate-700 dark:text-white border-slate-300/50 dark:border-white/10 hover:bg-blue-600 hover:text-white' : 'opacity-20 border-transparent bg-transparent cursor-default text-slate-700 dark:text-white'}`}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* Delete Media Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDeleteConfig.isOpen}
        title="Hapus Media?"
        message={`Apakah Anda yakin ingin menghapus "${confirmDeleteConfig.item?.title}" (${confirmDeleteConfig.sourceLabel})?`}
        confirmText="Ya, Hapus Media"
        cancelText="Batal"
        confirmColor="danger"
        icon="fa-trash-can"
        onClose={() => setConfirmDeleteConfig({ isOpen: false, item: null, sourceLabel: '' })}
        onConfirm={() => {
          if (onDelete && confirmDeleteConfig.item) onDelete(confirmDeleteConfig.item);
          setConfirmDeleteConfig({ isOpen: false, item: null, sourceLabel: '' });
        }}
      />
    </div>
  );
}
