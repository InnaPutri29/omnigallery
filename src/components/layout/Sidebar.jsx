import React from 'react';
import { formatBytes } from '../../utils/formatters.js';

export default function Sidebar({ activeTab, onSwitchTab, stats }) {
  const totalUsed = stats ? stats.totalUsed || 0 : 0;
  const totalCapacity = stats ? stats.totalCapacity || 1 : 1;
  const percent = Math.min(100, Math.round((totalUsed / totalCapacity) * 100));

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-slate-900/50 flex-shrink-0 flex flex-col justify-between hidden md:flex transition-all">
      <div className="p-4 space-y-6">
        {/* Navigation Menu */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Navigasi Utama</p>
          
          <button 
            onClick={() => onSwitchTab('dashboard')}
            className={`nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-chart-pie w-5 text-center"></i>
            <span>Dashboard Overview</span>
          </button>
          
          <button 
            onClick={() => onSwitchTab('explorer')}
            className={`nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${activeTab === 'explorer' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-folder-tree w-5 text-center"></i>
            <span>File Explorer</span>
          </button>

          <button 
            onClick={() => onSwitchTab('accounts')}
            className={`nav-tab w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${activeTab === 'accounts' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-users-gear w-5 text-center"></i>
            <span>Manajemen Akun</span>
          </button>
        </div>

        {/* Storage Gauge Widget */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Total Kapasitas</span>
            <span className="font-extrabold text-blue-400">{percent}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 p-0.5">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${percent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>{formatBytes(totalUsed)} Terpakai</span>
            <span>{formatBytes(totalCapacity)} Total</span>
          </div>
        </div>
      </div>

      {/* Gateway System Info */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            <i className="fa-solid fa-server"></i>
          </div>
          <div>
            <h5 className="text-xs font-bold text-white">OmniGateway v2.0</h5>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span> Connected
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
