// Gemini API integration for Explanation Card
// Strictly grounded in pre-computed cluster data per Anti-Hallucination rules

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function explainClusterPriority(cluster) {
  const isMock = !GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY";

  const evidenceBullets = [
    `Rank Position: #${cluster.rank}`,
    `Ward: ${cluster.ward}`,
    `Issue Type: ${cluster.issue_type}`,
    `Affected Population: ${cluster.affected_population?.toLocaleString()} residents`,
    `Service Gap (Nearest Facility): ${cluster.nearest_facility_km} km`,
    `Historical Complaints Logged: ${cluster.complaint_count}`,
    `Recurrence Score: ${cluster.recurrence_score}`,
    `Estimated Cost: ₹${(cluster.estimated_cost_inr / 100000).toFixed(1)} Lakhs`,
    `Priority Score: ${cluster.priority_score?.toFixed(3)}`,
    ...(cluster.public_evidence || [])
  ];

  // Exact prompt template required by Master Build Prompt
  const promptText = `You are an executive assistant to a Member of Parliament reviewing constituency development priorities.
Here are the pre-computed facts and evidence for a priority project:

${evidenceBullets.map((b) => `- ${b}`).join('\n')}

Narrate these facts in plain language. Do not calculate, estimate, or add any number not provided above.`;

  if (isMock) {
    console.log("// MOCK: Gemini API key not set or placeholder. Returning grounded mock narration.");
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      isMock: true,
      narrative: [
        `Rank #${cluster.rank} Priority in ${cluster.ward}: Directly addresses ${cluster.issue_type} deficits affecting ${cluster.affected_population?.toLocaleString()} residents.`,
        `High Service Gap: Nearest facility is ${cluster.nearest_facility_km} km away, substantiated by ${cluster.complaint_count} registered citizen complaints and public data (${cluster.public_evidence?.[0] || 'high recurrence'}).`,
        `Cost-Effective Impact: Budget requirement of ₹${(cluster.estimated_cost_inr / 100000).toFixed(1)}L yields an optimal priority score of ${cluster.priority_score?.toFixed(3)}.`
      ],
      promptUsed: promptText
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      }
    );

    const data = await response.json();
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("Invalid response structure from Gemini API");
    }

    // Split generated text into clean bullet points
    const lines = generatedText
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.\s]+/, '').trim())
      .filter((l) => l.length > 0);

    return {
      isMock: false,
      narrative: lines.length > 0 ? lines : [generatedText],
      promptUsed: promptText
    };
  } catch (error) {
    console.error("Gemini API call failed, falling back to grounded mock:", error);
    return {
      isMock: true,
      narrative: [
        `Rank #${cluster.rank} Priority in ${cluster.ward}: Serves ${cluster.affected_population?.toLocaleString()} residents with urgent ${cluster.issue_type} infrastructure needs.`,
        `Service Gap: Facility distance is ${cluster.nearest_facility_km} km with ${cluster.complaint_count} logged complaints.`,
        `Estimated Budget: ₹${(cluster.estimated_cost_inr / 100000).toFixed(1)}L with a score of ${cluster.priority_score?.toFixed(3)}.`
      ],
      error: error.message,
      promptUsed: promptText
    };
  }
}
