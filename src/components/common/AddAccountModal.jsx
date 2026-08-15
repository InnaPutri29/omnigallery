import React, { useState } from 'react';

export default function AddAccountModal({ onClose, onAddAccount }) {
  const [type, setType] = useState('gdrive'); // 'gdrive' or 'local'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [folderId, setFolderId] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [color, setColor] = useState('from-blue-600 to-indigo-600');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'gdrive' && (!name || !folderId)) return;
    if (type === 'local' && (!name || !localPath)) return;

    setSubmitting(true);
    await onAddAccount({
      name,
      email: type === 'local' ? (email || 'local@laptop.storage') : (email || 'account@google.com'),
      folderId: type === 'gdrive' ? folderId : undefined,
      path: type === 'local' ? localPath : undefined,
      color: type === 'local' ? 'from-teal-500 to-emerald-600' : color,
      type
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] w-screen h-screen min-h-screen glass-overlay flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 overflow-y-auto space-y-6 flex-1 w-full custom-scrollbar-container">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${type === 'gdrive' ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400' : 'bg-teal-500/20 text-teal-600 dark:text-teal-400'} flex items-center justify-center text-lg font-bold transition-colors`}>
                <i className={type === 'gdrive' ? 'fa-brands fa-google-drive' : 'fa-solid fa-laptop'}></i>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Hubungkan Akun Baru</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tambahkan direktori {type === 'gdrive' ? 'Google Drive' : 'Local Disk'} ke galeri</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 cursor-pointer transition-colors">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipe Penyimpanan Selector */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setType('gdrive')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${type === 'gdrive' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <i className="fa-brands fa-google-drive"></i> Google Drive
              </button>
              <button
                type="button"
                onClick={() => setType('local')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${type === 'local' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <i className="fa-solid fa-laptop"></i> Local Disk
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Nama Label Akun</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder={type === 'gdrive' ? "Contoh: Drive Utama / Dokumentasi Acara" : "Contoh: iCloud Photos / Harddisk Ext"} 
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>

            {type === 'gdrive' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Alamat Email (Opsional)</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="contoh@gmail.com" 
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Tautan (URL) atau ID Folder Google Drive Publik</label>
                  <input 
                    type="text" 
                    value={folderId} 
                    onChange={(e) => setFolderId(e.target.value)} 
                    required={type === 'gdrive'} 
                    placeholder="https://drive.google.com/drive/folders/1MHI_..." 
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all font-mono"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    *Pastikan status akses folder di Google Drive disetel ke <b>"Siapa saja yang memiliki link" (Public View)</b>.
                  </p>
                </div>
              </>
            )}

            {type === 'local' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Path Folder Disk / Flashdisk</label>
                <input 
                  type="text" 
                  value={localPath} 
                  onChange={(e) => setLocalPath(e.target.value)} 
                  required={type === 'local'} 
                  placeholder="Contoh: D:\Foto Kuliah atau C:\Users\HP\Pictures\iCloud Photos" 
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all font-mono"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  *Masukkan path / lokasi absolut dari folder yang ada di komputer Anda.
                </p>
              </div>
            )}



          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {submitting ? 'Menghubungkan...' : 'Simpan & Hubungkan'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
