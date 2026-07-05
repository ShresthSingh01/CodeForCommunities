// Default weights for Priority Scoring Formula
// Exposed as adjustable constants per PRD

export const WEIGHTS = {
  w1: 0.25, // Urgency Severity
  w2: 0.20, // Affected Population
  w3: 0.15, // Recurrence Score
  w4: 0.20, // Service Gap (nearest facility distance)
  w5: 0.10, // Vulnerability Index
  w6: 0.30, // Estimated Cost (negative weight)
};

// Urgency mapping to numeric severity
export const URGENCY_SEVERITY = {
  critical: 1.0,
  moderate: 0.6,
  low: 0.3
};

// Simple vulnerability lookup table based on affected group
export const VULNERABILITY_INDEX = {
  patients: 1.0,
  students: 0.9,
  residents: 0.8,
  commuters: 0.6,
  pedestrians: 0.7,
  default: 0.5
};
