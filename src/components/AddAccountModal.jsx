function AddAccountModal({ onClose, onAddAccount }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [folderId, setFolderId] = React.useState('');
  const [color, setColor] = React.useState('from-blue-600 to-indigo-600');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !folderId) return;

    setSubmitting(true);
    await onAddAccount({
      name,
      email: email || 'account@google.com',
      folderId,
      color,
      type: 'gdrive'
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-lg font-bold">
              <i className="fa-brands fa-google-drive"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Hubungkan Akun Google Drive Baru</h3>
              <p className="text-xs text-slate-400">Masukkan tautan atau ID folder Google Drive yang ingin ditambahkan</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Nama Label Akun</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="Contoh: Drive Utama / Dokumentasi Acara" 
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Alamat Email (Opsional)</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="contoh@gmail.com" 
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Tautan (URL) atau ID Folder Google Drive Publik</label>
            <input 
              type="text" 
              value={folderId} 
              onChange={(e) => setFolderId(e.target.value)} 
              required 
              placeholder="https://drive.google.com/drive/folders/1MHI_3pZLMewn3wcpgQAXrzIuJpE9_GMe" 
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              *Pastikan status akses folder di Google Drive disetel ke <b>"Siapa saja yang memiliki link" (Public View)</b>.
            </p>
          </div>



          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
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
  );
}

window.AddAccountModal = AddAccountModal;
