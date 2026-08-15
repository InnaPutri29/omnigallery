import React, { useState } from 'react';
import MediaCard from '../common/MediaCard.jsx';
import { renameFolder } from '../../services/api.js';

export default function FileExplorer({
  allMedia,
  accounts,
  activeCategory,
  onSelectCategory,
  activeStorageFilter,
  onSelectStorage,
  activeSubfolderFilter,
  onSelectSubfolder,
  searchQuery,
  onSearchChange,
  viewMode,
  onSelectViewMode,
  displayLimit,
  onLoadMore,
  onShowAll,
  onOpenLightbox,
  onRefreshData,
  contentMode
}) {
  const [sortBy, setSortBy] = useState('time'); // 'time', 'name', 'size'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [draggedAcc, setDraggedAcc] = useState(null);
  const [showAllStorageBtn, setShowAllStorageBtn] = useState(() => {
    try {
      return localStorage.getItem('gallery_show_all_storage') !== 'false';
    } catch {
      return true;
    }
  });
  
  const handleToggleAllStorage = () => {
    const newState = !showAllStorageBtn;
    setShowAllStorageBtn(newState);
    localStorage.setItem('gallery_show_all_storage', newState);
    if (!newState && activeStorageFilter === 'all' && accounts.length > 0) {
      onSelectStorage(accounts[0].name);
    }
  };

  const [accountOrder, setAccountOrder] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gallery_account_order')) || [];
    } catch {
      return [];
    }
  });

  const handleRenameSubfolder = async (subfolderName) => {
    const newName = window.prompt(`Ubah nama folder "${subfolderName}" di Google Drive / Hardisk:`, subfolderName);
    if (!newName || newName.trim() === '' || newName.trim() === subfolderName) return;

    const currentAcc = accounts.find(a => a.name === activeStorageFilter);
    const folderType = currentAcc?.type || 'gdrive';

    try {
      const res = await renameFolder(folderType, subfolderName, newName.trim());
      if (res && !res.error) {
        alert(`Nama folder berhasil diubah dari "${subfolderName}" menjadi "${newName.trim()}"!`);
        if (onRefreshData) onRefreshData();
      } else {
        alert("Gagal mengubah nama folder: " + (res?.error || "Error tidak diketahui"));
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  };
  const filteredMedia = allMedia.filter(item => {
    if (activeCategory === 'image' && item.type !== 'image') return false;
    if (activeCategory === 'video' && item.type !== 'video') return false;
    if (activeCategory === 'doc' && item.type !== 'doc') return false;

    if (activeStorageFilter !== 'all') {
      const matchExact = item.accountName === activeStorageFilter;
      const matchPartial = item.accountName && activeStorageFilter && (item.accountName.toLowerCase().includes(activeStorageFilter.toLowerCase()) || activeStorageFilter.toLowerCase().includes(item.accountName.toLowerCase()));
      if (!matchExact && !matchPartial) return false;
    }
    if (activeSubfolderFilter !== 'all' && item.subfolder !== activeSubfolderFilter) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const accMatch = (item.accountName || '').toLowerCase().includes(q);
      const folderMatch = (item.subfolder || '').toLowerCase().includes(q);
      if (!titleMatch && !accMatch && !folderMatch) return false;
    }

    return true;
  });

  const itemsInActiveStorage = activeStorageFilter === 'all' 
    ? [] 
    : allMedia.filter(m => m.accountName === activeStorageFilter);
  
  const availableSubfolders = [...new Set(itemsInActiveStorage.map(m => m.subfolder).filter(Boolean))];
  const showSubfolders = activeStorageFilter !== 'all' && availableSubfolders.length > 1;

  let categoryLabel = 'File';
  if (activeCategory === 'image') categoryLabel = 'Foto';
  else if (activeCategory === 'video') categoryLabel = 'Video';
  else if (activeCategory === 'doc') categoryLabel = 'Dokumen';

  const sortedMedia = [...filteredMedia].sort((a, b) => {
    let valA, valB;
    if (sortBy === 'name') {
      valA = (a.title || '').toLowerCase();
      valB = (b.title || '').toLowerCase();
    } else if (sortBy === 'size') {
      valA = a.size || 0;
      valB = b.size || 0;
    } else { // 'time'
      valA = a.modified ? new Date(a.modified).getTime() : 0;
      valB = b.modified ? new Date(b.modified).getTime() : 0;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const displayedItems = sortedMedia.slice(0, displayLimit);

  const videoCountInSubfolder = activeCategory === 'image' ? allMedia.filter(m => 
    (activeStorageFilter === 'all' || m.accountName === activeStorageFilter) &&
    (activeSubfolderFilter === 'all' || m.subfolder === activeSubfolderFilter) &&
    m.type === 'video'
  ).length : 0;

  return (
    <div className="p-3 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* Storage Filter Pills Navigation */}
      <div className="p-3 md:p-4 rounded-2xl glass-panel dark:bg-slate-900/90 border border-white/60 dark:border-slate-800 space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] md:text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-blue-600 dark:text-blue-400"></i> Sumber Penyimpanan:
            <button 
              onClick={handleToggleAllStorage} 
              title={showAllStorageBtn ? "Sembunyikan tombol 'Semua Storage'" : "Tampilkan tombol 'Semua Storage'"}
              className="ml-2 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
            >
              <i className={`fa-solid ${showAllStorageBtn ? 'fa-eye' : 'fa-eye-slash'}`}></i>
            </button>
          </p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{accounts.length + (showAllStorageBtn ? 1 : 0)} Aktif</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {showAllStorageBtn && (
            <button
              onClick={() => onSelectStorage('all')}
              className={`whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${activeStorageFilter === 'all' ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-white/50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-white/60 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <i className="fa-solid fa-border-all"></i> Semua Storage ({allMedia.length})
            </button>
          )}

          {(() => {
            const uniqueAccounts = [];
            const seen = new Set();
            accounts.forEach(acc => {
              if (!seen.has(acc.name)) {
                seen.add(acc.name);
                uniqueAccounts.push(acc);
              }
            });

            // Sort uniqueAccounts by user-defined order
            uniqueAccounts.sort((a, b) => {
              const idxA = accountOrder.indexOf(a.name);
              const idxB = accountOrder.indexOf(b.name);
              if (idxA === -1 && idxB === -1) return 0;
              if (idxA === -1) return 1;
              if (idxB === -1) return -1;
              return idxA - idxB;
            });

            return uniqueAccounts.map(acc => {
              const count = allMedia.filter(m => m.accountName === acc.name).length;
              const isDrive = acc.type === 'gdrive';
              const isSelected = activeStorageFilter === acc.name;
              const isDragged = draggedAcc === acc.name;

              return (
                <button
                  key={acc.name}
                  draggable="true"
                  onDragStart={(e) => {
                    setDraggedAcc(acc.name);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedAcc && draggedAcc !== acc.name) {
                      const currentNames = uniqueAccounts.map(a => a.name);
                      const fromIdx = currentNames.indexOf(draggedAcc);
                      const toIdx = currentNames.indexOf(acc.name);
                      
                      const newOrder = [...currentNames];
                      newOrder.splice(fromIdx, 1);
                      newOrder.splice(toIdx, 0, draggedAcc);
                      
                      setAccountOrder(newOrder);
                      localStorage.setItem('gallery_account_order', JSON.stringify(newOrder));
                    }
                    setDraggedAcc(null);
                  }}
                  onDragEnd={() => setDraggedAcc(null)}
                  onClick={() => onSelectStorage(acc.name)}
                  className={`whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isDragged ? 'opacity-50 scale-95 border-dashed border-blue-500' : ''} ${isSelected ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-white/50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-white/60 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <i className={isDrive ? 'fa-brands fa-google-drive text-emerald-600 dark:text-emerald-400' : 'fa-solid fa-folder text-amber-500 dark:text-amber-400'}></i>
                  {acc.name} <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Dynamic Subfolder Filter Pills */}
      {showSubfolders && (
        <div className="p-4 rounded-2xl glass-panel dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 border border-amber-400/30 dark:border-blue-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-folder-open text-amber-600 dark:text-amber-400"></i> Pilih Subfolder di dalam Storage ini:
            </p>
            <span className="text-[10px] text-slate-700 dark:text-slate-400 font-mono font-bold bg-white/50 dark:bg-slate-950/60 px-2.5 py-1 rounded-lg border border-white/60 dark:border-slate-800">
              {availableSubfolders.length} Subfolder
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-h-56 overflow-y-auto pr-1">
            <button
              onClick={() => onSelectSubfolder('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${activeSubfolderFilter === 'all' ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md' : 'bg-white/50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-white/60 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-white/80 dark:hover:border-slate-700'}`}
            >
              <i className="fa-solid fa-folder"></i> Semua Subfolder ({itemsInActiveStorage.length})
            </button>

            {availableSubfolders.map(sf => {
              const count = itemsInActiveStorage.filter(m => m.subfolder === sf).length;
              const isSelected = activeSubfolderFilter === sf;

              return (
                <button
                  key={sf}
                  onClick={() => onSelectSubfolder(sf)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 max-w-[260px] ${isSelected ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md' : 'bg-white/50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-white/60 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:border-white/80 dark:hover:border-slate-700'}`}
                  title={sf}
                >
                  <i className="fa-solid fa-folder text-amber-400 flex-shrink-0"></i>
                  <span className="truncate">{sf}</span>
                  <span className="ml-0.5 text-[10px] opacity-75 font-mono flex-shrink-0">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Control Bar: Categories, Search, & View Modes */}
      <div className="p-4 rounded-2xl glass-panel dark:bg-slate-900/90 border border-white/60 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Semua File
          </button>
          <button
            onClick={() => onSelectCategory('image')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'image' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <i className="fa-solid fa-image mr-1"></i> Foto
          </button>
          <button
            onClick={() => onSelectCategory('video')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeCategory === 'video' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <i className="fa-solid fa-circle-play mr-1 text-rose-400"></i> Video
          </button>
        </div>

        {/* Search & View Mode Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari file di sini..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-950 border border-white/60 dark:border-slate-800 text-xs text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-950 px-2 py-1.5 rounded-xl border border-white/60 dark:border-slate-800">
            <div className="relative">
              <button 
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 bg-transparent text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {sortBy === 'time' ? 'Waktu' : sortBy === 'name' ? 'Nama' : 'Ukuran'}
                <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${showSortMenu ? 'rotate-180' : ''}`}></i>
              </button>
              
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)}></div>
                  <div className="absolute right-0 mt-4 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {[
                      { val: 'time', label: 'Waktu', icon: 'fa-clock' },
                      { val: 'name', label: 'Nama', icon: 'fa-font' },
                      { val: 'size', label: 'Ukuran', icon: 'fa-hard-drive' }
                    ].map(opt => (
                      <button 
                        key={opt.val}
                        onClick={() => { setSortBy(opt.val); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 ${sortBy === opt.val ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        <i className={`fa-solid ${opt.icon} w-3 text-center opacity-70`}></i>
                        {opt.label}
                        {sortBy === opt.val && <i className="fa-solid fa-check ml-auto text-blue-500"></i>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={`Urutkan: ${sortOrder === 'asc' ? 'Menaik' : 'Menurun'}`}
              className="ml-1 w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <i className={`fa-solid ${sortOrder === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`}></i>
            </button>
          </div>

          <div className="flex items-center bg-white/50 dark:bg-slate-950 rounded-xl p-1 border border-white/60 dark:border-slate-800">
            <button
              onClick={() => onSelectViewMode('grid')}
              title="Tampilan Grid"
              className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <i className="fa-solid fa-border-all"></i>
            </button>
            <button
              onClick={() => onSelectViewMode('list')}
              title="Tampilan Daftar"
              className={`p-2 rounded-lg text-xs transition-all cursor-pointer ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <i className="fa-solid fa-list-ul"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredMedia.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          {activeCategory === 'image' && videoCountInSubfolder > 0 ? (
            <div className="space-y-3 py-6 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-xl font-bold">
                <i className="fa-solid fa-film"></i>
              </div>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">Subfolder ini Berisi Video!</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Folder ini tidak memiliki file Foto, tetapi memiliki <span className="font-mono text-rose-500 dark:text-rose-400 font-bold">{videoCountInSubfolder} file Video</span>.
              </p>
              <button 
                onClick={() => onSelectCategory('video')} 
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-circle-play"></i> Klik di Sini untuk Tampilkan {videoCountInSubfolder} Video
              </button>
            </div>
          ) : (
            <p className="text-slate-400 text-sm font-medium">Tidak ada file yang cocok dengan pencarian.</p>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {displayedItems.map(item => (
            <MediaCard 
              key={item.id} 
              item={item} 
              onOpenLightbox={(item) => onOpenLightbox(item, filteredMedia)} 
            />
          ))}

          {/* Pagination Controls */}
          {filteredMedia.length > displayLimit && (
            <div className="col-span-full flex flex-col items-center justify-center pt-6 pb-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Menampilkan {displayedItems.length} dari {filteredMedia.length} total {categoryLabel.toLowerCase()}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onLoadMore}
                  className="px-5 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-xs border border-blue-500/30 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-angles-down text-xs"></i> Tampilkan Lebih Banyak (+36)
                </button>
                <button
                  onClick={onShowAll}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold text-xs border border-emerald-500/30 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-border-all text-xs"></i> Tampilkan Semua ({filteredMedia.length} {categoryLabel})
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View Table */
        <div className="rounded-2xl border border-white/60 dark:border-slate-800 overflow-hidden glass-panel dark:bg-slate-900/90 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-extrabold border-b border-white/60 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Nama File Media</th>
                <th className="py-3.5 px-4">Tipe</th>
                <th className="py-3.5 px-4">Sumber Storage</th>
                <th className="py-3.5 px-4">Ukuran</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 dark:divide-slate-800/80">
              {displayedItems.map(item => {
                const handleRowClick = () => {
                  onOpenLightbox(item, filteredMedia);
                };
                return (
                <tr key={item.id} className="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer" onClick={handleRowClick}>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/60 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                      <i className={item.type === 'video' ? 'fa-solid fa-film text-rose-500 dark:text-rose-400' : 'fa-solid fa-image text-purple-600 dark:text-purple-400'}></i>
                    </div>
                    <span className="truncate max-w-xs">{item.title}</span>
                  </td>
                  <td className={`py-3 px-4 uppercase text-[11px] font-extrabold ${item.type === 'video' ? 'text-rose-500 dark:text-rose-400' : 'text-purple-600 dark:text-purple-400'}`}>
                    {item.type}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                    {item.accountName || (item.source === 'local' ? 'Local Storage' : 'Google Drive')}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                    {item.sizeFormatted || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRowClick(); }}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${item.type === 'video' ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white'}`}
                    >
                      {item.type === 'video' ? '▶ Putar' : 'Buka'}
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
