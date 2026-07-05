import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Endpoint: AI Extract complaint details from raw citizen text
app.post('/api/extract-complaint', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const isMock = !apiKey || apiKey === "YOUR_GEMINI_API_KEY";

  if (isMock) {
    console.log("// MOCK: Gemini extraction (No API key)");
    const lower = text.toLowerCase();
    let issue_type = "water";
    if (lower.includes("road") || lower.includes("pothole") || lower.includes("सड़क")) issue_type = "road";
    else if (lower.includes("hospital") || lower.includes("doctor") || lower.includes("clinic") || lower.includes("health") || lower.includes("अस्पताल")) issue_type = "health";
    else if (lower.includes("school") || lower.includes("teacher") || lower.includes("bench") || lower.includes("स्कूल")) issue_type = "education";

    return res.json({
      isMock: true,
      issue_type,
      location: { lat: 28.6200, lng: 77.2150, ward: "Ward 7" },
      urgency: lower.includes("urgent") || lower.includes("emergency") || lower.includes("नहीं") ? "critical" : "moderate",
      affected_group: "residents",
      cluster_id: `CL_W7_${issue_type.toUpperCase()}`
    });
  }

  try {
    const promptText = `Extract structured complaint facts from this citizen report:
"${text}"

Return JSON ONLY in this format:
{
  "issue_type": "water" | "road" | "health" | "education",
  "ward": "Ward 3" | "Ward 7" | "Ward 9",
  "urgency": "low" | "moderate" | "critical",
  "affected_group": "residents" | "commuters" | "patients" | "students"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const extracted = JSON.parse(resultText);

    res.json({
      isMock: false,
      issue_type: extracted.issue_type || "water",
      location: { lat: 28.6200, lng: 77.2150, ward: extracted.ward || "Ward 7" },
      urgency: extracted.urgency || "moderate",
      affected_group: extracted.affected_group || "residents",
      cluster_id: `CL_${(extracted.ward || 'Ward 7').replace(/\s+/g, '')}_${(extracted.issue_type || 'water').toUpperCase()}`
    });
  } catch (err) {
    console.error("Gemini Extraction Error:", err);
    res.json({
      isMock: true,
      issue_type: "water",
      location: { lat: 28.6200, lng: 77.2150, ward: "Ward 7" },
      urgency: "moderate",
      affected_group: "residents",
      cluster_id: "CL_W7_WATER"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
