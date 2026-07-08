/**
 * Constituency State Transition Engine (CSTE)
 * Simulates the "before" and "after" state of the constituency based on the funded portfolio.
 * Formula upgraded to use multi-factor data mapping dynamically from live clusters.
 */

const WARD_TOTAL_POPULATION = 120000; // Estimated total population for the constituency

/**
 * Computes the baseline constituency state dynamically from current live clusters.
 */
export function computeBaselineFromClusters(clusters) {
  if (!clusters || clusters.length === 0) {
    return {
      facilityDistance: 5.0,
      schoolAttendance: 50,
      waterCoverage: 50,
      healthcareAccess: 50
    };
  }

  let healthClusters = [];
  let educationClusters = [];
  let waterClusters = [];

  for (const c of clusters) {
    if (c.issue_type === 'health') healthClusters.push(c);
    else if (c.issue_type === 'education') educationClusters.push(c);
    else if (c.issue_type === 'water') waterClusters.push(c);
  }

  // Water Coverage: 100 - (avgRecurrenceScore_water * 50)
  let waterCoverage = 80; // Safe default if no water complaints
  if (waterClusters.length > 0) {
    const avgRecurrenceWater = waterClusters.reduce((sum, c) => sum + (c.recurrence_score || 0.5), 0) / waterClusters.length;
    waterCoverage = Math.max(0, 100 - (avgRecurrenceWater * 50));
  }

  // Facility Distance: average nearest_facility_km for health + education
  let facilityDistance = 4.0;
  const facilityClusters = [...healthClusters, ...educationClusters];
  if (facilityClusters.length > 0) {
    const avgDist = facilityClusters.reduce((sum, c) => sum + (c.nearest_facility_km || 4.0), 0) / facilityClusters.length;
    facilityDistance = avgDist;
  }

  // School Attendance: 100 - (sumComplaintCount_education / WARD_TOTAL_POPULATION * 30)
  let schoolAttendance = 75;
  if (educationClusters.length > 0) {
    const sumCountEdu = educationClusters.reduce((sum, c) => sum + (c.complaint_count || 10), 0);
    // Multiply by a factor so small sample numbers move the needle for the demo
    schoolAttendance = Math.max(0, 100 - ((sumCountEdu * 1000) / WARD_TOTAL_POPULATION * 30));
  }

  // Healthcare Access: 100 - (avgRecurrenceScore_health * 60)
  let healthcareAccess = 70;
  if (healthClusters.length > 0) {
    const avgRecurrenceHealth = healthClusters.reduce((sum, c) => sum + (c.recurrence_score || 0.5), 0) / healthClusters.length;
    healthcareAccess = Math.max(0, 100 - (avgRecurrenceHealth * 60));
  }

  return {
    facilityDistance: parseFloat(facilityDistance.toFixed(2)),
    schoolAttendance: parseFloat(schoolAttendance.toFixed(1)),
    waterCoverage: parseFloat(waterCoverage.toFixed(1)),
    healthcareAccess: parseFloat(healthcareAccess.toFixed(1))
  };
}

export function simulateCSTE(fundedClusters, allClusters) {
  // Base State (computed dynamically)
  const baseState = computeBaselineFromClusters(allClusters);
  
  // Future State (starts as baseline, gets modified by projects)
  const futureState = { ...baseState };

  let roadConnectivityBonus = 0;

  // First pass: Calculate road improvements which act as multipliers
  (fundedClusters || []).forEach(cluster => {
    if (cluster.issue_type === 'road') {
      const populationRatio = (cluster.affected_population || 1000) / WARD_TOTAL_POPULATION;
      const recurrenceFactor = cluster.recurrence_score || 0.5;
      roadConnectivityBonus += (5 * populationRatio * recurrenceFactor);
      
      futureState.facilityDistance = Math.max(0, futureState.facilityDistance - (0.5 * recurrenceFactor));
    }
  });

  // Second pass: Calculate domain-specific improvements
  (fundedClusters || []).forEach(cluster => {
    const populationRatio = (cluster.affected_population || 1000) / WARD_TOTAL_POPULATION;
    const recurrenceFactor = cluster.recurrence_score || 0.5;
    
    switch(cluster.issue_type) {
      case 'education':
        const baseAttendanceImpr = 25 * populationRatio * recurrenceFactor;
        futureState.schoolAttendance = Math.min(100, futureState.schoolAttendance + baseAttendanceImpr + roadConnectivityBonus);
        break;
      case 'water':
        const waterImpr = 200 * populationRatio * recurrenceFactor;
        futureState.waterCoverage = Math.min(100, futureState.waterCoverage + waterImpr);
        break;
      case 'health':
        const healthImpr = 150 * populationRatio * recurrenceFactor;
        futureState.healthcareAccess = Math.min(100, futureState.healthcareAccess + healthImpr + (roadConnectivityBonus * 1.5));
        futureState.facilityDistance = Math.max(0, futureState.facilityDistance - (0.3 * recurrenceFactor));
        break;
      default:
        break;
    }
  });

  // Round values for UI presentation
  futureState.facilityDistance = parseFloat(futureState.facilityDistance.toFixed(2));
  futureState.schoolAttendance = parseFloat(futureState.schoolAttendance.toFixed(1));
  futureState.waterCoverage = parseFloat(futureState.waterCoverage.toFixed(1));
  futureState.healthcareAccess = parseFloat(futureState.healthcareAccess.toFixed(1));

  return { baseState, futureState, computedAt: Date.now() };
}
