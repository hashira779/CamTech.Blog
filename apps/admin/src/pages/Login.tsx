import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@dailydiscovery.com');
  const [password, setPassword] = useState('AdminDaily2026!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.access_token) {
        localStorage.setItem('admin_token', res.data.access_token);
        localStorage.setItem('admin_user', JSON.stringify(res.data.user || {}));
        navigate('/dashboard');
      } else {
        setError('No access token received from server.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const detail = err.response?.data?.detail || 'Incorrect credentials or server offline.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased text-zinc-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        {/* Brand Mark */}
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-950 font-bold flex items-center justify-center text-sm shadow-sm">
            CT
          </div>
        </div>
        <h2 className="mt-5 text-center text-lg font-semibold tracking-tight text-zinc-100">
          Sign in to CamTech Editorial
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-400">
          Enter credentials to manage content and infrastructure
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm px-4 sm:px-0">
        <div className="bg-zinc-900/50 p-6 sm:p-7 rounded-lg border border-zinc-800/80 shadow-2xl backdrop-blur-sm">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-zinc-300">
                Email address
              </label>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="admin@dailydiscovery.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@dailydiscovery.com');
                    setPassword('AdminDaily2026!');
                  }}
                  className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Use Default Credentials
                </button>
              </div>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                defaultChecked
                className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-zinc-400 cursor-pointer">
                Remember this workstation for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-md transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>Connected to live backend API</span>
        </div>
      </div>
    </div>
  );
}
