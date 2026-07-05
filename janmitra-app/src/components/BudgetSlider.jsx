import React from 'react';

export default function BudgetSlider({ budget, minBudget = 500000, maxBudget = 10000000, onChange, selectedCount, totalCount, coveredPop, totalPop }) {
  const formatCost = (inr) => {
    if (inr >= 10000000) {
      return `₹${(inr / 10000000).toFixed(2)} Crore`;
    }
    return `₹${(inr / 100000).toFixed(0)} Lakhs`;
  };

  return (
    <div className="bg-ink-navy/95 border border-slate-ink/40 p-4 rounded-sm shadow-xl paper-texture text-aged-parchment">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Slider Controls */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1 font-mono text-xs">
            <span className="text-slate-ink uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-marigold animate-pulse" />
              Constituency Budget Allocation Simulator
            </span>
            <span className="text-marigold font-display font-bold text-lg">
              {formatCost(budget)}
            </span>
          </div>

          <input
            type="range"
            min={minBudget}
            max={maxBudget}
            step={250000}
            value={budget}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-marigold focus:outline-none ring-1 ring-slate-ink/30"
          />

          <div className="flex justify-between font-mono text-[10px] text-slate-ink mt-1">
            <span>₹5 L (Min)</span>
            <span>₹50 L</span>
            <span>₹1 Cr (Max Cap)</span>
          </div>
        </div>

        {/* Live Calculation Summary */}
        <div className="border-t md:border-t-0 md:border-l border-slate-ink/30 pt-3 md:pt-0 md:pl-4 min-w-[240px] font-mono text-xs">
          <div className="text-slate-ink uppercase text-[10px] tracking-wider mb-1">Impact Summary</div>
          <div className="text-aged-parchment font-bold text-sm">
            Funding <span className="text-marigold">№ 01 to № 0{selectedCount}</span> ({selectedCount} of {totalCount} Dockets)
          </div>
          <div className="text-slate-ink text-[11px] mt-0.5">
            Covers <span className="text-evidence-teal font-bold">{coveredPop?.toLocaleString() || 0}</span> of {totalPop?.toLocaleString() || 0} residents
          </div>
        </div>
      </div>
    </div>
  );
}
