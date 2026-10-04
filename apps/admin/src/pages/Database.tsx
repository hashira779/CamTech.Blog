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
        copy_data: copyData
      });
      setResult({ success: true, message: response.data.message });
    } catch (err: any) {
      setResult({ 
        success: false, 
        message: err.response?.data?.detail || err.message || 'Migration failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" />
            Super System: Database Migration
          </h1>
          <p className="text-gray-500 mt-1">
            Connect to external databases dynamically and run auto-migrations.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
        <div className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Database URL
            </label>
            <div className="relative">
              <Server className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="postgresql+psycopg2://user:password@host:5432/dbname"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Supports PostgreSQL, MySQL, SQLite, etc. (e.g., mysql+pymysql://...)
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="copyData"
              checked={copyData}
              onChange={(e) => setCopyData(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
            />
            <label htmlFor="copyData" className="text-sm text-gray-700 font-medium">
              Attempt to copy existing data to the new database
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleMigrate}
              disabled={loading || !targetUrl}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Database className="w-5 h-5" />
              )}
              {loading ? 'Connecting & Migrating...' : 'Connect & Auto-Migrate'}
            </button>
          </div>

          {result && (
            <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
              result.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold">{result.success ? 'Success' : 'Migration Failed'}</h4>
                <p className="text-sm mt-1">{result.message}</p>
              </div>
            </div>
          )}

        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 max-w-2xl">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          How this Smart System works
        </h3>
        <ul className="mt-2 space-y-2 text-sm text-blue-800 list-disc list-inside">
          <li><strong>Auto-Creation:</strong> It will connect to the target database and automatically generate all tables required by the application.</li>
          <li><strong>Data Copy (Beta):</strong> If checked, it will attempt to copy all rows from the current database. This works best between similar SQL dialects.</li>
          <li><strong>Permanent Switch:</strong> To permanently switch the app to use this new database, update the <code>DATABASE_URL</code> in your <code>docker-compose.yml</code> or <code>.env</code> file and restart the server.</li>
        </ul>
      </div>
    </div>
  );
}
