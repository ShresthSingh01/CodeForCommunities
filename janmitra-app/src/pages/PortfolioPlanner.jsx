import React, { useState, useEffect, useMemo } from 'react';
import ScoreTriadChip from '../components/ScoreTriadChip';
import ExplanationBlock from '../components/ExplanationBlock';
import { greedyBudgetSelect, computeRankings } from '../scoring/priorityEngine';
import { explainClusterPriority } from '../api/gemini';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function PortfolioPlanner({ 
  clusters, 
  budget = 3500000, 
  selectedCluster, 
  onNavigateToSimulator 
}) {
  // Pre-calculate rankings
  const rankedClusters = useMemo(() => computeRankings(clusters), [clusters]);

  // Optimal bundle chosen by greedy solver by default
  const optimalClusterIds = useMemo(() => {
    const funded = greedyBudgetSelect(rankedClusters, budget);
    return funded.map(c => c.id);
  }, [rankedClusters, budget]);

  // Local state for current selection overrides
  const [selectedIds, setSelectedIds] = useState([]);

  // Sync with optimal selection on load or budget change
  useEffect(() => {
    setSelectedIds(optimalClusterIds);
  }, [optimalClusterIds]);

  // Derived calculations based on current selection
  const selectedClusters = useMemo(() => {
    return rankedClusters.filter(c => selectedIds.includes(c.id));
  }, [rankedClusters, selectedIds]);

  const usedBudget = useMemo(() => {
    return selectedClusters.reduce((sum, c) => sum + c.estimated_cost_inr, 0);
  }, [selectedClusters]);

  const remainingBudget = budget - usedBudget;
  const isBudgetExceeded = usedBudget > budget;

  // AI Narrative State
  const [explanation, setExplanation] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isMockAi, setIsMockAi] = useState(false);

  // Choose target cluster to explain (last clicked / selected or top ranked selected)
  const [explainedClusterId, setExplainedClusterId] = useState(null);
  const targetCluster = useMemo(() => {
    if (explainedClusterId) {
      return rankedClusters.find(c => c.id === explainedClusterId) || null;
    }
    return selectedClusters[0] || rankedClusters[0] || null;
  }, [rankedClusters, selectedClusters, explainedClusterId]);

  useEffect(() => {
    async function fetchExplanation() {
      if (!targetCluster) return;
      setLoadingAi(true);
      try {
        const res = await explainClusterPriority(targetCluster);
        setExplanation(res.narrative);
        setIsMockAi(res.isMock);
      } catch (e) {
        setExplanation(["Could not generate explanation."]);
        setIsMockAi(true);
      } finally {
        setLoadingAi(false);
      }
    }
    
    fetchExplanation();
  }, [targetCluster]);

  // Toggle project selection
  const handleToggleProject = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Re-run optimization to reset selection to greedy solver results
  const handleResetToOptimal = () => {
    setSelectedIds(optimalClusterIds);
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSavePortfolio = async () => {
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'portfolios'), {
        sessionId: `SESSION_${Date.now()}`,
        timestamp: new Date().toISOString(),
        selectedClusters: selectedIds,
        budget: budget,
        usedBudget: usedBudget
      });
      alert('Portfolio saved to Firebase!');
    } catch (e) {
      console.error(e);
      alert('Error saving portfolio.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatLakhs = (inr) => `₹${(inr / 100000).toFixed(1)}L`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-gray pb-4">
        <div>
          <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Portfolio Planner</h1>
          <p className="text-[13px] text-neutral-gray mt-0.5">Select and optimize constituency projects within allocated budget constraints.</p>
        </div>
      </div>

      {/* Dynamic Summary Strip */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
        isBudgetExceeded 
          ? 'bg-urgent-red/5 border-urgent-red/30 text-urgent-red' 
          : 'bg-white border-border-gray'
      }`}>
        <div className="flex flex-wrap items-center gap-6 text-[13px] font-mono">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-gray uppercase font-semibold">Available Budget</span>
            <span className="text-[15px] font-bold text-slate-800">{formatLakhs(budget)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-gray uppercase font-semibold">Allocated Cost</span>
            <span className={`text-[15px] font-bold ${isBudgetExceeded ? 'text-urgent-red animate-pulse' : 'text-slate-800'}`}>
              {formatLakhs(usedBudget)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-gray uppercase font-semibold">Remaining Limit</span>
            <span className={`text-[15px] font-bold ${isBudgetExceeded ? 'text-urgent-red' : 'text-success-green'}`}>
              {formatLakhs(remainingBudget)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-gray uppercase font-semibold">Funded Count</span>
            <span className="text-[15px] font-bold text-slate-800">{selectedClusters.length} Projects</span>
          </div>
        </div>

        {/* Warning Indicator or Restore Action */}
        <div className="flex items-center gap-3">
          {isBudgetExceeded ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold">⚠️ Over budget</span>
              <button
                onClick={handleResetToOptimal}
                className="bg-urgent-red text-white text-[12px] font-bold px-3 py-1.5 rounded hover:bg-red-600 transition-colors"
              >
                Auto Optimize
              </button>
            </div>
          ) : (
            <button
              onClick={handleResetToOptimal}
              className="border border-border-gray hover:border-slate-350 text-slate-700 bg-slate-50 hover:bg-slate-100 text-[12px] font-bold px-3 py-1.5 rounded transition-all"
            >
              Reset to Optimal
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Interactive Project Ledger List */}
        <div className="lg:col-span-7 bg-white border border-border-gray rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Constituency Project Ledger
          </h2>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {rankedClusters.map((cluster) => {
              const isSelected = selectedIds.includes(cluster.id);
              const isTarget = targetCluster?.id === cluster.id;
              
              return (
                <div
                  key={cluster.id}
                  onClick={() => setExplainedClusterId(cluster.id)}
                  className={`p-4 rounded-lg border text-left transition-all cursor-pointer relative ${
                    isTarget 
                      ? 'ring-1 ring-need-blue border-need-blue' 
                      : 'border-slate-100'
                  } ${
                    isSelected ? 'bg-slate-50/50' : 'bg-white opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {/* Checkbox selector */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleProject(cluster.id)}
                        onClick={(e) => e.stopPropagation()} // Prevent setting explained id
                        className="w-4 h-4 rounded text-need-blue focus:ring-need-blue border-slate-300 cursor-pointer"
                      />
                      <div>
                        <h3 className="text-[13px] font-bold text-slate-800 capitalize leading-tight">
                          {cluster.issue_type} shortage — {cluster.ward}
                        </h3>
                        <span className="text-[11px] text-neutral-gray block mt-0.5 font-mono">
                          Required Cost: <span className="font-bold text-slate-700">{formatLakhs(cluster.estimated_cost_inr)}</span>
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-success-green/10 text-success-green' : 'bg-slate-100 text-neutral-gray'
                    }`}>
                      {isSelected ? 'FUNDED' : 'UNFUNDED'}
                    </span>
                  </div>

                  <ScoreTriadChip
                    needScore={cluster.need_score}
                    impactScore={cluster.impact_score}
                    synergyScore={cluster.synergy_score}
                    decisionScore={cluster.priority_score}
                    costInr={cluster.estimated_cost_inr}
                  />

                  {cluster.synergy_score > 0 && isSelected && (
                    <div className="mt-2.5 text-[10px] font-mono text-synergy-violet bg-synergy-violet/5 px-2 py-0.5 rounded inline-block">
                      Synergy: {cluster.synergy_explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Decision explanation and CSTE navigation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-border-gray rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Optimization Reasoning
            </h2>

            {targetCluster ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">
                      {targetCluster.issue_type === 'water' ? '🚰' :
                       targetCluster.issue_type === 'road' ? '🛣️' :
                       targetCluster.issue_type === 'health' ? '🏥' : '🏫'}
                    </span>
                    <span className="text-[12px] font-bold text-slate-800 capitalize">
                      {targetCluster.issue_type} — {targetCluster.ward}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-gray font-mono">Rank #{targetCluster.rank}</span>
                </div>

                <ExplanationBlock
                  text={explanation}
                  loading={loadingAi}
                  isMock={isMockAi}
                />
              </div>
            ) : (
              <div className="text-center py-6 text-[12px] text-neutral-gray italic">
                Select any project on the left ledger to review AI priority narrations.
              </div>
            )}
          </div>

          {/* Call to action for Simulator */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3.5">
            <div>
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-slate-300">Constituency Digital Twin</h3>
              <p className="text-[12px] text-slate-400 mt-1">
                Evaluate simulated public utility transitions and complaint reduction targets under this selected portfolio.
              </p>
            </div>

            <button
              onClick={onNavigateToSimulator}
              className="w-full bg-success-green hover:bg-emerald-600 text-[13px] font-bold py-2.5 px-4 rounded-lg transition-colors text-center shadow"
            >
              Verify Impact (CSTE Simulator) →
            </button>
            <button
              onClick={handleSavePortfolio}
              disabled={isSaving}
              className="w-full border border-slate-700 hover:border-slate-500 text-slate-300 text-[13px] font-bold py-2.5 px-4 rounded-lg transition-colors text-center shadow disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : '💾 Save Portfolio Draft'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
