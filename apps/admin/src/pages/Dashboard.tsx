import { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  MessageSquareWarning,
  MapPin,
  RefreshCw,
  Compass,
  Plus,
  ChevronRight,
  Settings,
  HardDrive,
  CheckSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { DashboardStatsResponse, ApiArticle } from '../lib/api';
import { useToast } from '../components/ui/Toast';

interface FeedbackItem {
  id: string;
  topic: string;
  page_path: string;
  message: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const { success: toastSuccess, error: toastError } = useToast();

  const [stats, setStats] = useState<DashboardStatsResponse['metrics']>({
    total_articles: 0,
    published_articles: 0,
    pending_reviews: 0,
    total_discoveries: 0,
    total_quizzes: 0,
    total_tools: 0,
    total_sources: 0,
    active_sources: 0,
    total_pageviews: 0,
    total_shares: 0,
  });
  const [recentArticles, setRecentArticles] = useState<ApiArticle[]>([]);
  const [newReports, setNewReports] = useState<FeedbackItem[]>([]);
  const [apiConnected, setApiConnected] = useState(false);

  const fetchDashboardData = async (showToast = false) => {
    setLoading(true);
    try {
      const [statsRes, articlesRes, feedbackRes] = await Promise.all([
        api.get<DashboardStatsResponse>('/admin/dashboard-stats').catch(() => null),
        api.get<{ items: ApiArticle[]; total: number }>('/articles?limit=8').catch(() => null),
        api.get<FeedbackItem[]>('/admin/feedback?status=NEW').catch(() => null),
      ]);

      if (statsRes?.data?.metrics) {
        setStats(statsRes.data.metrics);
        setApiConnected(true);
      }

      if (articlesRes?.data?.items) {
        setRecentArticles(articlesRes.data.items);
        setApiConnected(true);
        setStats((prev) => ({
          ...prev,
          total_articles: prev.total_articles || articlesRes.data.total || articlesRes.data.items.length,
          published_articles:
            prev.published_articles ||
            articlesRes.data.items.filter((a) => a.status === 'PUBLISHED').length,
        }));
      }

      if (Array.isArray(feedbackRes?.data)) {
        setNewReports(feedbackRes.data);
      }

      if (showToast) {
        toastSuccess('Dashboard refreshed');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toastError('Could not load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpis = [
    {
      label: 'Pending Review',
      value: stats.pending_reviews.toLocaleString(),
      hint: 'Drafts waiting to publish',
      to: '/articles?tab=DRAFT',
      icon: Clock,
      tone: stats.pending_reviews > 0 ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400 bg-zinc-800',
    },
    {
      label: 'Open User Reports',
      value: newReports.length.toLocaleString(),
      hint: 'Bug & feedback inbox',
      to: '/feedback',
      icon: MessageSquareWarning,
      tone: newReports.length > 0 ? 'text-rose-400 bg-rose-500/10' : 'text-emerald-400 bg-emerald-500/10',
    },
    {
      label: 'Published Articles',
      value: stats.published_articles.toLocaleString(),
      hint: `${stats.total_articles} total stories in DB`,
      to: '/articles?tab=PUBLISHED',
      icon: FileText,
      tone: 'text-blue-400 bg-blue-500/10',
    },
    {
      label: 'Discoveries & Sources',
      value: `${stats.total_discoveries} / ${stats.active_sources || stats.total_sources}`,
      hint: 'Explainers / active feeds',
      to: '/discoveries',
      icon: Compass,
      tone: 'text-emerald-400 bg-emerald-500/10',
    },
  ];

  const controlShortcuts = [
    {
      title: 'Articles & Publishing',
      desc: 'Write stories, review AI drafts, sync wire feeds, and publish.',
      to: '/articles',
      icon: FileText,
      color: 'text-blue-400',
    },
    {
      title: 'User Feedback Inbox',
      desc: 'Inspect whole-site bug reports and reader corrections.',
      to: '/feedback',
      icon: MessageSquareWarning,
      color: 'text-amber-400',
    },
    {
      title: 'Destinations & Map',
      desc: 'Edit Cambodia provinces, temples, photos, and places.',
      to: '/tourism',
      icon: MapPin,
      color: 'text-emerald-400',
    },
    {
      title: 'Place Approvals',
      desc: 'Approve or reject visitor-submitted travel places.',
      to: '/suggestions',
      icon: CheckSquare,
      color: 'text-purple-400',
    },
    {
      title: 'Visual Discoveries',
      desc: 'Manage technology & science visual explainers.',
      to: '/discoveries',
      icon: Sparkles,
      color: 'text-cyan-400',
    },
    {
      title: 'Autopilot, AI Keys & Media',
      desc: 'Toggle auto-publish rules, test AI providers, or browse S3.',
      to: '/settings',
      icon: Settings,
      color: 'text-zinc-300',
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Admin Control Desk</h1>
            <span className="badge-pill badge-emerald">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{apiConnected ? 'Connected' : 'Connecting'}</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Direct overview of pending editorial actions, site reports, and content areas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>

          <Link
            to="/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
          >
            <Settings size={13} />
            <span>Settings & AI</span>
          </Link>

          <Link
            to="/articles?new=true"
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3.5 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {/* Row 1: Actionable Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 space-y-3 animate-pulse">
                <div className="h-3 w-24 bg-zinc-800 rounded" />
                <div className="h-7 w-20 bg-zinc-800 rounded" />
                <div className="h-3 w-32 bg-zinc-800/60 rounded" />
              </div>
            ))
          : kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Link
                  key={kpi.label}
                  to={kpi.to}
                  className="group p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all shadow-sm block"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-400">{kpi.label}</span>
                    <div className={`w-8 h-8 rounded-lg ${kpi.tone} flex items-center justify-center shrink-0`}>
                      <Icon size={15} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-zinc-100 font-mono tracking-tight">
                      {kpi.value}
                    </span>
                    <span className="text-[11px] text-zinc-400 group-hover:text-emerald-400 inline-flex items-center gap-0.5 transition-colors">
                      Open <ChevronRight size={12} />
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500">{kpi.hint}</div>
                </Link>
              );
            })}
      </div>

      {/* Row 2: Quick Control Directory & Live User Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Where to Control Each Part of the Site</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Direct shortcuts to every real workspace</p>
            </div>
            <Link
              to="/storage"
              className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
            >
              <HardDrive size={13} />
              <span>Media Storage</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {controlShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80 transition-colors flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                    <Icon size={15} className={item.color} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                        {item.title}
                      </span>
                      <ChevronRight size={13} className="text-zinc-600 group-hover:text-zinc-300 shrink-0" />
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Live New User Feedback Preview */}
        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Open User Reports</h2>
              <MessageSquareWarning size={15} className="text-amber-400" />
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Newest visitor feedback from camtech.cam</p>

            <div className="mt-4 space-y-2.5">
              {newReports.length === 0 ? (
                <div className="p-6 rounded-lg bg-zinc-950/50 border border-zinc-800/80 text-center text-xs text-zinc-500">
                  All caught up — no unread reports right now.
                </div>
              ) : (
                newReports.slice(0, 4).map((rep) => (
                  <Link
                    key={rep.id}
                    to="/feedback"
                    className="block p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                      <span className="text-amber-300 uppercase">{rep.topic}</span>
                      <span className="text-zinc-500 truncate">{rep.page_path}</span>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-2 mt-1">{rep.message}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs">
            <a
              href="https://camtech.cam"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
            >
              <span>Visit live site</span>
              <ExternalLink size={12} />
            </a>
            <Link to="/feedback" className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-0.5">
              <span>Triage All</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Publications */}
      <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Latest Articles</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Most recent entries in the database</p>
          </div>
          <Link
            to="/articles"
            className="text-xs text-zinc-400 hover:text-zinc-100 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Manage Articles</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-5 font-medium">Title</th>
                <th className="py-3 px-4 font-medium">Region</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Views</th>
                <th className="py-3 px-5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-5"><div className="h-3.5 bg-zinc-800 rounded w-3/4" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-12 bg-zinc-800 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-zinc-800 rounded-full" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-3 w-10 bg-zinc-800 rounded ml-auto" /></td>
                    <td className="py-3.5 px-5 text-right"><div className="h-4 w-12 bg-zinc-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : recentArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500 text-xs">
                    No articles found yet. Click &quot;New Article&quot; to publish your first story.
                  </td>
                </tr>
              ) : (
                recentArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-5">
                      <div className="font-medium text-zinc-200 line-clamp-1 max-w-lg">{art.title}</div>
                      {art.title_km && (
                        <div className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">{art.title_km}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border bg-zinc-800 text-zinc-300 border-zinc-700/60">
                        {art.country || 'GLOBAL'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-mono text-zinc-300">{art.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-400">
                      {(art.views_count || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <Link
                        to={`/articles?q=${encodeURIComponent(art.slug)}`}
                        className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
