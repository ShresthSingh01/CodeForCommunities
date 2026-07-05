import React, { useEffect, useState } from 'react';
import { explainClusterPriority } from '../api/gemini';

export default function ExplanationCard({ cluster, onClose }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchExplanation() {
      if (!cluster) return;
      setLoading(true);
      const res = await explainClusterPriority(cluster);
      if (isMounted) {
        setExplanation(res);
        setLoading(false);
      }
    }

    fetchExplanation();

    return () => {
      isMounted = false;
    };
  }, [cluster]);

  if (!cluster) return null;

  // Calculate Impact Per Rupee rating stars (1 to 5 stars)
  const impactScore = cluster.impact_per_rupee || 0;
  const starsCount = Math.min(5, Math.max(1, Math.round(impactScore * 30)));
  const starsStr = "★".repeat(starsCount) + "☆".repeat(5 - starsCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      {/* Case File Outer Shell */}
      <div className="relative w-full max-w-2xl bg-aged-parchment text-ink-navy rounded-sm border-2 border-slate-ink/40 shadow-2xl overflow-hidden paper-texture">
        {/* Top Case File Folder Header Bar */}
        <div className="bg-slate-ink/15 border-b border-slate-ink/30 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs uppercase tracking-widest px-2 py-0.5 bg-ink-navy text-aged-parchment font-bold">
              OFFICIAL CASE FILE
            </span>
            <span className="font-mono text-xs text-slate-ink font-bold">
              ID: {cluster.id}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-ink hover:text-ink-navy font-mono text-sm px-2 py-0.5 border border-slate-ink/30 hover:border-ink-navy rounded transition-colors"
          >
            [CLOSE ✕]
          </button>
        </div>

        {/* Case File Main Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Header & Rank Badge */}
          <div className="flex items-start justify-between border-b border-slate-ink/20 pb-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-slate-ink">
                {cluster.ward} · {cluster.issue_type} Infrastructure
              </span>
              <h2 className="font-display font-bold text-2xl text-ink-navy mt-1 capitalize">
                Case Analysis: {cluster.issue_type} Priority
              </h2>
            </div>

            <div className="text-right">
              <span className="font-display font-bold text-3xl text-marigold block leading-none">
                № {String(cluster.rank).padStart(2, '0')}
              </span>
              <span className="font-mono text-[10px] text-slate-ink uppercase tracking-widest">
                Priority Rank
              </span>
            </div>
          </div>

          {/* AI Narrative Section (Gemini Grounded Explanation) */}
          <div className="space-y-3 bg-slate-ink/5 p-4 rounded-sm border border-slate-ink/20">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ink-navy flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-evidence-teal" />
                Executive Summary (Why № {String(cluster.rank).padStart(2, '0')})
              </h3>
              {explanation?.isMock && (
                <span className="font-mono text-[10px] text-slate-ink/70 bg-slate-ink/10 px-1.5 py-0.5 rounded">
                  // MOCK (No API Key)
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-6 flex items-center justify-center space-x-2 text-slate-ink font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-marigold animate-ping" />
                <span>Generating grounded reasoning via Gemini AI...</span>
              </div>
            ) : (
              <ul className="space-y-2 font-body text-sm text-ink-navy/90">
                {explanation?.narrative?.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-evidence-teal font-bold">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sourced Evidence Graph Data Grid */}
          <div>
            <h3 className="font-mono text-xs uppercase font-bold text-slate-ink tracking-wider mb-2">
              Sourced Evidence Graph Facts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-aged-parchment p-2.5 border border-slate-ink/20 rounded-sm">
                <span className="text-[10px] text-slate-ink block uppercase">Affected Pop.</span>
                <span className="font-bold text-ink-navy text-sm">
                  {cluster.affected_population?.toLocaleString()}
                </span>
              </div>
              <div className="bg-aged-parchment p-2.5 border border-slate-ink/20 rounded-sm">
                <span className="text-[10px] text-slate-ink block uppercase">Facility Distance</span>
                <span className="font-bold text-ink-navy text-sm">
                  {cluster.nearest_facility_km} km
                </span>
              </div>
              <div className="bg-aged-parchment p-2.5 border border-slate-ink/20 rounded-sm">
                <span className="text-[10px] text-slate-ink block uppercase">Logged Complaints</span>
                <span className="font-bold text-ink-navy text-sm">
                  {cluster.complaint_count} Reports
                </span>
              </div>
              <div className="bg-aged-parchment p-2.5 border border-slate-ink/20 rounded-sm">
                <span className="text-[10px] text-slate-ink block uppercase">Est. Budget</span>
                <span className="font-bold text-marigold text-sm">
                  ₹{(cluster.estimated_cost_inr / 100000).toFixed(1)} L
                </span>
              </div>
            </div>

            {/* Public Evidence Badges */}
            {cluster.public_evidence?.length > 0 && (
              <div className="mt-3 space-y-1">
                <span className="font-mono text-[10px] text-slate-ink uppercase tracking-wider block">
                  Public Data Signals:
                </span>
                <div className="flex flex-wrap gap-2">
                  {cluster.public_evidence.map((ev, i) => (
                    <span
                      key={i}
                      className="font-mono text-xs px-2 py-1 bg-evidence-teal/15 text-evidence-teal border border-evidence-teal/30 rounded-sm"
                    >
                      ✓ {ev}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Metrics & Impact Star Rating */}
          <div className="pt-4 border-t border-slate-ink/20 flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-slate-ink block text-[10px] uppercase">
                Return on Investment Metric
              </span>
              <span className="text-ink-navy font-bold">
                Impact Per Rupee: <span className="text-marigold">{starsStr}</span>
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-marigold hover:bg-marigold/90 text-ink-navy font-bold rounded-sm shadow transition-colors"
            >
              Acknowledge Case File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
