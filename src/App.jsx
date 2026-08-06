function App() {
  const [user, setUser] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [viewMode, setViewMode] = React.useState('grid');
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [activeStorageFilter, setActiveStorageFilter] = React.useState('all');
  const [activeSubfolderFilter, setActiveSubfolderFilter] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [displayLimit, setDisplayLimit] = React.useState(36);

  const [allMedia, setAllMedia] = React.useState([]);
  const [accounts, setAccounts] = React.useState([]);
  const [stats, setStats] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const [selectedMedia, setSelectedMedia] = React.useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  // Check Auth Session on Load
  React.useEffect(() => {
    const savedUser = localStorage.getItem('gdgate_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  // Fetch API Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [photosRes, accountsRes, statsRes] = await Promise.all([
        fetch('/api/photos').then(r => r.json()).catch(() => []),
        fetch('/api/accounts').then(r => r.json()).catch(() => []),
        fetch('/api/stats').then(r => r.json()).catch(() => null)
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

  React.useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari OmniGallery Dashboard?")) {
      localStorage.removeItem('gdgate_user');
      setUser(null);
    }
  };

  const handleAddAccount = async (newAccountData) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccountData)
      });
      const data = await res.json();
      if (data.accounts) {
        setAccounts(data.accounts);
      }
      setTimeout(fetchData, 1000);
    } catch (e) {
      console.log("Add Account Error:", e);
    }
  };

  if (!user) {
    return <window.LoginModal onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <window.Navbar 
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
        {/* Sidebar */}
        <window.Sidebar 
          activeTab={activeTab} 
          onSwitchTab={(t) => setActiveTab(t)} 
          stats={stats} 
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950/60 pb-16">
          {loading && (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs font-bold gap-2">
              <i className="fa-solid fa-spinner animate-spin text-blue-400 text-lg"></i> Memuat data galeri...
            </div>
          )}

          {!loading && activeTab === 'dashboard' && (
            <window.DashboardOverview 
              accounts={accounts}
              allMedia={allMedia}
              stats={stats}
              onOpenLightbox={(item) => setSelectedMedia(item)}
              onNavigateToExplorer={() => setActiveTab('explorer')}
            />
          )}

          {!loading && activeTab === 'explorer' && (
            <window.FileExplorer 
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
              onOpenLightbox={(item) => setSelectedMedia(item)}
            />
          )}

          {!loading && activeTab === 'accounts' && (
            <window.AccountsManagement 
              accounts={accounts}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Lightbox Modal */}
      {selectedMedia && (
        <window.LightboxModal 
          item={selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
        />
      )}

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <window.AddAccountModal 
          onClose={() => setIsAddModalOpen(false)}
          onAddAccount={handleAddAccount}
        />
      )}
    </div>
  );
}

window.App = App;
