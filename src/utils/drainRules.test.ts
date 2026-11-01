import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAlertLevel,
  calculateAlertScore,
  arrangeDrains,
  generateConsequencePrediction,
  getUnnoticedHighAlertDrains,
  generate24hTrendData,
  generateAreaWeather,
  generateSampleMaintenanceHistory,
  calculatePredictiveAlert,
  formatScheduledDateTime,
} from './drainRules';
import { DrainRecord } from '../types/drain';

function createMockDrain(partial: Partial<DrainRecord>): DrainRecord {
  return {
    id: 'mock-1',
    name: 'Longkang Kolej Test',
    drainCode: 'PBT-TEST-01',
    kolejZone: 'Kolej Perdana',
    sector: 'Zon Kolej',
    pbtCouncil: 'Majlis Bandaraya Iskandar Puteri',
    picName: 'En. Razak',
    picPhone: '+60 12-345 6789',
    contractorName: 'Mega Bina PBT',
    contractPriceRM: 2500,
    waterLevelPercent: 50,
    waterFlowM3s: 1.0,
    drainWidthMeters: 2.0,
    drainDepthMeters: 1.5,
    debrisType: 'Plastics',
    sensorStatus: 'online',
    lastTelemetryMinutesAgo: 2,
    acknowledgedByPic: true,
    prediction: {
      timeToOverflowMinutes: 60,
      floodRiskLevel: 'Moderate',
      primaryImpactSummary: 'Test impact',
      affectedFacilities: [],
      estimatedDamageRM: 1000,
      municipalPenaltyRM: 500,
      recommendedAction: 'Inspect',
      weatherRiskFactor: 'Clear',
    },
    ...partial,
  };
}

test('calculateAlertLevel classifies high alert properly', () => {
  // Water level >= 80% is high alert regardless of flow
  assert.equal(calculateAlertLevel(85, 1.2), 'high');
  assert.equal(calculateAlertLevel(92, 0.05), 'high');

  // Water level >= 65% with choked flow (<= 0.25 m³/s) is high alert
  assert.equal(calculateAlertLevel(68, 0.15), 'high');

  // Water level >= 75% with low flow (<= 0.45 m³/s) is high alert
  assert.equal(calculateAlertLevel(76, 0.35), 'high');
});

test('calculateAlertLevel classifies medium and normal alerts', () => {
  // Moderate water level or restricted flow
  assert.equal(calculateAlertLevel(60, 0.8), 'medium');
  assert.equal(calculateAlertLevel(35, 0.2), 'medium');

  // Low water level with healthy flow
  assert.equal(calculateAlertLevel(25, 1.1), 'normal');
  assert.equal(calculateAlertLevel(40, 0.6), 'normal');
});

test('arrangeDrains sorts from high alert to normal level', () => {
  const drainNormal = createMockDrain({ id: 'd-normal', waterLevelPercent: 20, waterFlowM3s: 1.2 });
  const drainMedium = createMockDrain({ id: 'd-medium', waterLevelPercent: 55, waterFlowM3s: 0.6 });
  const drainHigh = createMockDrain({ id: 'd-high', waterLevelPercent: 92, waterFlowM3s: 0.08 });

  const list = [drainNormal, drainHigh, drainMedium];
  const sorted = arrangeDrains(list, 'high-to-normal');

  assert.equal(sorted[0].id, 'd-high', 'First should be high alert');
  assert.equal(sorted[1].id, 'd-medium', 'Second should be medium alert');
  assert.equal(sorted[2].id, 'd-normal', 'Third should be normal alert');
});

test('generateConsequencePrediction generates overflow time and damages for high alert', () => {
  const prediction = generateConsequencePrediction({
    name: 'Longkang Utama KTDI',
    kolejZone: 'Kolej Tun Dr Ismail',
    waterLevelPercent: 94,
    waterFlowM3s: 0.05,
    contractPriceRM: 3200,
  });

  assert.equal(prediction.floodRiskLevel, 'Catastrophic');
  assert.ok(prediction.timeToOverflowMinutes <= 35, 'Overflow should be within 35 mins');
  assert.ok(prediction.estimatedDamageRM > 20000, 'Damage estimate should be severe');
  assert.ok(prediction.primaryImpactSummary.includes('Kolej Tun Dr Ismail'));
});

