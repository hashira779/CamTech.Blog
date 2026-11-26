import { useState } from 'react';
import { Database, Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function DatabaseMigration() {
  const [targetUrl, setTargetUrl] = useState('');
  const [copyData, setCopyData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleMigrate = async () => {
    if (!targetUrl) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/admin/database/migrate', {
        target_url: targetUrl,
        copy_data: copyData,
      });
      setResult({ success: true, message: response.data.message });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setResult({
        success: false,
        message: axiosErr.response?.data?.detail || axiosErr.message || 'Migration failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <div className="pb-5 border-b border-zinc-800/80">
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2.5 tracking-tight">
          <Database className="w-6 h-6 text-emerald-400" />
          Database Connection &amp; Migration
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Point the backend to another PostgreSQL instance and run schema migrations safely.
        </p>
      </div>

      <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/80 p-6 max-w-2xl space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">Target Database URL</label>
          <div className="relative">
            <Server className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="postgresql+psycopg2://user:password@host:5432/dbname"
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5">
            Supports PostgreSQL, MySQL, or SQLite connection strings.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="copyData"
            checked={copyData}
            onChange={(e) => setCopyData(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
          />
          <label htmlFor="copyData" className="text-xs text-zinc-300 font-medium">
            Attempt to copy existing rows to the target database
          </label>
        </div>

        <div className="pt-4 border-t border-zinc-800/80">
          <button
            onClick={handleMigrate}
            disabled={loading || !targetUrl}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            <span>{loading ? 'Connecting & Migrating...' : 'Connect & Auto-Migrate'}</span>
          </button>
        </div>

        {result && (
          <div
            className={`mt-4 p-4 rounded-lg flex items-start gap-3 border text-xs ${
              result.success
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-red-500/10 text-red-300 border-red-500/20'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            )}
            <div>
              <h4 className="font-semibold">{result.success ? 'Success' : 'Migration Failed'}</h4>
              <p className="mt-1 text-zinc-300">{result.message}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 max-w-2xl">
        <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-zinc-400" />
          Before Migrating
        </h3>
        <ul className="mt-2 space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
          <li>Creates required PostgreSQL schema tables automatically before copying records.</li>
          <li>Always keep a verified backup before switching a live production database URL.</li>
        </ul>
      </div>
    </div>
  );
}
