import { Outlet } from 'react-router-dom';
import Sidebar from './layout/Sidebar';
import Topbar from './layout/Topbar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden selection:bg-zinc-700 selection:text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-950">
        <Topbar />
        <div className="flex-1 overflow-y-auto bg-zinc-950/80">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