test('getUnnoticedHighAlertDrains identifies unacknowledged high alert drains', () => {
  const noticedHigh = createMockDrain({
    id: 'd1',
    waterLevelPercent: 90,
    waterFlowM3s: 0.1,
    acknowledgedByPic: true,
  });
  const unnoticedHigh = createMockDrain({
    id: 'd2',
    waterLevelPercent: 88,
    waterFlowM3s: 0.05,
    acknowledgedByPic: false, // NOT noticed!
  });
  const unnoticedNormal = createMockDrain({
    id: 'd3',
    waterLevelPercent: 30,
    waterFlowM3s: 1.0,
    acknowledgedByPic: false,
  });

  const unnoticed = getUnnoticedHighAlertDrains([noticedHigh, unnoticedHigh, unnoticedNormal]);
  assert.equal(unnoticed.length, 1);
  assert.equal(unnoticed[0].id, 'd2');
});

test('generate24hTrendData returns 13 data points with last point strictly matching current level', () => {
  const highTrend = generate24hTrendData(94, 'high');
  assert.equal(highTrend.length, 13);
  assert.equal(highTrend[highTrend.length - 1], 94);
  // High alert should start lower and surge upwards
  assert.ok(highTrend[0] < highTrend[highTrend.length - 1]);

  const normalTrend = generate24hTrendData(18, 'normal');
  assert.equal(normalTrend.length, 13);
  assert.equal(normalTrend[normalTrend.length - 1], 18);
});

test('generateAreaWeather correlates heavy rain directly to high alert spikes', () => {
  const highWeather = generateAreaWeather(94, 'high');
  assert.equal(highWeather.hasActiveRain, true);
  assert.ok(highWeather.rainfallMmPerHour >= 35, 'High alert should correlate to heavy downpour > 35mm/h');
  assert.equal(highWeather.condition, 'Thunderstorm');

  const normalWeather = generateAreaWeather(18, 'normal');
  assert.equal(normalWeather.rainfallMmPerHour, 0);
  assert.equal(normalWeather.hasActiveRain, false);
});

test('generateSampleMaintenanceHistory returns exactly 3 chronological events', () => {
  const events = generateSampleMaintenanceHistory('PBT-KTD-M01', 'Kolej Tun Dr Ismail', 'En. Ridzuan', 3800);
  assert.equal(events.length, 3);
  assert.ok(events[0].date.includes('2026'));
  assert.ok(events[0].costRM > 0);
  assert.ok(events[0].notes.length > 10);
  assert.equal(events[0].contractorPIC, 'En. Ridzuan');
});

test('calculatePredictiveAlert triggers when medium drain is projected to reach high in 4 hours', () => {
  // Rising medium drain: 68%, low flow 0.42 m³/s, 24h trend shows recent steep climb (from 50% to 68%)
  const history = [30, 32, 35, 38, 42, 45, 48, 52, 55, 58, 62, 65, 68];
  const alert = calculatePredictiveAlert(68, 0.42, history);

  assert.equal(alert.isTriggered, true, 'Should trigger predictive alert for surging medium drain');
  assert.ok(alert.projectedLevelIn4h >= 75, 'Projected level in 4h should reach high threshold');
  assert.ok(alert.estimatedHoursUntilHigh <= 4.0, 'Hours until high alert should be within 4 hours');
  assert.ok(alert.riskSummary.includes('High Alert breach'));

  // Stable normal drain: 18%, flow 1.85 m³/s
  const normalHistory = [22, 22, 23, 24, 25, 26, 25, 24, 22, 20, 19, 18, 18];
  const normalAlert = calculatePredictiveAlert(18, 1.85, normalHistory);
  assert.equal(normalAlert.isTriggered, false, 'Should not trigger for clear flowing normal drain');
});

test('formatScheduledDateTime formats date and time cleanly into Malaysian municipal format', () => {
  const formatted = formatScheduledDateTime('2026-11-04', '09:30');
  assert.equal(formatted, '4 Nov 2026, 9:30 AM');

  const afternoon = formatScheduledDateTime('2026-11-10', '14:45');
  assert.equal(afternoon, '10 Nov 2026, 2:45 PM');
});

test('arrangeDrains sorts scheduled tasks first when scheduled-first is selected', () => {
  const unscheduled = createMockDrain({
    id: 'd1',
    waterLevelPercent: 30,
    waterFlowM3s: 1.2,
  });
  const scheduled = createMockDrain({
    id: 'd2',
    waterLevelPercent: 25,
    waterFlowM3s: 1.5,
    scheduledMaintenance: {
      id: 'sm-1',
      scheduledDate: '2026-11-03',
      scheduledTime: '10:00',
      formattedDateTime: '3 Nov 2026, 10:00 AM',
      taskType: 'Routine Preventive Hydro-Jetting',
      contractorPIC: 'En. Ridzuan',
      estimatedCostRM: 1200,
      createdAt: '2026-10-31',
    },
  });

  const sorted = arrangeDrains([unscheduled, scheduled], 'scheduled-first');
  assert.equal(sorted[0].id, 'd2', 'Scheduled drain should be sorted first');
});





