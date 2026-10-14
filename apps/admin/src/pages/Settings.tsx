import { useState, useEffect } from 'react';
import { 
  Save,
  Key,
  Bot,
  RefreshCw,
  Sparkles,
  Cpu,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Zap
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
  AUTOPILOT_DISCOVERY_ENABLED: 'true',
  AUTOPILOT_DISCOVERY_INTERVAL_HOURS: '24',
  AUTOPILOT_QUIZ_ENABLED: 'true',
  AUTOPILOT_TRAVEL_ENABLED: 'true',
  AUTOPILOT_TRAVEL_INTERVAL_HOURS: '168',
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
  { key: 'AUTOPILOT_DISCOVERY_ENABLED', type: 'toggle', label: 'AI Visual Discoveries', help: 'Gemini drafts evergreen "how things work" explainers for the Discover section.' },
  { key: 'AUTOPILOT_DISCOVERY_INTERVAL_HOURS', type: 'number', min: 1, max: 720, suffix: 'hours', label: 'Discovery interval', help: 'How often new discoveries are drafted.' },
  { key: 'AUTOPILOT_QUIZ_ENABLED', type: 'toggle', label: 'AI Daily Quiz', help: 'A fresh quiz is generated every day (Cambodia time) with a rotating topic.' },
  { key: 'AUTOPILOT_TRAVEL_ENABLED', type: 'toggle', label: 'AI Travel Guides & Events', help: 'Gemini drafts destination guides and upcoming festivals with real dates.' },
  { key: 'AUTOPILOT_TRAVEL_INTERVAL_HOURS', type: 'number', min: 1, max: 2160, suffix: 'hours', label: 'Travel interval', help: 'How often guides and events are refreshed.' },
];

interface ProviderRow {
  id: string;
  label: string;
  style: string;
  model: string;
  base_url: string;
  api_key: string;
  enabled: boolean;
  temperature: number;
  max_tokens: number;
  supports_search: boolean;
  requires_key: boolean;
  has_key?: boolean;
}

