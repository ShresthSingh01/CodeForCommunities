import assert from 'node:assert';
import {
  cosineSimilarity,
  formClusters,
  assignClusterIds,
  buildSimilarityMatrix
} from '../clusterEngine.js';

// Test vectors
const v1 = [1, 0, 0];
const v2 = [1, 0, 0];
const v3 = [0, 1, 0];
const v4 = [0.9, 0.1, 0];

console.log("Running clusterEngine tests...");

// Test 1: Identical vectors
assert.strictEqual(cosineSimilarity(v1, v2), 1, "cosineSimilarity should be 1 for identical vectors");

// Test 2: Orthogonal vectors
assert.strictEqual(cosineSimilarity(v1, v3), 0, "cosineSimilarity should be 0 for orthogonal vectors");

// Test 3: Close vectors
const simClose = cosineSimilarity(v1, v4);
assert.ok(simClose > 0.8 && simClose < 1.0, "cosineSimilarity should be high for close vectors");

// Test 4: Mismatched length or empty
assert.strictEqual(cosineSimilarity(v1, [1, 0]), 0, "cosineSimilarity should return 0 for mismatched lengths");
assert.strictEqual(cosineSimilarity([], []), 0, "cosineSimilarity should return 0 for empty arrays");

// Test 5: formClusters correctly groups elements
const complaints = [
  { id: 'c1', embedding: v1, location: { ward: 'Ward 7' }, issue_type: 'water' },
  { id: 'c2', embedding: v4, location: { ward: 'Ward 7' }, issue_type: 'water' },
  { id: 'c3', embedding: v3, location: { ward: 'Ward 3' }, issue_type: 'road' }
];

// Threshold 0.75 should group c1 and c2, but isolate c3
const clusters = formClusters(complaints, 0.75);
assert.strictEqual(clusters.length, 2, "formClusters should produce exactly 2 clusters");

const clusterSizes = clusters.map(c => c.complaints.length).sort((a, b) => b - a);
assert.deepStrictEqual(clusterSizes, [2, 1], "One cluster should have 2 members, the other 1");

// Test 6: assignClusterIds
const updatedComplaints = assignClusterIds(complaints, clusters, 'TEST_PRE');
const group1 = updatedComplaints.filter(c => c.id === 'c1' || c.id === 'c2');
const group2 = updatedComplaints.filter(c => c.id === 'c3');

assert.strictEqual(group1[0].cluster_id, group1[1].cluster_id, "Grouped complaints should share the same cluster_id");
assert.notStrictEqual(group1[0].cluster_id, group2[0].cluster_id, "Isolated complaint should have a different cluster_id");

// Verify naming convention logic
assert.ok(group1[0].cluster_id.includes('Ward7_WATER'), "cluster_id should reflect dominant ward and type");
assert.ok(group2[0].cluster_id.includes('Ward3_ROAD'), "cluster_id should reflect dominant ward and type");

console.log("✅ All clusterEngine tests passed.");
