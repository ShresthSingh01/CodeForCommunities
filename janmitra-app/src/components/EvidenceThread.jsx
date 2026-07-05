import React, { useEffect, useState } from 'react';

export default function EvidenceThread({ activeCluster, cardRefs, pinRefs, containerRef }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!activeCluster || !containerRef?.current) {
      setCoords(null);
      return;
    }

    const cardEl = cardRefs?.current[activeCluster.id];
    const pinEl = pinRefs?.current[activeCluster.id];
    const containerEl = containerRef.current;

    if (!cardEl || !pinEl || !containerEl) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      const containerRect = containerEl.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();
      const pinRect = pinEl.getBoundingClientRect();

      // Start point: Right edge center of card
      const startX = cardRect.right - containerRect.left;
      const startY = cardRect.top + cardRect.height / 2 - containerRect.top;

      // End point: Center of map pin
      const endX = pinRect.left + pinRect.width / 2 - containerRect.left;
      const endY = pinRect.top + pinRect.height / 2 - containerRect.top;

      setCoords({ startX, startY, endX, endY });
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [activeCluster, cardRefs, pinRefs, containerRef]);

  if (!coords) return null;

  // Calculate curved Bezier path for dynamic organic feel
  const dx = coords.endX - coords.startX;
  const controlX1 = coords.startX + dx * 0.4;
  const controlY1 = coords.startY;
  const controlX2 = coords.startX + dx * 0.6;
  const controlY2 = coords.endY;

  const pathD = `M ${coords.startX},${coords.startY} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${coords.endX},${coords.endY}`;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="threadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2F6E68" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#E8A33D" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Background Thread Glow */}
      <path
        d={pathD}
        fill="none"
        stroke="#2F6E68"
        strokeWidth="4"
        strokeOpacity="0.3"
        strokeLinecap="round"
      />

      {/* Animated Foreground Thread */}
      <path
        d={pathD}
        fill="none"
        stroke="url(#threadGradient)"
        strokeWidth="2.5"
        strokeDasharray="8 4"
        className="animate-thread-draw"
      />

      {/* Connection Endpoint Nodes */}
      <circle cx={coords.startX} cy={coords.startY} r="4" fill="#E8A33D" />
      <circle cx={coords.endX} cy={coords.endY} r="5" fill="#2F6E68" stroke="#EDE6D2" strokeWidth="1.5" />
    </svg>
  );
}
