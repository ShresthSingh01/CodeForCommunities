import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import CitizenWidget from './pages/CitizenWidget';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'citizen'

  return (
    <div className="relative">
      {/* Floating View Switcher Bar for Demo Navigation */}
      <div className="fixed bottom-4 right-4 z-50 bg-ink-navy/90 backdrop-blur border border-marigold/60 p-1.5 rounded-full shadow-2xl flex items-center gap-1">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            currentView === 'dashboard'
              ? 'bg-marigold text-ink-navy shadow'
              : 'text-aged-parchment hover:text-marigold'
          }`}
        >
          MP Dashboard
        </button>
        <button
          onClick={() => setCurrentView('citizen')}
          className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
            currentView === 'citizen'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-aged-parchment hover:text-emerald-400'
          }`}
        >
          Citizen Widget (WhatsApp)
        </button>
      </div>

      {/* View Render */}
      {currentView === 'dashboard' ? (
        <Dashboard />
      ) : (
        <CitizenWidget onNavigateToDashboard={() => setCurrentView('dashboard')} />
      )}
    </div>
  );
}

export default App;
