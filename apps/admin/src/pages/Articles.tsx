import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  X,
  Sparkles,
  FileText,
  Check,
  Camera,
  Ban,
  RotateCcw,
  Clock,
  Globe,
  ChevronDown,
  Zap,
  Rss
} from 'lucide-react';
import { api } from '../lib/api';
import type { ApiArticle } from '../lib/api';
import { useToast } from '../components/ui/Toast';

type FilterTab = 'All' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

const DRAFT_STATUSES = ['DRAFT', 'AI_DRAFT', 'IN_REVIEW', 'NEEDS_REVISION', 'APPROVED'];
const ARCHIVE_STATUSES = ['ARCHIVED', 'REJECTED'];

interface AutopilotVerdict {
  id: string;
  eligible: boolean;
  reason: string;
  auto_publish_at: string | null;
}

function matchesTab(status: string, tab: FilterTab) {
  if (tab === 'PUBLISHED') return status === 'PUBLISHED';
  if (tab === 'DRAFT') return DRAFT_STATUSES.includes(status);
  if (tab === 'ARCHIVED') return ARCHIVE_STATUSES.includes(status);
  return true;
}

function formatCountdown(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Auto-publishing on next cycle';
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `Auto-publish in ${h > 0 ? `${h}h ` : ''}${m}m`;
}

