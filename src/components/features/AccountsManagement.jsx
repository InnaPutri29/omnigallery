import React, { useState } from 'react';
import { formatBytes } from '../../utils/formatters.js';
import { renameFolder, deleteAccount, editAccountLink } from '../../services/api.js';
import RenameModal from '../common/RenameModal.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';


export default function AccountsManagement({ accounts = [], allMedia = [], onOpenAddModal, onRefreshData }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [renameModalConfig, setRenameModalConfig] = useState({ isOpen: false, oldName: '' });
  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState({ isOpen: false, accName: null });
  
  // Sort state
  const [sortBy, setSortBy] = useState('time'); // 'time', 'name', 'size'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  const handleOpenDetail = (acc) => {
    setSelectedAccount(acc);
    setEditingName(acc.name);
    setEditingFolderId(acc.folderId || '');
    setAlert(null);
  };

  const handleDeleteAccountConfirm = (accName) => {
    setConfirmDeleteConfig({ isOpen: true, accName });
  };

  const executeDeleteAccount = async () => {
    const accName = confirmDeleteConfig.accName;
    setConfirmDeleteConfig({ isOpen: false, accName: null });
    if (!accName) return;

    try {
      const res = await deleteAccount(accName);
      if (res && !res.error) {
        if (selectedAccount && selectedAccount.name === accName) {
          setSelectedAccount(null);
        }
        if (onRefreshData) onRefreshData();
      } else {
        setAlert({ type: 'error', text: res?.error || 'Gagal menghapus akun' });
      }
    } catch (e) {
      setAlert({ type: 'error', text: 'Error: ' + e.message });
    }
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
      // Update nama folder jika berubah
      if (editingName.trim() !== selectedAccount.name) {
        const res = await renameFolder(
          selectedAccount.type,
          selectedAccount.name,
          editingName.trim(),
          selectedAccount.type === 'gdrive' ? selectedAccount.folderId : selectedAccount.path
        );

        if (!res || res.error) {
          setAlert({ type: 'error', text: res?.error || 'Gagal mengubah nama folder' });
          return;
        }
      }

      // Update link folder jika berubah (hanya untuk GDrive)
      if (selectedAccount.type === 'gdrive' && editingFolderId.trim() !== selectedAccount.folderId) {
        const linkRes = await editAccountLink(selectedAccount.id, editingFolderId.trim());
        if (!linkRes || linkRes.error) {
          setAlert({ type: 'error', text: linkRes?.error || 'Gagal mengubah link GDrive' });
          return;
        }
      }

      setAlert({ type: 'success', text: `Perubahan berhasil disimpan!` });
      if (onRefreshData) onRefreshData();
      setTimeout(() => {
        setSelectedAccount(null);
      }, 1200);
    } catch (err) {
      setAlert({ type: 'error', text: 'Error: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRenameSubfolderItem = (oldSubfolderName) => {
    setRenameModalConfig({ isOpen: true, oldName: oldSubfolderName });
  };

  const executeRenameSubfolder = async (newSubName) => {
    setRenameModalConfig({ isOpen: false, oldName: '' });
    const oldSubfolderName = renameModalConfig.oldName;
    
    setLoading(true);
    setAlert(null);

    try {
      const res = await renameFolder(selectedAccount.type, oldSubfolderName, newSubName);
      if (res && !res.error) {
        setAlert({ type: 'success', text: `Subfolder "${oldSubfolderName}" berhasil diubah menjadi "${newSubName}"!` });
        if (onRefreshData) onRefreshData();
      } else {
        setAlert({ type: 'error', text: res?.error || 'Gagal mengubah nama subfolder' });
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Error: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const accountMedia = selectedAccount ? allMedia.filter(m => m.accountName === selectedAccount.name) : [];
  const subfolders = selectedAccount ? [...new Set(accountMedia.map(m => m.subfolder).filter(Boolean))] : [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel dark:bg-slate-900 border border-white/60 dark:border-slate-800">
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">Manajemen Akun Storage</h2>
          <p className="text-xs text-slate-700 dark:text-slate-400 mt-1">Kelola koneksi akun Google Drive, ubah nama folder & subfolder, dan pantau direktori penyimpanan Anda.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Sort Control */}
          <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-white/60 dark:border-slate-800">
            <i className="fa-solid fa-arrow-down-a-z text-slate-500 dark:text-slate-400 text-xs"></i>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="time">Waktu Ditambahkan</option>
              <option value="name">Nama Akun</option>
              <option value="size">Ukuran Terpakai</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={`Urutkan: ${sortOrder === 'asc' ? 'Menaik' : 'Menurun'}`}
              className="ml-1 w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <i className={`fa-solid ${sortOrder === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`}></i>
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i> Hubungkan Akun Baru
          </button>
        </div>
      </div>

      {/* Grid Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...accounts].sort((a, b) => {
          let valA, valB;
          
          if (sortBy === 'name') {
            valA = (a.name || '').toLowerCase();
            valB = (b.name || '').toLowerCase();
          } else if (sortBy === 'size') {
            valA = a.usedBytes || 0;
            valB = b.usedBytes || 0;
          } else { // 'time'
            // Extract timestamp from ID if possible (e.g. acc-gdrive-1786676309508)
            const timeA = a.id.includes('-') ? parseInt(a.id.split('-').pop()) || 0 : 0;
            const timeB = b.id.includes('-') ? parseInt(b.id.split('-').pop()) || 0 : 0;
            valA = timeA;
            valB = timeB;
          }

          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        }).map(acc => {
          const percent = Math.min(100, Math.round((acc.usedBytes / (acc.totalBytes || 1)) * 100));
          const isDrive = acc.type === 'gdrive';
          const folderIds = (acc.folderId || '')
            .split(',')
            .map(id => id.trim())
            .filter(Boolean);

          return (
            <div key={acc.id} className="p-6 rounded-2xl glass-panel dark:bg-slate-900 border border-white/60 dark:border-slate-800 space-y-4 hover:border-blue-400 dark:hover:border-blue-500/40 transition-all shadow-md flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${acc.color || 'from-blue-600 to-indigo-600'} text-white flex items-center justify-center font-bold text-xl shadow-lg`}>
                      <i className={isDrive ? 'fa-brands fa-google-drive' : 'fa-solid fa-laptop'}></i>
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {isDrive ? 'Google Drive Cloud' : 'Local Disk'}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-800 dark:text-white mt-0.5">{acc.name}</h4>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Terhubung
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{acc.email}</p>
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

                <div className="space-y-2 pt-2 border-t border-white/40 dark:border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Penggunaan Kapasitas</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{percent}%</span>
                  </div>
                  <div className="w-full bg-white/50 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-white/60 dark:border-slate-800 p-0.5">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    <span>Terpakai: {formatBytes(acc.usedBytes)}</span>
                    <span>Total: {formatBytes(acc.totalBytes)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Lihat Detail & Edit Nama */}
              <div className="pt-3 border-t border-white/40 dark:border-slate-800/80 flex items-center justify-between">
                {!acc.id.startsWith('acc-local') ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenDetail(acc)}
                      className="px-3 py-2 rounded-xl bg-white/50 dark:bg-slate-800 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-white/60 dark:border-slate-700/80"
                    >
                      <i className="fa-solid fa-gear"></i> Detail & Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteAccountConfirm(acc.name)}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 dark:text-rose-400 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-rose-500/20"
                    >
                      <i className="fa-solid fa-trash-can"></i> Hapus Akun
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenDetail(acc)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/50 dark:bg-slate-800 hover:bg-white/80 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/60 dark:border-slate-700/80"
                  >
                    <i className="fa-solid fa-pen-to-square"></i> Lihat Detail & Edit Nama / Subfolder
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detail & Edit Nama Folder + Subfolders */}
      {selectedAccount && (
        <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen glass-overlay flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-panel dark:bg-slate-900 border border-white/60 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${selectedAccount.color || 'from-blue-600 to-indigo-600'} text-white flex items-center justify-center font-bold text-lg shadow-md`}>
                  <i className={selectedAccount.type === 'gdrive' ? 'fa-brands fa-google-drive' : 'fa-solid fa-laptop'}></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Detail & Edit Penyimpanan</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono truncate max-w-[220px]">{selectedAccount.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAccount(null)}
                className="w-8 h-8 rounded-xl bg-white/50 dark:bg-slate-800 hover:bg-white/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
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
            <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-950 border border-white/60 dark:border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tipe Penyimpanan:</span>
                <span className="text-slate-800 dark:text-white font-bold">{selectedAccount.type === 'gdrive' ? 'Google Drive Cloud' : 'Local Disk'}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Email Terhubung:</span>
                <span className="text-slate-800 dark:text-white font-bold truncate max-w-[200px]">{selectedAccount.email}</span>
              </div>
              {selectedAccount.type !== 'gdrive' && (
                <div className="text-slate-600 dark:text-slate-400 pt-1">
                  <span>Path Folder Disk:</span>
                  <p className="text-amber-600 dark:text-amber-400 break-all bg-white/50 dark:bg-slate-900 p-2 rounded-xl mt-1 border border-white/60 dark:border-slate-800">{selectedAccount.path}</p>
                </div>
              )}
            </div>

              {/* Section 1: Form Edit Nama Main Folder */}
              <form onSubmit={handleSaveRename} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Folder Utama / Penyimpanan</label>
                  <div className="relative">
                    <i className="fa-solid fa-folder-pen absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      required
                      placeholder="Masukkan nama folder baru..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 dark:bg-slate-950 border border-white/60 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                {selectedAccount.type === 'gdrive' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ID / Link Folder Google Drive</label>
                    <div className="relative">
                      <i className="fa-solid fa-link absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
                      <input
                        type="text"
                        value={editingFolderId}
                        onChange={(e) => setEditingFolderId(e.target.value)}
                        required
                        placeholder="Masukkan Link atau ID GDrive..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/50 dark:bg-slate-950 border border-white/60 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all font-semibold"
                      />
                    </div>
                  </div>
                )}

              {/* Section 2: Subfolders List & Rename */}
              <div className="space-y-2 pt-3 border-t border-white/40 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Daftar Subfolder di Penyimpanan Ini</label>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">{subfolders.length} Subfolder</span>
                </div>

                {subfolders.length === 0 ? (
                  <p className="text-xs text-slate-600 dark:text-slate-500 italic p-3 rounded-xl bg-white/40 dark:bg-slate-950 border border-white/60 dark:border-slate-800 text-center">
                    Tidak ada subfolder di penyimpanan ini.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {subfolders.map(sf => {
                      const count = accountMedia.filter(m => m.subfolder === sf).length;
                      return (
                        <div key={sf} className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 dark:bg-slate-950 border border-white/60 dark:border-slate-800 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <i className="fa-solid fa-folder text-amber-500 dark:text-amber-400"></i>
                            <span className="text-slate-800 dark:text-white font-semibold truncate">{sf}</span>
                            <span className="text-[10px] text-slate-600 dark:text-slate-500 font-mono">({count} file)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRenameSubfolderItem(sf)}
                            disabled={loading}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-[11px] transition-all flex items-center gap-1.5 border border-blue-500/30 cursor-pointer"
                          >
                            <i className="fa-solid fa-pen-to-square text-[10px]"></i> Edit Subfolder
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/40 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setSelectedAccount(null)} 
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-slate-300 dark:bg-slate-800 hover:bg-slate-400 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs transition-all cursor-pointer"
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

      {/* Rename Modal */}
      <RenameModal
        isOpen={renameModalConfig.isOpen}
        initialName={renameModalConfig.oldName}
        title={`Mengubah nama subfolder di akun ${selectedAccount ? selectedAccount.name : ''}`}
        onClose={() => setRenameModalConfig({ isOpen: false, oldName: '' })}
        onConfirm={executeRenameSubfolder}
      />

      {/* Delete Account Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDeleteConfig.isOpen}
        title="Hapus Penyimpanan?"
        message={`Apakah Anda yakin ingin menghapus akun "${confirmDeleteConfig.accName}"? Semua cache dari penyimpanan ini akan dihapus.`}
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        confirmColor="danger"
        icon="fa-trash-can"
        onClose={() => setConfirmDeleteConfig({ isOpen: false, accName: null })}
        onConfirm={executeDeleteAccount}
      />
    </div>
  );
}
