import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  SlidersHorizontal 
} from 'lucide-react';

interface ArticleItem {
  id: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft' | 'In Review';
  author: string;
  date: string;
  views: string;
  slug: string;
}

export default function Articles() {
  const [filterTab, setFilterTab] = useState<'All' | 'Published' | 'Draft' | 'In Review'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [articles] = useState<ArticleItem[]>([
    { id: 'ART-984', title: 'The Future of AI Innovation in Cambodia', category: 'Technology', status: 'Published', author: 'Sokha R.', date: 'Oct 03, 2026', views: '14,280', slug: 'future-of-ai-cambodia' },
    { id: 'ART-983', title: 'Top 10 Hidden Temples in Siem Reap Beyond Angkor', category: 'Travel', status: 'Draft', author: 'Mony P.', date: 'Oct 02, 2026', views: '-', slug: 'top-10-hidden-temples-siem-reap' },
    { id: 'ART-982', title: 'Economic Growth Projections for ASEAN 2027', category: 'Economy', status: 'Published', author: 'Chea V.', date: 'Oct 01, 2026', views: '8,420', slug: 'economic-growth-asean-2027' },
    { id: 'ART-981', title: 'New Culinary Experiences Emerging in Phnom Penh', category: 'Lifestyle', status: 'In Review', author: 'Sokha R.', date: 'Sep 30, 2026', views: '-', slug: 'culinary-experiences-phnom-penh' },
    { id: 'ART-980', title: 'Sustainable Agriculture & Agri-Tech Initiatives', category: 'Environment', status: 'Published', author: 'Chan M.', date: 'Sep 29, 2026', views: '5,120', slug: 'sustainable-agritech-initiatives' },
    { id: 'ART-979', title: 'National Data Infrastructure Roadmap Completed', category: 'Technology', status: 'Published', author: 'Chea V.', date: 'Sep 28, 2026', views: '9,340', slug: 'national-data-infrastructure-roadmap' },
    { id: 'ART-978', title: 'Battambang Heritage Preservation Architecture', category: 'Culture', status: 'Published', author: 'Mony P.', date: 'Sep 27, 2026', views: '4,890', slug: 'battambang-heritage-preservation' },
  ]);

  const filtered = articles.filter((art) => {
    if (filterTab !== 'All' && art.status !== filterTab) return false;
    if (searchQuery && !art.title.toLowerCase().includes(searchQuery.toLowerCase()) && !art.author.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Articles Management</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage editorial queue, publish revisions, and inspect live posts.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors">
            <SlidersHorizontal size={13} className="text-zinc-400" />
            <span>Columns</span>
          </button>
          <button className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3.5 py-1.5 rounded-md text-xs transition-colors shadow-sm">
            <Plus size={14} />
            <span>Create Article</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono shrink-0 overflow-x-auto">
          {(['All', 'Published', 'Draft', 'In Review'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                filterTab === tab
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar & Category Filter */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, slug..." 
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          <select className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-zinc-700 cursor-pointer">
            <option>All Categories</option>
            <option>Technology</option>
            <option>Travel</option>
            <option>Economy</option>
            <option>Lifestyle</option>
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
                <th className="py-3 px-4 font-medium">Category</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Author</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium text-right">Views</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filtered.map((article) => (
                <tr key={article.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="py-3 px-4">
                    <input type="checkbox" className="rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-0" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-1 max-w-md">
                      {article.title}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>{article.id}</span>
                      <span>·</span>
                      <span>/{article.slug}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                    {article.category}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      article.status === 'Published'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : article.status === 'In Review'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        article.status === 'Published' ? 'bg-emerald-400' : article.status === 'In Review' ? 'bg-amber-400' : 'bg-zinc-500'
                      }`} />
                      {article.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-300">
                    {article.author}
                  </td>
                  <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                    {article.date}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-300">
                    {article.views}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`https://blog.camtech.cam/world/news/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                        title="View live post"
                      >
                        <ExternalLink size={13} />
                      </a>
                      <button 
                        className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                        title="Edit article"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
                        title="Delete article"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 px-5 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span>Showing 1-{filtered.length} of 1,248 items</span>
          <div className="flex items-center gap-1.5">
            <button className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 disabled:opacity-50">
              Previous
            </button>
            <button className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
