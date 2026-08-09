import React, { useState } from 'react';
import { uploadMedia } from '../../services/api.js';

export default function UploadMediaModal({ accounts = [], onClose, onUploadSuccess }) {
  const [selectedTargetId, setSelectedTargetId] = useState(accounts[0]?.folderId || accounts[0]?.path || '');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const selectedAccount = accounts.find(a => a.folderId === selectedTargetId || a.path === selectedTargetId || a.id === selectedTargetId) || accounts[0];

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
        setAlert({ type: 'success', text: `Berhasil mengunggah ${res.uploadedResults.length} file ke ${selectedAccount.name}!` });
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-lg">
              <i className="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">Unggah Media Baru</h3>
              <p className="text-xs text-slate-400">Simpan langsung ke Google Drive atau Folder Lokal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Target Destination Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Tujuan Penyimpanan</label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer font-medium"
            >
              <optgroup label="☁️ Google Drive Cloud">
                {accounts.filter(a => a.type === 'gdrive').map(a => (
                  <option key={a.id} value={a.folderId || a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </optgroup>
              <optgroup label="💻 Penyimpanan Lokal">
                {accounts.filter(a => a.type === 'local').map(a => (
                  <option key={a.id} value={a.path || a.id}>
                    {a.name} ({a.path})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* File Drag & Drop Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Pilih Foto atau Video</label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-center bg-slate-950/50 hover:bg-slate-950 transition-all cursor-pointer group"
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
              <p className="text-xs font-bold text-white">Klik atau Tarik File ke Sini</p>
              <p className="text-[10px] text-slate-400 mt-1">Mendukung format JPG, PNG, WEBP, MP4, MOV, dll (Maks 10 file sekaligus)</p>
            </div>
          </div>

          {/* Selected Files Preview List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              <p className="text-[11px] font-bold text-slate-400">{files.length} file dipilih:</p>
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <i className={f.type.startsWith('video/') ? 'fa-solid fa-film text-purple-400' : 'fa-solid fa-image text-blue-400'}></i>
                    <span className="text-slate-200 font-medium truncate">{f.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{(f.size / (1024 * 1024)).toFixed(1)} MB</span>
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all cursor-pointer"
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
  );
}
