import React, { useState } from 'react';
import { formatBytes } from '../../utils/formatters.js';
import { renameFolder } from '../../services/api.js';

export default function AccountsManagement({ accounts = [], onOpenAddModal, onRefreshData }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleOpenDetail = (acc) => {
    setSelectedAccount(acc);
    setEditingName(acc.name);
    setAlert(null);
  };

  const handleSaveRename = async (e) => {
    e.preventDefault();
    if (!editingName || !editingName.trim()) return;

    if (editingName.trim() === selectedAccount.name) {
      setSelectedAccount(null);
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const res = await renameFolder(
        selectedAccount.type,
        selectedAccount.name,
        editingName.trim(),
        selectedAccount.type === 'gdrive' ? selectedAccount.folderId : selectedAccount.path
      );

      if (res && !res.error) {
        setAlert({ type: 'success', text: `Nama folder berhasil diubah menjadi "${editingName.trim()}"!` });
        if (onRefreshData) onRefreshData();
        setTimeout(() => {
          setSelectedAccount(null);
        }, 1200);
      } else {
        setAlert({ type: 'error', text: res?.error || 'Gagal mengubah nama folder' });
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Error: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white">Manajemen Akun Storage</h2>
          <p className="text-xs text-slate-400 mt-1">Kelola koneksi akun Google Drive, ubah nama folder, dan pantau direktori penyimpanan Anda.</p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <i className="fa-solid fa-plus"></i> Hubungkan Akun Baru
        </button>
      </div>

      {/* Grid Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map(acc => {
          const percent = Math.min(100, Math.round((acc.usedBytes / (acc.totalBytes || 1)) * 100));
          const isDrive = acc.type === 'gdrive';
          const folderIds = (acc.folderId || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);

          return (
            <div key={acc.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 hover:border-blue-500/40 transition-all shadow-md flex flex-col justify-between">
              <div className="space-y-4">
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

              {/* Action Buttons: Lihat Detail & Edit Nama */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
                <button
                  onClick={() => handleOpenDetail(acc)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-700/80"
                >
                  <i className="fa-solid fa-pen-to-square"></i> Lihat Detail & Edit Nama
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detail & Edit Nama Folder */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${selectedAccount.color || 'from-blue-600 to-indigo-600'} text-white flex items-center justify-center font-bold text-lg shadow-md`}>
                  <i className={selectedAccount.type === 'gdrive' ? 'fa-brands fa-google-drive' : 'fa-solid fa-laptop'}></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Detail & Edit Penyimpanan</h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{selectedAccount.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAccount(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Alert Notification */}
            {alert && (
              <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${alert.type === 'error' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                <i className={alert.type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'}></i>
                {alert.text}
              </div>
            )}

            {/* Account Info Cards */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Tipe Penyimpanan:</span>
                <span className="text-white font-bold">{selectedAccount.type === 'gdrive' ? 'Google Drive Cloud' : 'Local Disk'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Email Terhubung:</span>
                <span className="text-white font-bold truncate max-w-[180px]">{selectedAccount.email}</span>
              </div>
              {selectedAccount.type === 'gdrive' ? (
                <div className="text-slate-400 pt-1">
                  <span>ID Folder Google Drive:</span>
                  <p className="text-blue-400 break-all bg-slate-900 p-2 rounded-xl mt-1 border border-slate-800">{selectedAccount.folderId}</p>
                </div>
              ) : (
                <div className="text-slate-400 pt-1">
                  <span>Path Folder Disk:</span>
                  <p className="text-amber-400 break-all bg-slate-900 p-2 rounded-xl mt-1 border border-slate-800">{selectedAccount.path}</p>
                </div>
              )}
            </div>

            {/* Form Edit Nama Folder */}
            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Nama Folder / Penyimpanan</label>
                <div className="relative">
                  <i className="fa-solid fa-folder-pen absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    required
                    placeholder="Masukkan nama folder baru..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  {selectedAccount.type === 'gdrive' 
                    ? '⚠️ Mengubah nama di sini akan otomatis mengubah nama folder langsung di akun Google Drive Anda.' 
                    : '⚠️ Mengubah nama di sini akan otomatis merename nama folder di hardisk Windows Anda.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setSelectedAccount(null)} 
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !editingName.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Menyimpan...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
