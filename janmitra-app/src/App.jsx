import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { CLUSTERS } from '../scripts/seedData.js';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

import Dashboard from './pages/Dashboard';
import IssuesPage from './pages/IssuesPage';
import PortfolioPlanner from './pages/PortfolioPlanner';
import BudgetSimulator from './pages/BudgetSimulator';
import CitizenWidget from './pages/CitizenWidget';
import WardMapPage from './pages/WardMapPage';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'issues' | 'portfolio' | 'simulator' | 'wardmap' | 'citizen' | 'reports' | 'settings' | 'help'
  
  // Shared State
  const [currentConstituency, setCurrentConstituency] = useState('varanasi');
  const [clusters, setClusters] = useState([]);
  const [budget, setBudget] = useState(3500000);
  const [selectedCluster, setSelectedCluster] = useState(null);

  // Data loading (Real-time from Firestore)
  useEffect(() => {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const isFirebaseValid = projectId && !projectId.includes("YOUR_");

    if (isFirebaseValid) {
      console.log(`Setting up real-time listener for ${currentConstituency} clusters...`);
      const q = query(collection(db, 'clusters'), where('constituency_id', '==', currentConstituency));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docsData = [];
          snapshot.forEach((doc) => docsData.push({ id: doc.id, ...doc.data() }));
          setClusters(docsData);
        } else {
          setClusters([]); // Clear clusters if none found for constituency
        }
      }, (error) => {
        console.warn("Firestore snapshot error, falling back to seed data:", error.message);
      });

      return () => unsubscribe();
    } else {
      console.warn("Firebase not configured. Using local/seeded state.");
      
      // Fallback local storage logic if firebase is not active
      const loadLocalClusters = () => {
        const saved = localStorage.getItem('janmitra_clusters');
        if (saved) {
          try {
            setClusters(JSON.parse(saved));
          } catch (e) {
            console.warn("Error parsing saved clusters:", e);
          }
        }
      };

      loadLocalClusters();
      const handleUpdate = () => loadLocalClusters();
      window.addEventListener('janmitra_clusters_updated', handleUpdate);
      return () => window.removeEventListener('janmitra_clusters_updated', handleUpdate);
    }
  }, [currentConstituency]);

  return (
    <div className="flex h-screen overflow-hidden bg-soft-surface">
      {/* Left Sidebar / Bottom Navigation Bar */}
      <Sidebar activeView={currentView} onViewChange={setCurrentView} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        {/* Top Utility Bar */}
        <TopBar 
          notificationCount={clusters.reduce((acc, c) => acc + (c.complaint_count || 0), 0)} 
          currentConstituency={currentConstituency}
          onConstituencyChange={setCurrentConstituency}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentView === 'home' && (
            <Dashboard 
              clusters={clusters} 
              onNavigateToPortfolio={() => setCurrentView('portfolio')}
              onNavigateToIssues={(issue) => {
                setSelectedCluster(issue);
                setCurrentView('issues');
              }}
            />
          )}

          {currentView === 'issues' && (
            <IssuesPage 
              clusters={clusters} 
              selectedCluster={selectedCluster} 
              setSelectedCluster={setSelectedCluster}
              onNavigateToPortfolio={() => setCurrentView('portfolio')}
            />
          )}

          {currentView === 'portfolio' && (
            <PortfolioPlanner 
              clusters={clusters} 
              budget={budget} 
              selectedCluster={selectedCluster}
              onNavigateToSimulator={() => setCurrentView('simulator')}
            />
          )}

          {currentView === 'simulator' && (
            <BudgetSimulator 
              clusters={clusters} 
              budget={budget} 
              onBudgetChange={setBudget}
              onNavigateBack={() => setCurrentView('portfolio')}
            />
          )}

          {currentView === 'wardmap' && (
            <WardMapPage 
              clusters={clusters} 
              setSelectedCluster={setSelectedCluster}
              onNavigateToIssues={(issue) => {
                setSelectedCluster(issue);
                setCurrentView('issues');
              }}
            />
          )}

          {currentView === 'citizen' && (
            <CitizenWidget currentConstituency={currentConstituency} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
