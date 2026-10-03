import { Outlet, Link } from 'react-router-dom';
import './AdminLayout.css';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <h2>CamTech Admin</h2>
        <nav>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/articles">Articles</Link></li>
            {/* Add more links here */}
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>Welcome, Admin</div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
