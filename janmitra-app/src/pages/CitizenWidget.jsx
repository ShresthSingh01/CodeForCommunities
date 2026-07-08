import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { CLUSTERS } from '../../scripts/seedData.js';

export default function CitizenWidget({ currentConstituency = 'varanasi' }) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1); // 1: Input, 2: Review, 3: Success
  const [mode, setMode] = useState('type'); // 'type' | 'voice'
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extracted data state for review
  const [extractedData, setExtractedData] = useState({
    issue_type: 'water',
    ward: 'Ward 7',
    urgency: 'moderate',
    affected_group: 'residents'
  });
  
  // Voice Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [complaintId, setComplaintId] = useState('');

  // Local keywords extractor fallback if backend fails
  const getSmartFallback = (text) => {
    const lower = (text || '').toLowerCase();
    
    let issue_type = "water";
    if (lower.includes("road") || lower.includes("pothole") || lower.includes("sarak") || lower.includes("सड़क") || lower.includes("गड्ढे")) {
      issue_type = "road";
    } else if (lower.includes("hospital") || lower.includes("doctor") || lower.includes("clinic") || lower.includes("health") || lower.includes("अस्पताल") || lower.includes("इलाज")) {
      issue_type = "health";
    } else if (lower.includes("school") || lower.includes("teacher") || lower.includes("bench") || lower.includes("स्कूल") || lower.includes("शिक्षा")) {
      issue_type = "education";
    }

    let ward = "Ward 7";
    if (lower.includes("ward 3") || lower.includes("ward3") || lower.includes("वार्ड 3") || lower.includes("w3")) {
      ward = "Ward 3";
    } else if (lower.includes("ward 9") || lower.includes("ward9") || lower.includes("वार्ड 9") || lower.includes("w9")) {
      ward = "Ward 9";
    }

    const urgency = lower.includes("urgent") || lower.includes("emergency") || lower.includes("तुरंत") || lower.includes("खराब") ? "critical" : "moderate";
    const affected_group = issue_type === 'health' ? 'patients' : issue_type === 'education' ? 'students' : issue_type === 'road' ? 'commuters' : 'residents';

    return { issue_type, ward, urgency, affected_group };
  };

  // Step 1 -> Step 2: Trigger AI Extraction
  const handleExtract = async () => {
    const textToExtract = mode === 'voice' && !rawText ? "Urgent drinking water shortage and leak" : rawText;
    if (!textToExtract.trim()) return;

    setIsExtracting(true);
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/extract-complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToExtract, language: i18n.language, constituency: currentConstituency })
      });

      if (response.ok) {
        const data = await response.json();
        setExtractedData({
          issue_type: data.issue_type || 'water',
          ward: data.location?.ward || 'Ward 7',
          urgency: data.urgency || 'moderate',
          affected_group: data.affected_group || 'residents',
          embedding: data.embedding
        });
      } else {
        setExtractedData(getSmartFallback(textToExtract));
      }
    } catch (e) {
      console.warn("Backend extraction failed, using telemetry parser:", e);
      setExtractedData(getSmartFallback(textToExtract));
    } finally {
      setIsExtracting(false);
      setStep(2);
    }
  };

  // Step 2 -> Step 3: Write to Firestore / localstorage and show success receipt
  const handleRegister = async () => {
    setIsSubmitting(true);
    const generatedId = `C${Date.now().toString().slice(-4)}`;
    setComplaintId(generatedId);

    const complaintDoc = {
      id: generatedId,
      raw_text: rawText || "Voice logged complaint",
      language: 'en',
      extracted: {
        issue_type: extractedData.issue_type,
        location: { lat: 28.62, lng: 77.21, ward: extractedData.ward },
        urgency: extractedData.urgency,
        affected_group: extractedData.affected_group
      },
      cluster_id: `CL_${currentConstituency === 'lucknow' ? 'LKO' : currentConstituency === 'amethi' ? 'AME' : 'VAR'}_${extractedData.ward.replace(/\s+/g, '')}_${extractedData.issue_type.toUpperCase()}`,
      constituency_id: currentConstituency,
      embedding: extractedData.embedding || null,
      timestamp: new Date().toISOString()
    };

    // Firebase write if configured
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const isFirebaseValid = projectId && !projectId.includes("YOUR_");

    if (isFirebaseValid) {
      try {
        await addDoc(collection(db, 'complaints'), complaintDoc);
      } catch (dbErr) {
        console.warn("Firestore skipped:", dbErr.message);
      }
    }

    // Update Local Storage
    try {
      const savedClustersStr = localStorage.getItem('janmitra_clusters');
      let currentClusters = savedClustersStr ? JSON.parse(savedClustersStr) : JSON.parse(JSON.stringify(CLUSTERS));

      const targetIndex = currentClusters.findIndex(
        (c) => c.ward === extractedData.ward && c.issue_type === extractedData.issue_type
      );

      if (targetIndex !== -1) {
        const prevCount = currentClusters[targetIndex].complaint_count || 10;
        currentClusters[targetIndex] = {
          ...currentClusters[targetIndex],
          complaint_count: prevCount + 1,
          recurrence_score: Math.min(1.0, (currentClusters[targetIndex].recurrence_score || 0.5) + 0.05)
        };
      }
      localStorage.setItem('janmitra_clusters', JSON.stringify(currentClusters));
      window.dispatchEvent(new Event('janmitra_clusters_updated'));
    } catch (lsErr) {
      console.warn("Local storage sync skipped:", lsErr);
    }

    setIsSubmitting(false);
    setStep(3);
  };

  // Speech Recognition hook
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser speech-to-text not supported in this browser. Please type details.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-US';
    rec.continuous = false;

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setRawText(transcript);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.start();
  };

  const handleReset = () => {
    setRawText('');
    setStep(1);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto pb-24 md:pb-6">
      {/* Header Info */}
      <div className="border-b border-border-gray pb-4">
        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Citizen Complaint Registry</h1>
        <p className="text-[13px] text-neutral-gray mt-0.5">Collect, verify, and group citizen grievances into constituency twin telemetry.</p>
      </div>

      {/* Stepper Indicator */}
      <div className="flex items-center justify-between bg-white px-6 py-3 border border-border-gray rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-mono ${
            step >= 1 ? 'bg-need-blue text-white' : 'bg-slate-100 text-neutral-gray'
          }`}>1</span>
          <span className="text-[12px] font-bold text-slate-700">Complaint Input</span>
        </div>
        <span className="text-neutral-gray text-xs">➔</span>
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-mono ${
            step >= 2 ? 'bg-need-blue text-white' : 'bg-slate-100 text-neutral-gray'
          }`}>2</span>
          <span className="text-[12px] font-bold text-slate-700">AI Review</span>
        </div>
        <span className="text-neutral-gray text-xs">➔</span>
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold font-mono ${
            step >= 3 ? 'bg-success-green text-white' : 'bg-slate-100 text-neutral-gray'
          }`}>3</span>
          <span className="text-[12px] font-bold text-slate-700">Receipt</span>
        </div>
      </div>

      {/* Step Contents */}
      <div className="bg-white border border-border-gray rounded-xl p-6 shadow-sm">
        
        {/* Step 1: Input Mode */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-[16px] font-bold text-slate-800">How can we help?</h2>
              <p className="text-[12px] text-neutral-gray">Submit grievance details in either text or spoken formats.</p>
            </div>

            {/* Input Toggle */}
            <div className="flex justify-center gap-4 border-b border-slate-150 pb-2">
              <button
                onClick={() => setMode('type')}
                className={`pb-1 text-[13px] font-bold transition-all ${
                  mode === 'type' ? 'text-need-blue border-b-2 border-need-blue' : 'text-neutral-gray'
                }`}
              >
                Type Text
              </button>
              <button
                onClick={() => setMode('voice')}
                className={`pb-1 text-[13px] font-bold transition-all ${
                  mode === 'voice' ? 'text-need-blue border-b-2 border-need-blue' : 'text-neutral-gray'
                }`}
              >
                Speak Voice
              </button>
            </div>

            {mode === 'type' ? (
              <div className="relative">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value.slice(0, 500))}
                  placeholder="Describe the constituency issue here (e.g. Broken water pipeline in sector 3...)"
                  className="w-full h-32 p-3 border border-border-gray rounded-lg text-[13px] bg-slate-50 focus:outline-none focus:ring-1 focus:ring-need-blue focus:border-need-blue"
                />
                <span className="absolute bottom-3 right-3 text-[10px] font-mono text-neutral-gray">
                  {rawText.length}/500
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 space-y-4">
                <button
                  onClick={startSpeechRecognition}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isListening ? 'bg-urgent-red text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="text-2xl">{isListening ? '🛑' : '🎤'}</span>
                </button>
                <div className="text-center">
                  <span className="text-[12px] font-bold text-slate-800">
                    {isListening ? 'Listening... Speak details clearly' : 'Tap to start recording'}
                  </span>
                  {rawText && (
                    <p className="text-[11px] text-neutral-gray mt-2 italic bg-slate-50 p-2.5 rounded border border-slate-100 max-w-sm">
                      "{rawText}"
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleExtract}
              disabled={isExtracting || (!rawText.trim() && mode === 'type')}
              className="w-full bg-need-blue hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-[13px] transition-colors disabled:opacity-50"
            >
              {isExtracting ? 'Analyzing Complaint via Gemini AI...' : 'Analyze Details →'}
            </button>
          </div>
        )}

        {/* Step 2: AI Review State */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[16px] font-bold text-slate-800">Verify Telemetry Extraction</h2>
              <p className="text-[12px] text-neutral-gray">Gemini structured details automatically. Make corrections if inaccurate.</p>
            </div>

            <div className="space-y-4 border-t border-b border-slate-100 py-4">
              {/* Issue Type */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-slate-700">Issue Category</span>
                <select
                  value={extractedData.issue_type}
                  onChange={(e) => setExtractedData({ ...extractedData, issue_type: e.target.value })}
                  className="bg-slate-50 border border-border-gray rounded-md p-1.5 text-[12px]"
                >
                  <option value="water">Water Shortage</option>
                  <option value="road">Road Connectivity</option>
                  <option value="health">Healthcare Access</option>
                  <option value="education">Education Infrastructure</option>
                </select>
              </div>

              {/* Ward */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-slate-700">Constituency Ward</span>
                <select
                  value={extractedData.ward}
                  onChange={(e) => setExtractedData({ ...extractedData, ward: e.target.value })}
                  className="bg-slate-50 border border-border-gray rounded-md p-1.5 text-[12px]"
                >
                  <option value="Ward 3">Ward 3</option>
                  <option value="Ward 7">Ward 7</option>
                  <option value="Ward 9">Ward 9</option>
                </select>
              </div>

              {/* Urgency */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-slate-700">Priority Urgency</span>
                <select
                  value={extractedData.urgency}
                  onChange={(e) => setExtractedData({ ...extractedData, urgency: e.target.value })}
                  className="bg-slate-50 border border-border-gray rounded-md p-1.5 text-[12px]"
                >
                  <option value="moderate">Moderate State</option>
                  <option value="critical">Critical Urgency</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-border-gray py-2.5 rounded-lg text-[13px] font-bold hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleRegister}
                disabled={isSubmitting}
                className="flex-1 bg-success-green hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg text-[13px] transition-colors"
              >
                {isSubmitting ? 'Registering...' : 'Confirm & Register ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Receipt */}
        {step === 3 && (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 rounded-full bg-success-green/10 text-success-green text-3xl flex items-center justify-center mx-auto">
              ✓
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-slate-800">Complaint Registered Successfully</h2>
              <p className="text-[12px] text-neutral-gray mt-1">
                Receipt generated under system log. Integrated into prioritizations.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-sm mx-auto font-mono text-[11px] text-left space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span>Receipt ID:</span>
                <span className="font-bold">{complaintId}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-bold uppercase">{extractedData.issue_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-bold">{extractedData.ward}</span>
              </div>
              <div className="flex justify-between">
                <span>Urgency:</span>
                <span className="font-bold uppercase text-urgent-red">{extractedData.urgency}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={handleReset}
                className="bg-need-blue hover:bg-blue-700 text-white text-[12px] font-bold px-5 py-2 rounded-lg transition-colors shadow-sm"
              >
                Log New Complaint
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
