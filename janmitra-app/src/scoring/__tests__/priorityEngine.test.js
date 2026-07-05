import { computeRankings, greedyBudgetSelect } from '../priorityEngine.js';
import { CLUSTERS } from '../../../scripts/seedData.js';

// Basic verification script since we don't have Jest installed for the MVP hackathon build
// Run with: node src/scoring/__tests__/priorityEngine.test.js

function runTests() {
  console.log("Running Priority Engine Tests...\n");

  const ranked = computeRankings(CLUSTERS);
  
  const rank1 = ranked[0];
  console.log(`Rank #1 Cluster: ${rank1.id} (Score: ${rank1.priority_score.toFixed(3)}, Impact: ${rank1.impact_per_rupee.toFixed(3)})`);

  if (rank1.id === "CL_W7_WATER") {
    console.log("✅ SUCCESS: Ward 7 Water issue is correctly ranked #1.");
  } else {
    console.error(`❌ FAILURE: Expected CL_W7_WATER to be #1, but got ${rank1.id}`);
  }

  console.log("\nTesting Budget Simulation (₹20L budget)...");
  const budget = 2000000; // 20 Lakhs
  const selected = greedyBudgetSelect(ranked, budget);
  
  const totalCost = selected.reduce((sum, c) => sum + c.estimated_cost_inr, 0);
  console.log(`Selected ${selected.length} clusters. Total cost: ₹${totalCost}`);
  
  selected.forEach(c => {
    console.log(` - [Rank ${c.rank}] ${c.id}: ₹${c.estimated_cost_inr}`);
  });

  if (totalCost <= budget) {
    console.log("✅ SUCCESS: Selected clusters fit within budget.");
  } else {
    console.error("❌ FAILURE: Selected clusters exceeded budget.");
  }
}

runTests();
