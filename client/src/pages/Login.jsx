import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { LogIn, Eye, EyeOff, Globe } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t, toggle, lang } = useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Language toggle */}
      <button onClick={toggle} className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm z-10">
        <Globe size={18} />
        {lang === 'en' ? 'العربية' : 'English'}
      </button>

      {/* Login card */}
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="glass-card p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-2xl mb-4 shadow-lg shadow-primary-500/30 animate-pulse-glow">
              A
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
              {t('app_name')}
            </h1>
            <p className="text-white/40 mt-1 text-sm">{t('sign_in_subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">{t('username')}</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="input-field" placeholder="admin" required autoFocus id="login-username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">{t('password')}</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12" placeholder="••••••••" required id="login-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2" id="login-submit">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn size={18} />}
              {t('sign_in')}
            </button>
          </form>

          <div className="mt-6 p-4 bg-white/5 rounded-xl">
            <p className="text-xs text-white/40 mb-2">Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-white/60">
              <span>Admin:</span><span className="font-mono">admin / password123</span>
              <span>PM:</span><span className="font-mono">sarah_pm / password123</span>
              <span>Creator:</span><span className="font-mono">omar_creator / password123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
