import React from 'react';
import { formatBytes } from '../../utils/formatters.js';

export default function Sidebar({ activeTab, onSwitchTab, stats, isOpen, onClose }) {
  const totalUsed = stats ? stats.totalUsed || 0 : 0;
  const totalCapacity = stats ? stats.totalCapacity || 1 : 1;
  const percent = Math.min(100, Math.round((totalUsed / totalCapacity) * 100));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        ></div>
      )}
      
      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/40 dark:border-slate-800/80 glass-panel dark:glass-panel flex-shrink-0 flex flex-col justify-between transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 space-y-6">
        {/* Navigation Menu */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Navigasi Utama</p>
          
          <button 
            onClick={() => { onSwitchTab('dashboard'); onClose?.(); }}
            className={`nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-chart-pie w-5 text-center"></i>
            <span>Dashboard Overview</span>
          </button>
          
          <button 
            onClick={() => { onSwitchTab('explorer'); onClose?.(); }}
            className={`nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${activeTab === 'explorer' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-folder-tree w-5 text-center"></i>
            <span>File Explorer</span>
          </button>

          <button 
            onClick={() => { onSwitchTab('accounts'); onClose?.(); }}
            className={`nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${activeTab === 'accounts' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-users-gear w-5 text-center"></i>
            <span>Manajemen Akun</span>
          </button>

          <button 
            onClick={() => { onSwitchTab('settings'); onClose?.(); }}
            className={`nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-gear w-5 text-center"></i>
            <span>Pengaturan</span>
          </button>
        </div>

        {/* Storage Gauge Widget */}
        <div className="p-4 rounded-2xl glass-panel dark:bg-gradient-to-b dark:from-slate-800/80 dark:to-slate-900/90 border border-white/60 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Total Kapasitas</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400">{percent}%</span>
          </div>
          <div className="w-full bg-white/50 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/60 dark:border-slate-800 p-0.5">
            <div 
              className="bg-gradient-to-r from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>{formatBytes(totalUsed)} Terpakai</span>
            <span>{formatBytes(totalCapacity)} Total</span>
          </div>
        </div>
      </div>


    </aside>
    </>
  );
}
