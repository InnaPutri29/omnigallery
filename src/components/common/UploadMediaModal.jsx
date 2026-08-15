import React, { useState } from 'react';
import { uploadMedia } from '../../services/api.js';

export default function UploadMediaModal({ accounts = [], onClose, onUploadSuccess }) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setAlert({ type: 'error', text: 'Pilih minimal 1 file foto atau video untuk diunggah.' });
      return;
    }

    if (!selectedAccount) {
      setAlert({ type: 'error', text: 'Pilih tujuan penyimpanan terlebih dahulu.' });
      return;
    }

    setLoading(true);
    setAlert(null);

    const formData = new FormData();
    formData.append('destinationType', selectedAccount.type);
    formData.append('targetId', selectedAccount.type === 'gdrive' ? selectedAccount.folderId : selectedAccount.path);

    files.forEach(f => formData.append('files', f));

    try {
      const res = await uploadMedia(formData);
      if (res && res.uploadedResults && res.uploadedResults.length > 0) {
        setAlert({ type: 'success', text: `Berhasil mengunggah ${res.uploadedResults.length} file ke ${selectedAccount.name} (${selectedAccount.email || selectedAccount.path})!` });
        setFiles([]);
        if (onUploadSuccess) onUploadSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setAlert({ type: 'error', text: res?.error || (res?.errors && res.errors[0]) || 'Gagal mengunggah file. Silakan coba lagi.' });
      }
    } catch (err) {
      setAlert({ type: 'error', text: 'Terjadi kesalahan: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen glass-overlay flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 w-full custom-scrollbar-container">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Unggah Media Baru</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Simpan langsung ke Google Drive atau Folder Lokal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Target Destination Dropdown */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tujuan Penyimpanan</label>
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white transition-all cursor-pointer font-medium flex items-center justify-between shadow-sm hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <div className="truncate">
                {selectedAccount ? (
                  <>
                    <i className={selectedAccount.type === 'gdrive' ? 'fa-brands fa-google-drive text-emerald-500 mr-2' : 'fa-solid fa-laptop text-teal-600 mr-2'}></i>
                    {selectedAccount.type === 'gdrive' ? `${selectedAccount.name} (${selectedAccount.email})` : (selectedAccount.name === selectedAccount.path ? selectedAccount.name : `${selectedAccount.name} (${selectedAccount.path})`)}
                  </>
                ) : 'Pilih Penyimpanan'}
              </div>
              <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}></i>
            </div>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-y-auto max-h-60 py-2 animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar-container">
                  {/* GDrive Group */}
                  {accounts.filter(a => a.type === 'gdrive').length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fa-brands fa-google-drive text-emerald-500"></i> Google Drive Cloud
                      </div>
                      {accounts.filter(a => a.type === 'gdrive').map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => { setSelectedAccountId(a.id); setShowDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 ${selectedAccountId === a.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          <span className="truncate flex-1">{a.name} <span className="opacity-60">({a.email})</span></span>
                          {selectedAccountId === a.id && <i className="fa-solid fa-check text-blue-500"></i>}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Local Group */}
                  {accounts.filter(a => a.type === 'local').length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <i className="fa-solid fa-laptop text-teal-600"></i> Penyimpanan Lokal
                      </div>
                      {accounts.filter(a => a.type === 'local').map(a => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => { setSelectedAccountId(a.id); setShowDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 ${selectedAccountId === a.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          <span className="truncate flex-1">{a.name === a.path ? a.name : `${a.name} (${a.path})`}</span>
                          {selectedAccountId === a.id && <i className="fa-solid fa-check text-blue-500"></i>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* File Drag & Drop Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pilih Foto atau Video</label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500/50 rounded-2xl p-6 text-center bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group"
              onClick={() => document.getElementById('file-input-modal').click()}
            >
              <input 
                id="file-input-modal"
                type="file" 
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-400 group-hover:scale-110 flex items-center justify-center mx-auto mb-2 transition-all">
                <i className="fa-solid fa-file-arrow-up text-xl"></i>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Klik atau Tarik File ke Sini</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Mendukung format JPG, PNG, WEBP, MP4, MOV, dll (Maks 10 file sekaligus)</p>
            </div>
          </div>

          {/* Selected Files Preview List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{files.length} file dipilih:</p>
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <i className={f.type.startsWith('video/') ? 'fa-solid fa-film text-purple-600 dark:text-purple-400' : 'fa-solid fa-image text-blue-600 dark:text-blue-400'}></i>
                    <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{f.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-500">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-300 dark:bg-slate-800 hover:bg-slate-400 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs transition-all cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading || files.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Mengunggah...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up"></i> Unggah Sekarang
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
