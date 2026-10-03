import { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';

export default function Articles() {
  const [articles] = useState([
    { id: 1, title: 'The Future of AI in Cambodia', category: 'Technology', status: 'Published', author: 'Sokha R.', date: 'Oct 03, 2026', views: '12.5K' },
    { id: 2, title: 'Top 10 Hidden Temples in Siem Reap', category: 'Travel', status: 'Draft', author: 'Mony P.', date: 'Oct 02, 2026', views: '-' },
    { id: 3, title: 'Economic Growth Projections 2027', category: 'Economy', status: 'Published', author: 'Chea V.', date: 'Oct 01, 2026', views: '8.2K' },
    { id: 4, title: 'New Culinary Experiences in Phnom Penh', category: 'Lifestyle', status: 'Review', author: 'Sokha R.', date: 'Sep 30, 2026', views: '-' },
    { id: 5, title: 'Sustainable Farming Initiatives', category: 'Environment', status: 'Published', author: 'Chan M.', date: 'Sep 29, 2026', views: '4.1K' },
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Articles Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Create, edit, and manage your editorial content.</p>
        </div>
        <button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
          <Plus size={18} />
          New Article
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search articles by title, author..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium w-full sm:w-auto justify-center">
            <Filter size={16} />
            Filters
          </button>
          <select className="border border-slate-200 text-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 bg-white cursor-pointer w-full sm:w-auto">
            <option>All Status</option>
            <option>Published</option>
            <option>Drafts</option>
            <option>In Review</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{article.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide
                      ${article.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 
                        article.status === 'Draft' ? 'bg-slate-100 text-slate-600' : 
                        'bg-amber-100 text-amber-700'}`}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{article.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {article.author.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{article.author}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{article.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{article.views}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View">
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing <span className="font-medium text-slate-900">1</span> to <span className="font-medium text-slate-900">5</span> of <span className="font-medium text-slate-900">124</span> results</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
