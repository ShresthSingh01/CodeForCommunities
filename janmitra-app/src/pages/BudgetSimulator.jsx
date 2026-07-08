import React, { useState, useMemo } from 'react';
import { greedyBudgetSelect, computeRankings } from '../scoring/priorityEngine';
import { simulateCSTE } from '../scoring/csteEngine';

export default function BudgetSimulator({ 
  clusters, 
  budget, 
  onBudgetChange,
  onNavigateBack 
}) {
  const [csteMode, setCsteMode] = useState('current'); // 'current' | 'projected'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reflow portfolio ranking and greedy selection based on slider
  const rankedClusters = useMemo(() => computeRankings(clusters), [clusters]);
  const fundedClusters = useMemo(() => greedyBudgetSelect(rankedClusters, budget), [rankedClusters, budget]);
  
  const unfundedCount = rankedClusters.length - fundedClusters.length;
  const csteMetrics = useMemo(() => simulateCSTE(fundedClusters, clusters), [fundedClusters, clusters]);

  const formatLakhs = (inr) => `₹${(inr / 100000).toFixed(0)}L`;

  // Compute stats for Section B bottom cards
  const peopleBenefited = useMemo(() => {
    return fundedClusters.reduce((sum, c) => sum + (c.affected_population || 0), 0);
  }, [fundedClusters]);

  const serviceGapReduction = useMemo(() => {
    const base = csteMetrics.baseState.facilityDistance;
    const future = csteMetrics.futureState.facilityDistance;
    return Math.max(0, base - future);
  }, [csteMetrics]);

  const expectedComplaintReduction = useMemo(() => {
    if (rankedClusters.length === 0) return 0;
    return Math.round((fundedClusters.length / rankedClusters.length) * 100);
  }, [fundedClusters, rankedClusters]);

  // Dynamic values helper for 6 constituency metrics
  const getMetrics = () => {
    const base = csteMetrics.baseState;
    const future = csteMetrics.futureState;

    return [
      { 
        label: "Water Piped Coverage", 
        currentVal: base.waterCoverage, 
        futureVal: future.waterCoverage, 
        suffix: "%",
        invertGood: false 
      },
      { 
        label: "Avg Distance to Clinic (PHC)", 
        currentVal: parseFloat(base.facilityDistance.toFixed(1)), 
        futureVal: parseFloat(future.facilityDistance.toFixed(1)), 
        suffix: " km",
        invertGood: true 
      },
      { 
        label: "School Attendance Rate", 
        currentVal: base.schoolAttendance, 
        futureVal: future.schoolAttendance, 
        suffix: "%",
        invertGood: false 
      },
      { 
        label: "Healthcare Access Index", 
        currentVal: base.healthcareAccess, 
        futureVal: future.healthcareAccess, 
        suffix: "%",
        invertGood: false 
      },
      { 
        label: "Road Connectivity Index", 
        currentVal: 65, // baseline connectivity index
        futureVal: Math.min(100, 65 + fundedClusters.filter(c => c.issue_type === 'road').length * 8), 
        suffix: "%",
        invertGood: false 
      },
      { 
        label: "Complaint Reduction Target", 
        currentVal: 0, 
        futureVal: expectedComplaintReduction, 
        suffix: "%",
        invertGood: false 
      }
    ];
  };

  const metricsList = getMetrics();

  const renderMetricRow = (metric) => {
    const isProjected = csteMode === 'projected';
    const displayVal = isProjected ? metric.futureVal : metric.currentVal;
    const delta = metric.futureVal - metric.currentVal;
    const isGood = metric.invertGood ? delta < 0 : delta > 0;
    
    return (
      <div 
        key={metric.label}
        className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors"
      >
        <span className="text-[12px] font-bold text-slate-800">{metric.label}</span>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[14px] font-bold text-slate-800 font-mono">
              {displayVal}{metric.suffix}
            </span>
            {isProjected && delta !== 0 && (
              <span className={`text-[10px] font-bold font-mono ml-2 px-1.5 py-0.5 rounded ${
                isGood ? 'bg-success-green/10 text-success-green' : 'bg-urgent-red/10 text-urgent-red'
              }`}>
                {delta > 0 ? '+' : ''}{delta % 1 !== 0 ? delta.toFixed(1) : delta}{metric.suffix}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto pb-24 md:pb-6">
      {/* Header Area */}
      <div className="flex items-center justify-between border-b border-border-gray pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Budget Simulator</h1>
          <p className="text-[13px] text-neutral-gray mt-0.5">Simulate before / after constituency health indicators under variable budgets.</p>
        </div>
        <button
          onClick={onNavigateBack}
          className="border border-border-gray hover:border-slate-350 text-slate-700 bg-white text-[12px] font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
        >
          ← Return to Planner
        </button>
      </div>

      {/* Main Grid: Section A top, Section B bottom */}
      <div className="space-y-6">
        
        {/* Section A: Slider and Dynamic Count */}
        <div className="bg-white border border-border-gray rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">Constituency Budget limit</h2>
              <p className="text-[11px] text-neutral-gray mt-0.5 font-mono">Move slider to simulate optimal projects bundle</p>
            </div>
            <div className="text-[28px] font-bold text-marigold font-display leading-none">
              {formatLakhs(budget)}
            </div>
          </div>

          <input
            type="range"
            min={1000000}
            max={10000000}
            step={500000}
            value={budget}
            onChange={(e) => onBudgetChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-marigold border border-slate-200"
          />

          <div className="flex justify-between font-mono text-[10px] text-neutral-gray">
            <span>₹10 Lakhs</span>
            <span>₹50 Lakhs</span>
            <span>₹1 Crore</span>
          </div>

          <div className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[13px] text-slate-850">
              Allocates <strong className="text-need-blue">{fundedClusters.length}</strong> optimal projects of {rankedClusters.length} total.
            </span>
            <span className="text-[11px] text-neutral-gray font-mono">
              {unfundedCount} Unfunded
            </span>
          </div>
        </div>

        {/* Section B: CSTE Digital Twin Output */}
        <div className="bg-white border border-border-gray rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-3">
            <div>
              <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">CSTE Digital Twin telemetry</h2>
              <p className="text-[11px] text-neutral-gray mt-0.5 font-mono">Twin state representation before and after investments</p>
            </div>

            {/* Toggle State */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setCsteMode('current')}
                className={`px-3 py-1.5 text-[12px] font-bold rounded-md transition-all ${
                  csteMode === 'current' ? 'bg-white text-slate-850 shadow-sm' : 'text-neutral-gray hover:text-slate-850'
                }`}
              >
                Current state
              </button>
              <button
                onClick={() => setCsteMode('projected')}
                className={`px-3 py-1.5 text-[12px] font-bold rounded-md transition-all ${
                  csteMode === 'projected' ? 'bg-white text-slate-850 shadow-sm' : 'text-neutral-gray hover:text-slate-850'
                }`}
              >
                Projected state
              </button>
            </div>
          </div>

          {/* Metric Rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricsList.map(renderMetricRow)}
          </div>

          {/* Bottom Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span className="text-[9px] text-neutral-gray uppercase font-bold tracking-wider block mb-1">People Benefited</span>
              <span className="text-[14px] font-bold text-slate-850">{peopleBenefited.toLocaleString()}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span className="text-[9px] text-neutral-gray uppercase font-bold tracking-wider block mb-1">Clinic Dist Reduction</span>
              <span className="text-[14px] font-bold text-slate-850">{serviceGapReduction.toFixed(1)} km</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span className="text-[9px] text-neutral-gray uppercase font-bold tracking-wider block mb-1">Impact Score</span>
              <span className="text-[14px] font-bold text-need-blue">
                {((fundedClusters.reduce((sum, c) => sum + (c.priority_score || 0), 0) / (rankedClusters.length || 1)) * 10).toFixed(1)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center">
              <span className="text-[9px] text-neutral-gray uppercase font-bold tracking-wider block mb-1">Complaints Solved</span>
              <span className="text-[14px] font-bold text-success-green">~{expectedComplaintReduction}%</span>
            </div>
          </div>
        </div>

        {/* Confirmation Action */}
        <div className="pt-4 flex items-center justify-between">
          {saveSuccess ? (
            <div className="text-[13px] font-bold text-success-green flex items-center gap-2">
              <span>✅</span> Portfolio Snapshot Saved Successfully!
            </div>
          ) : (
            <p className="text-[12px] text-neutral-gray">
              Lock in this portfolio to generate work orders and commit to the Digital Twin projection.
            </p>
          )}

          <button
            onClick={async () => {
              setIsSaving(true);
              setSaveSuccess(false);
              try {
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
                const res = await fetch(`${API_BASE_URL}/api/save-cste-snapshot`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    budget_inr: budget,
                    funded_cluster_ids: fundedClusters.map(c => c.id),
                    base_state: csteMetrics.baseState,
                    future_state: csteMetrics.futureState,
                    constituency_id: 'varanasi'
                  })
                });
                if (res.ok) {
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 3000);
                }
              } catch (err) {
                console.error("Failed to save snapshot", err);
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving || fundedClusters.length === 0}
            className={`bg-need-blue hover:bg-blue-700 text-white text-[14px] font-bold py-3 px-8 rounded-lg shadow-md transition-all ${isSaving || fundedClusters.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? 'Saving Snapshot...' : 'Confirm Portfolio & Lock Budget'}
          </button>
        </div>

      </div>
    </div>
  );
}
