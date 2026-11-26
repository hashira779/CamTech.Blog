import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Rss,
  CheckCheck
} from 'lucide-react';
import { api } from '../lib/api';
import type { ApiArticle } from '../lib/api';
import { safeHref, safeImageSrc } from '../lib/sanitize';
import { useToast } from '../components/ui/Toast';

const FlagKH = () => (
  <svg className="w-4 h-3 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480" aria-label="Cambodia">
    <rect width="640" height="480" fill="#032ea1"/>
    <rect y="120" width="640" height="240" fill="#e00025"/>
    <path fill="#ffffff" d="M320,165 L335,200 L305,200 Z M285,190 L297,220 L273,220 Z M355,190 L367,220 L343,220 Z M260,220 L380,220 L380,245 L260,245 Z M250,245 L390,245 L390,265 L250,265 Z M240,265 L400,265 L400,285 L240,285 Z"/>
  </svg>
);

const FlagTH = () => (
  <svg className="w-4 h-3 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480" aria-label="Thailand">
    <rect width="640" height="480" fill="#ed1c24"/>
    <rect y="80" width="640" height="320" fill="#ffffff"/>
    <rect y="160" width="640" height="160" fill="#241d4f"/>
  </svg>
);

const FlagVN = () => (
  <svg className="w-4 h-3 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480" aria-label="Vietnam">
    <rect width="640" height="480" fill="#da251d"/>
    <polygon fill="#ff0" points="320,135 348,220 437,220 365,273 392,358 320,305 248,358 275,273 203,220 292,220"/>
  </svg>
);

