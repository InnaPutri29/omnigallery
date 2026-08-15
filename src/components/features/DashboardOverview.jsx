import React from 'react';
import MediaCard from '../common/MediaCard.jsx';
import { formatBytes } from '../../utils/formatters.js';

export default function DashboardOverview({ accounts, allMedia, stats, onOpenLightbox, onNavigateToExplorer, contentMode }) {
  const recentItems = allMedia.slice(0, 4);

  const imageCount = allMedia.filter(m => m.type === 'image').length;
  const videoCount = allMedia.filter(m => m.type === 'video').length;
  const docCount = allMedia.filter(m => m.type === 'doc').length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Banner Selamat Datang */}
      <div className="relative overflow-hidden rounded-3xl glass-panel dark:bg-gradient-to-r dark:from-blue-900/40 dark:via-indigo-900/40 dark:to-slate-900 border border-white/60 dark:border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <i className="fa-solid fa-cloud-bolt"></i> Multi-Cloud Storage Aggregator
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Kelola Seluruh File & Media Cloud Anda dalam Satu Dashboard
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            OmniGallery menghubungkan ruang penyimpanan lokal komputer Anda dengan beberapa akun Google Drive secara aman & cepat.
          </p>
        </div>
      </div>

      {/* Ringkasan Statistik Media */}
      <div className={`grid grid-cols-2 gap-4 ${contentMode === 'gallery' ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
        <div className="p-4 rounded-3xl glass-panel dark:bg-slate-900/80 border border-white/60 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold">
            <i className="fa-solid fa-photo-film"></i>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Total Media</p>
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">{allMedia.length}</h4>
          </div>
        </div>

        <div className="p-4 rounded-3xl glass-panel dark:bg-slate-900/80 border border-white/60 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xl font-bold">
            <i className="fa-solid fa-image"></i>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Foto & Gambar</p>
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">{imageCount}</h4>
          </div>
        </div>

        <div className="p-4 rounded-3xl glass-panel dark:bg-slate-900/80 border border-white/60 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl font-bold">
            <i className="fa-solid fa-film"></i>
          </div>
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Video</p>
            <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">{videoCount}</h4>
          </div>
        </div>

        {contentMode !== 'gallery' && (
          <div className="p-4 rounded-3xl glass-panel dark:bg-slate-900/80 border border-white/60 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-file-lines"></i>
            </div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Dokumen</p>
              <h4 className="text-xl font-extrabold text-slate-800 dark:text-white">{docCount}</h4>
            </div>
          </div>
        )}
      </div>

      {/* Grid Akun Kuota */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <i className="fa-solid fa-hard-drive text-blue-600 dark:text-blue-400"></i> Kapasitas Penyimpanan Akun Terhubung
          </h3>
          <span className="text-xs text-slate-400 font-medium">{accounts.length} Akun Aktif</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map(acc => {
            const percent = Math.min(100, Math.round((acc.usedBytes / (acc.totalBytes || 1)) * 100));
            const isDrive = acc.type === 'gdrive';

            return (
              <div key={acc.id} className="p-5 rounded-3xl glass-panel dark:bg-slate-900/90 border border-white/60 dark:border-slate-800 space-y-4 hover:border-blue-400 dark:hover:border-blue-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${acc.type === 'local' ? 'from-teal-500 to-emerald-600' : 'from-blue-600 to-indigo-600'} text-white flex items-center justify-center font-bold shadow-md`}>
                      <i className={isDrive ? 'fa-brands fa-google-drive text-lg' : 'fa-solid fa-laptop text-lg'}></i>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{acc.name}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{acc.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Aktif
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Terpakai</span>
                    <span className="text-slate-800 dark:text-white font-mono">{percent}%</span>
                  </div>
                  <div className="w-full bg-white/50 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-white/60 dark:border-slate-800 p-0.5">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    <span>{formatBytes(acc.usedBytes)}</span>
                    <span>{formatBytes(acc.totalBytes)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Recent Media */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-blue-600 dark:text-blue-400"></i> Media Terbaru
          </h3>
          <button
            onClick={onNavigateToExplorer}
            className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua di Explorer <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {recentItems.map(item => (
            <MediaCard key={item.id} item={item} onOpenLightbox={(item) => onOpenLightbox(item, recentItems)} />
          ))}
        </div>
      </div>
    </div>
  );
}
