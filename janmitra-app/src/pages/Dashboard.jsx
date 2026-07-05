import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { CLUSTERS } from '../../scripts/seedData.js';
import { computeRankings, greedyBudgetSelect } from '../scoring/priorityEngine';
import DocketCard from '../components/DocketCard';
import MapPanel from '../components/MapPanel';
import EvidenceThread from '../components/EvidenceThread';
import BudgetSlider from '../components/BudgetSlider';
import ExplanationCard from '../components/ExplanationCard';

export default function Dashboard() {
  const [rawClusters, setRawClusters] = useState(CLUSTERS);
  const [budget, setBudget] = useState(3500000); // Default ₹35 Lakhs
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [hoveredCluster, setHoveredCluster] = useState(null);
  const [activeCaseFile, setActiveCaseFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const pinRefs = useRef({});

  // Fetch from Firestore if available, otherwise fallback to seed CLUSTERS
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'clusters'));
        if (!querySnapshot.empty) {
          const docsData = [];
          querySnapshot.forEach((doc) => docsData.push({ id: doc.id, ...doc.data() }));
          setRawClusters(docsData);
        }
      } catch (err) {
        console.warn('Firestore load skipped (using seeded data):', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 1. Calculate Priority Ranking across all clusters
  const rankedClusters = useMemo(() => {
    return computeRankings(rawClusters);
  }, [rawClusters]);

  // 2. Filter clusters based on Client-Side Budget Simulation
  const fundedClusters = useMemo(() => {
    return greedyBudgetSelect(rankedClusters, budget);
  }, [rankedClusters, budget]);

  // Auto-select #1 rank on initial load
  useEffect(() => {
    if (rankedClusters.length > 0 && !selectedCluster) {
      setSelectedCluster(rankedClusters[0]);
    }
  }, [rankedClusters]);

  // Compute summary stats
  const totalPop = useMemo(() => {
    return rawClusters.reduce((sum, c) => sum + (c.affected_population || 0), 0);
  }, [rawClusters]);

  const coveredPop = useMemo(() => {
    return fundedClusters.reduce((sum, c) => sum + (c.affected_population || 0), 0);
  }, [fundedClusters]);

  const activeClusterForThread = hoveredCluster || selectedCluster;

  return (
    <div ref={containerRef} className="relative min-h-screen bg-ink-navy text-aged-parchment font-body flex flex-col">
      {/* Top Navigation / Header */}
      <header className="border-b border-slate-ink/30 px-6 py-4 bg-ink-navy/90 backdrop-blur sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-marigold animate-pulse" />
          <h1 className="font-display font-bold text-2xl text-marigold tracking-tight">
            JanMitra AI
          </h1>
          <span className="font-mono text-xs px-2 py-0.5 bg-slate-ink/20 text-slate-ink rounded border border-slate-ink/30">
            DISTRICT WAR ROOM · MVP
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs text-slate-ink">
          <span>Wards: <strong className="text-aged-parchment">3 Active</strong></span>
          <span>·</span>
          <span>Dockets: <strong className="text-aged-parchment">{rankedClusters.length}</strong></span>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Threaded Ledger Docket Stack (5 cols) */}
        <section className="lg:col-span-5 flex flex-col h-[calc(100vh-180px)] overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-aged-parchment flex items-center gap-2">
              <span>Threaded Ledger</span>
              <span className="font-mono text-xs font-normal text-slate-ink">
                (Priority Ranked)
              </span>
            </h2>
            <span className="font-mono text-xs text-evidence-teal">
              {fundedClusters.length} Funded under ₹{(budget / 100000).toFixed(0)}L
            </span>
          </div>

          {/* Scrollable Docket Card List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {rankedClusters.map((cluster) => {
              const isFunded = fundedClusters.some((f) => f.id === cluster.id);
              return (
                <div key={cluster.id} className={`transition-opacity duration-300 ${isFunded ? 'opacity-100' : 'opacity-40 grayscale-[50%]'}`}>
                  <DocketCard
                    cluster={cluster}
                    isSelected={selectedCluster?.id === cluster.id}
                    onSelect={(c) => {
                      setSelectedCluster(c);
                      setActiveCaseFile(c);
                    }}
                    onHover={setHoveredCluster}
                    cardRef={(el) => (cardRefs.current[cluster.id] = el)}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Interactive Map & Details (7 cols) */}
        <section className="lg:col-span-7 flex flex-col h-[calc(100vh-180px)] gap-4">
          {/* Top Map Panel */}
          <div className="flex-1 min-h-[380px] relative">
            <MapPanel
              clusters={rankedClusters}
              selectedCluster={selectedCluster}
              hoveredCluster={hoveredCluster}
              onSelectCluster={(c) => {
                setSelectedCluster(c);
                setActiveCaseFile(c);
              }}
              pinRefs={pinRefs}
            />
          </div>

          {/* Bottom Interactive Budget Simulation Slider */}
          <div>
            <BudgetSlider
              budget={budget}
              onChange={setBudget}
              selectedCount={fundedClusters.length}
              totalCount={rankedClusters.length}
              coveredPop={coveredPop}
              totalPop={totalPop}
            />
          </div>
        </section>
      </main>

      {/* Signature Animated Evidence Thread SVG overlay */}
      <EvidenceThread
        activeCluster={activeClusterForThread}
        cardRefs={cardRefs}
        pinRefs={pinRefs}
        containerRef={containerRef}
      />

      {/* Explanation Card Case File Modal */}
      {activeCaseFile && (
        <ExplanationCard
          cluster={activeCaseFile}
          onClose={() => setActiveCaseFile(null)}
        />
      )}
    </div>
  );
}
