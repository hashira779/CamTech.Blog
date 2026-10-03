import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import Storage from './pages/Storage';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  // In a real app, you'd check auth state. For now, we will just assume user is logged in
  // or redirect based on simple state.
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Admin Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="articles" element={<Articles />} />
          <Route path="storage" element={<Storage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
