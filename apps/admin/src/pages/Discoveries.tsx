import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Eye, 
  ExternalLink, 
  Search,
  BookOpen
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export interface DiscoveryItem {
  id: string;
  slug: string;
  title: string;
  title_km?: string;
  category: string;
  intro: string;
  hero_image_url: string;
  hero_image_credit?: string;
  views_count?: number;
  is_published?: number;
  published_at?: string;
}

export default function DiscoveriesPage() {
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const fetchDiscoveries = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ items: DiscoveryItem[]; total: number }>('/discoveries?limit=50');
      setItems(res.data?.items || []);
    } catch (err: any) {
      console.error(err);
      toastError(err.response?.data?.detail || 'Failed to load discoveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveries();
  }, []);

  const handleScanDiscoveries = async () => {
    setScanning(true);
    toastInfo('AI is researching breakthroughs and creating visual explainers with 1600px HD imagery...', 'AI Discovery Engine');
    try {
      const res = await api.post<{ status: string; created_count: number; items?: any[] }>('/admin/ai/scan/discoveries?count=2');
      if (res.data?.status === 'success') {
        toastSuccess(`Discovered and created ${res.data.created_count} visual explainers!`, 'AI Scan Complete');
        await fetchDiscoveries();
      } else {
        toastError('Discovery scan failed. Check logs.');
      }
    } catch (err: any) {
      console.error(err);
      toastError(err.response?.data?.detail || 'Failed to scan discoveries');
    } finally {
      setScanning(false);
    }
  };

  const filtered = items.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.title.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Visual Discoveries</h1>
            <span className="badge-pill badge-zinc font-mono">{items.length} explainers</span>
            {loading && <span className="text-xs text-zinc-500 animate-pulse">Syncing...</span>}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Deep-dive visual science, quantum mechanics, subsea networking, and semiconductor explainers for the public blog.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={fetchDiscoveries}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleScanDiscoveries}
            disabled={scanning}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-lg text-xs transition-all shadow-md hover:shadow-purple-950/40 disabled:opacity-50 cursor-pointer"
            title="Use Gemini AI to research and write new deep-dive visual explainers"
          >
            {scanning ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
            <span>{scanning ? 'Scanning Breakthroughs...' : 'Scan Discoveries'}</span>
          </button>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discoveries by topic or title..."
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-8 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all"
          />
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          Showing {filtered.length} of {items.length}
        </div>
      </div>

      {/* 3. Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div 
            key={item.id}
            className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col hover:border-zinc-700 transition-all group"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-zinc-950 overflow-hidden">
              <img 
                src={item.hero_image_url} 
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=85';
                }}
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-black/75 backdrop-blur-md text-zinc-200 border border-white/10">
                  {item.category}
                </span>
              </div>
              <div className="absolute top-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PUBLISHED
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.intro}
                </p>
              </div>

              {/* Footer actions */}
              <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Eye size={12} /> {item.views_count || 0} views
                </span>
                <a
                  href={`http://localhost:3000/discover/${item.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors font-medium text-[11px]"
                >
                  <span>Preview</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 space-y-3">
            <BookOpen size={32} className="mx-auto text-zinc-600" />
            <div className="text-sm font-medium text-zinc-400">No discoveries found</div>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              Click &quot;Scan Discoveries&quot; to have Google Gemini research and draft new visual tech explainers automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
