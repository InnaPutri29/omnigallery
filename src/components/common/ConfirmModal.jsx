import React from 'react';

export default function ConfirmModal({ isOpen, title, message, confirmText, cancelText, confirmColor, icon, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 text-center">
        <div className="flex justify-center mb-2">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${confirmColor === 'danger' ? 'bg-rose-500/20 text-rose-500 dark:text-rose-400 shadow-rose-500/30' : 'bg-blue-500/20 text-blue-500 dark:text-blue-400 shadow-blue-500/30'}`}>
            <i className={`fa-solid ${icon || 'fa-triangle-exclamation'}`}></i>
          </div>
        </div>
        
        <div>
          <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">{title || 'Konfirmasi'}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{message}</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            type="button" 
            onClick={onClose} 
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all cursor-pointer"
          >
            {cancelText || 'Batal'}
          </button>
          <button 
            type="button" 
            onClick={onConfirm}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all cursor-pointer ${confirmColor === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'}`}
          >
            {confirmText || 'Ya, Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
