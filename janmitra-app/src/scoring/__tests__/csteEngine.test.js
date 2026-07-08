import assert from 'node:assert';
import { computeBaselineFromClusters, simulateCSTE } from '../csteEngine.js';

console.log("Running csteEngine tests...");

const mockClusters = [
  { issue_type: 'water', recurrence_score: 0.8, nearest_facility_km: null, complaint_count: 5 },
  { issue_type: 'health', recurrence_score: 0.6, nearest_facility_km: 3.5, complaint_count: 3 },
  { issue_type: 'education', recurrence_score: 0.4, nearest_facility_km: 2.5, complaint_count: 10 }
];

// Test 1: Baseline computation handles mock data correctly
const baseline = computeBaselineFromClusters(mockClusters);

// Water Coverage: 100 - (0.8 * 50) = 60
assert.strictEqual(baseline.waterCoverage, 60.0);

// Facility Distance: avg(3.5, 2.5) = 3.0
assert.strictEqual(baseline.facilityDistance, 3.0);

// Healthcare Access: 100 - (0.6 * 60) = 64
assert.strictEqual(baseline.healthcareAccess, 64.0);

// School Attendance: 100 - ((10 * 1000) / 120000 * 30) = 100 - 2.5 = 97.5
assert.strictEqual(baseline.schoolAttendance, 97.5);

// Test 2: simulateCSTE applies improvements correctly
const funded = [ mockClusters[0] ]; // Fund water
const simResult = simulateCSTE(funded, mockClusters);

assert.strictEqual(simResult.baseState.waterCoverage, 60.0, "Base state must match original baseline");
assert.ok(simResult.futureState.waterCoverage > 60.0, "Funded water project must improve water coverage");

// Unfunded metrics should stay the same (with rounding variance handled)
assert.strictEqual(simResult.futureState.healthcareAccess, 64.0, "Unfunded health metric should not change");

// Test 3: Empty state safe fallback
const emptyBaseline = computeBaselineFromClusters([]);
assert.ok(emptyBaseline.waterCoverage > 0);
assert.ok(emptyBaseline.facilityDistance > 0);

console.log("✅ All csteEngine tests passed.");
