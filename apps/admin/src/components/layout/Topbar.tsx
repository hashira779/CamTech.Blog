import { Bell, Search, Plus, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Topbar() {
  return (
    <header className="h-14 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800/80 flex items-center justify-between px-6 shrink-0 z-10 select-none">
      {/* Search and Command Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input 
            type="text" 
            placeholder="Search articles, authors, commands..." 
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-md py-1.5 pl-9 pr-12 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-colors"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Live sync indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-400 bg-zinc-900/50 border border-zinc-800/80">
          <Radio size={12} className="text-emerald-500 animate-pulse" />
          <span>Sync: Online</span>
        </div>

        {/* Notifications */}
        <button 
          title="Notifications"
          className="relative p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors"
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
        </button>

        {/* New Article Action */}
        <Link
          to="/articles"
          className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3 py-1.5 rounded-md text-xs transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span>New Article</span>
        </Link>
      </div>
    </header>
  );
}