const FlagCN = () => (
  <svg className="w-4 h-3 rounded-xs shrink-0 shadow-xs inline-block" viewBox="0 0 640 480" aria-label="China">
    <rect width="640" height="480" fill="#de2910"/>
    <polygon fill="#ffde00" points="100,60 115,105 160,105 125,130 140,175 100,150 60,175 75,130 40,105 85,105"/>
    <polygon fill="#ffde00" points="180,45 185,60 200,60 188,70 193,85 180,75 167,85 172,70 160,60 175,60"/>
    <polygon fill="#ffde00" points="215,85 220,100 235,100 223,110 228,125 215,115 202,125 207,110 195,100 210,100"/>
    <polygon fill="#ffde00" points="215,145 220,160 235,160 223,170 228,185 215,175 202,185 207,170 195,160 210,160"/>
    <polygon fill="#ffde00" points="180,185 185,200 200,200 188,210 193,225 180,215 167,225 172,210 160,200 175,200"/>
  </svg>
);

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
  const [searchParams] = useSearchParams();
  const initialTabParam = searchParams.get('tab');
  const initialFilterTab: FilterTab =
    initialTabParam === 'PUBLISHED' || initialTabParam === 'DRAFT' || initialTabParam === 'ARCHIVED'
      ? initialTabParam
      : 'All';

  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>(initialFilterTab);
  const [verdicts, setVerdicts] = useState<Record<string, AutopilotVerdict>>({});
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'KH' | 'TH' | 'ASEAN' | 'WORLD'>('ALL');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [translatingMissing, setTranslatingMissing] = useState(false);
  const [enhancingImages, setEnhancingImages] = useState(false);
  const [syncingFeeds, setSyncingFeeds] = useState(false);
  const [publishingAll, setPublishingAll] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [topicRegion, setTopicRegion] = useState<string>('KH');
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [counts, setCounts] = useState<{ all: number; published: number; drafts: number; archived: number }>({
    all: 0,
    published: 0,
    drafts: 0,
    archived: 0
  });
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

  const fetchArticles = async (showToast = false, tabOverride?: FilterTab) => {
    setLoading(true);
    const activeTab = tabOverride ?? filterTab;
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (activeTab === 'All') {
        params.set('status', 'ALL');
      } else if (activeTab === 'PUBLISHED') {
        params.set('status', 'PUBLISHED');
      } else if (activeTab === 'DRAFT') {
        params.set('status', 'DRAFT');
      } else if (activeTab === 'ARCHIVED') {
        params.set('status', 'ARCHIVED');
      }
      if (countryFilter !== 'ALL') {
        params.set('country', countryFilter);
      }
      const [res, countsRes] = await Promise.all([
        api.get<{ items: ApiArticle[]; total: number }>(`/articles?${params.toString()}`),
        api.get<{ all: number; published: number; drafts: number; archived: number }>('/admin/articles/counts').catch(() => null)
      ]);
      if (res.data?.items) {
        setArticles(res.data.items);
        setTotalCount(res.data.total || res.data.items.length);
      }
      if (countsRes?.data) {
        setCounts(countsRes.data);
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
    const qParam = searchParams.get('q') ?? '';
    const tabParam = searchParams.get('tab');
    const newParam = searchParams.get('new');
    if (qParam !== searchQuery) {
      setSearchQuery(qParam);
    }
    if (tabParam === 'PUBLISHED' || tabParam === 'DRAFT' || tabParam === 'ARCHIVED' || tabParam === 'All') {
      if (tabParam !== filterTab) {
        setFilterTab(tabParam);
        fetchArticles(false, tabParam);
      }
    }
    if (newParam === 'true') {
      setIsModalOpen(true);
    }
    // Sync query parameters cleanly when navigating via Topbar or Dashboard links.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handleClose = () => {
      setIsModalOpen(false);
      setScanMenuOpen(false);
    };
    window.addEventListener('admin:close-modals', handleClose);

    return () => {
      window.removeEventListener('admin:close-modals', handleClose);
    };
  }, []);

  const handleScanNews = async (target: 'cambodia' | 'thailand-cambodia' | 'asean' | 'world' | 'all') => {
    setAiGenerating(true);
    setScanMenuOpen(false);
    const labelMap: Record<typeof target, string> = {
      cambodia: 'Cambodia News',
      'thailand-cambodia': 'Thai News on Cambodia',
      asean: 'ASEAN Regional News',
      world: 'World News',
      all: 'All Sections (Cambodia, Thai Watch, ASEAN, World + Discoveries)',
    };
    const label = labelMap[target];
    toastInfo(`AI scanning and generating bilingual ${label} with HD images...`, 'AI News Scanner');
    try {
      if (target === 'cambodia') {
        await api.post('/admin/ai/scan/cambodia-news?count=3');
      } else if (target === 'thailand-cambodia') {
        await api.post('/admin/ai/scan/thailand-cambodia?count=3');
      } else if (target === 'asean') {
        await api.post('/admin/ai/scan/asean-news?count=3');
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

  const handleTranslateMissing = async () => {
    setTranslatingMissing(true);
    setScanMenuOpen(false);
    toastInfo('Backfilling missing Khmer headlines, summaries, and full bodies...', 'Khmer Translation Backfill');
    try {
      const res = await api.post<{ articles_translated: number; discoveries_translated: number }>(
        '/admin/ai/translate-missing?article_limit=10&discovery_limit=4'
      );
      await fetchArticles();
      toastSuccess(
        `Translated ${res.data.articles_translated || 0} article(s) and ${res.data.discoveries_translated || 0} discovery explainer(s) into Khmer.`,
        'Translation Complete'
      );
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to run Khmer translation backfill.');
    } finally {
      setTranslatingMissing(false);
    }
  };

  const handleSeedFeeds = async () => {
    setSyncingFeeds(true);
    setScanMenuOpen(false);
    try {
      const res = await api.post<{ added: number; existing: number; total: number }>('/admin/sources/seed-recommended');
      toastSuccess(
        `Recommended feeds checked: ${res.data.added} added, ${res.data.existing} already active (${res.data.total} total).`,
        'Feed Registry Ready'
      );
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to seed recommended RSS feeds.');
    } finally {
      setSyncingFeeds(false);
    }
  };

  const handlePublishAll = async () => {
    setPublishingAll(true);
    toastInfo('Reviewing and publishing all quality-eligible drafts...', 'Approve All');
    try {
      const res = await api.post<{ status: string; published_count: number; skipped_count: number; total: number }>('/admin/articles/publish-all');
      const { published_count, skipped_count } = res.data;
      await fetchArticles();
      if (published_count > 0) {
        toastSuccess(`Successfully published ${published_count} stories! (${skipped_count} held for quality review)`, 'Approve All');
      } else {
        toastInfo(`0 drafts were eligible (${skipped_count} held for missing substantive copy or source links).`, 'Approve All');
      }
    } catch (err: any) {
      console.error('Publish all failed:', err);
      toastError(err.response?.data?.detail || 'Failed to publish ready drafts.', 'Approve All Error');
    } finally {
      setPublishingAll(false);
    }
  };

  const handleGenerateTopic = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customTopic.trim()) return;
    setGeneratingTopic(true);
    const mode = publishImmediately ? 'researching & publishing' : 'researching & drafting';
    toastInfo(`AI is ${mode} in-depth article on "${customTopic.trim()}"...`, 'AI Topic Engine');
    try {
      const res = await api.post<{ status: string; title: string; published?: boolean }>('/admin/ai/generate-topic-news', {
        topic: customTopic.trim(),
        region: topicRegion,
        publish_immediately: publishImmediately
      });
      setTopicModalOpen(false);
      setCustomTopic('');
      await fetchArticles();
      if (res.data.published) {
        toastSuccess(`Published "${res.data.title}" immediately to live website!`, 'Article Live');
      } else {
        toastSuccess(`Draft created: "${res.data.title}"`, 'Article Drafted');
      }
    } catch (err: any) {
      console.error('Topic generation failed:', err);
      toastError(err.response?.data?.detail || 'Failed to generate topic article.', 'Generation Error');
    } finally {
      setGeneratingTopic(false);
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
            onClick={handlePublishAll}
            disabled={publishingAll}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            title="Publish all eligible AI drafts that pass quality gates immediately"
          >
            {publishingAll ? <RefreshCw size={13} className="animate-spin" /> : <CheckCheck size={13} />}
            <span>{publishingAll ? 'Publishing...' : 'Publish Ready'}</span>
          </button>

          {/* Unified AI & Feed Pipeline Dropdown */}
          <div className="relative">
            <button
              onClick={() => setScanMenuOpen(!scanMenuOpen)}
              disabled={aiGenerating || syncingFeeds || enhancingImages || translatingMissing}
              className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {aiGenerating || syncingFeeds || enhancingImages || translatingMissing ? (
                <RefreshCw size={13} className="animate-spin text-emerald-400" />
              ) : (
                <Sparkles size={13} className="text-emerald-400" />
              )}
              <span>
                {translatingMissing
                  ? 'Translating KM...'
                  : syncingFeeds
                    ? 'Syncing Feeds...'
                    : enhancingImages
                      ? 'Enhancing Photos...'
                      : aiGenerating
                        ? 'AI Scanning...'
                        : 'AI & Feeds'}
              </span>
              <ChevronDown size={12} className={scanMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>

            {scanMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setScanMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-76 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl py-1.5 z-50">
                  <div className="px-3 py-1.5 border-b border-zinc-800/80 text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                    Feeds, Media &amp; Khmer Translation
                  </div>
                  <button
                    onClick={() => {
                      setScanMenuOpen(false);
                      handleSyncFeeds();
                    }}
                    disabled={syncingFeeds}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Rss size={15} className="text-amber-400 shrink-0" />
                    <div>
                      <div className="font-medium text-zinc-100">Sync Wire RSS Feeds</div>
                      <div className="text-[10px] text-zinc-400">Pull Cambodia, Thai Watch, ASEAN &amp; World RSS</div>
                    </div>
                  </button>
                  <button
                    onClick={handleTranslateMissing}
                    disabled={translatingMissing}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={15} className="text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-medium text-zinc-100">Translate Missing Khmer</div>
                      <div className="text-[10px] text-zinc-400">Backfill Khmer bodies on published &amp; draft posts</div>
                    </div>
                  </button>
                  <button
                    onClick={handleSeedFeeds}
                    disabled={syncingFeeds}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Globe size={15} className="text-zinc-400 shrink-0" />
                    <div>
                      <div className="font-medium text-zinc-100">Seed Recommended RSS Feeds</div>
                      <div className="text-[10px] text-zinc-400">Register Bangkok Post/Khaosod KH, ASEAN, World wires</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setScanMenuOpen(false);
                      handleEnhanceImages();
                    }}
                    disabled={enhancingImages}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Camera size={15} className="text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-medium text-zinc-100">Enhance Missing HD Images</div>
                      <div className="text-[10px] text-zinc-400">Find verified cover photos for drafts</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-zinc-800/80" />
                  <div className="px-3 py-1 text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                    AI Desk Scanners
                  </div>
                  <button
                    onClick={() => handleScanNews('cambodia')}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <FlagKH />
                    <div>
                      <div className="font-medium text-zinc-100">Scan Cambodia News</div>
                      <div className="text-[10px] text-zinc-400">Local tech, Bakong fintech, economy &amp; policy</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleScanNews('thailand-cambodia')}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <FlagTH />
                    <div>
                      <div className="font-medium text-zinc-100">Scan Thai News on Cambodia</div>
                      <div className="text-[10px] text-zinc-400">Bangkok Post, Nation, Khaosod mentioning Cambodia</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleScanNews('asean')}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Globe size={15} className="text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-medium text-zinc-100">Scan ASEAN Regional News</div>
                      <div className="text-[10px] text-zinc-400">Mekong trade, RCEP, SEA digital corridors</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleScanNews('world')}
                    className="w-full text-left px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Globe size={15} className="text-blue-400 shrink-0" />
                    <div>
                      <div className="font-medium text-zinc-100">Scan World News</div>
                      <div className="text-[10px] text-zinc-400">Global AI, robotics, cyber &amp; big tech</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setScanMenuOpen(false);
                      setTopicModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-purple-300 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <Sparkles size={15} className="text-purple-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-purple-300">Custom Topic Research...</div>
                      <div className="text-[10px] text-zinc-400">Specify any country, event or topic to draft</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleScanNews('all')}
                    className="w-full text-left px-3 py-2 text-xs text-emerald-300 hover:bg-zinc-800 flex items-center gap-2.5 cursor-pointer transition-colors"
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
            const count = tab === 'All' ? counts.all : tab === 'PUBLISHED' ? counts.published : tab === 'DRAFT' ? counts.drafts : counts.archived;
            const label = tab === 'All' ? 'All' : tab === 'PUBLISHED' ? 'Published' : tab === 'DRAFT' ? 'Drafts' : 'Archived';
            return (
              <button
                key={tab}
                onClick={() => {
                  setFilterTab(tab);
                  fetchArticles(false, tab);
                }}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap font-medium cursor-pointer ${
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
            onChange={(e) => setCountryFilter(e.target.value as 'ALL' | 'KH' | 'TH' | 'ASEAN' | 'WORLD')}
            className="bg-zinc-950/80 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-700 cursor-pointer shrink-0"
          >
            <option value="ALL">All Desks</option>
            <option value="KH">Cambodia (KH)</option>
            <option value="TH">Thai News on Cambodia (TH)</option>
            <option value="ASEAN">ASEAN Regional (ASEAN)</option>
            <option value="WORLD">World / Foreign (WORLD)</option>
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
                        {safeImageSrc(article.hero_image_url) ? (
                          <img 
                            src={safeImageSrc(article.hero_image_url)} 
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
                          <div className="flex items-center gap-2 mt-0.5">
                            {article.title_km ? (
                              <span className="text-[11px] text-zinc-500 line-clamp-1 font-sans">
                                {article.title_km}
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500 font-mono truncate max-w-md">
                                /{article.slug}
                              </span>
                            )}
                            <span
                              className={`shrink-0 px-1.5 py-0.2 rounded text-[9px] font-mono border ${
                                article.content_km && /[\u1780-\u17FF]/.test(article.content_km)
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {article.content_km && /[\u1780-\u17FF]/.test(article.content_km) ? 'KM OK' : 'KM Missing'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${
                        article.country === 'KH'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : article.country === 'TH'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : article.country === 'ASEAN'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700/60'
                      }`}>
                        {article.country || 'WORLD'}
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
                          href={safeHref(article.primary_source_url) || undefined}
                          target="_blank" 
                          rel="noopener noreferrer"
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
                          href={`https://camtech.cam/${article.country === 'KH' ? 'cambodia' : 'world'}/news/${article.slug}`}
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
                    <option value="TH">Thai News on Cambodia (TH)</option>
                    <option value="ASEAN">ASEAN &amp; Region</option>
                    <option value="WORLD">World / Foreign</option>
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

      {/* Custom Topic Generator Modal */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/40">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">AI Topic Research & Draft</h3>
                  <p className="text-[11px] text-zinc-400">Specify any breaking event, country, or topic for AI to draft</p>
                </div>
              </div>
              <button 
                onClick={() => setTopicModalOpen(false)} 
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleGenerateTopic} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Research Topic or Headline
                </label>
                <textarea
                  required
                  rows={3}
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Cambodia Bakong digital cross-border payments expand to Vietnam and Thailand..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Gemini will write an in-depth journalistic article (400–600 words with ## subheadings) meeting all AdSense quality gates.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Target Country / Region</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTopicRegion('KH')}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      topicRegion === 'KH' 
                        ? 'bg-purple-600/15 border-purple-500/40 text-purple-300' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FlagKH />
                    <span>Cambodia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicRegion('TH')}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      topicRegion === 'TH' 
                        ? 'bg-purple-600/15 border-purple-500/40 text-purple-300' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FlagTH />
                    <span>Thai → Cambodia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicRegion('ASEAN')}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      topicRegion === 'ASEAN' 
                        ? 'bg-purple-600/15 border-purple-500/40 text-purple-300' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Globe size={14} className="text-emerald-400" />
                    <span>ASEAN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicRegion('VN')}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      topicRegion === 'VN' 
                        ? 'bg-purple-600/15 border-purple-500/40 text-purple-300' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FlagVN />
                    <span>Vietnam</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicRegion('CN')}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                      topicRegion === 'CN' 
                        ? 'bg-purple-600/15 border-purple-500/40 text-purple-300' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FlagCN />
                    <span>China & HK</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicRegion('WORLD')}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 col-span-2 sm:col-span-2 transition-all ${
                      topicRegion === 'WORLD' 
                        ? 'bg-purple-600/15 border-purple-500/40 text-purple-300' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Globe size={14} className="text-blue-400" />
                    <span>Global Tech & World</span>
                  </button>
                </div>
              </div>

              {/* Instant Auto-Publish Option */}
              <div 
                onClick={() => setPublishImmediately(!publishImmediately)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  publishImmediately 
                    ? 'bg-emerald-950/20 border-emerald-500/30' 
                    : 'bg-zinc-950/50 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
                    <span>⚡ Publish Immediately to Live Website</span>
                    {publishImmediately && (
                      <span className="badge-pill bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5">Live</span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {publishImmediately 
                      ? 'Article will go live on camtech.cam immediately with HD cover image' 
                      : 'Article will be saved as an AI draft for your editorial review'}
                  </div>
                </div>
                <input 
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingTopic || !customTopic.trim()}
                  className={`px-4 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-50 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    publishImmediately 
                      ? 'bg-emerald-600 hover:bg-emerald-500' 
                      : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  {generatingTopic ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>
                    {generatingTopic 
                      ? (publishImmediately ? 'Researching & Publishing...' : 'Researching & Drafting...') 
                      : (publishImmediately ? 'Publish to Live Site with AI' : 'Save as AI Draft')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
