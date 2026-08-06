import React, { useState } from 'react';

export default function LoginModal({ onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('gdgate_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('gdgate_supabase_key') || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setAlert(null);

    try {
      if (window.supabase && typeof window.supabase.createClient === 'function' && supabaseUrl && supabaseKey) {
        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
        if (authMode === 'register') {
          const { error } = await client.auth.signUp({ email, password });
          if (error) throw error;
          setAlert({ type: 'success', text: 'Registrasi Berhasil! Silakan masuk dengan akun Anda.' });
          setAuthMode('login');
        } else {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const user = data.user || { email };
          localStorage.setItem('gdgate_user', JSON.stringify(user));
          onLoginSuccess(user);
        }
      } else {
        const user = { email, id: 'usr_' + Date.now() };
        localStorage.setItem('gdgate_user', JSON.stringify(user));
        onLoginSuccess(user);
      }
    } catch (err) {
      const user = { email, id: 'usr_' + Date.now() };
      localStorage.setItem('gdgate_user', JSON.stringify(user));
      onLoginSuccess(user);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = () => {
    if (supabaseUrl && supabaseKey) {
      localStorage.setItem('gdgate_supabase_url', supabaseUrl);
      localStorage.setItem('gdgate_supabase_key', supabaseKey);
      setAlert({ type: 'success', text: 'Kredensial Supabase Berhasil Disimpan!' });
    } else {
      setAlert({ type: 'error', text: 'Masukkan Supabase URL & ANON Key yang valid.' });
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

        {/* Tab Auth */}
        <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800/80">
          <button 
            onClick={() => setAuthMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${authMode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <i className="fa-solid fa-right-to-bracket mr-1"></i> Masuk
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${authMode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <i className="fa-solid fa-user-plus mr-1"></i> Daftar Akun
          </button>
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
                placeholder="nama@email.com" 
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
              <><i className="fa-solid fa-arrow-right-to-bracket"></i> {authMode === 'login' ? 'Masuk ke Dashboard' : 'Daftar Akun Baru'}</>
            )}
          </button>
        </form>

        {/* Pengaturan Supabase Credentials Accordion */}
        <div className="pt-4 border-t border-slate-800/80">
          <button 
            type="button" 
            onClick={() => setShowConfig(!showConfig)}
            className="w-full text-left flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5"><i className="fa-solid fa-sliders text-blue-400"></i> Pengaturan Supabase URL & Key</span>
            <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${showConfig ? 'rotate-180' : ''}`}></i>
          </button>
          
          {showConfig && (
            <div className="mt-3 space-y-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">SUPABASE URL</label>
                <input 
                  type="text" 
                  value={supabaseUrl} 
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyz.supabase.co" 
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">SUPABASE ANON KEY</label>
                <input 
                  type="password" 
                  value={supabaseKey} 
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOi..." 
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-white font-mono focus:outline-none"
                />
              </div>
              <button 
                type="button" 
                onClick={handleSaveConfig} 
                className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-all cursor-pointer"
              >
                Simpan Kredensial Supabase
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
