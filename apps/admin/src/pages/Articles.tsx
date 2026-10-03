import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  Radio,
  X
} from 'lucide-react';
import { api } from '../lib/api';
import type { ApiArticle } from '../lib/api';

export default function Articles() {
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'All' | 'PUBLISHED' | 'DRAFT'>('All');
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'KH' | 'WORLD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Article Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCountry, setNewCountry] = useState('KH');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (countryFilter !== 'ALL') {
        params.set('country', countryFilter);
      }
      const res = await api.get<{ items: ApiArticle[]; total: number }>(`/articles?${params.toString()}`);
      if (res.data?.items) {
        setArticles(res.data.items);
        setTotalCount(res.data.total || res.data.items.length);
      }
    } catch (err) {
      console.error('Failed to fetch real articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [countryFilter]);

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
      fetchArticles();
    } catch (err) {
      console.error('Failed to create article:', err);
      alert('Note: Publishing requires admin authentication token. If not logged in, please sign in.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the live database?`)) return;
    try {
      await api.delete(`/articles/${id}`);
      fetchArticles();
    } catch (err) {
      console.error('Failed to delete article:', err);
      alert('Failed to delete. Make sure you are authenticated with an admin token.');
    }
  };

  const filtered = articles.filter((art) => {
    if (filterTab !== 'All' && art.status !== filterTab) return false;
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Articles Management</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio size={10} className="animate-pulse" /> Live DB ({totalCount})
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Directly query and publish content to PostgreSQL database.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={fetchArticles}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3.5 py-1.5 rounded-md text-xs transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Create Article</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono shrink-0 overflow-x-auto">
          {(['All', 'PUBLISHED', 'DRAFT'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                filterTab === tab
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'All' ? `All (${totalCount})` : tab}
            </button>
          ))}
        </div>

        {/* Search Bar & Country Filter */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search live articles by title or slug..." 
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          <select 
            value={countryFilter}
            onChange={(e: any) => setCountryFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-zinc-700 cursor-pointer"
          >
            <option value="ALL">All Regions</option>
            <option value="KH">Cambodia (KH)</option>
            <option value="WORLD">World</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-0" />
                </th>
                <th className="py-3 px-4 font-medium">Article Title & Slug</th>
                <th className="py-3 px-4 font-medium">Region</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Attribution</th>
                <th className="py-3 px-4 font-medium text-right">Views</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                    Loading records from PostgreSQL database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono text-xs">
                    No articles match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 px-4">
                      <input type="checkbox" className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-0" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-1 max-w-md">
                        {article.title}
                      </div>
                      {article.title_km && (
                        <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          {article.title_km}
                        </div>
                      )}
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span>{article.id.slice(0, 8)}</span>
                        <span>·</span>
                        <span>/{article.slug}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                      {article.country}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        article.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          article.status === 'PUBLISHED' ? 'bg-emerald-400' : 'bg-zinc-500'
                        }`} />
                        {article.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {article.source_attribution_text || 'Editorial Desk'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-zinc-300">
                      {article.views_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={article.country === 'KH' ? `https://blog.camtech.cam/cambodia/news/${article.slug}` : `https://blog.camtech.cam/world/news/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                          title="View live post on blog.camtech.cam"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button 
                          onClick={() => handleDelete(article.id, article.title)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                          title="Delete from database"
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

        {/* Pagination Footer */}
        <div className="p-3 px-5 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Showing {filtered.length} of {totalCount} live database records</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500">PostgreSQL 16 Connection Active</span>
          </div>
        </div>
      </div>

      {/* Modal: Create Article */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-semibold text-zinc-100">Create Live Article</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300">Article Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Cambodia AI Innovation Hub Opens in Phnom Penh"
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Region</label>
                  <select
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                  >
                    <option value="KH">Cambodia (KH)</option>
                    <option value="WORLD">World</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300">Primary Source URL</label>
                  <input
                    type="url"
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="https://akp.gov.kh"
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">Summary (Lead paragraph)</label>
                <textarea
                  required
                  rows={2}
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Brief synopsis displayed on home feed..."
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300">Article Content (Markdown)</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Full article content body..."
                  className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-zinc-950 bg-zinc-100 hover:bg-white disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating ? 'Publishing...' : 'Publish to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
