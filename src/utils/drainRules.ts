import { AlertLevel, AreaWeather, ConsequencePrediction, DrainRecord, MaintenanceEvent, PredictiveAlert, SortArrangement } from '../types/drain';

/**
 * Determine alert level based on water level (%) and water flow rate (m³/s).
 * High alert triggers when water level is critically high or choked (low flow with high level).
 */
export function calculateAlertLevel(waterLevelPercent: number, waterFlowM3s: number): AlertLevel {
  if (waterLevelPercent >= 80 || (waterLevelPercent >= 65 && waterFlowM3s <= 0.25) || (waterLevelPercent >= 75 && waterFlowM3s <= 0.45)) {
    return 'high';
  }
  if (waterLevelPercent >= 50 || waterFlowM3s <= 0.35) {
    return 'medium';
  }
  return 'normal';
}

/**
 * Calculates a continuous alert score (higher = more dangerous bottleneck).
 * High water level with restricted/near-zero flow gives the highest score.
 */
export function calculateAlertScore(waterLevelPercent: number, waterFlowM3s: number): number {
  const levelWeight = waterLevelPercent * 1.2;
  const flowPenalty = Math.max(0, (1.5 - Math.max(0, waterFlowM3s)) * 30);
  return levelWeight + flowPenalty;
}

/**
 * Arranges drains according to the contractor's selected arrangement mode.
 * Default is 'high-to-normal' which satisfies Feature 3:
 * "arrange the drain with high alert to normal level based on water level and water flow"
 */
export function arrangeDrains(drains: DrainRecord[], arrangement: SortArrangement): DrainRecord[] {
  const alertRank: Record<AlertLevel, number> = {
    high: 3,
    medium: 2,
    normal: 1,
  };

  return [...drains].sort((a, b) => {
    const levelA = calculateAlertLevel(a.waterLevelPercent, a.waterFlowM3s);
    const levelB = calculateAlertLevel(b.waterLevelPercent, b.waterFlowM3s);
    const scoreA = calculateAlertScore(a.waterLevelPercent, a.waterFlowM3s);
    const scoreB = calculateAlertScore(b.waterLevelPercent, b.waterFlowM3s);

    switch (arrangement) {
      case 'high-to-normal': {
        if (alertRank[levelA] !== alertRank[levelB]) {
          return alertRank[levelB] - alertRank[levelA]; // High (3) first, Normal (1) last
        }
        return scoreB - scoreA; // Within same alert band, highest severity score first
      }
      case 'normal-to-high': {
        if (alertRank[levelA] !== alertRank[levelB]) {
          return alertRank[levelA] - alertRank[levelB];
        }
        return scoreA - scoreB;
      }
      case 'water-level-desc':
        return b.waterLevelPercent - a.waterLevelPercent;
      case 'water-flow-asc':
        return a.waterFlowM3s - b.waterFlowM3s;
      case 'price-desc':
        return b.contractPriceRM - a.contractPriceRM;
      case 'scheduled-first': {
        const hasA = a.scheduledMaintenance ? 1 : 0;
        const hasB = b.scheduledMaintenance ? 1 : 0;
        if (hasA !== hasB) return hasB - hasA;
        return (alertRank[levelB] || 0) - (alertRank[levelA] || 0);
      }
      default:
        return 0;
    }
  });
}

/**
 * Format date & time strings into readable Malaysian municipal schedule format.
 */
export function formatScheduledDateTime(dateStr: string, timeStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, min] = timeStr.split(':').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const displayMin = min < 10 ? `0${min}` : min;
    return `${day} ${months[month - 1]} ${year}, ${displayHour}:${displayMin} ${period}`;
  } catch {
    return `${dateStr} ${timeStr}`;
  }
}

/**
 * Dynamically predicts the catastrophic consequence if a drain is left unaddressed.
 */