const PROVIDER_STYLES = ['openai', 'gemini', 'anthropic'];

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
  const [running, setRunning] = useState<string | null>(null);
  const setAp = (key: string, value: string) => setAutopilot(prev => ({ ...prev, [key]: value }));

  // AI Providers registry
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [catalog, setCatalog] = useState<ProviderRow[]>([]);
  const [dirtyKeys, setDirtyKeys] = useState<Record<string, boolean>>({});
  const [savingProviders, setSavingProviders] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [providerLoading, setProviderLoading] = useState(true);
  const [addPick, setAddPick] = useState('');

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
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setProviderLoading(true);
    try {
      const res = await api.get('/admin/ai-providers');
      const rows: ProviderRow[] = (res.data?.providers ?? []).map((p: any) => ({ ...p, api_key: '' }));
      setProviders(rows);
      setCatalog(res.data?.catalog ?? []);
      setDirtyKeys({});
    } catch (err) {
      console.error('Failed to fetch AI providers:', err);
      showToast('error', 'Unable to load AI provider configuration.');
    } finally {
      setProviderLoading(false);
    }
  };

  const updateProvider = (id: string, patch: Partial<ProviderRow>) =>
    setProviders(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const toggleProvider = (id: string) =>
    setProviders(prev => prev.map(p => (p.id === id ? { ...p, enabled: !p.enabled } : p)));

  const setProviderKey = (id: string, val: string) => {
    setProviders(prev => prev.map(p => (p.id === id ? { ...p, api_key: val } : p)));
    setDirtyKeys(prev => ({ ...prev, [id]: true }));
  };

  const moveProvider = (idx: number, dir: -1 | 1) =>
    setProviders(prev => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const removeProvider = (id: string) => setProviders(prev => prev.filter(p => p.id !== id));

  const addProvider = () => {
    const item = catalog.find(c => c.id === addPick);
    if (!item) return;
    setProviders(prev =>
      prev.some(p => p.id === item.id) ? prev : [...prev, { ...item, api_key: '', has_key: false }],
    );
    setAddPick('');
  };

  const addCustomProvider = () => {
    const id = `custom-${Date.now().toString(36)}`;
    setProviders(prev => [
      ...prev,
      { id, label: 'Custom Provider', style: 'openai', model: '', base_url: '', api_key: '',
        enabled: false, temperature: 0.5, max_tokens: 2048, supports_search: false, requires_key: true, has_key: false },
    ]);
  };

  const saveProviders = async () => {
    setSavingProviders(true);
    try {
      const payload = providers.map(p => ({
        id: p.id,
        label: p.label,
        style: p.style,
        model: p.model,
        base_url: p.base_url,
        enabled: !!p.enabled,
        temperature: Number(p.temperature) || 0.5,
        max_tokens: Number(p.max_tokens) || 2048,
        supports_search: !!p.supports_search,
        requires_key: p.requires_key !== false,
        api_key: dirtyKeys[p.id] ? ((p.api_key || '').trim() || '__CLEAR__') : '',
      }));
      const res = await api.put('/admin/ai-providers', { providers: payload });
      setProviders((res.data?.providers ?? []).map((p: any) => ({ ...p, api_key: '' })));
      setDirtyKeys({});
      showToast('success', 'AI providers saved. Top-to-bottom order is the fallback priority.');
    } catch (err) {
      console.error('Failed to save providers:', err);
      showToast('error', 'Failed to save AI provider configuration.');
    } finally {
      setSavingProviders(false);
    }
  };

  const testProvider = async (id: string) => {
    setTestingId(id);
    setTestResults(prev => ({ ...prev, [id]: 'Testing…' }));
    try {
      const res = await api.post('/admin/ai-providers/test', { provider_id: id });
      const ok = !!res.data?.ok;
      const detail = ok
        ? `Works (${res.data.model})`
        : `Failed: ${JSON.stringify(res.data?.detail ?? res.data ?? '')}`.slice(0, 90);
      setTestResults(prev => ({ ...prev, [id]: detail }));
      showToast(ok ? 'success' : 'error', `${id}: ${detail}`);
    } catch (err) {
      setTestResults(prev => ({ ...prev, [id]: 'Request failed' }));
      showToast('error', 'Provider test request failed.');
    } finally {
      setTestingId(null);
    }
  };

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

  const runAutopilotAction = async (action: 'lifecycle' | 'discoveries' | 'quiz' | 'travel') => {
    setRunning(action);
    try {
      const res = action === 'lifecycle'
        ? await api.post('/admin/autopilot/run')
        : await api.post(`/admin/autopilot/generate?section=${action}`);
      const detail = JSON.stringify(res.data ?? {});
      showToast('success', `${action} finished: ${detail.slice(0, 120)}`);
    } catch (err) {
      console.error('Autopilot action failed:', err);
      showToast('error', `Action "${action}" failed. Check that the Gemini key is set.`);
    } finally {
      setRunning(null);
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
          {/* AI Providers Registry Section */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-zinc-400" />
                <h2 className="text-sm font-medium text-zinc-200">AI Providers</h2>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {providers.filter(p => p.enabled && (p.has_key || p.api_key || !p.requires_key)).length} active
              </span>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-zinc-400">
                Connect any number of AI vendors. Generators try the enabled providers top-to-bottom and
                automatically fall back to the next one if a key is missing or a request fails, so one bad
                key never stops the AI pipeline. Reorder to set priority.
              </p>

              {providerLoading ? (
                <div className="space-y-3">
                  <div className="h-16 w-full skeleton-shimmer rounded-lg" />
                  <div className="h-16 w-full skeleton-shimmer rounded-lg" />
                </div>
              ) : (
                <div className="space-y-3">
                  {providers.map((p, idx) => (
                    <div key={p.id} className="border border-zinc-800 rounded-lg p-3 space-y-3 bg-zinc-950/30">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={p.enabled}
                            onClick={() => toggleProvider(p.id)}
                            className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${
                              p.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                              p.enabled ? 'translate-x-4' : ''
                            }`} />
                          </button>
                          <input
                            value={p.label}
                            onChange={(e) => updateProvider(p.id, { label: e.target.value })}
                            className="bg-transparent text-sm font-medium text-zinc-100 focus:outline-none focus:border-b focus:border-blue-500 min-w-0"
                          />
                          {p.has_key && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">key saved</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" title="Move up" onClick={() => moveProvider(idx, -1)}
                            disabled={idx === 0}
                            className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 disabled:opacity-30">
                            <ArrowUp size={14} />
                          </button>
                          <button type="button" title="Move down" onClick={() => moveProvider(idx, 1)}
                            disabled={idx === providers.length - 1}
                            className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 disabled:opacity-30">
                            <ArrowDown size={14} />
                          </button>
                          <button type="button" title="Remove" onClick={() => removeProvider(p.id)}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Vendor API style</label>
                          <select
                            value={p.style}
                            onChange={(e) => updateProvider(p.id, { style: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                          >
                            {PROVIDER_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Model</label>
                          <input
                            value={p.model}
                            onChange={(e) => updateProvider(p.id, { model: e.target.value })}
                            placeholder="e.g. gemini-2.5-flash"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Base URL</label>
                          <input
                            value={p.base_url}
                            onChange={(e) => updateProvider(p.id, { base_url: e.target.value })}
                            placeholder="https://api.example.com/v1"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">API key</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              value={p.api_key}
                              onChange={(e) => setProviderKey(p.id, e.target.value)}
                              placeholder={p.has_key ? '••••••••  (saved — type to replace)' : (p.requires_key ? 'Paste API key' : 'No key needed (local)')}
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => testProvider(p.id)}
                              disabled={testingId !== null}
                              className="flex items-center gap-1 shrink-0 px-2.5 py-1.5 text-[11px] font-medium rounded-md border border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                            >
                              <Zap size={12} className={testingId === p.id ? 'animate-pulse text-amber-400' : 'text-zinc-400'} />
                              Test
                            </button>
                          </div>
                          {testResults[p.id] && (
                            <p className={`text-[10px] mt-1 ${testResults[p.id].startsWith('Works') ? 'text-emerald-400' : (testResults[p.id] === 'Testing…' ? 'text-zinc-400' : 'text-red-400')}`}>
                              {testResults[p.id]}
                            </p>
                          )}
                          <p className="text-[10px] text-zinc-600 mt-1">Save first, then Test — testing uses the saved key.</p>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Temperature</label>
                          <input
                            type="number" step="0.1" min="0" max="2"
                            value={p.temperature}
                            onChange={(e) => updateProvider(p.id, { temperature: Number(e.target.value) })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Max tokens</label>
                          <input
                            type="number" step="1" min="1" max="32000"
                            value={p.max_tokens}
                            onChange={(e) => updateProvider(p.id, { max_tokens: Number(e.target.value) })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <select
                      value={addPick}
                      onChange={(e) => setAddPick(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Add a vendor…</option>
                      {catalog
                        .filter(c => !providers.some(p => p.id === c.id))
                        .map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={addProvider}
                      disabled={!addPick}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md border border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
                    >
                      <Plus size={12} /> Add vendor
                    </button>
                    <button
                      type="button"
                      onClick={addCustomProvider}
                      className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-md border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                    >
                      <Plus size={12} /> Custom (OpenAI-compatible)
                    </button>
                    <button
                      type="button"
                      onClick={saveProviders}
                      disabled={savingProviders}
                      className="flex items-center gap-1.5 ml-auto bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      {savingProviders ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>{savingProviders ? 'Saving…' : 'Save providers'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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

              <div className="pt-4 border-t border-zinc-800 space-y-2.5">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  Run now (without waiting for the worker)
                </p>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['lifecycle', 'Publish / archive cycle'],
                    ['discoveries', 'Generate discoveries'],
                    ['quiz', "Generate today's quiz"],
                    ['travel', 'Generate guides & events'],
                  ] as const).map(([action, label]) => (
                    <button
                      key={action}
                      type="button"
                      disabled={running !== null}
                      onClick={() => runAutopilotAction(action)}
                      className="px-3 py-1.5 text-[11px] font-medium rounded-md border border-zinc-700 text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                      {running === action ? 'Running…' : label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500">
                  Generated items start unpublished and go live after the review window above, exactly like news drafts.
                </p>
              </div>
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
                <p className="text-[10px] text-zinc-500 mt-1">Legacy key — used for the Google Gemini provider above if it has no key of its own. Prefer managing keys in AI Providers.</p>
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
