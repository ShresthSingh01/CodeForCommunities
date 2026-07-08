// Seed data for JanMitra AI MVP
// 3 Wards: Ward 3, Ward 7, Ward 9
// 4 Issue Types: water, road, health, education

const WARD_3_CENTER = { lat: 28.6125, lng: 77.2125 };
const WARD_7_CENTER = { lat: 28.6175, lng: 77.2175 };
const WARD_9_CENTER = { lat: 28.6025, lng: 77.2025 };

// Helper to generate jittered coords around a center
const jitter = (center, maxOffset = 0.005) => ({
  lat: center.lat + (Math.random() - 0.5) * maxOffset,
  lng: center.lng + (Math.random() - 0.5) * maxOffset,
});

export const COMPLAINTS = [
  // Ward 7 - Water Issue (Designed to be #1 priority)
  { id: "C001", raw_text: "No water in our colony for 3 days.", language: "en", extracted: { issue_type: "water", location: { ...jitter(WARD_7_CENTER), ward: "Ward 7" }, urgency: "critical", affected_group: "residents" }, cluster_id: "CL_W7_WATER", timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "C002", raw_text: "पानी नहीं आ रहा है, टैंकर भी नहीं है", language: "hi", extracted: { issue_type: "water", location: { ...jitter(WARD_7_CENTER), ward: "Ward 7" }, urgency: "critical", affected_group: "residents" }, cluster_id: "CL_W7_WATER", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "C003", raw_text: "Need water tanker urgently at sector 4.", language: "en", extracted: { issue_type: "water", location: { ...jitter(WARD_7_CENTER), ward: "Ward 7" }, urgency: "critical", affected_group: "residents" }, cluster_id: "CL_W7_WATER", timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "C004", raw_text: "Please restore water supply.", language: "en", extracted: { issue_type: "water", location: { ...jitter(WARD_7_CENTER), ward: "Ward 7" }, urgency: "moderate", affected_group: "residents" }, cluster_id: "CL_W7_WATER", timestamp: new Date(Date.now() - 3600000 * 12).toISOString() },

  // Ward 3 - Road Issue
  { id: "C005", raw_text: "Huge pothole near the main market.", language: "en", extracted: { issue_type: "road", location: { ...jitter(WARD_3_CENTER), ward: "Ward 3" }, urgency: "moderate", affected_group: "commuters" }, cluster_id: "CL_W3_ROAD", timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "C006", raw_text: "सड़क बहुत खराब है, एक्सीडेंट हो रहे हैं", language: "hi", extracted: { issue_type: "road", location: { ...jitter(WARD_3_CENTER), ward: "Ward 3" }, urgency: "critical", affected_group: "commuters" }, cluster_id: "CL_W3_ROAD", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },

  // Ward 9 - Health Issue
  { id: "C007", raw_text: "Local dispensary is closed for a week.", language: "en", extracted: { issue_type: "health", location: { ...jitter(WARD_9_CENTER), ward: "Ward 9" }, urgency: "critical", affected_group: "patients" }, cluster_id: "CL_W9_HEALTH", timestamp: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "C008", raw_text: "No doctor available at the clinic.", language: "en", extracted: { issue_type: "health", location: { ...jitter(WARD_9_CENTER), ward: "Ward 9" }, urgency: "moderate", affected_group: "patients" }, cluster_id: "CL_W9_HEALTH", timestamp: new Date(Date.now() - 86400000 * 4).toISOString() },

  // Ward 3 - Education Issue
  { id: "C009", raw_text: "School roof is leaking.", language: "en", extracted: { issue_type: "education", location: { ...jitter(WARD_3_CENTER), ward: "Ward 3" }, urgency: "moderate", affected_group: "students" }, cluster_id: "CL_W3_EDU", timestamp: new Date(Date.now() - 86400000 * 10).toISOString() },
  
  // Ward 7 - Road Issue
  { id: "C010", raw_text: "Streetlight not working on main road.", language: "en", extracted: { issue_type: "road", location: { ...jitter(WARD_7_CENTER), ward: "Ward 7" }, urgency: "low", affected_group: "pedestrians" }, cluster_id: "CL_W7_ROAD", timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: "C011", raw_text: "Road dug up and left open.", language: "en", extracted: { issue_type: "road", location: { ...jitter(WARD_7_CENTER), ward: "Ward 7" }, urgency: "moderate", affected_group: "residents" }, cluster_id: "CL_W7_ROAD", timestamp: new Date(Date.now() - 86400000 * 15).toISOString() },

  // Ward 9 - Water Issue
  { id: "C012", raw_text: "Water pressure is very low.", language: "en", extracted: { issue_type: "water", location: { ...jitter(WARD_9_CENTER), ward: "Ward 9" }, urgency: "low", affected_group: "residents" }, cluster_id: "CL_W9_WATER", timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
  
  // Additional filler complaints to reach 15
  { id: "C013", raw_text: "Garbage blocking the drain.", language: "en", extracted: { issue_type: "health", location: { ...jitter(WARD_3_CENTER), ward: "Ward 3" }, urgency: "moderate", affected_group: "residents" }, cluster_id: "CL_W3_HEALTH", timestamp: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "C014", raw_text: "Primary school needs benches.", language: "en", extracted: { issue_type: "education", location: { ...jitter(WARD_9_CENTER), ward: "Ward 9" }, urgency: "low", affected_group: "students" }, cluster_id: "CL_W9_EDU", timestamp: new Date(Date.now() - 86400000 * 20).toISOString() },
  { id: "C015", raw_text: "Water pipe burst.", language: "en", extracted: { issue_type: "water", location: { ...jitter(WARD_7_CENTER), ward: "Ward 7" }, urgency: "critical", affected_group: "residents" }, cluster_id: "CL_W7_WATER", timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
];

export const CLUSTERS = [
  // Deliberately constructed so CL_W7_WATER has the highest ImpactPerRupee
  {
    id: "CL_W7_WATER",
    issue_type: "water",
    ward: "Ward 7",
    location: WARD_7_CENTER,
    complaint_count: 42, // Inflated beyond raw list to show history
    recurrence_score: 0.85,
    affected_population: 2450, // High population
    nearest_facility_km: 3.2, // High gap
    public_evidence: [
      "Pipeline burst reported by Jal Board 3 days ago",
      "Summer demand peak currently +20% above average",
      "No alternative tanker route available"
    ],
    estimated_cost_inr: 500000, // Very low cost to fix a pipe (₹5L)
    // Priority Score will be high, cost is low -> #1 ImpactPerRupee
  },
  {
    id: "CL_W3_ROAD",
    issue_type: "road",
    ward: "Ward 3",
    location: WARD_3_CENTER,
    complaint_count: 18,
    recurrence_score: 0.60,
    affected_population: 1200,
    nearest_facility_km: 0.5,
    public_evidence: [
      "Traffic slows by 40% during peak hours here",
      "Monsoon damage logged in municipal survey"
    ],
    estimated_cost_inr: 2500000, // Costly repair (₹25L)
  },
  {
    id: "CL_W9_HEALTH",
    issue_type: "health",
    ward: "Ward 9",
    location: WARD_9_CENTER,
    complaint_count: 27,
    recurrence_score: 0.70,
    affected_population: 3100, // Very high population
    nearest_facility_km: 4.5, // High gap
    public_evidence: [
      "Nearest operational clinic is overcrowded by 150%",
      "Dengue cases rising in adjacent blocks"
    ],
    estimated_cost_inr: 4500000, // Expensive to staff/supply (₹45L)
  },
  {
    id: "CL_W3_EDU",
    issue_type: "education",
    ward: "Ward 3",
    location: WARD_3_CENTER,
    complaint_count: 8,
    recurrence_score: 0.40,
    affected_population: 850,
    nearest_facility_km: 1.2,
    public_evidence: [
      "School building is 30 years old",
      "Attendance dropped 10% during monsoons"
    ],
    estimated_cost_inr: 1500000, // ₹15L
  },
  {
    id: "CL_W7_ROAD",
    issue_type: "road",
    ward: "Ward 7",
    location: { lat: WARD_7_CENTER.lat + 0.01, lng: WARD_7_CENTER.lng },
    complaint_count: 12,
    recurrence_score: 0.50,
    affected_population: 900,
    nearest_facility_km: 0.8,
    public_evidence: [
      "Pending contractor clearance for 3 months"
    ],
    estimated_cost_inr: 3000000, // ₹30L
  },
  {
    id: "CL_W9_WATER",
    issue_type: "water",
    ward: "Ward 9",
    location: { lat: WARD_9_CENTER.lat - 0.01, lng: WARD_9_CENTER.lng },
    complaint_count: 15,
    recurrence_score: 0.45,
    affected_population: 1100,
    nearest_facility_km: 1.5,
    public_evidence: [
      "Old booster pump operating at 50% capacity"
    ],
    estimated_cost_inr: 1200000, // ₹12L
  },
  {
    id: "CL_W3_HEALTH",
    issue_type: "health",
    ward: "Ward 3",
    location: { lat: WARD_3_CENTER.lat + 0.005, lng: WARD_3_CENTER.lng - 0.005 },
    complaint_count: 22,
    recurrence_score: 0.80,
    affected_population: 1500,
    nearest_facility_km: 2.1,
    public_evidence: [
      "Drainage blockages correlate with recent rainfall"
    ],
    estimated_cost_inr: 1000000, // ₹10L
  },
  {
    id: "CL_W9_EDU",
    issue_type: "education",
    ward: "Ward 9",
    location: { lat: WARD_9_CENTER.lat + 0.015, lng: WARD_9_CENTER.lng },
    complaint_count: 5,
    recurrence_score: 0.20,
    affected_population: 600,
    nearest_facility_km: 0.9,
    public_evidence: [
      "Budget allocated but disbursement delayed"
    ],
  }
].map(c => ({ ...c, constituency_id: 'varanasi', id: `CL_VAR_${c.id.split('CL_')[1]}` }));

export const LUCKNOW_CLUSTERS = [
  {
    id: "CL_LKO_W2_WATER",
    issue_type: "water",
    ward: "Ward 2",
    location: { lat: 26.8467, lng: 80.9462 },
    complaint_count: 55,
    recurrence_score: 0.9,
    affected_population: 5000,
    nearest_facility_km: 4.0,
    public_evidence: ["Major pipeline leak in Hazratganj"],
    estimated_cost_inr: 800000,
    constituency_id: "lucknow"
  },
  {
    id: "CL_LKO_W5_ROAD",
    issue_type: "road",
    ward: "Ward 5",
    location: { lat: 26.8500, lng: 80.9500 },
    complaint_count: 30,
    recurrence_score: 0.7,
    affected_population: 3000,
    nearest_facility_km: 1.0,
    public_evidence: ["Gomti Nagar main road heavily damaged"],
    estimated_cost_inr: 4500000,
    constituency_id: "lucknow"
  }
];

export const ALL_CLUSTERS = [...CLUSTERS, ...LUCKNOW_CLUSTERS];
