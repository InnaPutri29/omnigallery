import React, { useEffect } from 'react';

export default function LightboxModal({ item, onClose }) {
  const videoRef = React.useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log("Autoplay prevented:", err));
    }
  }, [item]);

  if (!item) return null;

  const mediaUrl = item.url || (item.source === 'local' ? `/media-file?path=${encodeURIComponent(item.id)}` : `/gdrive-media?id=${item.id}`);
  const viewUrl = item.viewUrl || (item.source === 'gdrive' ? `https://drive.google.com/file/d/${item.id}/view` : mediaUrl);
  const isVideo = item.type === 'video';
  const isMov = (item.ext || '').toLowerCase() === '.mov';
  const isGDriveVideo = isVideo && item.source === 'gdrive';

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors p-2 z-10 cursor-pointer"
      >
        <i className="fa-solid fa-xmark text-3xl"></i>
      </button>

      <div className="relative w-full max-w-4xl max-h-[80vh] flex flex-col items-center justify-center space-y-3">
        {!isVideo ? (
          <img 
            src={item.source === 'gdrive' ? `/gdrive-media?id=${item.id}` : mediaUrl} 
            alt={item.title} 
            referrerPolicy="no-referrer" 
            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl scale-100 transition-transform duration-300"
          />
        ) : isGDriveVideo ? (
          <iframe 
            src={`https://drive.google.com/file/d/${item.id}/preview?autoplay=1`}
            className="w-full h-[70vh] max-w-4xl rounded-2xl shadow-2xl border border-slate-800"
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
            className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl"
          ></video>
        )}
      </div>

      <div className="mt-4 text-center space-y-2 max-w-2xl">
        <p className="text-slate-200 text-base font-bold drop-shadow-md">
          {item.title} <span className="text-xs text-slate-400 font-normal">({item.accountName || 'Storage Gateway'})</span>
        </p>

        {isVideo && !isGDriveVideo && isMov && (
          <div className="mt-1 text-xs font-semibold text-rose-400 bg-rose-950/50 border border-rose-500/30 p-2 rounded-xl">
            ⚠️ Format iPhone MOV (Codec HEVC/H.265). Chrome Windows membutuhkan pemutar bawaan laptop untuk memutarnya. Klik tombol merah di bawah untuk buka/putar di player laptop.
          </div>
        )}

        <div className="pt-2">
          {isVideo && !isGDriveVideo ? (
            <a 
              href={viewUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-lg border border-rose-400/40"
            >
              <i className="fa-solid fa-play"></i> Putar Video di Tab Baru / Media Player ({item.sizeFormatted || ''})
            </a>
          ) : (
            <a 
              href={viewUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-xs transition-all border border-blue-500/30"
            >
              <i className="fa-solid fa-up-right-from-square"></i> Buka di Google Drive Web
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
