import React, { useMemo } from 'react';
import { computeBaselineFromClusters } from '../scoring/csteEngine';

export default function CSTEPanel({ clusters }) {
  const baseState = useMemo(() => computeBaselineFromClusters(clusters), [clusters]);

  const metrics = [
    {
      id: 'water',
      label: 'Water Coverage',
      value: baseState.waterCoverage,
      icon: '🚰',
      color: 'bg-blue-500',
      unit: '%'
    },
    {
      id: 'health',
      label: 'Healthcare Access',
      value: baseState.healthcareAccess,
      icon: '🏥',
      color: 'bg-red-500',
      unit: '%'
    },
    {
      id: 'education',
      label: 'School Attendance',
      value: baseState.schoolAttendance,
      icon: '🏫',
      color: 'bg-yellow-500',
      unit: '%'
    },
    {
      id: 'distance',
      label: 'Avg Facility Distance',
      value: baseState.facilityDistance,
      icon: '🛣️',
      color: 'bg-emerald-500',
      unit: 'km',
      inverse: true // lower is better
    }
  ];

  return (
    <div className="bg-white border border-border-gray rounded-xl p-5 shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
        <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-wider">
          Constituency Digital Twin (Live Baseline)
        </h2>
        <span className="text-[10px] font-mono text-need-blue bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-need-blue animate-pulse"></span>
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m) => {
          // Normalize progress bar percentage (0-100)
          let progressPercent = m.value;
          if (m.inverse) {
            // For distance, 0km = 100%, 10km = 0%
            progressPercent = Math.max(0, 100 - (m.value * 10));
          }

          return (
            <div key={m.id} className="flex flex-col space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-[12px] font-bold text-slate-700">{m.label}</span>
                </div>
                <span className="text-[16px] font-mono font-bold text-slate-900">
                  {m.value}{m.unit}
                </span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${m.color} transition-all duration-1000 ease-in-out`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