export function generateConsequencePrediction(
  drain: Pick<DrainRecord, 'name' | 'kolejZone' | 'waterLevelPercent' | 'waterFlowM3s' | 'contractPriceRM'>
): ConsequencePrediction {
  const level = drain.waterLevelPercent;
  const flow = drain.waterFlowM3s;
  const alert = calculateAlertLevel(level, flow);

  // Remaining capacity calculation: remaining % divided by fill rate
  let minutesToOverflow = 180;
  if (level >= 90) {
    minutesToOverflow = Math.max(12, Math.round((100 - level) * 4 + flow * 5));
  } else if (level >= 80) {
    minutesToOverflow = Math.max(25, Math.round((100 - level) * 3.5));
  } else if (level >= 65) {
    minutesToOverflow = Math.max(55, Math.round((100 - level) * 3));
  } else {
    minutesToOverflow = Math.max(120, Math.round((100 - level) * 4));
  }

  if (alert === 'high') {
    return {
      timeToOverflowMinutes: minutesToOverflow,
      floodRiskLevel: level >= 90 ? 'Catastrophic' : 'Severe',
      primaryImpactSummary: `Monsoon storm will trigger immediate overflow at ${drain.kolejZone}. Flash flood will inundate hostel ground floors, car parks, and primary ingress roads.`,
      affectedFacilities: [
        `${drain.kolejZone} Ground Block A & B`,
        'Main Student Access Road (Jalan Kolej)',
        'Local PBT Electrical Substation 4B',
        'Cafeteria Storage & Drainage Sump'
      ],
      estimatedDamageRM: Math.round(drain.contractPriceRM * 18 + level * 350),
      municipalPenaltyRM: 5000,
      recommendedAction: 'Immediate deployment: High-pressure water jetting unit + backhoe silt grabber within 30 minutes.',
      weatherRiskFactor: 'MetMalaysia thunderstorm advisory active: heavy 45mm/hr rain expected within 40 minutes.'
    };
  }

  if (alert === 'medium') {
    return {
      timeToOverflowMinutes: minutesToOverflow,
      floodRiskLevel: 'Moderate',
      primaryImpactSummary: `Restricted water flow will cause gradual perimeter drain ponding and sidewalk waterlogging at ${drain.kolejZone} during sustained rainfall.`,
      affectedFacilities: [
        `${drain.kolejZone} Pedestrian Walkway`,
        'Sewer manhole overflow zone',
        'Surau perimeter drain'
      ],
      estimatedDamageRM: Math.round(drain.contractPriceRM * 5 + level * 120),
      municipalPenaltyRM: 1500,
      recommendedAction: 'Schedule priority clearance within 4 hours: Manual screen rake and sediment vacuuming.',
      weatherRiskFactor: 'Scattered afternoon showers forecast in local sector.'
    };
  }

  return {
    timeToOverflowMinutes: minutesToOverflow,
    floodRiskLevel: 'Low',
    primaryImpactSummary: `Water flow is moving steadily with acceptable hydraulic clearance at ${drain.kolejZone}. No immediate flood hazard.`,
    affectedFacilities: ['Normal drainage canal corridor'],
    estimatedDamageRM: 0,
    municipalPenaltyRM: 0,
    recommendedAction: 'Maintain standard routine PBT maintenance schedule (bi-weekly inspection).',
    weatherRiskFactor: 'Clear skies, normal catchment runoff conditions.'
  };
}

/**
 * Rule: Find any high alert drain that the Person In Charge (PIC) has NOT noticed / acknowledged.
 */
export function getUnnoticedHighAlertDrains(drains: DrainRecord[]): DrainRecord[] {
  return drains.filter(d => {
    const alertLevel = calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s);
    return alertLevel === 'high' && !d.acknowledgedByPic;
  });
}

/**
 * Generates deterministic 24-hour historical telemetry water level trend.
 * Returns 13 points (every 2 hours: -24h to 0h/now).
 * The final point strictly equals currentLevel.
 */