export default function Articles() {
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('All');
  const [verdicts, setVerdicts] = useState<Record<string, AutopilotVerdict>>({});
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'KH' | 'WORLD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [enhancingImages, setEnhancingImages] = useState(false);
  const [syncingFeeds, setSyncingFeeds] = useState(false);
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  
  // Create Article Modal state
  const [scanMenuOpen, setScanMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCountry, setNewCountry] = useState('KH');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  const fetchArticles = async (showToast = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      params.set('status', 'ALL');
      if (countryFilter !== 'ALL') {
        params.set('country', countryFilter);
      }
      const res = await api.get<{ items: ApiArticle[]; total: number }>(`/articles?${params.toString()}`);
      if (res.data?.items) {
        setArticles(res.data.items);
        setTotalCount(res.data.total || res.data.items.length);
      }
      try {
        const ap = await api.get<{ pending: AutopilotVerdict[] }>('/admin/autopilot');
        const map: Record<string, AutopilotVerdict> = {};
        ap.data?.pending?.forEach(v => { map[v.id] = v; });
        setVerdicts(map);
      } catch {
        setVerdicts({});
      }
      if (showToast) {
        toastSuccess('Articles list refreshed');
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      toastError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [countryFilter]);

  useEffect(() => {
    const handleClose = () => {
      setIsModalOpen(false);
      setScanMenuOpen(false);
    };
    window.addEventListener('admin:close-modals', handleClose);

    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === 'true') {
      setIsModalOpen(true);
    }

    return () => {
      window.removeEventListener('admin:close-modals', handleClose);
    };
  }, []);

  const handleScanNews = async (target: 'cambodia' | 'world' | 'all') => {
    setAiGenerating(true);
    setScanMenuOpen(false);
    const label = target === 'cambodia' ? 'Cambodia News' : target === 'world' ? 'World News' : 'All Sections (News + Discoveries)';
    toastInfo(`AI scanning and generating fresh ${label} with 1600px HD images...`, 'AI News Scanner');
    try {
      if (target === 'cambodia') {
        await api.post('/admin/ai/scan/cambodia-news?count=3');
      } else if (target === 'world') {
        await api.post('/admin/ai/scan/world-news?count=3');
      } else {
        await api.post('/admin/ai/scan/all');
      }
      await fetchArticles();
      toastSuccess(`Successfully scanned and ingested fresh ${label}!`, 'Scan Complete');
    } catch (err: any) {
      console.error('Scan Failed:', err);
      toastError(err.response?.data?.detail || `Failed to scan ${label}.`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleEnhanceImages = async () => {
    setEnhancingImages(true);
    toastInfo('Scanning and discovering high-resolution HD images for stories...', 'AI Image Engine');
    try {
      const res = await api.post<{ status: string; updated_count: number }>('/admin/ai/enhance-news-images');
      await fetchArticles();
      toastSuccess(`Enhanced ${res.data.updated_count || 0} stories with high-resolution images!`, 'HD Images Updated');
    } catch (err: any) {
      console.error('Failed to enhance images:', err);
      toastError(err.response?.data?.detail || 'Failed to enhance images');
    } finally {
      setEnhancingImages(false);
    }
  };

  const handleSyncFeeds = async () => {
    setSyncingFeeds(true);
    toastInfo('Polling all verified RSS wire feeds (Khmer Times, Kiripost, Fresh News, Phnom Penh Post, Al Jazeera, CNA, ThmeyThmey)...', 'Wire Feed Ingestion');
    try {
      const res = await api.post<{ status: string; total_sources_polled: number; results: any[] }>('/sources/fetch-all');
      const totalIngested = res.data?.results?.reduce((acc: number, r: any) => acc + (r.items_ingested || 0), 0) || 0;
      await fetchArticles();
      toastSuccess(`Polled ${res.data?.total_sources_polled || 0} wire feeds. Ingested ${totalIngested} fresh stories!`, 'Feeds Synchronized');
    } catch (err: any) {
      console.error('Failed to sync feeds:', err);
      toastError(err.response?.data?.detail || 'Failed to sync RSS feeds');
    } finally {
      setSyncingFeeds(false);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;
    setCreating(true);

    try {
      const slug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
      await api.post('/articles', {
        title: newTitle,
        slug: slug,
        summary: newSummary,
        content: newContent || newSummary,
        country: newCountry,
        primary_source_url: newSourceUrl || 'https://camtech.cam',
        category_id: 'ca82761b-c4b3-43a0-82fd-75188f694e2e',
        author_id: 'e8da801f-8b2c-439c-a9db-5c678cec6b8c',
        language: 'en',
        status: 'PUBLISHED'
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setNewSourceUrl('');
      toastSuccess(`Published "${newTitle}"`, 'Story Live');
      fetchArticles();
    } catch (err) {
      console.error('Failed to create article:', err);
      toastError('Failed to create article. Please ensure you are signed in.');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id: string, title: string) => {
    try {
      await api.post(`/articles/${id}/publish`);
      toastSuccess(`Published "${title}"`, 'Live on Website');
      await fetchArticles();
    } catch (err: any) {
      console.error('Failed to publish article:', err);
      toastError(err.response?.data?.detail || 'Failed to publish article.');
    }
  };

  const handleReviewAction = async (id: string, title: string, action: 'REJECT' | 'RESTORE') => {
    try {
      const res = await api.post<{ new_status: string }>('/admin/review-action', { article_id: id, action });
      const newStatus = res.data?.new_status;
      setArticles(prev => prev.map(a => (a.id === id && newStatus ? { ...a, status: newStatus } : a)));
      toastSuccess(
        action === 'REJECT' ? `Rejected "${title}" — it will not auto-publish` : `Restored "${title}" to review`,
        action === 'REJECT' ? 'Draft Rejected' : 'Story Restored'
      );
    } catch (err: any) {
      console.error(`Failed to ${action} article:`, err);
      toastError(err.response?.data?.detail || `Failed to ${action.toLowerCase()} article.`);
    }
  };

  const handleDelete = async (id: string, title: string, status: string) => {
    const permanent = status === 'ARCHIVED';
    const msg = permanent
      ? `Permanently delete "${title}"? This cannot be undone.`
      : `Archive "${title}"? It will be hidden from the website and can be restored from the Archived tab.`;
    if (!confirm(msg)) return;
    try {
      const res = await api.delete<{ deleted: boolean }>(`/articles/${id}`);
      if (res.data?.deleted) {
        setArticles(prev => prev.filter(a => a.id !== id));
        toastSuccess(`Deleted "${title}"`, 'Article Removed');
      } else {
        setArticles(prev => prev.map(a => (a.id === id ? { ...a, status: 'ARCHIVED' } : a)));
        toastSuccess(`Archived "${title}"`, 'Article Archived');
      }
    } catch (err) {
      console.error('Failed to delete article:', err);
      toastError('Failed to delete article.');
    }
  };

  const filtered = articles.filter((art) => {
    if (!matchesTab(art.status, filterTab)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchSlug = art.slug.toLowerCase().includes(q);
      if (!matchTitle && !matchSlug) return false;
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* 1. Standard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Articles</h1>
            <span className="badge-pill badge-zinc font-mono">{articles.length} stories</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage editorial coverage, regional reporting, and publication workflows.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => fetchArticles(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleEnhanceImages}
            disabled={enhancingImages}
            className="flex items-center gap-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/25 font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50"
            title="Scan stories with missing or low-res images and find high-resolution HD imagery"
          >
            {enhancingImages ? <RefreshCw size={13} className="animate-spin" /> : <Camera size={13} />}
            <span>Enhance HD Images</span>
          </button>
          <button 
            onClick={handleSyncFeeds}
            disabled={syncingFeeds}
            className="flex items-center gap-1.5 bg-amber-600/15 hover:bg-amber-600/25 text-amber-400 border border-amber-500/25 font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            title="Poll all verified RSS wire feeds (Khmer Times, Kiripost, Fresh News, Phnom Penh Post, Al Jazeera, CNA, ThmeyThmey)"
          >
            {syncingFeeds ? <RefreshCw size={13} className="animate-spin" /> : <Rss size={13} />}
            <span>{syncingFeeds ? 'Syncing Feeds...' : 'Sync Wire Feeds'}</span>
          </button>
          {/* Scan News Dropdown Menu */}
          <div className="relative">
            <button 
              onClick={() => setScanMenuOpen(!scanMenuOpen)}
              disabled={aiGenerating}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {aiGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{aiGenerating ? 'AI Scanning...' : 'Scan News (AI)'}</span>
              <ChevronDown size={12} className={scanMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>

            {scanMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setScanMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl py-1.5 z-50">
                  <div className="px-3 py-1.5 border-b border-zinc-800/80 text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                    Select AI Scan Target
                  </div>
                  <button
                    onClick={() => handleScanNews('cambodia')}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <span className="text-base leading-none">🇰🇭</span>
                    <div>
                      <div className="font-medium text-zinc-100">Scan Cambodia News</div>
                      <div className="text-[10px] text-zinc-400">Local tech, Bakong fintech, telecom & startups</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleScanNews('world')}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Globe size={15} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="font-medium text-zinc-100">Scan World News</div>
                      <div className="text-[10px] text-zinc-400">Global AI, robotics, cyber & big tech</div>
                    </div>
                  </button>
                  <div className="my-1 border-t border-zinc-800/80" />
                  <button
                    onClick={() => handleScanNews('all')}
                    className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Zap size={15} className="text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-emerald-300">Master Scan (All Sections)</div>
                      <div className="text-[10px] text-zinc-400">Full sweep across News + Discoveries</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
          <button 
            data-shortcut="new-article"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] shrink-0 overflow-x-auto">
          {(['All', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((tab) => {
            const count = articles.filter(a => matchesTab(a.status, tab)).length;
            const label = tab === 'All' ? 'All' : tab === 'PUBLISHED' ? 'Published' : tab === 'DRAFT' ? 'Drafts' : 'Archived';
            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap font-medium ${
                  filterTab === tab
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {`${label} (${count})`}
              </button>
            );
          })}
        </div>

        {/* Search Bar & Country Filter */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter stories by title or slug..." 
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-8 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <select 
            value={countryFilter}
            onChange={(e: any) => setCountryFilter(e.target.value)}
            className="bg-zinc-950/80 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-700 cursor-pointer shrink-0"
          >
            <option value="ALL">All Regions</option>
            <option value="KH">Cambodia (KH)</option>
            <option value="WORLD">World</option>
          </select>
        </div>
      </div>

      {/* 3. Main Data Table (With Full Skeleton State) */}
      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-5 font-medium">Story Title</th>
                <th className="py-3 px-4 font-medium">Region</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Attribution</th>
                <th className="py-3 px-4 font-medium text-right">Views</th>
                <th className="py-3 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5">
                      <div className="h-3.5 bg-zinc-800 rounded w-2/3 mb-1.5" />
                      <div className="h-2.5 bg-zinc-800/60 rounded w-1/3" />
                    </td>
                    <td className="py-4 px-4"><div className="h-4 w-12 bg-zinc-800 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-zinc-800 rounded-full" /></td>
                    <td className="py-4 px-4"><div className="h-3 w-24 bg-zinc-800/60 rounded" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-3 w-10 bg-zinc-800 rounded ml-auto" /></td>
                    <td className="py-4 px-5 text-right"><div className="h-4 w-12 bg-zinc-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500 text-xs">
                    <FileText size={32} className="mx-auto text-zinc-600 mb-2.5" />
                    <p className="font-medium text-zinc-300">No articles found</p>
                    <p className="text-zinc-500 mt-1">Try adjusting your keyword or region filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        {article.hero_image_url ? (
                          <img 
                            src={article.hero_image_url} 
                            alt={article.title} 
                            className="w-10 h-8 rounded-md object-cover border border-zinc-800 shrink-0 shadow-2xs" 
                          />
                        ) : (
                          <div className="w-10 h-8 rounded-md bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0 text-zinc-500 text-[9px] font-mono">
                            No img
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-1 max-w-lg">
                            {article.title}
                          </div>
                          {article.title_km ? (
                            <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5 font-sans">
                              {article.title_km}
                            </div>
                          ) : (
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-md">
                              /{article.slug}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                        article.country === 'KH'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                      }`}>
                        {article.country || 'GLOBAL'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {article.status === 'PUBLISHED' ? (
                        <span className="badge-pill badge-emerald">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>PUBLISHED</span>
                        </span>
                      ) : ARCHIVE_STATUSES.includes(article.status) ? (
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          article.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                        }`}>
                          <span>{article.status}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>{article.status}</span>
                        </span>
                      )}
                      {article.status === 'AI_DRAFT' && verdicts[article.id] && (
                        <div
                          className={`flex items-center gap-1 mt-1 text-[10px] max-w-[180px] ${
                            verdicts[article.id].eligible ? 'text-sky-400' : 'text-zinc-500'
                          }`}
                          title={verdicts[article.id].reason}
                        >
                          <Clock size={10} className="shrink-0" />
                          <span className="truncate">
                            {verdicts[article.id].eligible && verdicts[article.id].auto_publish_at
                              ? formatCountdown(verdicts[article.id].auto_publish_at as string)
                              : `Held: ${verdicts[article.id].reason}`}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px] truncate max-w-[160px]">
                      {article.primary_source_url ? (
                        <a 
                          href={article.primary_source_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:text-zinc-200 hover:underline flex items-center gap-1"
                          title={article.source_attribution_text || article.primary_source_url}
                        >
                          <span className="truncate">
                            {(() => {
                              try {
                                const host = new URL(article.primary_source_url).hostname.replace('www.', '');
                                if (host === 'news.google.com' && article.source_attribution_text) {
                                  return article.source_attribution_text.replace(/^Source:\s*/i, '');
                                }
                                return host;
                              } catch {
                                return article.source_attribution_text?.replace(/^Source:\s*/i, '') || 'Source';
                              }
                            })()}
                          </span>
                          <ExternalLink size={10} className="shrink-0" />
                        </a>
                      ) : (article.source_attribution_text || 'Direct')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-400">
                      {(article.views_count || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {DRAFT_STATUSES.includes(article.status) && (
                          <button
                            onClick={() => handlePublish(article.id, article.title)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-md hover:bg-emerald-500/15 transition-colors border border-emerald-500/20"
                            title="Approve & Publish live to website"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        {DRAFT_STATUSES.includes(article.status) && (
                          <button
                            onClick={() => handleReviewAction(article.id, article.title, 'REJECT')}
                            className="p-1.5 text-amber-400 hover:text-amber-300 rounded-md hover:bg-amber-500/10 transition-colors"
                            title="Reject (stops auto-publish)"
                          >
                            <Ban size={13} />
                          </button>
                        )}
                        {ARCHIVE_STATUSES.includes(article.status) && (
                          <button
                            onClick={() => handleReviewAction(article.id, article.title, 'RESTORE')}
                            className="p-1.5 text-sky-400 hover:text-sky-300 rounded-md hover:bg-sky-500/10 transition-colors"
                            title="Restore to review"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                        <a
                          href={`https://blog.camtech.cam/${article.country === 'KH' ? 'cambodia' : 'world'}/news/${article.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors"
                          title="View live publication"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button
                          onClick={() => handleDelete(article.id, article.title, article.status)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-md hover:bg-rose-500/10 transition-colors"
                          title={article.status === 'ARCHIVED' ? 'Delete permanently' : 'Archive (restorable)'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 px-5 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Showing {filtered.length} of {totalCount} total stories</span>
          <span className="text-[10px] text-zinc-500">FastAPI & PostgreSQL Synced</span>
        </div>
      </div>

      {/* 4. Modal: Create Article */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">Write New Story</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Headline</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cambodia Tech Summit Expands Digital Hub in Phnom Penh"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Region</label>
                  <select
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    <option value="KH">Cambodia (KH)</option>
                    <option value="WORLD">World</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Primary Source URL</label>
                  <input
                    type="url"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="https://akp.gov.kh"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Summary (Lead paragraph)</label>
                <textarea
                  required
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Key summary displayed in cards and RSS feeds..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Story Content (Markdown supported)</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Full article content body..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {creating ? 'Publishing...' : 'Publish Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
