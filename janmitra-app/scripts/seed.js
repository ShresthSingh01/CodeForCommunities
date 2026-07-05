import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, getDocs } from 'firebase/firestore';
import { COMPLAINTS, CLUSTERS } from './seedData.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAndReseed() {
  if (!process.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID === "YOUR_FIREBASE_PROJECT_ID") {
    console.error("Firebase is not configured yet. Please update .env with real credentials before seeding.");
    console.error("Skipping seed for now (dev setup mode).");
    process.exit(0);
  }

  console.log('Starting seed process...');
  const batch = writeBatch(db);

  // Clear existing complaints
  const complaintsSnap = await getDocs(collection(db, 'complaints'));
  console.log(`Deleting ${complaintsSnap.size} existing complaints...`);
  complaintsSnap.forEach((d) => batch.delete(d.ref));

  // Clear existing clusters
  const clustersSnap = await getDocs(collection(db, 'clusters'));
  console.log(`Deleting ${clustersSnap.size} existing clusters...`);
  clustersSnap.forEach((d) => batch.delete(d.ref));

  // Add new complaints
  console.log(`Adding ${COMPLAINTS.length} new complaints...`);
  COMPLAINTS.forEach((c) => {
    const docRef = doc(collection(db, 'complaints'), c.id);
    batch.set(docRef, c);
  });

  // Add new clusters
  console.log(`Adding ${CLUSTERS.length} new clusters...`);
  CLUSTERS.forEach((c) => {
    const docRef = doc(collection(db, 'clusters'), c.id);
    batch.set(docRef, c);
  });

  await batch.commit();
  console.log('Seed process completed successfully.');
  process.exit(0);
}

clearAndReseed().catch(console.error);
