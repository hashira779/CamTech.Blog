import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  const isSessionExpired = searchParams.get('expired') === '1' || searchParams.get('expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.access_token) {
        login(res.data.access_token, res.data.user || {});
        navigate(redirectPath, { replace: true });
      } else {
        setError('No access token received from server.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let detail = err.response?.data?.detail;
      if (!detail) {
        if (err.response?.status === 502 || err.response?.status === 503 || err.response?.status === 504) {
          detail = 'Backend service is restarting for deployment updates. Please wait a moment and try again.';
        } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          detail = 'Connection timed out. Please check your network and try again.';
        } else {
          detail = 'Incorrect credentials or server offline.';
        }
      }
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
          <img
            src="/logo.png"
            alt="CamTech Logo"
            className="w-12 h-12 rounded-xl object-contain bg-zinc-900 border border-zinc-700/60 shadow-md"
          />
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
          {isSessionExpired && !error && (
            <div className="mb-4 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
              <Info size={14} className="shrink-0" />
              <span>Your session expired or authentication is required. Please sign in to continue.</span>
            </div>
          )}

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
                  placeholder="you@camtech.cam"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">
                  Password
                </label>
                {/*
                  A button used to sit here that filled this form in with the seeded super-admin
                  address and its password. This page is served to the whole internet at
                  cms.camtech.cam, so it was not a convenience - it was the admin credential, in a
                  downloadable bundle, one click from working. Any account it named has to be
                  treated as published and have its password changed.
                */}
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
