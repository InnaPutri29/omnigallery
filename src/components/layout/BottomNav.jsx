import React from 'react';

export default function BottomNav({ activeTab, onSwitchTab }) {
  const tabs = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
    { id: 'explorer', icon: 'fa-folder-tree', label: 'Explorer' },
    { id: 'accounts', icon: 'fa-users-gear', label: 'Akun' },
    { id: 'settings', icon: 'fa-gear', label: 'Setelan' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel dark:bg-slate-900/95 border-t border-white/40 dark:border-slate-800">
      <div className="flex items-center justify-around py-2 px-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSwitchTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-lg ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}></i>
              <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
