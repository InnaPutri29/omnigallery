import React from 'react';

export default function Navbar({ searchQuery, onSearchChange, onOpenAddModal, onOpenUploadModal, user, onLogout }) {
  return (
    <header className="h-14 md:h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-3 md:px-6 flex items-center justify-between gap-3">
      {/* Left Brand Logo */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <i className="fa-solid fa-photo-film text-base md:text-xl"></i>
        </div>
        <div>
          <span className="font-extrabold text-base md:text-lg tracking-tight text-white">
            Omni<span className="text-blue-500">Gallery</span>
          </span>
          <p className="text-[10px] text-slate-400 hidden lg:block">Multi-Account Cloud & Local Photos Hub</p>
        </div>
      </div>

      {/* Search Bar — hidden on mobile, shown on md+ */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari file, foto, video..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Icon */}
        <button
          className="md:hidden w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 flex items-center justify-center cursor-pointer"
          onClick={() => {
            const q = window.prompt('Cari file...');
            if (q !== null) onSearchChange(q);
          }}
        >
          <i className="fa-solid fa-magnifying-glass text-sm"></i>
        </button>

        {/* Upload Button */}
        <button
          onClick={onOpenUploadModal}
          className="px-2.5 md:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-cloud-arrow-up"></i>
          <span className="hidden sm:inline">Unggah Media</span>
        </button>

        {/* Add Account Button */}
        <button
          onClick={onOpenAddModal}
          className="px-2.5 md:px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-user-plus"></i>
          <span className="hidden sm:inline">Hubungkan</span>
        </button>

        {/* User Avatar + Logout */}
        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200">
          <i className="fa-solid fa-circle-user text-blue-400 text-sm flex-shrink-0"></i>
          <span className="truncate max-w-[60px] md:max-w-[120px] hidden xs:block">{user ? (user.email || '').split('@')[0] : 'User'}</span>
          <button
            onClick={onLogout}
            title="Keluar"
            className="text-slate-400 hover:text-rose-400 transition-colors p-0.5 cursor-pointer flex-shrink-0"
          >
            <i className="fa-solid fa-right-from-bracket text-xs"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
