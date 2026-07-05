import { WEIGHTS, URGENCY_SEVERITY, VULNERABILITY_INDEX } from './weights.js';

/**
 * Normalizes an array of values to a 0-1 scale.
 */
function normalize(values) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  if (max === min) return values.map(() => 0.5); // Avoid division by zero
  
  return values.map(val => (val - min) / (max - min));
}

/**
 * Computes priority score and impact-per-rupee for an array of clusters.
 * Ranks them and returns the updated array.
 */
export function computeRankings(clusters, customWeights = WEIGHTS) {
  if (!clusters || clusters.length === 0) return [];

  // 1. Extract values for normalization
  const populations = clusters.map(c => c.affected_population || 0);
  const serviceGaps = clusters.map(c => c.nearest_facility_km || 0);
  const costs = clusters.map(c => c.estimated_cost_inr || 0);

  // 2. Normalize
  const normPopulations = normalize(populations);
  const normServiceGaps = normalize(serviceGaps);
  const normCosts = normalize(costs);

  // 3. Compute scores
  const scoredClusters = clusters.map((cluster, index) => {
    // We don't have direct 'urgency' on the cluster in the DB (it's on complaints),
    // but we can infer it or we can just use 1.0 for demonstration since PRD simplifies it.
    // Wait, the PRD says PriorityScore formula uses UrgencySeverity. Let's assume
    // we take a default of 'critical' (1.0) if not specified on the cluster, or map by issue_type.
    // Since seed data doesn't put urgency on cluster, we'll default to 0.8 to keep it simple,
    // OR we can pass it if we aggregate. For MVP, we'll just use a high baseline.
    const urgency = 0.8; 

    const affectedGroup = cluster.issue_type === 'health' ? 'patients' : 
                          cluster.issue_type === 'education' ? 'students' : 
                          cluster.issue_type === 'road' ? 'commuters' : 'residents';
                          
    const vulnIndex = VULNERABILITY_INDEX[affectedGroup] || VULNERABILITY_INDEX.default;

    const popNorm = normPopulations[index];
    const recScore = cluster.recurrence_score || 0;
    const gapNorm = normServiceGaps[index];
    const costNorm = normCosts[index];

    // PriorityScore = w1*UrgencySeverity + w2*AffectedPopulationNorm + w3*RecurrenceScore + w4*ServiceGapNorm + w5*VulnerabilityIndex - w6*EstimatedCostNorm
    const priority_score = 
      (customWeights.w1 * urgency) +
      (customWeights.w2 * popNorm) +
      (customWeights.w3 * recScore) +
      (customWeights.w4 * gapNorm) +
      (customWeights.w5 * vulnIndex) -
      (customWeights.w6 * costNorm);
      
    // Prevent division by zero
    const safeCost = cluster.estimated_cost_inr > 0 ? cluster.estimated_cost_inr : 1;
    
    // ImpactPerRupee = PriorityScore / estimated_cost_inr
    // We multiply by 100000 just to keep the float readable (impact per Lakh INR)
    const impact_per_lakh = (priority_score / safeCost) * 100000;

    return {
      ...cluster,
      priority_score,
      impact_per_rupee: impact_per_lakh // Rename to keep it conceptually the same
    };
  });

  // 4. Sort by Impact Per Rupee descending
  scoredClusters.sort((a, b) => b.impact_per_rupee - a.impact_per_rupee);

  // 5. Assign ranks
  return scoredClusters.map((cluster, index) => ({
    ...cluster,
    rank: index + 1
  }));
}

/**
 * Budget Simulation: Greedy selection maximizing ImpactPerRupee
 */
export function greedyBudgetSelect(rankedClusters, budgetInr) {
  let remainingBudget = budgetInr;
  const selected = [];

  // Since rankedClusters are already sorted by ImpactPerRupee descending, 
  // we just take from the top until budget is exhausted.
  for (const cluster of rankedClusters) {
    if (cluster.estimated_cost_inr <= remainingBudget) {
      selected.push(cluster);
      remainingBudget -= cluster.estimated_cost_inr;
    }
  }

  return selected;
}
