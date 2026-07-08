import React from 'react';

export default function ScoreTriadChip({ needScore = 0, impactScore = 0, synergyScore = 0, decisionScore = 0, costInr = 0 }) {
  const formatCostLakhs = (inr) => (inr / 100000).toFixed(1);

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center flex-wrap gap-2 font-mono text-[11px]">
        
        {/* Need */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-border-gray">
          <span className="text-neutral-gray uppercase tracking-wider text-[9px] font-bold">Need</span>
          <span className="font-bold text-slate-800 text-[11px]">{needScore.toFixed(2)}</span>
        </div>
        
        {/* Impact */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-border-gray">
          <span className="text-neutral-gray uppercase tracking-wider text-[9px] font-bold">Impact</span>
          <span className="font-bold text-slate-800 text-[11px]">{impactScore.toFixed(2)}</span>
        </div>
        
        {/* Synergy */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-border-gray">
          <span className="text-neutral-gray uppercase tracking-wider text-[9px] font-bold">Synergy</span>
          <span className="font-bold text-evidence-teal text-[11px]">+{synergyScore.toFixed(2)}</span>
        </div>
        
        <span className="text-neutral-gray mx-0.5">→</span>
        
        {/* Decision Score (Right side) */}
        <div className="flex flex-col items-center min-w-[100px]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-neutral-gray uppercase tracking-wider text-[9px] font-bold">Decision Score</span>
            <span className="font-bold text-slate-800 text-[13px]">{decisionScore.toFixed(3)}</span>
          </div>
          <span className="text-[10px] text-neutral-gray border-t border-border-gray pt-0.5 mt-0.5 w-full text-center">
            ÷ ₹{formatCostLakhs(costInr)}L
          </span>
        </div>

      </div>
    </div>
  );
}
