import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  HardDrive, 
  MapPin, 
  Database,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const mainNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Articles', path: '/articles', icon: FileText },
    { name: 'Discoveries', path: '/discoveries', icon: Sparkles },
    { name: 'Destinations', path: '/tourism', icon: MapPin },
    { name: 'Place Approvals', path: '/suggestions', icon: ShieldCheck },
    { name: 'Media Storage', path: '/storage', icon: HardDrive },
  ];

  const systemNav = [
    { name: 'Users & Roles', path: '/users', icon: Users },
    { name: 'Infrastructure', path: '/infrastructure', icon: Layers },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Database Config', path: '/database', icon: Database },
  ];

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } bg-zinc-950 border-r border-zinc-800/80 flex flex-col shrink-0 select-none transition-all duration-200`}
    >
      {/* Workspace Header */}
      <div className="h-14 px-3.5 flex items-center justify-between border-b border-zinc-800/80">
        <Link to="/dashboard" className="flex items-center gap-2.5 group overflow-hidden">
          <div className="w-7 h-7 rounded bg-zinc-100 text-zinc-950 font-bold flex items-center justify-center text-xs tracking-tight shadow-sm shrink-0">
            CT
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-100 tracking-tight leading-none group-hover:text-white transition-colors truncate">
                CamTech Editorial
              </span>
              <span className="text-[10px] text-zinc-500 font-mono mt-1">production</span>
            </div>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 p-1 rounded transition-colors"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-6">
        <div>
          {!sidebarCollapsed && (
            <div className="px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Platform
            </div>
          )}
          <nav className="space-y-0.5">
            {mainNav.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-2.5'
                  } py-2 rounded-md text-xs transition-colors duration-150 ${
                    isActive 
                      ? 'bg-zinc-800/90 text-white font-medium border-l-2 border-emerald-500 pl-2' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-emerald-400 shrink-0' : 'text-zinc-400 shrink-0'} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          {!sidebarCollapsed && (
            <div className="px-2 mb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              System
            </div>
          )}
          <nav className="space-y-0.5">
            {systemNav.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-2.5'
                  } py-2 rounded-md text-xs transition-colors duration-150 ${
                    isActive 
                      ? 'bg-zinc-800/90 text-white font-medium border-l-2 border-emerald-500 pl-2' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} className={isActive ? 'text-emerald-400 shrink-0' : 'text-zinc-400 shrink-0'} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
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
            title={sidebarCollapsed ? 'Visit Live Blog' : undefined}
            className={`flex items-center ${
              sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-2.5'
            } py-2 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors`}
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink size={15} className="text-zinc-500 shrink-0" />
              {!sidebarCollapsed && <span>Visit Live Blog</span>}
            </div>
            {!sidebarCollapsed && <span className="text-[10px] font-mono text-zinc-600">↗</span>}
          </a>
        </div>
      </div>

      {/* Footer Profile */}
      <div className={`p-3 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center ${
        sidebarCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-xs font-semibold shrink-0">
            {(user?.full_name || user?.email || 'A')[0].toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-medium text-zinc-200 truncate leading-tight">
                {user?.full_name || user?.email || 'Admin User'}
              </span>
              <span className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
                <ShieldCheck size={10} className="text-emerald-500" /> {user?.role || 'Administrator'}
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={handleLogout}
          title="Sign out"
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
