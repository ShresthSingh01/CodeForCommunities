import React from 'react';

export default function DocketCard({ cluster, isSelected, onSelect, onHover, cardRef }) {
  const isCritical = cluster.urgency === 'critical' || cluster.issue_type === 'water' || cluster.issue_type === 'health';
  
  // Format rank with leading zero: № 01
  const formattedRank = `№ ${String(cluster.rank).padStart(2, '0')}`;

  // Format currency in Lakhs/Crores
  const formatCost = (inr) => {
    if (inr >= 10000000) {
      return `₹${(inr / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(inr / 100000).toFixed(1)} L`;
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(cluster)}
      onMouseEnter={() => onHover && onHover(cluster)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`relative paper-texture transition-all duration-200 cursor-pointer p-4 mb-3 rounded-sm border ${
        isSelected
          ? 'bg-aged-parchment border-marigold ring-2 ring-marigold shadow-lg transform -translate-y-0.5'
          : 'bg-aged-parchment/95 hover:bg-aged-parchment border-slate-ink/30 hover:border-marigold/60 shadow'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between">
        <div className="flex items-baseline space-x-2">
          <span className="font-display font-bold text-2xl text-ink-navy tracking-tight">
            {formattedRank}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 bg-slate-ink/10 text-slate-ink rounded">
            {cluster.ward}
          </span>
        </div>

        {/* Urgency Ink Stamp */}
        <div
          className={`font-mono text-xs font-bold px-2 py-0.5 uppercase border-2 tracking-widest transition-transform ${
            isCritical
              ? 'text-seal-red border-seal-red rotate-[-3deg] shadow-sm'
              : 'text-slate-ink border-slate-ink rotate-[2deg] opacity-80'
          }`}
        >
          {isCritical ? 'CRITICAL' : 'MODERATE'}
        </div>
      </div>

      {/* Title / Category */}
      <h3 className="font-body font-bold text-ink-navy text-base mt-2 capitalize flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-evidence-teal"></span>
        {cluster.issue_type} Infrastructure Issue
      </h3>

      {/* Evidence & Metrics Bar */}
      <div className="mt-3 pt-2 border-t border-slate-ink/15 grid grid-cols-3 gap-2 font-mono text-xs text-slate-ink">
        <div>
          <span className="block text-[10px] uppercase text-slate-ink/70">Affected</span>
          <span className="font-bold text-ink-navy">{cluster.affected_population?.toLocaleString() || '1,000+'}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase text-slate-ink/70">Service Gap</span>
          <span className="font-bold text-ink-navy">{cluster.nearest_facility_km} km</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase text-slate-ink/70">Est. Cost</span>
          <span className="font-bold text-marigold">{formatCost(cluster.estimated_cost_inr)}</span>
        </div>
      </div>

      {/* Active Selection Indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-marigold rounded-l-sm" />
      )}
    </div>
  );
}
