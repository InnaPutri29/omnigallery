import React from 'react';

export default function MediaCard({ item, onOpenLightbox }) {
  const mediaUrl = item.url || (item.source === 'local' ? `/photos/${item.id}` : `https://drive.google.com/thumbnail?id=${item.id}&sz=w800`);
  const viewUrl = item.viewUrl || (item.source === 'gdrive' ? `https://drive.google.com/file/d/${item.id}/view` : `/media-file?path=${encodeURIComponent(item.id)}`);
  const isVideo = item.type === 'video';

  const handleClick = (e) => {
    e.stopPropagation();
    if (isVideo) {
      // Directly open and play video instantly in new tab/player
      window.open(viewUrl, '_blank');
    } else {
      onOpenLightbox(item);
    }
  };

  if (isVideo) {
    const videoThumbnailSource = item.source === 'gdrive' 
      ? `/gdrive-media?id=${item.id}` 
      : `${mediaUrl}#t=0.5`;

    return (
      <div 
        onClick={handleClick}
        className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md hover:shadow-2xl hover:border-rose-500/40 transition-all duration-300 cursor-pointer"
      >
        <div className="aspect-video bg-slate-950 overflow-hidden relative flex items-center justify-center">
          {item.source === 'gdrive' ? (
            <img 
              src={videoThumbnailSource} 
              alt={item.title} 
              loading="lazy" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <video 
              src={videoThumbnailSource} 
              preload="metadata" 
              muted 
              playsInline 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
            ></video>
          )}

          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-all border border-rose-400/40 backdrop-blur-sm">
              <i className="fa-solid fa-play text-lg ml-0.5"></i>
            </div>
          </div>

          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-rose-400 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 border border-rose-500/30">
            <i className="fa-solid fa-film"></i> VIDEO
          </div>

          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-[10px] font-mono">
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
    const fallbackUrl = item.source === 'gdrive' ? `https://drive.google.com/uc?export=view&id=${item.id}` : '';

    return (
      <div 
        onClick={handleClick}
        className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 cursor-pointer"
      >
        <div className="aspect-video bg-slate-950 overflow-hidden relative">
          <img 
            src={mediaUrl} 
            alt={item.title} 
            loading="lazy" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.onerror = null;
              if (fallbackUrl) {
                e.target.src = fallbackUrl;
              } else {
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-xs font-bold gap-1"><i class="fa-solid fa-image text-2xl text-purple-400/50"></i>Foto</div>';
              }
            }}
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
              Pratinjau
            </span>
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
