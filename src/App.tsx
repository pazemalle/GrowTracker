import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, setStoreContextRef } from './context/AuthContext';
import { LayoutDashboard, Sprout, Settings, PlusCircle } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Profiles } from './components/Profiles';
import { NewGrow } from './components/NewGrow';
import { GrowDetail } from './components/GrowDetail';
import { SettingsPage } from './components/Settings';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

// Wrapper component to set StoreContext reference for AuthContext
const StoreContextConnector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useStore();

  useEffect(() => {
    setStoreContextRef(store);
  }, [store]);

  return <>{children}</>;
};

const Navigation = () => {
  const location = useLocation();
  const { t } = useLanguage();

  // Get auth state
  let isAuthenticated = false;
  let username = '';

  try {
    const auth = useAuth();
    isAuthenticated = auth.isAuthenticated;
    username = auth.username || '';
  } catch {
    // AuthContext not available
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="app-navigation">
      <div className="nav-container">
        <div className="nav-header">
          <div className="nav-title">
            <div className="nav-icon-wrapper">
              <Sprout className="nav-icon" size={24} />
            </div>
            GrowTracker
          </div>
          <p className="nav-subtitle">{t.nav.appSubtitle}</p>
        </div>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>
            <LayoutDashboard size={20} />
            <span>{t.nav.dashboard}</span>
          </Link>

          <Link to="/profiles" className={`nav-link ${isActive('/profiles') ? 'nav-link-active' : ''}`}>
            <Sprout size={20} />
            <span>{t.nav.profiles}</span>
          </Link>

          <Link to="/new-grow" className={`nav-link ${isActive('/new-grow') ? 'nav-link-active' : ''}`}>
            <PlusCircle size={20} />
            <span>{t.nav.newGrow}</span>
          </Link>

          <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'nav-link-active' : ''}`}>
            <Settings size={20} />
            <span>{t.nav.settings}</span>
          </Link>
        </div>

        {/* User Status Badge */}
        <div className="mt-auto p-4 border-t border-slate-700">
          <div
            className={`px-3 py-2 rounded-lg border text-xs font-medium ${isAuthenticated
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }`}
            title={isAuthenticated ? `Angemeldet als ${username}` : 'Gast-Modus (nur lokal)'}
          >
            {isAuthenticated ? `👤 ${username}` : '👤 Gast'}
          </div>
        </div>
      </div>
    </nav>
  );
};

const AppContent = () => {
  return (
    <>
      <Navigation />
      <div style={{ marginLeft: '320px', minHeight: '100vh' }}>
        <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/new-grow" element={<NewGrow />} />
            <Route path="/grow/:id" element={<GrowDetail />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StoreProvider>
          <StoreContextConnector>
            <Router>
              <AppContent />
            </Router>
          </StoreContextConnector>
        </StoreProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
