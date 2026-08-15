import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export default function RenameModal({ isOpen, initialName, title, onClose, onConfirm }) {
  const [newName, setNewName] = useState(initialName || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNewName(initialName || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newName || !newName.trim()) return;
    onConfirm(newName.trim());
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[200] w-screen h-screen min-h-screen glass-overlay flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-bold">
            <i className="fa-solid fa-pen-to-square"></i>
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white">Ubah Nama Subfolder</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{title}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              ref={inputRef}
              type="text" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              required 
              placeholder="Masukkan nama baru..." 
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={!newName.trim() || newName.trim() === initialName}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs shadow-lg shadow-amber-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
