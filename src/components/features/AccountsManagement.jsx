import React from 'react';
import { formatBytes } from '../../utils/formatters.js';

export default function AccountsManagement({ accounts, onOpenAddModal }) {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white">Manajemen Akun Storage</h2>
          <p className="text-xs text-slate-400 mt-1">Kelola koneksi akun Google Drive dan direktori penyimpanan lokal Anda.</p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> Hubungkan Akun Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map(acc => {
          const percent = Math.min(100, Math.round((acc.usedBytes / (acc.totalBytes || 1)) * 100));
          const isDrive = acc.type === 'gdrive';
          const folderIds = (acc.folderId || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);

          return (
            <div key={acc.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-blue-500/40 transition-all shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${acc.color || 'from-blue-600 to-indigo-600'} text-white flex items-center justify-center font-bold text-xl shadow-lg`}>
                    <i className={isDrive ? 'fa-brands fa-google-drive' : 'fa-solid fa-laptop'}></i>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 uppercase tracking-wider">
                      {isDrive ? 'Google Drive Cloud' : 'Local Disk'}
                    </span>
                    <h4 className="font-extrabold text-base text-white mt-0.5">{acc.name}</h4>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Terhubung
                </span>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-mono">{acc.email}</p>
                {isDrive && folderIds.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-[11px] text-slate-400 font-mono truncate" title={acc.folderId}>
                      ID Folder: {acc.folderId}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {folderIds.map((fId, idx) => {
                        const cleanId = fId.replace(/.*folders\//, '').replace(/.*id=/, '');
                        const url = `https://drive.google.com/drive/folders/${cleanId}`;
                        const label = folderIds.length > 1 ? `Buka Folder Drive ${idx + 1}` : 'Buka Folder Drive';
                        return (
                          <a 
                            key={fId + idx}
                            href={url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs font-bold transition-all border border-blue-500/30 shadow-sm"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> {label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Penggunaan Kapasitas</span>
                  <span className="font-bold text-blue-400 font-mono">{percent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 p-0.5">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Terpakai: {formatBytes(acc.usedBytes)}</span>
                  <span>Total: {formatBytes(acc.totalBytes)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
