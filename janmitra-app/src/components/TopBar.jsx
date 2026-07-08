import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TopBar({ notificationCount = 0, currentConstituency, onConstituencyChange }) {
  const { t, i18n } = useTranslation();
  const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const constituencies = {
    varanasi: 'Varanasi Lok Sabha',
    lucknow: 'Lucknow Lok Sabha',
    amethi: 'Amethi Lok Sabha'
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'hi' : 'en');
  };

  return (
    <header className="bg-white border-b border-border-gray h-16 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Greeting and Utility */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-slate-800">Good afternoon, MP</span>
          <span className="text-[11px] text-neutral-gray font-mono">Constituency: {constituencies[currentConstituency] || currentConstituency}</span>
        </div>
      </div>

      {/* Right-side Controls */}
      <div className="flex items-center gap-6">
        {/* Language Switcher */}
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 text-[11px] font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded transition-colors"
        >
          {i18n.language === 'en' ? 'अ (Hindi)' : 'A (English)'}
        </button>

        {/* Last Updated Timestamp */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-neutral-gray bg-slate-100 px-2 py-1 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-success-green"></span>
          <span>Synced: {lastUpdated}</span>
        </div>



        {/* Notification Bell Icon */}
        <button className="relative p-1.5 hover:bg-slate-100 rounded-full transition-colors" aria-label="Notifications">
          <span className="text-[20px]">🔔</span>
          {notificationCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-urgent-red text-white text-[9px] font-bold font-mono rounded-full flex items-center justify-center border-2 border-white">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
