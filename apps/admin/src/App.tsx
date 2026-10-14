import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';
import { isAuthenticated } from './lib/auth';
import { ToastProvider } from './components/ui/Toast';

// Lazy load all pages so they don't block the initial loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Articles = lazy(() => import('./pages/Articles'));
const Storage = lazy(() => import('./pages/Storage'));
const Discoveries = lazy(() => import('./pages/Discoveries'));
const Settings = lazy(() => import('./pages/Settings'));
const Tourism = lazy(() => import('./pages/Tourism'));
const ProvinceDetails = lazy(() => import('./pages/ProvinceDetails'));
const PlaceSuggestions = lazy(() => import('./pages/PlaceSuggestions'));
const DatabaseMigration = lazy(() => import('./pages/Database'));
const Login = lazy(() => import('./pages/Login'));

// A simple loading spinner shown while downloading the page code
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
  </div>
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    const currentPath = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Admin Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="articles" element={<Articles />} />
              <Route path="discoveries" element={<Discoveries />} />
              <Route path="storage" element={<Storage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="database" element={<DatabaseMigration />} />
              <Route path="tourism" element={<Tourism />} />
              <Route path="tourism/:slug" element={<ProvinceDetails />} />
              <Route path="suggestions" element={<PlaceSuggestions />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

