import React from 'react';

export default function MediaCard({ item, onOpenLightbox }) {
  const isVideo = item.type === 'video';
  const isLocal = item.source === 'local';

  // ⚡ Thumbnail URL — pakai endpoint thumbnail kecil (WebP 400px) untuk lokal
  const thumbUrl = isLocal
    ? isVideo
      ? `/video-thumb?path=${encodeURIComponent(item.id)}`        // Frame video via FFmpeg
      : `/thumbnail?path=${encodeURIComponent(item.id)}&w=400`    // Gambar resize WebP
    : isVideo
      ? `https://drive.google.com/thumbnail?id=${item.id}&sz=w400` // GDrive video thumb
      : `https://drive.google.com/thumbnail?id=${item.id}&sz=w400`; // GDrive image thumb

  const handleClick = (e) => {
    e.stopPropagation();
    onOpenLightbox(item);
  };

  if (isVideo) {
    return (
      <div
        onClick={handleClick}
        className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
      >
        <div className="aspect-video bg-slate-950 overflow-hidden relative flex items-center justify-center">
          <img
            src={thumbUrl}
            alt={item.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

          {/* Tombol biru muncul di pojok kanan atas saat dihover (sama seperti foto, tapi icon play) */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-8 h-8 rounded-xl bg-blue-600/90 text-white flex items-center justify-center shadow-lg backdrop-blur-sm">
              <i className="fa-solid fa-play text-xs ml-0.5"></i>
            </div>
          </div>

          {/* Indikator kecil di kiri bawah agar tahu ini video */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-[10px] font-mono flex items-center gap-1">
            <i className="fa-solid fa-film text-[9px] text-blue-400"></i>
            {(item.ext || 'MP4').replace('.', '').toUpperCase()}
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <h4 className="font-bold text-xs text-white truncate" title={item.title}>{item.title}</h4>
          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="truncate max-w-[130px]">{item.accountName || 'Storage Gateway'}</span>
            <span className="font-mono">{item.sizeFormatted || ''}</span>
          </p>
        </div>
      </div>
    );
  } else {
    return (
      <div
        onClick={handleClick}
        className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
      >
        <div className="aspect-video bg-slate-950 overflow-hidden relative">
          <img
            src={thumbUrl}
            alt={item.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback ke URL asli jika thumbnail gagal
              if (isLocal) {
                e.target.src = `/media-file?path=${encodeURIComponent(item.id)}`;
              }
            }}
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />

          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-8 h-8 rounded-xl bg-blue-600/90 text-white flex items-center justify-center shadow-lg backdrop-blur-sm">
              <i className="fa-solid fa-magnifying-glass-plus text-xs"></i>
            </div>
          </div>
        </div>

        <div className="p-3.5 space-y-1">
          <h4 className="font-bold text-xs text-white truncate" title={item.title}>{item.title}</h4>
          <p className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="truncate max-w-[130px]">{item.accountName || 'Storage Gateway'}</span>
            <span className="font-mono">{item.sizeFormatted || ''}</span>
          </p>
        </div>
      </div>
    );
  }
}
