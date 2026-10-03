import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  LogOut, 
  FolderTree, 
  BarChart3, 
  ExternalLink,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Articles', path: '/articles', icon: FileText, badge: '1,248' },
    { name: 'Categories', path: '/categories', icon: FolderTree },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Storage', path: '/storage', icon: HardDrive },
  ];

  const systemNav = [
    { name: 'Users & Roles', path: '/users', icon: Users },
    { name: 'Infrastructure', path: '/infrastructure', icon: Layers },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col shrink-0 select-none">
      {/* Workspace Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-800/80">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-950 font-bold flex items-center justify-center text-xs tracking-tight shadow-sm">
            CT
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-zinc-100 tracking-tight leading-none group-hover:text-white transition-colors">
              CamTech Editorial
            </span>
            <span className="text-[10px] text-zinc-500 font-mono mt-1">production</span>
          </div>
        </Link>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          v2.4
        </span>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Platform
          </div>
          <nav className="space-y-0.5">
            {mainNav.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors duration-150 ${
                    isActive 
                      ? 'bg-zinc-800/90 text-white font-medium border-l-2 border-white pl-2' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className={isActive ? 'text-white' : 'text-zinc-400'} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            System
          </div>
          <nav className="space-y-0.5">
            {systemNav.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors duration-150 ${
                    isActive 
                      ? 'bg-zinc-800/90 text-white font-medium border-l-2 border-white pl-2' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className={isActive ? 'text-white' : 'text-zinc-400'} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-2 border-t border-zinc-800/60">
          <a
            href="https://blog.camtech.cam"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-2.5 py-2 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink size={14} className="text-zinc-500" />
              <span>Visit Live Blog</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-600">↗</span>
          </a>
        </div>
      </div>

      {/* Footer Profile */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 text-xs font-semibold shrink-0">
            A
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-xs font-medium text-zinc-200 truncate leading-tight">Admin User</span>
            <span className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
              <ShieldCheck size={10} className="text-emerald-500" /> Superadmin
            </span>
          </div>
        </div>
        <Link 
          to="/login"
          title="Sign out"
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded transition-colors"
        >
          <LogOut size={14} />
        </Link>
      </div>
    </aside>
  );
}
