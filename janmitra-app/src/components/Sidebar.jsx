import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Sidebar({ activeView, onViewChange }) {
  const { t } = useTranslation();

  const MENU_ITEMS = [
    { id: 'home', label: t('sidebar.home', 'Home'), icon: '🏠' },
    { id: 'issues', label: t('sidebar.issues', 'Issues'), icon: '📊' },
    { id: 'portfolio', label: t('sidebar.planner', 'Portfolio'), icon: '💼' },
    { id: 'simulator', label: t('sidebar.simulator', 'Simulator'), icon: '📈' },
    { id: 'wardmap', label: t('sidebar.map', 'Ward Map'), icon: '🗺️' },
    { id: 'citizen', label: t('sidebar.kiosk', 'Citizen Widget'), icon: '📝' }
  ];

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex flex-col w-64 bg-ink-navy text-slate-300 h-screen sticky top-0 flex-shrink-0 border-r border-slate-800">
        {/* App Title */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-need-blue flex items-center justify-center font-bold text-white text-sm">
            JM
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-[16px] leading-tight">JanMitra AI</h1>
            <span className="text-[10px] text-neutral-gray uppercase tracking-widest font-mono">Decision Kiosk</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all ${
                  isActive
                    ? 'bg-need-blue text-white font-semibold'
                    : 'hover:bg-slate-850 hover:text-white text-slate-400'
                }`}
              >
                <span className="text-[16px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* MP Office Profile Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-lg border border-slate-800">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
              👤
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-white truncate">Hon'ble MP</p>
              <p className="text-[10px] text-neutral-gray truncate font-mono">Varanasi Constituency</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-success-green animate-pulse" title="System Active"></span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (visible on mobile, hidden on md and up) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-ink-navy border-t border-slate-800 flex justify-around items-center h-16 z-50 px-2">
        {MENU_ITEMS.slice(0, 6).map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
                isActive ? 'text-need-blue font-bold' : 'text-slate-400'
              }`}
            >
              <span className="text-[18px]">{item.icon}</span>
              <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
