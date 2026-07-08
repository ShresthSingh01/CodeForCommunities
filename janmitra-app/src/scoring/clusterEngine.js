/**
 * Computes cosine similarity between two numeric arrays.
 * Returns 0 if lengths mismatch or vectors are empty.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Returns a 2D array (matrix) of similarities between items.
 * @param {Array} items - Array of objects
 * @param {string} vecKey - The key where the embedding vector is stored
 */
export function buildSimilarityMatrix(items, vecKey = 'embedding') {
  const n = items.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    matrix[i][i] = 1.0; // self-similarity
    for (let j = i + 1; j < n; j++) {
      const sim = cosineSimilarity(items[i][vecKey], items[j][vecKey]);
      matrix[i][j] = sim;
      matrix[j][i] = sim;
    }
  }
  return matrix;
}

/**
 * Uses a greedy agglomerative approach to group complaints.
 * @param {Array} complaints - Array of complaint objects (must have `embedding` field)
 * @param {number} threshold - Cosine similarity threshold
 * @returns {Array} Array of cluster objects: { complaints: [], centroid: [] }
 */
export function formClusters(complaints, threshold) {
  if (!complaints || complaints.length === 0) return [];

  const clusters = [];

  for (const complaint of complaints) {
    if (!complaint.embedding || complaint.embedding.length === 0) {
      // Treat complaints without embeddings as isolated clusters
      clusters.push({
        complaints: [complaint],
        centroid: []
      });
      continue;
    }

    let bestCluster = null;
    let maxSim = -1;

    // Find the closest existing cluster centroid
    for (const cluster of clusters) {
      if (cluster.centroid.length === 0) continue;
      const sim = cosineSimilarity(complaint.embedding, cluster.centroid);
      if (sim >= threshold && sim > maxSim) {
        maxSim = sim;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      // Join best cluster and update its centroid
      bestCluster.complaints.push(complaint);
      const n = bestCluster.complaints.length;
      const dim = complaint.embedding.length;
      for (let i = 0; i < dim; i++) {
        // running average for the centroid
        bestCluster.centroid[i] = ((bestCluster.centroid[i] * (n - 1)) + complaint.embedding[i]) / n;
      }
    } else {
      // Create new cluster
      clusters.push({
        complaints: [complaint],
        centroid: [...complaint.embedding]
      });
    }
  }

  return clusters;
}

/**
 * Assigns dynamic semantic cluster IDs to complaints.
 * @param {Array} complaints - Flat array of all complaints
 * @param {Array} clusters - Array of clusters produced by formClusters
 * @param {string} prefix - The prefix for the cluster ID
 * @returns {Array} Updated array of complaints with a `cluster_id` field
 */
export function assignClusterIds(complaints, clusters, prefix = 'CL_SEM') {
  let clusterIndex = 0;

  for (const cluster of clusters) {
    if (cluster.complaints.length === 0) continue;

    // Determine dominant ward and issue_type by simple frequency counting
    const wardCounts = {};
    const typeCounts = {};

    for (const c of cluster.complaints) {
      const w = c.location?.ward || 'Unknown';
      const t = c.issue_type || 'unknown';
      wardCounts[w] = (wardCounts[w] || 0) + 1;
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    }

    let dominantWard = Object.keys(wardCounts).sort((a, b) => wardCounts[b] - wardCounts[a])[0];
    let dominantType = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])[0];

    const cleanWard = dominantWard.replace(/\s+/g, '');
    const cleanType = dominantType.toUpperCase();
    
    // e.g., CL_SEM_Ward3_ROAD_0
    const newClusterId = `${prefix}_${cleanWard}_${cleanType}_${clusterIndex}`;

    // Update the original complaint objects in the flat array by reference
    for (const c of cluster.complaints) {
      const original = complaints.find(comp => comp.id === c.id || comp === c);
      if (original) {
        original.cluster_id = newClusterId;
      }
    }
    
    clusterIndex++;
  }

  return complaints;
}
