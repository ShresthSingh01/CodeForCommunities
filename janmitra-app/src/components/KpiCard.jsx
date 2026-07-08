import React from 'react';

export default function KpiCard({ title, value, subtext, trend, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-white border border-border-gray rounded-xl p-5 shadow-sm text-left transition-all ${
        onClick ? 'hover:shadow-md hover:border-slate-300 cursor-pointer' : 'cursor-default'
      }`}
    >
      <span className="text-[12px] font-semibold text-neutral-gray uppercase tracking-wider block mb-1">
        {title}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-bold text-slate-800 leading-none">
          {value}
        </span>
        {trend && (
          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${
            trend.type === 'positive' ? 'bg-success-green/10 text-success-green' : 'bg-slate-100 text-neutral-gray'
          }`}>
            {trend.value}
          </span>
        )}
      </div>
      {subtext && (
        <span className="text-[11px] text-neutral-gray block mt-2 font-mono">
          {subtext}
        </span>
      )}
    </button>
  );
}
