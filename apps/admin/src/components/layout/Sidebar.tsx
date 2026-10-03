import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Users, LogOut } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Articles', path: '/articles', icon: FileText },
    { name: 'Users', path: '/users', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
            C
          </span>
          CamTech Admin
        </h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-teal-500/10 text-teal-400 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-teal-400' : ''} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link 
          to="/login"
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 transition-colors rounded-xl hover:bg-slate-800"
        >
          <LogOut size={20} />
          Logout
        </Link>
      </div>
    </aside>
  );
}
