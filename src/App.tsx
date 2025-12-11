import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, setStoreContextRef } from './context/AuthContext';
import { LayoutDashboard, Sprout, Settings, PlusCircle, Menu, X, Hexagon, Archive, FileText } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Profiles } from './components/Profiles';
import { NewGrow } from './components/NewGrow';
import { GrowDetail } from './components/GrowDetail';
import { SettingsPage } from './components/Settings';
import SeedBank from './components/SeedBank';
import Notes from './components/Notes';
import SetupManager from './components/SetupManager';
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
  const [isOpen, setIsOpen] = React.useState(false);

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

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="mobile-header fixed top-0 left-0 right-0 h-16 bg-[#0a0f1e]/95 backdrop-blur-md border-b border-emerald-500/20 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg">
            <Sprout className="text-white" size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">GrowTracker</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar / Mobile Menu Overlay */}
      <nav className={`
        sidebar-nav fixed inset-y-0 left-0 z-40 bg-[#0f172a] md:bg-[#0a0f1e] border-r border-emerald-500/20
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-full flex flex-col p-6 pt-6 md:pt-6 app-nav-content" style={{ paddingTop: '7rem' }}>
          {/* Desktop Header */}
          <div className="desktop-header hidden md:block mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                <Sprout className="text-white" size={28} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight">GrowTracker</span>
                <span className="text-xs text-emerald-400/80 font-medium tracking-wider uppercase">{t.nav.appSubtitle}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2 flex-1">
            <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>{t.nav.dashboard}</span>
            </Link>

            <Link to="/new-grow" className={`nav-link ${isActive('/new-grow') ? 'nav-link-active' : ''}`}>
              <PlusCircle size={20} />
              <span>{t.nav.newGrow}</span>
            </Link>

            <Link to="/profiles" className={`nav-link ${isActive('/profiles') ? 'nav-link-active' : ''}`}>
              <Sprout size={20} />
              <span>{t.nav.profiles}</span>
            </Link>

            <Link to="/setups" className={`nav-link ${isActive('/setups') ? 'nav-link-active' : ''}`}>
              <Hexagon size={20} />
              <span>{t.nav.setups}</span>
            </Link>

            <Link to="/seeds" className={`nav-link ${isActive('/seeds') ? 'nav-link-active' : ''}`}>
              <Archive size={20} />
              <span>{t.nav.seeds}</span>
            </Link>

            <Link to="/notes" className={`nav-link ${isActive('/notes') ? 'nav-link-active' : ''}`}>
              <FileText size={20} />
              <span>{t.nav.notes}</span>
            </Link>

            <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'nav-link-active' : ''}`}>
              <Settings size={20} />
              <span>{t.nav.settings}</span>
            </Link>
          </div>

          {/* User Status Badge */}
          <div className="pt-6 border-t border-slate-700/50 mt-auto">
            <div
              className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-3 ${isAuthenticated
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {isAuthenticated ? username : 'Gast-Modus'}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

const AppContent = () => {
  return (
    <div className="app-layout min-h-screen bg-[#0a0f1e]">
      <Navigation />
      <div className="main-content transition-all duration-300">
        <main className="container pt-20 md:pt-8 pb-8 px-4 mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/setups" element={<SetupManager />} />
            <Route path="/seeds" element={<SeedBank />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/new-grow" element={<NewGrow />} />
            <Route path="/grow/:id" element={<GrowDetail />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
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
