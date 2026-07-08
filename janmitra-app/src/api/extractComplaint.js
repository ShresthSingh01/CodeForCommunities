import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { CLUSTERS } from '../../scripts/seedData.js';

function getSmartFallback(text) {
  const lower = (text || '').toLowerCase();
  
  let issue_type = "water";
  if (lower.includes("road") || lower.includes("pothole") || lower.includes("sarak") || lower.includes("सड़क") || lower.includes("गड्ढे") || lower.includes("गड्डा")) {
    issue_type = "road";
  } else if (lower.includes("hospital") || lower.includes("doctor") || lower.includes("clinic") || lower.includes("health") || lower.includes("अस्पताल") || lower.includes("डेंगू")) {
    issue_type = "health";
  } else if (lower.includes("school") || lower.includes("teacher") || lower.includes("bench") || lower.includes("स्कूल") || lower.includes("पढ़ाई")) {
    issue_type = "education";
  }

  let ward = "Ward 7";
  if (lower.includes("ward 3") || lower.includes("ward3") || lower.includes("वाढ 3") || lower.includes("वार्ड 3") || lower.includes("w3")) {
    ward = "Ward 3";
  } else if (lower.includes("ward 9") || lower.includes("ward9") || lower.includes("वाढ 9") || lower.includes("वार्ड 9") || lower.includes("w9")) {
    ward = "Ward 9";
  } else if (lower.includes("ward 7") || lower.includes("ward7") || lower.includes("वाढ 7") || lower.includes("वार्ड 7") || lower.includes("w7")) {
    ward = "Ward 7";
  }

  const urgency = lower.includes("urgent") || lower.includes("emergency") || lower.includes("नहीं") || lower.includes("खराब") || lower.includes("pothole") ? "critical" : "moderate";
  const affected_group = issue_type === 'health' ? 'patients' : issue_type === 'education' ? 'students' : issue_type === 'road' ? 'commuters' : 'residents';
  const cluster_id = `CL_${ward.replace(/\s+/g, '')}_${issue_type.toUpperCase()}`;

  return {
    isMock: true,
    issue_type,
    location: { lat: 28.6200, lng: 77.2150, ward },
    urgency,
    affected_group,
    cluster_id
  };
}

export async function submitCitizenComplaint(rawText, language = 'hi') {
  try {
    // 1. Call Backend AI Extraction
    let extractedData;
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/extract-complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText })
      });

      if (response.ok) {
        extractedData = await response.json();
      } else {
        extractedData = getSmartFallback(rawText);
      }
    } catch (e) {
      extractedData = getSmartFallback(rawText);
    }

    const complaintDoc = {
      id: `C${Date.now().toString().slice(-4)}`,
      raw_text: rawText,
      language,
      extracted: {
        issue_type: extractedData.issue_type,
        location: extractedData.location,
        urgency: extractedData.urgency,
        affected_group: extractedData.affected_group
      },
      cluster_id: extractedData.cluster_id,
      timestamp: new Date().toISOString()
    };

    // 2. Write to Firestore
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const isFirebaseValid = projectId && !projectId.includes("YOUR_");

    if (isFirebaseValid) {
      try {
        await addDoc(collection(db, 'complaints'), complaintDoc);
        
        // 3. Update Cluster in Firestore
        const clusterRef = doc(db, 'clusters', extractedData.cluster_id);
        const clusterSnap = await getDoc(clusterRef);
        
        if (clusterSnap.exists()) {
          const currentCluster = clusterSnap.data();
          const prevCount = currentCluster.complaint_count || 10;
          await updateDoc(clusterRef, {
            complaint_count: prevCount + 1,
            recurrence_score: Math.min(1.0, (currentCluster.recurrence_score || 0.5) + 0.05)
          });
          console.log(`✅ Updated cluster ${extractedData.cluster_id} complaint count: ${prevCount} -> ${prevCount + 1} in Firestore`);
        } else {
          console.warn(`Cluster ${extractedData.cluster_id} not found in Firestore.`);
        }
      } catch (dbErr) {
        console.error("Firestore write failed:", dbErr.message);
      }
    } else {
      console.log("Firestore unconfigured, skipping DB write.");
    }

    return {
      success: true,
      complaint: complaintDoc,
      extracted: extractedData
    };
  } catch (error) {
    console.error("Error submitting complaint:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
