import { useState, useEffect } from 'react';
import { 
  Save,
  Key,
  Bot,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

interface SystemSetting {
  key: string;
  value_json: string;
  description: string | null;
}

// Must match DEFAULTS in apps/api/app/services/news_autopilot.py
const AUTOPILOT_DEFAULTS: Record<string, string> = {
  AUTOPILOT_NEWS_ENABLED: 'true',
  AUTOPILOT_DAILY_NEWS_ENABLED: 'true',
  AUTOPILOT_DAILY_NEWS_HOUR: '7',
  AUTOPILOT_AUTO_PUBLISH_ENABLED: 'true',
  AUTOPILOT_PUBLISH_DELAY_HOURS: '2',
  AUTOPILOT_MAX_PUBLISH_PER_RUN: '10',
  AUTOPILOT_MIN_CONTENT_CHARS: '300',
  AUTOPILOT_ARCHIVE_AFTER_DAYS: '7',
  AUTOPILOT_PURGE_AFTER_DAYS: '30',
};

type AutopilotField =
  | { key: string; label: string; help: string; type: 'toggle' }
  | { key: string; label: string; help: string; type: 'number'; min: number; max: number; suffix: string };

const AUTOPILOT_FIELDS: AutopilotField[] = [
  { key: 'AUTOPILOT_NEWS_ENABLED', type: 'toggle', label: 'Autopilot master switch', help: 'Turn off to stop all automatic publishing, archiving and daily AI news.' },
  { key: 'AUTOPILOT_DAILY_NEWS_ENABLED', type: 'toggle', label: 'Daily AI news generation', help: 'Gemini writes fresh stories for every category once a day.' },
  { key: 'AUTOPILOT_DAILY_NEWS_HOUR', type: 'number', min: 0, max: 23, suffix: 'h (Cambodia time)', label: 'Daily news hour', help: 'Hour of the day the daily AI news run starts.' },
  { key: 'AUTOPILOT_AUTO_PUBLISH_ENABLED', type: 'toggle', label: 'Hybrid auto-publish', help: 'Gemini drafts that pass the quality gate go live after the review window unless you reject them.' },
  { key: 'AUTOPILOT_PUBLISH_DELAY_HOURS', type: 'number', min: 0, max: 168, suffix: 'hours', label: 'Review window', help: 'Time you have to reject a draft before it auto-publishes.' },
  { key: 'AUTOPILOT_MAX_PUBLISH_PER_RUN', type: 'number', min: 0, max: 100, suffix: 'per 5 min', label: 'Publish limit', help: 'Safety cap on how many stories go live per worker cycle.' },
  { key: 'AUTOPILOT_MIN_CONTENT_CHARS', type: 'number', min: 0, max: 5000, suffix: 'characters', label: 'Minimum length', help: 'Shorter drafts are held for manual review.' },
  { key: 'AUTOPILOT_ARCHIVE_AFTER_DAYS', type: 'number', min: 1, max: 365, suffix: 'days', label: 'Archive stale drafts after', help: 'Unpublished AI drafts and rejected stories are hidden (restorable).' },
  { key: 'AUTOPILOT_PURGE_AFTER_DAYS', type: 'number', min: 7, max: 3650, suffix: 'days', label: 'Delete archived after', help: 'Archived AI stories that were never public are permanently removed.' },
];

export default function Settings() {
  const [, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Form states
  const [geminiKey, setGeminiKey] = useState('');
  const [youKey, setYouKey] = useState('');
  const [newsApiKey, setNewsApiKey] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChannel, setTelegramChannel] = useState('');

  // News Autopilot
  const [autopilot, setAutopilot] = useState<Record<string, string>>({ ...AUTOPILOT_DEFAULTS });
  const [lastDailyRun, setLastDailyRun] = useState<string | null>(null);
  const setAp = (key: string, value: string) => setAutopilot(prev => ({ ...prev, [key]: value }));

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get<SystemSetting[]>('/admin/settings');
      setSettings(res.data || []);
      
      // Parse values
      const ap: Record<string, string> = { ...AUTOPILOT_DEFAULTS };
      res.data?.forEach(s => {
        if (s.key === 'GEMINI_API_KEY') setGeminiKey(s.value_json);
        if (s.key === 'YOU_API_KEY') setYouKey(s.value_json);
        if (s.key === 'NEWS_API_KEY') setNewsApiKey(s.value_json);
        if (s.key === 'TELEGRAM_BOT_TOKEN') setTelegramToken(s.value_json);
        if (s.key === 'TELEGRAM_CHANNEL_ID') setTelegramChannel(s.value_json);
        if (s.key in AUTOPILOT_DEFAULTS && s.value_json !== '') ap[s.key] = s.value_json;
        if (s.key === 'AUTOPILOT_DAILY_NEWS_LAST_RUN') setLastDailyRun(s.value_json);
      });
      setAutopilot(ap);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      showToast('error', 'Unable to retrieve system configurations.');
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
        { key: 'YOU_API_KEY', value_json: youKey, description: 'You.com API Key for AI Search Fallback' },
        { key: 'NEWS_API_KEY', value_json: newsApiKey, description: 'News API Key for fetching external articles' },
        { key: 'TELEGRAM_BOT_TOKEN', value_json: telegramToken, description: 'Telegram Bot Token for Auto-Posting' },
        { key: 'TELEGRAM_CHANNEL_ID', value_json: telegramChannel, description: 'Telegram Channel ID (e.g., @camtechblog)' },
        ...Object.entries(autopilot).map(([key, value_json]) => ({
          key,
          value_json,
          description: AUTOPILOT_FIELDS.find(f => f.key === key)?.label ?? 'News Autopilot setting',
        })),
      ];
      await api.put('/admin/settings', updates);
      showToast('success', 'System configurations saved successfully.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast('error', 'Failed to update system configurations.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">System Settings</h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Configure external API integrations, distribution channels, and system secrets.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={fetchSettings}
            disabled={loading || saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>
          
          <button 
            onClick={handleSave}
            disabled={loading || saving}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 font-medium px-4 py-1.5 rounded-lg text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="h-5 w-48 skeleton-shimmer rounded mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-28 skeleton-shimmer rounded" />
              <div className="h-10 w-full skeleton-shimmer rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-36 skeleton-shimmer rounded" />
              <div className="h-10 w-full skeleton-shimmer rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-32 skeleton-shimmer rounded" />
              <div className="h-10 w-full skeleton-shimmer rounded-lg" />
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="h-5 w-40 skeleton-shimmer rounded mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-32 skeleton-shimmer rounded" />
              <div className="h-10 w-full skeleton-shimmer rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-36 skeleton-shimmer rounded" />
              <div className="h-10 w-full skeleton-shimmer rounded-lg" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* News Autopilot Section */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-zinc-400" />
                <h2 className="text-sm font-medium text-zinc-200">AI News Autopilot</h2>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                Last daily run: {lastDailyRun || 'never'}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-zinc-400">
                The worker checks every 5 minutes. Every automatic action is recorded in the audit log, and archived stories can be restored from Articles.
              </p>
              {AUTOPILOT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <label htmlFor={field.key} className="block text-xs font-medium text-zinc-300">{field.label}</label>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{field.help}</p>
                  </div>
                  {field.type === 'toggle' ? (
                    <button
                      id={field.key}
                      type="button"
                      role="switch"
                      aria-checked={autopilot[field.key] === 'true'}
                      onClick={() => setAp(field.key, autopilot[field.key] === 'true' ? 'false' : 'true')}
                      className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${
                        autopilot[field.key] === 'true' ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        autopilot[field.key] === 'true' ? 'translate-x-4' : ''
                      }`} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        id={field.key}
                        type="number"
                        min={field.min}
                        max={field.max}
                        value={autopilot[field.key]}
                        onChange={(e) => setAp(field.key, e.target.value)}
                        className="w-20 bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-2 text-sm text-zinc-100 text-right focus:outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="text-[10px] text-zinc-500 w-28">{field.suffix}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

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
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">You.com API Key (Fallback)</label>
                <input
                  type="password"
                  value={youKey}
                  onChange={(e) => setYouKey(e.target.value)}
                  placeholder="Paste your You.com API key here"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Used automatically when Gemini API quota is exceeded.</p>
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
