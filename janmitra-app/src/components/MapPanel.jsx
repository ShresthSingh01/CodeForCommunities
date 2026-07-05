import React from 'react';

// Ward definitions with normalized relative coordinates (0-100%) for visual rendering
const WARDS_CONFIG = [
  { name: 'Ward 7', color: '#14213D', path: 'M 10,10 L 60,15 L 55,60 L 15,55 Z', labelPos: { x: 30, y: 30 } },
  { name: 'Ward 3', color: '#1E293B', path: 'M 60,15 L 95,20 L 90,65 L 55,60 Z', labelPos: { x: 75, y: 35 } },
  { name: 'Ward 9', color: '#0F172A', path: 'M 15,55 L 55,60 L 90,65 L 85,95 L 20,95 Z', labelPos: { x: 50, y: 75 } },
];

export default function MapPanel({ clusters, selectedCluster, hoveredCluster, onSelectCluster, pinRefs }) {
  // Coordinate bounds mapping to relative 10-90% SVG canvas
  const getPinPosition = (cluster) => {
    // Map cluster wards to fixed canvas coordinates for pixel-perfect evidence threads
    if (cluster.ward === 'Ward 7' || cluster.id?.includes('W7')) {
      if (cluster.issue_type === 'water') return { x: 32, y: 35 };
      return { x: 42, y: 45 };
    }
    if (cluster.ward === 'Ward 3' || cluster.id?.includes('W3')) {
      if (cluster.issue_type === 'road') return { x: 72, y: 32 };
      if (cluster.issue_type === 'education') return { x: 80, y: 48 };
      return { x: 65, y: 52 };
    }
    // Ward 9
    if (cluster.issue_type === 'health') return { x: 48, y: 72 };
    if (cluster.issue_type === 'water') return { x: 35, y: 82 };
    return { x: 70, y: 78 };
  };

  return (
    <div className="relative w-full h-full min-h-[450px] bg-ink-navy border border-slate-ink/30 rounded-sm overflow-hidden flex flex-col">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-ink-navy/90 backdrop-blur border border-slate-ink/40 px-3 py-1.5 rounded text-xs font-mono text-aged-parchment flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>CONSTITUENCY DIGITAL TWIN — WARD GEO-GRAPH</span>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-ink-navy/90 backdrop-blur border border-slate-ink/40 p-2 rounded text-[11px] font-mono text-slate-ink flex gap-3">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-marigold border border-ink-navy"></span>
          <span className="text-aged-parchment">Rank #1 Target</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-evidence-teal border border-ink-navy"></span>
          <span className="text-aged-parchment">Priority Docket</span>
        </div>
      </div>

      {/* Interactive Geo Canvas */}
      <div className="relative flex-1 w-full h-full bg-slate-950/60 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
          {/* Grid Background */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#2F6E68" strokeWidth="0.15" strokeOpacity="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Ward Boundaries */}
          {WARDS_CONFIG.map((ward) => (
            <g key={ward.name}>
              <path
                d={ward.path}
                fill={ward.color}
                fillOpacity="0.4"
                stroke="#2F6E68"
                strokeWidth="0.5"
                strokeDasharray="1,1"
                className="transition-all duration-300 hover:fill-opacity-60"
              />
              <text
                x={ward.labelPos.x}
                y={ward.labelPos.y}
                fill="#EDE6D2"
                fillOpacity="0.35"
                fontSize="3.5"
                fontFamily="IBM Plex Mono"
                textAnchor="middle"
                className="pointer-events-none select-none uppercase font-bold tracking-widest"
              >
                {ward.name}
              </text>
            </g>
          ))}

          {/* Connective Geometry Lines */}
          <path
            d="M 32,35 L 72,32 L 48,72 Z"
            fill="none"
            stroke="#E8A33D"
            strokeWidth="0.2"
            strokeDasharray="0.5,1"
            opacity="0.5"
          />
        </svg>

        {/* Render Cluster Map Pins */}
        {clusters.map((cluster) => {
          const pos = getPinPosition(cluster);
          const isSelected = selectedCluster?.id === cluster.id;
          const isHovered = hoveredCluster?.id === cluster.id;
          const isTopRank = cluster.rank === 1;

          return (
            <div
              key={cluster.id}
              ref={(el) => {
                if (pinRefs) pinRefs.current[cluster.id] = el;
              }}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => onSelectCluster(cluster)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-20 group ${
                isSelected || isHovered ? 'scale-125 z-30' : 'scale-100'
              }`}
            >
              {/* Pulse Ring for Top Rank / Selected */}
              {(isTopRank || isSelected) && (
                <span
                  className={`absolute -inset-2 rounded-full animate-ping opacity-75 ${
                    isTopRank ? 'bg-marigold' : 'bg-evidence-teal'
                  }`}
                />
              )}

              {/* Pin Marker Body */}
              <div
                className={`relative flex items-center justify-center font-display font-bold text-xs rounded-full w-8 h-8 border-2 shadow-xl transition-all ${
                  isTopRank
                    ? 'bg-marigold text-ink-navy border-aged-parchment ring-2 ring-marigold/50'
                    : isSelected
                    ? 'bg-evidence-teal text-aged-parchment border-marigold ring-2 ring-marigold'
                    : 'bg-ink-navy text-aged-parchment border-evidence-teal hover:border-marigold'
                }`}
              >
                №{cluster.rank}
              </div>

              {/* Pin Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block bg-ink-navy border border-slate-ink px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap text-aged-parchment z-40 shadow-lg">
                <span className="text-marigold font-bold">{cluster.ward}</span> · {cluster.issue_type}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
