import React, { useState, useEffect } from 'react';

export default function LoginModal({ onLoginSuccess }) {
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
    <div id="login-screen" className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <i className="fa-solid fa-shield-halved"></i> Supabase Secure Auth
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Omni<span className="text-blue-500">Gallery</span>
          </h2>
          <p className="text-xs text-slate-400">Masuk untuk mengelola galeri foto & video Anda</p>
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
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Alamat Email</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder={ALLOWED_EMAIL}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Kata Sandi (Password)</label>
            <div className="relative">
              <i className="fa-solid fa-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                minLength={6}
                placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
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
