import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// MOCK: Endpoint to extract complaint structure via Gemini
// Will be fully implemented in Phase 5
app.post('/api/extract-complaint', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // MOCK response until Gemini integration in Phase 5
  res.json({
    issue_type: "water",
    location: { lat: 0, lng: 0, ward: "Ward 7" },
    urgency: "moderate",
    affected_group: "residents"
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
