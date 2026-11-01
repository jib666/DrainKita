export type AlertLevel = 'high' | 'medium' | 'normal';

export interface ConsequencePrediction {
  timeToOverflowMinutes: number; // e.g. 25 minutes
  floodRiskLevel: 'Catastrophic' | 'Severe' | 'Moderate' | 'Low';
  primaryImpactSummary: string; // e.g. "Kolej hostel ground floor flooding & road submerged"
  affectedFacilities: string[]; // e.g. ["Kolej Cafeteria", "Jalan Lingkaran 2", "TNB Substation"]
  estimatedDamageRM: number; // e.g. RM 48,000
  municipalPenaltyRM: number; // PBT penalty for unhandled critical drain e.g. RM 5,000/day
  recommendedAction: string; // e.g. "Immediate deployment of 1x high-capacity vacuum jetting lorry"
  weatherRiskFactor: string; // e.g. "Heavy thunderstorm warning from MetMalaysia in 30 mins"
}

export interface AreaWeather {
  condition: 'Thunderstorm' | 'Heavy Rain' | 'Moderate Rain' | 'Light Drizzle' | 'Overcast' | 'Passing Clouds';
  rainfallMmPerHour: number;
  humidityPercent: number;
  hasActiveRain: boolean;
  stormAdvisory: string;
}

export interface MaintenanceEvent {
  id: string;
  date: string;
  actionType: string;
  contractorPIC: string;
  costRM: number;
  notes: string;
  status: 'Completed' | 'Verified by PBT';
}

export interface PredictiveAlert {
  isTriggered: boolean;
  projectedLevelIn4h: number;
  estimatedHoursUntilHigh: number; // e.g. 2.5 hours
  hourlyRateOfRise: number; // e.g. +4.2% / hour
  riskSummary: string;
  preemptiveAction: string;
  confidencePercent: number;
}

export interface ScheduledMaintenance {
  id: string;
  scheduledDate: string; // e.g. "2026-11-03"
  scheduledTime: string; // e.g. "09:30"
  formattedDateTime: string; // e.g. "3 Nov 2026, 09:30 AM"
  taskType: string; // e.g. "Routine Preventive Hydro-Jetting"
  contractorPIC: string;
  estimatedCostRM: number;
  notes?: string;
  createdAt: string;
}

export interface DrainRecord {
  id: string;
  name: string; // e.g. "Longkang Utama Kolej Tun Dr Ismail (KTDI)"
  drainCode: string; // e.g. "PBT-DR-K01"
  kolejZone: string; // e.g. "Kolej Tun Dr Ismail (KTDI)"
  sector: string; // e.g. "Zon Saliran Timur / Kolej Siswa"
  pbtCouncil: string; // e.g. "Majlis Bandaraya Iskandar Puteri / PBT"
  picName: string; // Person In Charge name e.g. "En. Ridzuan Sidek"
  picPhone: string; // e.g. "+60 12-789 4412"
  contractorName: string; // Contractor company e.g. "Aliff Teguh Bina Sdn Bhd"
  contractPriceRM: number; // Price in RM e.g. 2800
  waterLevelPercent: number; // 0 - 100%
  waterFlowM3s: number; // cubic meters per second (0.02 to 2.50)
  drainWidthMeters: number; // e.g. 2.4 m
  drainDepthMeters: number; // e.g. 1.8 m
  debrisType: string; // e.g. "Plastic trash, tree branches & food grease"
  sensorStatus: 'online' | 'degraded' | 'offline';
  lastTelemetryMinutesAgo: number;
  acknowledgedByPic: boolean;
  acknowledgedAt?: string;
  weather?: AreaWeather; // Current local rainfall and atmospheric condition
  mapCoords?: {
    x: number; // percentage X position on map 0-100
    y: number; // percentage Y position on map 0-100
    flowsToId?: string; // ID of downstream drain node
    zoneLabel?: string;
  };
  waterLevelHistory24h?: number[]; // Water level percentages over the last 24h
  maintenanceHistory?: MaintenanceEvent[]; // Last 3 maintenance events for this drain location
  predictiveAlert?: PredictiveAlert; // Predictive alert for likely breach of high threshold in next 4h
  scheduledMaintenance?: ScheduledMaintenance; // Scheduled routine preventive clearing
  prediction: ConsequencePrediction;
}

export type SortArrangement =
  | 'high-to-normal' // arrange high alert to normal level based on water level and water flow
  | 'normal-to-high'
  | 'water-level-desc'
  | 'water-flow-asc' // lowest flow (most clogged) first
  | 'price-desc' // RM price highest first
  | 'scheduled-first'; // drains with scheduled maintenance first
