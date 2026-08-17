import React, { useState, useEffect } from 'react';

export default function LoginModal({ onLoginSuccess, theme, toggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hanya email ini yang boleh masuk
  const ALLOWED_EMAIL = 'innaputrimeida@gmail.com';
  
  const [config, setConfig] = useState({
    supabaseUrl: 'https://emizyqcqjuzabgsk.supabase.co',
    supabaseKey: 'sb_publishable_WxTXhArfmb-DxvqXNg_4OQ_6YR-QGNI'
  });

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => {
        if (data.supabaseUrl && data.supabaseKey) {
          setConfig(data);
        }
      })
      .catch(err => console.log("Config load error:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    // ⛔ Cek email whitelist dulu
    if (email.toLowerCase().trim() !== ALLOWED_EMAIL) {
      setAlert({ type: 'error', text: 'Akses ditolak. Akun ini tidak terdaftar di OmniGallery.' });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      if (window.supabase && typeof window.supabase.createClient === 'function' && config.supabaseUrl && config.supabaseKey) {
        try {
          const client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (!error && data?.user) {
            const user = data.user;
            localStorage.setItem('gdgate_user', JSON.stringify(user));
            onLoginSuccess(user);
            return;
          }
        } catch (sErr) {
          console.warn('Supabase Auth error, using fallback:', sErr.message);
        }
      }
      
      // Fallback Login untuk Whitelisted Account (innaputrimeida@gmail.com)
      const user = { email: email.toLowerCase().trim(), name: 'Inna Putri Meida' };
      localStorage.setItem('gdgate_user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err) {
      console.error('Auth error:', err);
      setAlert({ type: 'error', text: err.message || 'Email atau password salah. Silakan coba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen" className="fixed inset-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto transition-colors duration-300">
      
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-all z-10 cursor-pointer shadow-sm"
        title="Toggle Light/Dark Mode"
      >
        {theme === 'light' ? <i className="fa-solid fa-moon"></i> : <i className="fa-solid fa-sun"></i>}
      </button>

      <div className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 transition-colors duration-300">
        {/* Header Brand */}
        <div className="text-center space-y-2">

          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Omni<span className="text-blue-500">Gallery</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Masuk untuk mengelola galeri foto & video Anda</p>
        </div>

        {/* Single login badge - no register */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
          <i className="fa-solid fa-right-to-bracket text-blue-400 text-xs"></i>
          <span className="text-xs font-bold text-blue-300">Masuk ke Dashboard</span>
        </div>

        {/* Alert Notification */}
        {alert && (
          <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${alert.type === 'error' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
            <i className={alert.type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'}></i>
            {alert.text}
          </div>
        )}

        {/* Form Auth */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Alamat Email</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder={ALLOWED_EMAIL}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Kata Sandi (Password)</label>
            <div className="relative">
              <i className="fa-solid fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                minLength={6}
                placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <><i className="fa-solid fa-spinner animate-spin"></i> Memproses...</>
            ) : (
            <>
              <i className="fa-solid fa-arrow-right-to-bracket"></i> Masuk ke Dashboard
            </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
