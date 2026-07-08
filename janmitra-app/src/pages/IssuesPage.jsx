import React, { useState, useMemo } from 'react';
import { computeRankings } from '../scoring/priorityEngine';

export default function IssuesPage({ clusters, selectedCluster, setSelectedCluster, onNavigateToPortfolio }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'clusters' | 'trend'

  // Pre-calculate ranked issues
  const rankedClusters = useMemo(() => {
    return computeRankings(clusters);
  }, [clusters]);

  // Handle Search Filtering (by issue_type, ward, or public_evidence)
  const filteredClusters = useMemo(() => {
    if (!searchQuery.trim()) return rankedClusters;
    const lower = searchQuery.toLowerCase();
    return rankedClusters.filter(c => 
      c.issue_type.toLowerCase().includes(lower) ||
      c.ward.toLowerCase().includes(lower) ||
      (c.public_evidence || []).some(evidence => evidence.toLowerCase().includes(lower))
    );
  }, [rankedClusters, searchQuery]);

  // Set initial selected cluster if none selected
  const activeCluster = useMemo(() => {
    if (selectedCluster && filteredClusters.some(c => c.id === selectedCluster.id)) {
      return selectedCluster;
    }
    return filteredClusters[0] || null;
  }, [selectedCluster, filteredClusters]);

  const formatCostLakhs = (val) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-gray pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Issues & Clusters</h1>
          <p className="text-[13px] text-neutral-gray mt-0.5">Aggregated citizen complaints grouped into actionable development priorities.</p>
        </div>
        
        {/* Navigation Tabs & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToPortfolio()}
            className="bg-need-blue hover:bg-blue-700 text-white text-[12px] font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Open Planner
          </button>
        </div>
      </div>

      {/* Search and Filters Strip */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 border border-border-gray rounded-xl shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by issue type, ward..."
            className="w-full pl-8 pr-4 py-2 border border-border-gray rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-need-blue focus:border-need-blue bg-slate-50"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-gray text-[14px]">🔍</span>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
              activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-neutral-gray hover:text-slate-800'
            }`}
          >
            All Issues
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
              activeTab === 'clusters' ? 'bg-white text-slate-800 shadow-sm' : 'text-neutral-gray hover:text-slate-800'
            }`}
          >
            Clusters ({filteredClusters.length})
          </button>
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all ${
              activeTab === 'trend' ? 'bg-white text-slate-800 shadow-sm' : 'text-neutral-gray hover:text-slate-800'
            }`}
          >
            Trends
          </button>
        </div>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Panel: Ranked Issues List */}
        <div className="lg:col-span-5 bg-white border border-border-gray rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Priority Docket List
          </h2>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {filteredClusters.map((cluster) => {
              const isSelected = activeCluster?.id === cluster.id;
              const isCritical = cluster.urgency === 'critical' || cluster.issue_type === 'water' || cluster.issue_type === 'health';
              return (
                <button
                  key={cluster.id}
                  onClick={() => setSelectedCluster(cluster)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-need-blue bg-blue-50/20 shadow-sm'
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {cluster.issue_type === 'water' ? '🚰' :
                       cluster.issue_type === 'road' ? '🛣️' :
                       cluster.issue_type === 'health' ? '🏥' : '🏫'}
                    </span>
                    <div>
                      <h3 className="text-[13px] font-bold text-slate-800 capitalize leading-tight">
                        {cluster.issue_type} shortage
                      </h3>
                      <span className="text-[11px] text-neutral-gray block mt-1 font-mono">
                        {cluster.ward} · {cluster.complaint_count} complaints
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[13px] font-bold text-slate-800 font-mono">
                        {cluster.priority_score ? cluster.priority_score.toFixed(2) : '0.00'}
                      </span>
                      <span className="text-[9px] text-neutral-gray block mt-0.5 font-mono">Need Score</span>
                    </div>
                    <span className="text-neutral-gray text-[12px] opacity-75">➔</span>
                  </div>
                </button>
              );
            })}

            {filteredClusters.length === 0 && (
              <div className="text-center py-12 text-[12px] text-neutral-gray font-mono">
                No matching priority clusters.
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Selected Issue Detail */}
        <div className="lg:col-span-7 space-y-6">
          {activeCluster ? (
            <>
              {/* Detailed Summary Card */}
              <div className="bg-white border border-border-gray rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl">
                      {activeCluster.issue_type === 'water' ? '🚰' :
                       activeCluster.issue_type === 'road' ? '🛣️' :
                       activeCluster.issue_type === 'health' ? '🏥' : '🏫'}
                    </span>
                    <div>
                      <h2 className="text-[18px] font-bold text-slate-850 capitalize leading-tight">
                        {activeCluster.issue_type} Infrastructure Cluster
                      </h2>
                      <p className="text-[11px] font-mono text-neutral-gray mt-1">ID: {activeCluster.id}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded tracking-wide ${
                    activeCluster.urgency === 'critical' || activeCluster.issue_type === 'water' || activeCluster.issue_type === 'health'
                      ? 'bg-urgent-red/10 text-urgent-red border border-urgent-red/20'
                      : 'bg-warning-orange/10 text-warning-orange border border-warning-orange/20'
                  }`}>
                    {activeCluster.urgency === 'critical' || activeCluster.issue_type === 'water' || activeCluster.issue_type === 'health' ? 'CRITICAL' : 'MODERATE'}
                  </span>
                </div>

                {/* Primary Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-neutral-gray uppercase tracking-wider block font-semibold mb-1">Ward Location</span>
                    <span className="text-[13px] font-bold text-slate-800">{activeCluster.ward}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-gray uppercase tracking-wider block font-semibold mb-1">Complaints Logged</span>
                    <span className="text-[13px] font-bold text-slate-800">{activeCluster.complaint_count} cases</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-gray uppercase tracking-wider block font-semibold mb-1">People Impacted</span>
                    <span className="text-[13px] font-bold text-slate-800">{activeCluster.affected_population?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-gray uppercase tracking-wider block font-semibold mb-1">Estimated Cost</span>
                    <span className="text-[13px] font-bold text-need-blue">{formatCostLakhs(activeCluster.estimated_cost_inr)}</span>
                  </div>
                </div>

                {/* Additional Evidence / Specific Details */}
                <div className="space-y-3">
                  <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">Verifiable Evidence Log</h3>
                  <ul className="space-y-2">
                    {(activeCluster.public_evidence || []).map((evidence, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[12px] text-slate-700 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        <span className="text-evidence-teal mt-0.5">✓</span>
                        <span>{evidence}</span>
                      </li>
                    ))}
                    {(activeCluster.public_evidence || []).length === 0 && (
                      <span className="text-[12px] text-neutral-gray italic">No public logs uploaded. Using telemetry metrics.</span>
                    )}
                  </ul>
                </div>
              </div>

              {/* Lower Section Recommended Action Kicker */}
              <div className="bg-blue-50/30 border border-blue-100 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-800 leading-tight">Recommended Resource Action</h4>
                  <p className="text-[12px] text-neutral-gray mt-1">
                    Fund pipeline and facility restructuring within {activeCluster.ward} using the planner.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToPortfolio()}
                  className="bg-need-blue hover:bg-blue-700 text-white font-bold text-[12px] px-4 py-2 rounded-lg transition-all shadow-sm"
                >
                  Allocate in Portfolio
                </button>
              </div>
            </>
          ) : (
            <div className="bg-white border border-border-gray rounded-xl p-12 text-center text-neutral-gray font-mono text-[12px]">
              Select a cluster from the left panel to review telemetry details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
