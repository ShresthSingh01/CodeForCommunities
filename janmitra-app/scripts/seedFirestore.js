import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, query, getDocs, writeBatch } from 'firebase/firestore';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { ALL_CLUSTERS } from './seedData.js';

// Load .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

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

async function wipeCollection(collectionName) {
  const q = query(collection(db, collectionName));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Wiped ${collectionName} collection`);
}

async function seed() {
  try {
    console.log('Wiping old clusters...');
    await wipeCollection('clusters');
    
    console.log('Seeding clusters to Firestore...');
    for (const cluster of ALL_CLUSTERS) {
      try {
        await setDoc(doc(db, 'clusters', cluster.id), cluster);
        console.log(`Seeded cluster ${cluster.id}`);
      } catch (e) {
        console.error(`Failed to seed ${cluster.id}:`, e);
      }
    }
    console.log('Seeding complete.');
  } catch (e) {
    console.error('Seeding failed:', e);
  }
  console.log('Seeding complete.');
  process.exit(0);
}

seed();
