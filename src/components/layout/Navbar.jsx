import React from 'react';

export default function Navbar({ searchQuery, onSearchChange, onOpenAddModal, user, onLogout }) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
      {/* Left Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <i className="fa-solid fa-photo-film text-xl"></i>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-white">
              Omni<span className="text-blue-500">Gallery</span>
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide">
              Media Gateway
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Multi-Account Cloud & Local Photos Hub</p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari file, foto, video, atau dokumen di seluruh akun..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onOpenAddModal}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs md:text-sm shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <i className="fa-solid fa-user-plus"></i>
          <span className="hidden sm:inline">Hubungkan Akun</span>
        </button>

        <div className="w-px h-6 bg-slate-800"></div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200">
          <i className="fa-solid fa-circle-user text-blue-400 text-sm"></i>
          <span className="truncate max-w-[140px]">{user ? user.email : 'Pengguna OmniGallery'}</span>
          <button 
            onClick={onLogout}
            title="Keluar / Logout" 
            className="ml-1 text-slate-400 hover:text-rose-400 transition-colors p-1 cursor-pointer"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
