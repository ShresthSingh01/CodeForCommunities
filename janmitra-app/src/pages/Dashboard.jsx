import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { computeRankings, greedyBudgetSelect } from '../scoring/priorityEngine';
import KpiCard from '../components/KpiCard';
import MapPanel from '../components/MapPanel';
import CSTEPanel from '../components/CSTEPanel';

export default function Dashboard({ clusters, onNavigateToPortfolio, onNavigateToIssues }) {
  const { t } = useTranslation();
  const defaultBudget = 3500000; // ₹35 Lakhs

  // Compute rankings and selections
  const rankedClusters = useMemo(() => {
    return computeRankings(clusters);
  }, [clusters]);

  const fundedClusters = useMemo(() => {
    return greedyBudgetSelect(rankedClusters, defaultBudget);
  }, [rankedClusters]);

  // KPI calculations
  const totalComplaints = useMemo(() => {
    return clusters.reduce((sum, c) => sum + (c.complaint_count || 0), 0);
  }, [clusters]);

  const totalPeopleImpacted = useMemo(() => {
    return fundedClusters.reduce((sum, c) => sum + (c.affected_population || 0), 0);
  }, [fundedClusters]);

  const formatCostLakhs = (val) => `${(val / 100000).toFixed(0)}L`;

  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: {
            totalComplaints,
            activeIssues: rankedClusters.length,
            budget: defaultBudget,
            topProjects: fundedClusters
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'janmitra-report.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error generating report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Greeting Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">{t('dashboard.title', 'Constituency Operational Kiosk')}</h1>
          <p className="text-[13px] text-neutral-gray mt-0.5">{t('dashboard.subtitle', 'Real-time resource allocation and citizen complaint tracking.')}</p>
        </div>
        <div>
          <button 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="bg-slate-800 hover:bg-slate-700 text-white text-[12px] font-bold py-2 px-4 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {isGeneratingReport ? 'Generating PDF...' : '📄 Generate Report'}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard
          title="Total Complaints"
          value={totalComplaints.toLocaleString()}
          subtext="Logged in system"
          trend={{ value: '+12% this week', type: 'positive' }}
        />
        <KpiCard
          title="Active Issues"
          value={rankedClusters.length}
          subtext="Identified dockets"
          trend={{ value: 'Stable', type: 'neutral' }}
        />
        <KpiCard
          title="Available Budget"
          value="₹35L"
          subtext="Constituency limit"
        />
        <KpiCard
          title="Recommended Projects"
          value={fundedClusters.length}
          subtext="Optimal allocation bundle"
          onClick={onNavigateToPortfolio}
        />
        <KpiCard
          title="People Impacted"
          value={totalPeopleImpacted.toLocaleString()}
          subtext="Constituents served"
          trend={{ value: 'High Coverage', type: 'positive' }}
        />
      </div>

      {/* CSTE Live Baseline Panel */}
      <CSTEPanel clusters={clusters} />

      {/* Main 3-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Column 1: Top Issues (Ranked) */}
        <section className="lg:col-span-4 bg-white border border-border-gray rounded-xl p-5 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Top Priority Issues</h2>
            <span className="text-[10px] font-mono text-neutral-gray bg-slate-100 px-2 py-0.5 rounded">Ranked</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[350px]">
            {rankedClusters.slice(0, 5).map((cluster, index) => {
              const isCritical = cluster.urgency === 'critical' || cluster.issue_type === 'water' || cluster.issue_type === 'health';
              return (
                <button
                  key={cluster.id}
                  onClick={() => onNavigateToIssues(cluster)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-need-blue bg-slate-50/50 hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {cluster.issue_type === 'water' ? '🚰' :
                       cluster.issue_type === 'road' ? '🛣️' :
                       cluster.issue_type === 'health' ? '🏥' : '🏫'}
                    </span>
                    <div>
                      <h3 className="text-[13px] font-bold text-slate-800 capitalize leading-tight group-hover:text-need-blue">
                        {cluster.issue_type} shortage
                      </h3>
                      <span className="text-[11px] text-neutral-gray block mt-0.5">
                        {cluster.ward} · {cluster.complaint_count} complaints
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      isCritical ? 'bg-urgent-red/10 text-urgent-red' : 'bg-warning-orange/10 text-warning-orange'
                    }`}>
                      {cluster.priority_score ? cluster.priority_score.toFixed(2) : '0.00'}
                    </span>
                    <span className="text-[10px] text-neutral-gray block mt-1 font-mono">Need Score</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Column 2: Constituency Overview Map */}
        <section className="lg:col-span-4 bg-white border border-border-gray rounded-xl p-5 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Ward Geography Map</h2>
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-urgent-red"></span>
              <span className="text-[9px] font-mono text-neutral-gray">Critical</span>
            </div>
          </div>

          <div className="flex-1 rounded-lg overflow-hidden border border-slate-100">
            <MapPanel
              clusters={rankedClusters}
              selectedCluster={null}
              hoveredCluster={null}
              onSelectCluster={onNavigateToIssues}
            />
          </div>
        </section>

        {/* Column 3: AI-Recommended Portfolio Summary */}
        <section className="lg:col-span-4 bg-white border border-border-gray rounded-xl p-5 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Recommended Portfolio</h2>
              <span className="text-[10px] font-mono text-success-green bg-success-green/10 px-2 py-0.5 rounded">Optimized</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[12px] text-neutral-gray">Allocation Cost:</span>
                <span className="text-[14px] font-bold text-slate-800">
                  ₹{formatCostLakhs(fundedClusters.reduce((sum, c) => sum + c.estimated_cost_inr, 0))} / ₹{formatCostLakhs(defaultBudget)}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-gray uppercase tracking-wider block">Selected Projects</span>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {fundedClusters.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-2 rounded bg-slate-50/50 border border-slate-100 text-[11px]">
                      <span className="font-semibold text-slate-700 capitalize truncate max-w-[150px]">{c.issue_type} shortage ({c.ward})</span>
                      <span className="font-mono text-neutral-gray">₹{formatCostLakhs(c.estimated_cost_inr)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onNavigateToPortfolio}
              className="w-full bg-need-blue hover:bg-blue-700 text-white text-[13px] font-bold py-2.5 px-4 rounded-lg transition-colors text-center block shadow-sm"
            >
              View Full Portfolio Planner
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
