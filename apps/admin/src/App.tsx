import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';

// Lazy load all pages so they don't block the initial loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Articles = lazy(() => import('./pages/Articles'));
const Storage = lazy(() => import('./pages/Storage'));
const Settings = lazy(() => import('./pages/Settings'));
const Tourism = lazy(() => import('./pages/Tourism'));
const ProvinceDetails = lazy(() => import('./pages/ProvinceDetails'));
const Login = lazy(() => import('./pages/Login'));

// A simple loading spinner shown while downloading the page code
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
  </div>
);

function App() {
  // In a real app, you'd check auth state. For now, we will just assume user is logged in
  // or redirect based on simple state.
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Admin Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="articles" element={<Articles />} />
            <Route path="storage" element={<Storage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="tourism" element={<Tourism />} />
            <Route path="tourism/:slug" element={<ProvinceDetails />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
