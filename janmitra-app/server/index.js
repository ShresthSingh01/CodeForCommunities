import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import admin from 'firebase-admin';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin (optional for demo if no service account)
const saPath = resolve(__dirname, '../serviceAccountKey.json');
let dbAdmin = null;
if (fs.existsSync(saPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  dbAdmin = admin.firestore();
  console.log("Firebase Admin initialized.");
} else {
  console.log("// MOCK: Firebase Admin not initialized (missing serviceAccountKey.json).");
}


const PORT = process.env.PORT || 3001;

// Smart Fallback Parser when AI key is missing/erroring
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

// Helper to fetch Vertex AI text-embedding-004
async function getEmbedding(text, apiKey) {
  const isMock = !apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey.includes("YOUR_");
  if (isMock) {
    console.log("// MOCK: Vertex AI Embedding (No API key)");
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
    if (data.error) {
      console.error("🔴 Vertex AI Embedding Error:", data.error.message);
      return new Array(768).fill(0);
    }
    
    return data.embedding?.values || new Array(768).fill(0);
  } catch (err) {
    console.error("Gemini Embedding API Error:", err);
    return new Array(768).fill(0);
  }
}

// Endpoint: Generate embedding for raw citizen text
app.post('/api/embed-complaint', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const isMock = !apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey.includes("YOUR_");
  
  const embedding = await getEmbedding(text, apiKey);
  res.json({ isMock, embedding });
});

