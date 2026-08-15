import React from 'react';

export default function Settings({ theme, toggleTheme, contentMode, onToggleContentMode }) {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white shadow-lg">
          <i className="fa-solid fa-gear text-lg"></i>
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Pengaturan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Atur preferensi tampilan dan mode galeri</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tampilan (Tema) */}
        <div className="p-6 rounded-3xl glass-panel dark:bg-slate-900 border border-white/60 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/40 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <i className="fa-solid fa-palette"></i>
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Tampilan</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Mode Gelap</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Gunakan tema gelap untuk kenyamanan mata</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full p-1 flex items-center transition-all duration-300 ${theme === 'dark' ? 'bg-indigo-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </button>
          </div>
        </div>

        {/* Mode Konten */}
        <div className="p-6 rounded-3xl glass-panel dark:bg-slate-900 border border-white/60 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-white/40 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <i className="fa-solid fa-filter"></i>
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Mode Konten</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Sembunyikan Dokumen</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Hanya tampilkan Foto & Video (Mode Galeri)</p>
            </div>
            <button
              onClick={onToggleContentMode}
              className={`w-12 h-6 rounded-full p-1 flex items-center transition-all duration-300 ${contentMode === 'gallery' ? 'bg-blue-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
