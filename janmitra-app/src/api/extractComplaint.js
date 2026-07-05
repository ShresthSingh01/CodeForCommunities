import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function submitCitizenComplaint(rawText, language = 'hi') {
  try {
    // 1. Call Backend AI Extraction
    const response = await fetch('http://localhost:3001/api/extract-complaint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText })
    });

    let extractedData;
    if (response.ok) {
      extractedData = await response.json();
    } else {
      // Fallback if backend server isn't running
      extractedData = {
        isMock: true,
        issue_type: "water",
        location: { lat: 28.6200, lng: 77.2150, ward: "Ward 7" },
        urgency: "moderate",
        affected_group: "residents",
        cluster_id: "CL_W7_WATER"
      };
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

    // 2. Write to Firestore (best-effort)
    try {
      await addDoc(collection(db, 'complaints'), complaintDoc);
    } catch (dbErr) {
      console.warn("Firestore write skipped (using local mock state):", dbErr.message);
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
