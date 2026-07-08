import React, { useState, useMemo } from 'react';
import MapPanel from '../components/MapPanel';

export default function WardMapPage({ clusters, setSelectedCluster, onNavigateToIssues }) {
  const [selectedWard, setSelectedWard] = useState('Ward 7');

  // Compute ward details dynamically based on clusters
  const wardDetails = useMemo(() => {
    const details = {
      'Ward 7': { name: 'Ward 7', complaints: 0, population: 3350, issues: [], needScoreSum: 0 },
      'Ward 3': { name: 'Ward 3', complaints: 0, population: 3550, issues: [], needScoreSum: 0 },
      'Ward 9': { name: 'Ward 9', complaints: 0, population: 4800, issues: [], needScoreSum: 0 }
    };

    clusters.forEach(c => {
      const wardKey = c.ward;
      if (details[wardKey]) {
        details[wardKey].complaints += c.complaint_count || 0;
        details[wardKey].issues.push(c);
        details[wardKey].needScoreSum += c.priority_score || 0.5;
      }
    });

    // Calculate averages
    Object.keys(details).forEach(key => {
      const w = details[key];
      w.avgNeedScore = w.issues.length ? parseFloat((w.needScoreSum / w.issues.length).toFixed(2)) : 0;
    });

    return details;
  }, [clusters]);

  const activeWard = wardDetails[selectedWard] || {
    name: selectedWard,
    complaints: 0,
    population: 1000,
    avgNeedScore: 0,
    issues: []
  };

  const handleSelectCluster = (cluster) => {
    setSelectedCluster(cluster);
    onNavigateToIssues(cluster);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto pb-24 md:pb-6">
      {/* Header Info */}
      <div className="border-b border-border-gray pb-4">
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Constituency Ward Map</h1>
        <p className="text-[13px] text-neutral-gray mt-0.5">Explore geographic ward parameters, resource limits, and need allocations.</p>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-border-gray rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Interact Map Boundaries</h2>
            <div className="flex gap-4 text-[11px] font-mono text-neutral-gray">
              <span>Click a ward polygon on the map to select it</span>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="h-[400px] rounded-lg overflow-hidden border border-slate-100">
            <MapPanel
              clusters={clusters}
              selectedCluster={null}
              hoveredCluster={null}
              onSelectCluster={handleSelectCluster}
              onSelectWard={setSelectedWard}
            />
          </div>
        </div>

        {/* Bottom Ward Summary Drawer */}
        <div className="bg-white border border-border-gray rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <div>
                <h3 className="text-[16px] font-bold text-slate-805 leading-none">{activeWard.name} Detail summary</h3>
                <span className="text-[11px] font-mono text-neutral-gray block mt-1">Constituency Zone parameters</span>
              </div>
            </div>

            {/* Ward parameters */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center font-mono">
              <div>
                <span className="text-[9px] text-neutral-gray uppercase font-bold tracking-wider block mb-1">Issue count</span>
                <span className="text-[13px] font-bold text-slate-800">{activeWard.issues.length} active</span>
              </div>
              <div>
                <span className="text-[9px] text-neutral-gray uppercase font-bold tracking-wider block mb-1">Population</span>
                <span className="text-[13px] font-bold text-slate-800">{activeWard.population?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-neutral-gray uppercase font-bold tracking-wider block mb-1">Avg Need Index</span>
                <span className="text-[13px] font-bold text-need-blue">{activeWard.avgNeedScore}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSelectCluster(activeWard.issues[0])}
            disabled={activeWard.issues.length === 0}
            className="bg-need-blue hover:bg-blue-700 text-white font-bold text-[12px] px-6 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            View Details in Issues page →
          </button>
        </div>
      </div>
    </div>
  );
}
