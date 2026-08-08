import React from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import DashboardOverview from './components/features/DashboardOverview.jsx';
import FileExplorer from './components/features/FileExplorer.jsx';
import AccountsManagement from './components/features/AccountsManagement.jsx';
import LightboxModal from './components/common/LightboxModal.jsx';
import AddAccountModal from './components/common/AddAccountModal.jsx';
import LoginModal from './components/common/LoginModal.jsx';
import { useState, useEffect } from 'react';
import { fetchPhotos, fetchAccounts, fetchStats, addAccount } from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStorageFilter, setActiveStorageFilter] = useState('all');
  const [activeSubfolderFilter, setActiveSubfolderFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayLimit, setDisplayLimit] = useState(36);

  const [allMedia, setAllMedia] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [lightboxContext, setLightboxContext] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Check Auth Session on Load
  useEffect(() => {
    const savedUser = localStorage.getItem('gdgate_user');
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch (e) {}
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [photosRes, accountsRes, statsRes] = await Promise.all([
        fetchPhotos(), fetchAccounts(), fetchStats()
      ]);
      setAllMedia(photosRes || []);
      setAccounts(accountsRes || []);
      setStats(statsRes);
    } catch (e) {
      console.log("Fetch Data Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchData(); }, [user]);

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari OmniGallery Dashboard?")) {
      localStorage.removeItem('gdgate_user');
      setUser(null);
    }
  };

  const handleAddAccount = async (newAccountData) => {
    try {
      const data = await addAccount(newAccountData);
      if (data && data.accounts) setAccounts(data.accounts);
      setTimeout(fetchData, 1000);
    } catch (e) {
      console.log("Add Account Error:", e);
    }
  };

  if (!user) {
    return <LoginModal onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (activeTab !== 'explorer') setActiveTab('explorer');
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar — hidden on mobile */}
        <Sidebar
          activeTab={activeTab}
          onSwitchTab={(t) => setActiveTab(t)}
          stats={stats}
        />

        {/* Content Area — add bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto bg-slate-950/60 pb-20 md:pb-8">
          {loading && (
            <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-bold gap-2">
              <i className="fa-solid fa-spinner animate-spin text-blue-400 text-lg"></i> Memuat data galeri...
            </div>
          )}

          {!loading && activeTab === 'dashboard' && (
            <DashboardOverview
              accounts={accounts}
              allMedia={allMedia}
              stats={stats}
              onOpenLightbox={(item, context) => {
                setSelectedMedia(item);
                setLightboxContext(context || allMedia);
              }}
              onNavigateToExplorer={() => setActiveTab('explorer')}
            />
          )}

          {!loading && activeTab === 'explorer' && (
            <FileExplorer
              allMedia={allMedia}
              accounts={accounts}
              activeCategory={activeCategory}
              onSelectCategory={(c) => { setActiveCategory(c); setDisplayLimit(36); }}
              activeStorageFilter={activeStorageFilter}
              onSelectStorage={(s) => { setActiveStorageFilter(s); setActiveSubfolderFilter('all'); setDisplayLimit(36); }}
              activeSubfolderFilter={activeSubfolderFilter}
              onSelectSubfolder={(sf) => { setActiveSubfolderFilter(sf); setDisplayLimit(36); }}
              searchQuery={searchQuery}
              onSearchChange={(q) => setSearchQuery(q)}
              viewMode={viewMode}
              onSelectViewMode={(v) => setViewMode(v)}
              displayLimit={displayLimit}
              onLoadMore={() => setDisplayLimit(prev => prev + 36)}
              onShowAll={() => setDisplayLimit(999999)}
              onOpenLightbox={(item, context) => {
                setSelectedMedia(item);
                setLightboxContext(context || allMedia);
              }}
            />
          )}

          {!loading && activeTab === 'accounts' && (
            <AccountsManagement
              accounts={accounts}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onSwitchTab={(t) => setActiveTab(t)} />

      {/* Lightbox Modal */}
      {selectedMedia && (
        <LightboxModal
          item={selectedMedia}
          allMedia={lightboxContext.length > 0 ? lightboxContext : allMedia}
          onNavigate={(item) => setSelectedMedia(item)}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <AddAccountModal
          onClose={() => setIsAddModalOpen(false)}
          onAddAccount={handleAddAccount}
        />
      )}
    </div>
  );
}
