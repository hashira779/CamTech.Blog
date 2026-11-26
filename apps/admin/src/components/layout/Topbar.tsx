import { type FormEvent, useState } from 'react';
import { Search, Plus, MessageSquareWarning, ExternalLink } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Control Center',
  '/articles': 'Articles',
  '/discoveries': 'Visual Discoveries',
  '/tourism': 'Destinations & Places',
  '/suggestions': 'Place Approvals',
  '/feedback': 'User Reports',
  '/storage': 'Media Storage',
  '/settings': 'Settings & AI',
  '/database': 'Database',
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const pageTitle =
    Object.entries(ROUTE_TITLES).find(([prefix]) => location.pathname.startsWith(prefix))?.[1] ||
    'Admin';

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/articles?q=${encodeURIComponent(trimmed)}` : '/articles');
  };

  return (
    <header className="h-14 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/80 flex items-center justify-between gap-4 px-5 shrink-0 z-10 select-none">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <span className="hidden lg:inline-block text-xs font-semibold text-zinc-200 tracking-tight whitespace-nowrap">
          {pageTitle}
        </span>
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input
            id="global-search-input"
            data-shortcut="search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles & press Enter..."
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md py-1.5 pl-9 pr-12 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">
            Ctrl+K
          </kbd>
        </form>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/feedback"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-300 hover:text-white bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 transition-colors"
        >
          <MessageSquareWarning size={13} className="text-amber-400" />
          <span>Reports</span>
        </Link>

        <a
          href="https://camtech.cam"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-zinc-300 hover:text-white bg-zinc-900/70 hover:bg-zinc-800 border border-zinc-800 transition-colors"
        >
          <ExternalLink size={13} className="text-zinc-400" />
          <span>camtech.cam</span>
        </a>

        <Link
          to="/articles?new=true"
          data-shortcut="new-article"
          className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3 py-1.5 rounded-md text-xs transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span>New Article</span>
        </Link>
      </div>
    </header>
  );
}
