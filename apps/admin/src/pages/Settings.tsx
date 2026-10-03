import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  Save,
  Key,
  Bot,
  RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';

interface SystemSetting {
  key: string;
  value_json: string;
  description: string | null;
}

export default function Settings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [geminiKey, setGeminiKey] = useState('');
  const [newsApiKey, setNewsApiKey] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChannel, setTelegramChannel] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get<SystemSetting[]>('/admin/settings');
      setSettings(res.data || []);
      
      // Parse values
      res.data?.forEach(s => {
        if (s.key === 'GEMINI_API_KEY') setGeminiKey(s.value_json);
        if (s.key === 'NEWS_API_KEY') setNewsApiKey(s.value_json);
        if (s.key === 'TELEGRAM_BOT_TOKEN') setTelegramToken(s.value_json);
        if (s.key === 'TELEGRAM_CHANNEL_ID') setTelegramChannel(s.value_json);
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'GEMINI_API_KEY', value_json: geminiKey, description: 'Google Gemini API Key for Auto-News' },
        { key: 'NEWS_API_KEY', value_json: newsApiKey, description: 'News API Key for fetching external articles' },
        { key: 'TELEGRAM_BOT_TOKEN', value_json: telegramToken, description: 'Telegram Bot Token for Auto-Posting' },
        { key: 'TELEGRAM_CHANNEL_ID', value_json: telegramChannel, description: 'Telegram Channel ID (e.g., @camtechblog)' },
      ];
      await api.put('/admin/settings', updates);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">System Settings</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Configure API keys, Telegram automation, and integrations.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={fetchSettings}
            disabled={loading || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>
          
          <button 
            onClick={handleSave}
            disabled={loading || saving}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-1.5 rounded-md text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-zinc-500 font-mono text-sm">
          Loading Configurations...
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Configuration Section */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center gap-2">
              <Key size={16} className="text-zinc-400" />
              <h2 className="text-sm font-medium text-zinc-200">AI & News API Integrations</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Google Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Required for the AI Auto-News generation feature.</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">NewsAPI Key</label>
                <input
                  type="password"
                  value={newsApiKey}
                  onChange={(e) => setNewsApiKey(e.target.value)}
                  placeholder="Paste your NewsAPI key here"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Telegram Bot Automation Section */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center gap-2">
              <Bot size={16} className="text-zinc-400" />
              <h2 className="text-sm font-medium text-zinc-200">Telegram Bot Automation</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-zinc-400 pb-2">
                Configure your Telegram bot to automatically broadcast new articles when they are published.
              </p>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Telegram Bot Token</label>
                <input
                  type="password"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target Channel / Chat ID</label>
                <input
                  type="text"
                  value={telegramChannel}
                  onChange={(e) => setTelegramChannel(e.target.value)}
                  placeholder="@camtechblog or -100123456789"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Make sure the bot is added as an Administrator to this channel.</p>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