export function generate24hTrendData(currentLevel: number, alertLevel: AlertLevel): number[] {
  const pointsCount = 13;
  const result: number[] = [];

  if (alertLevel === 'high') {
    const baseline = Math.max(25, Math.round(currentLevel * 0.42));
    for (let i = 0; i < pointsCount - 1; i++) {
      const progress = i / (pointsCount - 1);
      const surgeFactor = Math.pow(progress, 2.2);
      const noise = ((i % 3) - 1) * 2;
      const val = Math.min(
        100,
        Math.max(15, Math.round(baseline + (currentLevel - baseline) * surgeFactor + noise))
      );
      result.push(val);
    }
  } else if (alertLevel === 'medium') {
    const baseline = Math.max(20, Math.round(currentLevel * 0.55));
    for (let i = 0; i < pointsCount - 1; i++) {
      const progress = i / (pointsCount - 1);
      const surgeFactor = Math.pow(progress, 1.4);
      const noise = i % 2 === 0 ? 1 : -1;
      const val = Math.min(
        95,
        Math.max(10, Math.round(baseline + (currentLevel - baseline) * surgeFactor + noise))
      );
      result.push(val);
    }
  } else {
    const peak = Math.min(50, Math.round(currentLevel * 1.4 + 6));
    for (let i = 0; i < pointsCount - 1; i++) {
      const progress = i / (pointsCount - 1);
      const peakFactor = Math.sin(progress * Math.PI * 0.85);
      const val = Math.min(
        80,
        Math.max(10, Math.round(currentLevel + (peak - currentLevel) * peakFactor))
      );
      result.push(val);
    }
  }

  result.push(currentLevel);
  return result;
}

/**
 * Returns weather and rainfall diagnostics for a drain sector.
 * Directly correlates precipitation intensity to water level spikes.
 */
export function generateAreaWeather(waterLevelPercent: number, alertLevel: AlertLevel): AreaWeather {
  if (alertLevel === 'high' || waterLevelPercent >= 80) {
    const mmPerHour = Math.round(38 + (waterLevelPercent - 80) * 1.1);
    return {
      condition: waterLevelPercent >= 90 ? 'Thunderstorm' : 'Heavy Rain',
      rainfallMmPerHour: mmPerHour,
      humidityPercent: 95,
      hasActiveRain: true,
      stormAdvisory: `Heavy monsoon downpour (${mmPerHour} mm/h) directly causing active water level spike.`,
    };
  }

  if (alertLevel === 'medium' || waterLevelPercent >= 50) {
    const mmPerHour = Math.round(12 + (waterLevelPercent - 50) * 0.5);
    return {
      condition: 'Moderate Rain',
      rainfallMmPerHour: mmPerHour,
      humidityPercent: 88,
      hasActiveRain: true,
      stormAdvisory: `Moderate sustained showers (${mmPerHour} mm/h) maintaining high canal water tables.`,
    };
  }

  const isDrizzle = waterLevelPercent > 28;
  return {
    condition: isDrizzle ? 'Light Drizzle' : 'Overcast',
    rainfallMmPerHour: isDrizzle ? 3 : 0,
    humidityPercent: 74,
    hasActiveRain: isDrizzle,
    stormAdvisory: isDrizzle
      ? 'Passing light shower (3 mm/h), normal drainage capacity intact.'
      : 'Overcast skies, 0 mm/h rainfall, baseline runoff conditions.',
  };
}

/**
 * Returns the last 3 maintenance events for a specific drain location.
 */
export function generateSampleMaintenanceHistory(
  drainCode: string,
  kolejZone: string,
  picName: string,
  contractPriceRM: number
): MaintenanceEvent[] {
  return [
    {
      id: `${drainCode}-m1`,
      date: '24 Oct 2026',
      actionType: 'High-Pressure Hydro-Jetting & Sump Clean',
      contractorPIC: picName,
      costRM: Math.round(contractPriceRM * 0.8),
      notes: `Hydro-jetted 45m culvert run at ${kolejZone}. Cleared 1.8 tons of wet sediment and food packaging silt.`,
      status: 'Verified by PBT',
    },
    {
      id: `${drainCode}-m2`,
      date: '11 Oct 2026',
      actionType: 'Culvert Screen Debris Dredging',
      contractorPIC: picName,
      costRM: Math.round(contractPriceRM * 0.55),
      notes: `Extracted fallen branches, beverage bottles, and compacted foliage after thunderstorm.`,
      status: 'Completed',
    },
    {
      id: `${drainCode}-m3`,
      date: '26 Sep 2026',
      actionType: 'Routine Bi-Weekly Sluice Desiltation',
      contractorPIC: picName,
      costRM: Math.round(contractPriceRM * 0.45),
      notes: `Trimmed invasive perimeter roots and desilted concrete U-drain invert line. Free flow restored.`,
      status: 'Verified by PBT',
    },
  ];
}