// Endpoint: AI Extract complaint details from raw citizen text
app.post('/api/extract-complaint', async (req, res) => {
  const { text, constituency = 'varanasi' } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const isMock = !apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey.includes("YOUR_");

  if (isMock) {
    console.log("// MOCK: Gemini extraction (No API key)");
    const fallbackObj = getSmartFallback(text);
    fallbackObj.embedding = await getEmbedding(text, apiKey);
    return res.json(fallbackObj);
  }

  try {
    const fallbackObj = getSmartFallback(text);

    const promptText = `Analyze this citizen report for the ${constituency} constituency:
"${text}"

Extract structured facts carefully:
1. issue_type: "water", "road", "health", or "education".
2. ward: Must be "Ward 3", "Ward 7", or "Ward 9".
3. urgency: "critical" if severe/emergency/pothole/broken, else "moderate" or "low".
4. affected_group: "residents", "commuters", "patients", or "students".

Return JSON ONLY in this format:
{
  "issue_type": "water" | "road" | "health" | "education",
  "ward": "Ward 3" | "Ward 7" | "Ward 9",
  "urgency": "low" | "moderate" | "critical",
  "affected_group": "residents" | "commuters" | "patients" | "students"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error("🔴 Google Gemini API Error:", data.error.message);
      return res.json({
        ...fallbackObj,
        apiError: data.error.message
      });
    }

    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const extracted = JSON.parse(resultText);
    const finalWard = extracted.ward || fallbackObj.location.ward;
    const finalType = extracted.issue_type || fallbackObj.issue_type;
    const prefix = constituency === 'lucknow' ? 'LKO' : constituency === 'amethi' ? 'AME' : 'VAR';
    
    const embedding = await getEmbedding(text, apiKey);

    res.json({
      isMock: false,
      issue_type: finalType,
      location: { lat: 28.6200, lng: 77.2150, ward: finalWard },
      urgency: extracted.urgency || fallbackObj.urgency,
      affected_group: extracted.affected_group || fallbackObj.affected_group,
      cluster_id: `CL_${prefix}_${finalWard.replace(/\s+/g, '')}_${finalType.toUpperCase()}`,
      embedding
    });
  } catch (err) {
    console.error("Gemini Extraction Error:", err);
    const fallbackObj = getSmartFallback(text);
    fallbackObj.embedding = await getEmbedding(text, process.env.VITE_GEMINI_API_KEY);
    res.json(fallbackObj);
  }
});

app.post('/api/generate-report', async (req, res) => {
  try {
    // We expect the frontend to send the HTML content or a specific layout instruction.
    // For simplicity, we can render a simple HTML page based on the data sent.
    const { reportData } = req.body;
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    
    // Simple HTML template for the report
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #0f172a; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;}
            .section { margin-bottom: 30px; }
            .kpi { display: inline-block; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-right: 15px; width: 150px;}
            .kpi-title { font-size: 12px; color: #64748b; text-transform: uppercase; }
            .kpi-val { font-size: 24px; font-weight: bold; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background-color: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #64748b;}
            .urgent { color: #ef4444; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>JanMitra AI — Constituency Report</h1>
          <p style="color: #64748b;">Generated on: ${new Date().toLocaleString()}</p>
          
          <div class="section">
            <h2>Overview</h2>
            <div class="kpi">
              <div class="kpi-title">Total Complaints</div>
              <div class="kpi-val">${reportData.totalComplaints}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Active Issues</div>
              <div class="kpi-val">${reportData.activeIssues}</div>
            </div>
            <div class="kpi">
              <div class="kpi-title">Available Budget</div>
              <div class="kpi-val">₹${(reportData.budget / 100000).toFixed(1)}L</div>
            </div>
          </div>
          
          <div class="section">
            <h2>Top Recommended Projects</h2>
            <table>
              <thead>
                <tr>
                  <th>Project Type</th>
                  <th>Ward</th>
                  <th>Need Score</th>
                  <th>Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.topProjects.map(p => `
                  <tr>
                    <td style="text-transform: capitalize;">${p.issue_type}</td>
                    <td>${p.ward}</td>
                    <td class="${p.priority_score > 7 ? 'urgent' : ''}">${p.priority_score.toFixed(2)}</td>
                    <td>₹${(p.estimated_cost_inr / 100000).toFixed(1)}L</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    await browser.close();
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="janmitra-report.pdf"'
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Endpoint: Live CSTE State
app.post('/api/cste-state', async (req, res) => {
  try {
    const { ward, clusters: clientClusters } = req.body;
    let clusters = clientClusters || [];

    // If no client clusters provided and we have admin access, read from DB
    if (clusters.length === 0 && dbAdmin) {
      const snap = await dbAdmin.collection('clusters').get();
      snap.forEach(doc => {
        clusters.push({ id: doc.id, ...doc.data() });
      });
      if (ward) {
        clusters = clusters.filter(c => c.ward === ward);
      }
    }

    // Dynamic computation rules
    let healthClusters = clusters.filter(c => c.issue_type === 'health');
    let educationClusters = clusters.filter(c => c.issue_type === 'education');
    let waterClusters = clusters.filter(c => c.issue_type === 'water');

    let waterCoverage = 80;
    if (waterClusters.length > 0) {
      const avgRecurrenceWater = waterClusters.reduce((sum, c) => sum + (c.recurrence_score || 0.5), 0) / waterClusters.length;
      waterCoverage = Math.max(0, 100 - (avgRecurrenceWater * 50));
    }

    let facilityDistance = 4.0;
    const facilityClusters = [...healthClusters, ...educationClusters];
    if (facilityClusters.length > 0) {
      facilityDistance = facilityClusters.reduce((sum, c) => sum + (c.nearest_facility_km || 4.0), 0) / facilityClusters.length;
    }

    let schoolAttendance = 75;
    if (educationClusters.length > 0) {
      const sumCountEdu = educationClusters.reduce((sum, c) => sum + (c.complaint_count || 10), 0);
      schoolAttendance = Math.max(0, 100 - ((sumCountEdu * 1000) / 120000 * 30));
    }

    let healthcareAccess = 70;
    if (healthClusters.length > 0) {
      const avgRecurrenceHealth = healthClusters.reduce((sum, c) => sum + (c.recurrence_score || 0.5), 0) / healthClusters.length;
      healthcareAccess = Math.max(0, 100 - (avgRecurrenceHealth * 60));
    }

    res.json({
      ward: ward || 'All',
      waterCoverage: parseFloat(waterCoverage.toFixed(1)),
      facilityDistance: parseFloat(facilityDistance.toFixed(2)),
      schoolAttendance: parseFloat(schoolAttendance.toFixed(1)),
      healthcareAccess: parseFloat(healthcareAccess.toFixed(1)),
      computedAt: Date.now(),
      source: dbAdmin && !clientClusters ? 'firestore' : 'client-provided'
    });
  } catch (err) {
    console.error('CSTE State Error:', err);
    res.status(500).json({ error: 'Failed to compute CSTE state' });
  }
});

// Endpoint: Save CSTE Snapshot
app.post('/api/save-cste-snapshot', async (req, res) => {
  try {
    const { budget_inr, funded_cluster_ids, base_state, future_state, constituency_id } = req.body;

    const snapshotDoc = {
      timestamp: new Date().toISOString(),
      budget_inr,
      funded_cluster_ids,
      base_state,
      future_state,
      constituency_id: constituency_id || 'varanasi'
    };

    if (dbAdmin) {
      const docRef = await dbAdmin.collection('cste_snapshots').add(snapshotDoc);
      res.json({ success: true, id: docRef.id });
    } else {
      console.log('// MOCK: Saving snapshot (no DB Admin)', snapshotDoc);
      res.json({ success: true, mock: true, data: snapshotDoc });
    }
  } catch (err) {
    console.error('Save Snapshot Error:', err);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// Endpoint: Geocode Ward
app.get('/api/geocode-ward', async (req, res) => {
  try {
    const { ward, constituency = 'Varanasi' } = req.query;
    if (!ward) return res.status(400).json({ error: 'Ward is required' });

    const apiKey = process.env.VITE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    const isMock = !apiKey || apiKey.includes('YOUR_');

    if (isMock) {
      // Mock coordinates
      return res.json({ lat: 28.610, lng: 77.210, mock: true });
    }

    // 1. Check cache
    let docRef;
    if (dbAdmin) {
      const cacheQuery = await dbAdmin.collection('ward_coordinates')
        .where('ward', '==', ward)
        .where('constituency', '==', constituency)
        .limit(1)
        .get();

      if (!cacheQuery.empty) {
        const data = cacheQuery.docs[0].data();
        return res.json({ lat: data.lat, lng: data.lng, cached: true });
      }
    }

    // 2. Fetch from Google
    const address = `${ward}, ${constituency}, India`;
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      
      // 3. Save to cache
      if (dbAdmin) {
        await dbAdmin.collection('ward_coordinates').add({
          ward,
          constituency,
          lat: location.lat,
          lng: location.lng,
          timestamp: new Date().toISOString()
        });
      }

      return res.json({ lat: location.lat, lng: location.lng, source: 'google' });
    } else {
      console.error('Geocoding API Error:', data.status, data.error_message);
      return res.json({ lat: 28.610, lng: 77.210, mock: true, error: data.status });
    }
  } catch (err) {
    console.error('Geocode Error:', err);
    res.status(500).json({ error: 'Failed to geocode ward' });
  }
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
