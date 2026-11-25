import { useEffect, useState } from 'react';
import { MessageSquareWarning, RefreshCw, CheckCircle, Eye, Trash2, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

interface FeedbackReportItem {
  id: string;
  topic: string;
  name?: string | null;
  reply_email?: string | null;
  page_path: string;
  message: string;
  status: 'NEW' | 'REVIEWED' | 'RESOLVED';
  admin_notes?: string | null;
  created_at: string;
}

export default function FeedbackReports() {
  const [reports, setReports] = useState<FeedbackReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('NEW');
  const [busyId, setBusyId] = useState<string | null>(null);
  const { showToast } = useToast();

  const loadReports = async () => {
    try {
      setLoading(true);
      const url = filter ? `/admin/feedback?status=${encodeURIComponent(filter)}` : '/admin/feedback';
      const res = await api.get(url);
      setReports(res.data || []);
    } catch {
      showToast('error', 'Failed to load user feedback reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const setStatus = async (id: string, status: 'REVIEWED' | 'RESOLVED') => {
    try {
      setBusyId(id);
      await api.patch(`/admin/feedback/${encodeURIComponent(id)}`, { status });
      showToast('success', `Marked report as ${status.toLowerCase()}.`);
      await loadReports();
    } catch {
      showToast('error', 'Could not update report status.');
    } finally {
      setBusyId(null);
    }
  };

  const removeReport = async (id: string) => {
    try {
      setBusyId(id);
      await api.delete(`/admin/feedback/${encodeURIComponent(id)}`);
      showToast('success', 'Report deleted.');
      await loadReports();
    } catch {
      showToast('error', 'Could not delete report.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <MessageSquareWarning className="w-6 h-6 text-emerald-400" />
            Site Feedback & Issue Reports
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Private feedback, bug reports, and correction requests submitted across CamTech.Blog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['NEW', 'REVIEWED', 'RESOLVED', ''].map((state) => (
            <button
              key={state || 'ALL'}
              type="button"
              onClick={() => setFilter(state)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === state
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {state || 'ALL'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void loadReports()}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-zinc-500">Loading feedback reports...</div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-10 text-center text-sm text-zinc-400">
          No {filter ? filter.toLowerCase() : ''} reports found.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-semibold uppercase">
                    {item.topic}
                  </span>
                  <span className="font-mono text-emerald-400">{item.page_path}</span>
                  <a
                    href={`https://camtech.cam${item.page_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <span className="text-zinc-500">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                {item.message}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span>Status: <strong className="text-zinc-200">{item.status}</strong></span>
                  {item.name && <span>Name: <strong className="text-zinc-200">{item.name}</strong></span>}
                  {item.reply_email && (
                    <span>Reply: <strong className="text-emerald-300">{item.reply_email}</strong></span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {item.status !== 'REVIEWED' && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void setStatus(item.id, 'REVIEWED')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    >
                      <Eye className="w-3.5 h-3.5" /> Mark Reviewed
                    </button>
                  )}
                  {item.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void setStatus(item.id, 'RESOLVED')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void removeReport(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