/**
 * Predictive Alert Calculator:
 * Analyzes the 24h water level trend trajectory and current flow patterns.
 * Identifies drains currently not in high alert that are projected to breach
 * the 'High Alert' threshold within the next 4 hours.
 */
export function calculatePredictiveAlert(
  waterLevelPercent: number,
  waterFlowM3s: number,
  history24h?: number[]
): PredictiveAlert {
  const currentLevel = calculateAlertLevel(waterLevelPercent, waterFlowM3s);

  // If already at High Alert, it is already active critical alert
  if (currentLevel === 'high') {
    return {
      isTriggered: false,
      projectedLevelIn4h: Math.min(100, Math.round(waterLevelPercent + 4)),
      estimatedHoursUntilHigh: 0,
      hourlyRateOfRise: 0,
      riskSummary: 'Drain is already at critical High Alert capacity.',
      preemptiveAction: 'Emergency crew dispatch required immediately.',
      confidencePercent: 95,
    };
  }

  // 1. Analyze 24h trend: determine rate of rise over recent 4 to 6 hours
  let hourlyRate = 0;
  if (history24h && history24h.length >= 3) {
    // history24h has 13 points spaced 2 hours apart:
    // index 12 = 0h (now), index 10 = -4h
    const level4hAgo = history24h[history24h.length - 3];
    const delta4h = waterLevelPercent - level4hAgo;
    hourlyRate = delta4h / 4;
  } else {
    hourlyRate = waterLevelPercent > 50 ? 3.0 : 0.8;
  }

  // 2. Flow constriction factor: low flow (< 0.50 m³/s) slows discharge and accelerates ponding
  let flowConstrictionMultiplier = 1.0;
  if (waterFlowM3s <= 0.25) {
    flowConstrictionMultiplier = 1.8;
  } else if (waterFlowM3s <= 0.45) {
    flowConstrictionMultiplier = 1.45;
  } else if (waterFlowM3s <= 0.65) {
    flowConstrictionMultiplier = 1.2;
  }

  const effectiveHourlyRise = Math.max(0, hourlyRate * flowConstrictionMultiplier);

  // Projected level in 4 hours
  const projectedLevelIn4h = Math.min(
    100,
    Math.round(waterLevelPercent + effectiveHourlyRise * 4)
  );

  // High alert threshold: level >= 80, or level >= 65 with flow <= 0.25, or level >= 75 with flow <= 0.45
  const willBreachHigh =
    projectedLevelIn4h >= 80 ||
    (projectedLevelIn4h >= 65 && waterFlowM3s <= 0.25) ||
    (projectedLevelIn4h >= 75 && waterFlowM3s <= 0.45);

  const isTriggered = willBreachHigh && effectiveHourlyRise >= 0.8;

  // Estimate hours until high alert threshold is crossed
  let targetThreshold = 80;
  if (waterFlowM3s <= 0.25) targetThreshold = 65;
  else if (waterFlowM3s <= 0.45) targetThreshold = 75;

  const hoursRemaining =
    effectiveHourlyRise > 0
      ? Math.max(0.5, Math.min(4.0, (targetThreshold - waterLevelPercent) / effectiveHourlyRise))
      : 4.0;

  return {
    isTriggered,
    projectedLevelIn4h,
    estimatedHoursUntilHigh: Math.round(hoursRemaining * 10) / 10,
    hourlyRateOfRise: Math.round(effectiveHourlyRise * 10) / 10,
    riskSummary: isTriggered
      ? `24h rising trend (+${Math.round(effectiveHourlyRise * 4)}% / 4h) with restricted discharge (${waterFlowM3s.toFixed(2)} m³/s) projects High Alert breach in ~${Math.round(hoursRemaining * 10) / 10}h (reaching ${projectedLevelIn4h}%).`
      : 'Current trend and flow capacity indicate steady hydraulic drainage over the next 4 hours.',
    preemptiveAction: isTriggered
      ? 'Preemptive crew dispatch advised: Clear culvert screen & desilt invert line now to prevent flood spillover.'
      : 'Maintain normal routine monitoring schedule.',
    confidencePercent: isTriggered ? Math.min(94, Math.round(75 + effectiveHourlyRise * 4)) : 60,
  };
}




