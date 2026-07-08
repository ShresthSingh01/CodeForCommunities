import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { formClusters, assignClusterIds } from '../src/scoring/clusterEngine.js';
import { SIMILARITY_THRESHOLD } from '../src/scoring/weights.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getEmbedding(text, apiKey) {
  if (!apiKey || apiKey.includes('YOUR_')) {
    console.warn('// MOCK: No valid Gemini API key for recluster script.');
    return new Array(768).fill(0);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] }
        })
      }
    );

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.embedding?.values || new Array(768).fill(0);
  } catch (err) {
    console.error("Gemini Embedding API Error:", err);
    return new Array(768).fill(0);
  }
}

async function runRecluster() {
  console.log('Fetching complaints from Firestore...');
  const complaintsSnapshot = await getDocs(collection(db, 'complaints'));
  const complaints = [];
  
  complaintsSnapshot.forEach((doc) => {
    complaints.push({ id: doc.id, ...doc.data() });
  });

  console.log(`Found ${complaints.length} complaints.`);
  const apiKey = process.env.VITE_GEMINI_API_KEY;

  let embeddingsGenerated = 0;

  // Process sequentially to respect rate limits
  for (const c of complaints) {
    if (!c.embedding || c.embedding.length === 0) {
      console.log(`Generating embedding for complaint ${c.id}...`);
      c.embedding = await getEmbedding(c.raw_text, apiKey);
      embeddingsGenerated++;
      // Wait a bit to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log(`Generated ${embeddingsGenerated} new embeddings.`);

  // Form semantic clusters
  console.log('Clustering complaints...');
  const clusters = formClusters(complaints, SIMILARITY_THRESHOLD);
  console.log(`Formed ${clusters.length} semantic clusters.`);

  // Assign semantic cluster IDs
  const updatedComplaints = assignClusterIds(complaints, clusters, 'CL_SEM');

  // Compute cluster aggregates
  const clusterAggregates = clusters.map((clusterObj) => {
    const members = clusterObj.complaints;
    if (members.length === 0) return null;

    const clusterId = members[0].cluster_id;
    const representative = members[0];

    const complaint_count = members.length;
    const affected_population = members.reduce((sum, c) => {
      // Mock demographic fallback based on type and ward
      let pop = 800;
      if (c.issue_type === 'water') pop = 1500;
      if (c.location.ward === 'Ward 7') pop += 500;
      return sum + pop;
    }, 0) / complaint_count; // average

    const nearest_facility_km = members.reduce((sum, c) => {
      let km = 2.5;
      if (c.issue_type === 'health') km = 4.5;
      if (c.location.ward === 'Ward 9') km += 1.0;
      return sum + km;
    }, 0) / complaint_count;
    
    const recurrence_score = members.reduce((sum, c) => sum + (c.urgency === 'critical' ? 0.9 : 0.4), 0) / complaint_count;

    let cost = 1200000;
    if (representative.issue_type === 'water') cost = 2500000;
    else if (representative.issue_type === 'road') cost = 4500000;
    else if (representative.issue_type === 'health') cost = 1800000;

    return {
      id: clusterId,
      issue_type: representative.issue_type,
      ward: representative.location.ward,
      location: representative.location, // uses centroid theoretically, but representative is fine for demo
      complaint_count,
      recurrence_score,
      affected_population: Math.round(affected_population * complaint_count),
      nearest_facility_km: Number(nearest_facility_km.toFixed(1)),
      public_evidence: [
        `High concentration of ${representative.issue_type} issues reported in ${representative.location.ward}.`,
        `Estimated affected base: ${Math.round(affected_population * complaint_count)} people.`
      ],
      estimated_cost_inr: cost,
      priority_score: 0, // Computed by priority engine later
      rank: 0,
      createdAt: new Date().toISOString()
    };
  }).filter(Boolean);

  console.log('Writing updates to Firestore...');
  const batch = writeBatch(db);

  // 1. Update complaints
  for (const c of updatedComplaints) {
    const docRef = doc(db, 'complaints', c.id);
    batch.update(docRef, {
      embedding: c.embedding,
      cluster_id: c.cluster_id
    });
  }

  // 2. Delete existing clusters
  const oldClustersSnap = await getDocs(collection(db, 'clusters'));
  oldClustersSnap.forEach((d) => {
    batch.delete(doc(db, 'clusters', d.id));
  });

  // 3. Insert new clusters
  for (const agg of clusterAggregates) {
    const docRef = doc(db, 'clusters', agg.id);
    batch.set(docRef, agg);
  }

  await batch.commit();
  console.log('Reclustering complete! Firebase updated successfully.');
  process.exit(0);
}

runRecluster().catch(err => {
  console.error("Recluster failed:", err);
  process.exit(1);
});
