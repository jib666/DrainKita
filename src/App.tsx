import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertBannerModal } from './components/AlertBannerModal';
import { ArrangeControls } from './components/ArrangeControls';
import { DrainCard } from './components/DrainCard';
import { DrainFlowMap } from './components/DrainFlowMap';
import { DrainSummaryStats } from './components/DrainSummaryStats';
import { Header } from './components/Header';
import { PredictionModal } from './components/PredictionModal';
import { INITIAL_DRAINS } from './data/sampleDrains';
import { AlertLevel, DrainRecord, ScheduledMaintenance, SortArrangement } from './types/drain';
import { arrangeDrains, calculateAlertLevel, generate24hTrendData, generateConsequencePrediction, getUnnoticedHighAlertDrains } from './utils/drainRules';
import { alertSound } from './utils/sound';
import { CheckCircle2, LayoutGrid, Map, ShieldCheck, Sparkles, Waves } from 'lucide-react';

export default function App() {
  const [drains, setDrains] = useState<DrainRecord[]>(() => INITIAL_DRAINS);
  const [arrangement, setArrangement] = useState<SortArrangement>('high-to-normal');
  const [selectedFilter, setSelectedFilter] = useState<'all' | AlertLevel | 'kolej' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [selectedPredictionDrain, setSelectedPredictionDrain] = useState<DrainRecord | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sound preference synchronization
  useEffect(() => {
    alertSound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Check for any high alert drain that the Person In Charge (PIC) has not noticed
  const unnoticedHighAlertDrains = useMemo(() => {
    return getUnnoticedHighAlertDrains(drains);
  }, [drains]);

  // Audio chime trigger when unnoticed high alert drain appears
  const lastChimeDrainIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (unnoticedHighAlertDrains.length > 0) {
      const topDrain = unnoticedHighAlertDrains[0];
      if (lastChimeDrainIdRef.current !== topDrain.id) {
        lastChimeDrainIdRef.current = topDrain.id;
        alertSound.playWarningChime();
      }
    } else {
      lastChimeDrainIdRef.current = null;
    }
  }, [unnoticedHighAlertDrains]);

  // Filter and arrange the drains according to water level, water flow, and selected options
  const arrangedAndFilteredDrains = useMemo(() => {
    // 1. Filter by search query
    let result = drains.filter((drain) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        drain.name.toLowerCase().includes(q) ||
        drain.drainCode.toLowerCase().includes(q) ||
        drain.kolejZone.toLowerCase().includes(q) ||
        drain.sector.toLowerCase().includes(q) ||
        drain.picName.toLowerCase().includes(q) ||
        drain.contractorName.toLowerCase().includes(q)
      );
    });

    // 2. Filter by category pill
    if (selectedFilter === 'high') {
      result = result.filter(
        (d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) === 'high'
      );
    } else if (selectedFilter === 'medium') {
      result = result.filter(
        (d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) === 'medium'
      );
    } else if (selectedFilter === 'normal') {
      result = result.filter(
        (d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) === 'normal'
      );
    } else if (selectedFilter === 'kolej') {
      result = result.filter((d) => d.kolejZone.toLowerCase().includes('kolej'));
    } else if (selectedFilter === 'scheduled') {
      result = result.filter((d) => Boolean(d.scheduledMaintenance));
    }

    // 3. Arrange drains (Feature 3: default high alert to normal level based on water level and flow)
    return arrangeDrains(result, arrangement);
  }, [drains, searchQuery, selectedFilter, arrangement]);

  // Counts for pills
  const counts = useMemo(() => {
    return {
      all: drains.length,
      high: drains.filter((d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) === 'high').length,
      medium: drains.filter((d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) === 'medium').length,
      normal: drains.filter((d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) === 'normal').length,
      kolej: drains.filter((d) => d.kolejZone.toLowerCase().includes('kolej')).length,
      scheduled: drains.filter((d) => Boolean(d.scheduledMaintenance)).length,
    };
  }, [drains]);

  // Toast handler
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Schedule future routine preventive clearing
  const handleSaveSchedule = (drainId: string, schedule: ScheduledMaintenance | null) => {
    setDrains((prev) =>
      prev.map((d) => (d.id === drainId ? { ...d, scheduledMaintenance: schedule ?? undefined } : d))
    );
    if (schedule) {
      showToast(`Routine clearing scheduled for ${schedule.formattedDateTime}!`);
    } else {
      showToast('Maintenance schedule removed.');
    }
  };

  // Acknowledge a single drain (Person in Charge confirms they noticed)
  const handleAcknowledge = (drainId: string) => {
    setDrains((prev) =>
      prev.map((d) =>
        d.id === drainId
          ? {
              ...d,
              acknowledgedByPic: true,
              acknowledgedAt: new Date().toLocaleTimeString('en-MY', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : d
      )
    );
    showToast('High alert acknowledged by Person In Charge (PIC).');
  };

  // Acknowledge all unnoticed high alert drains
  const handleAcknowledgeAll = () => {
    setDrains((prev) =>
      prev.map((d) => ({
        ...d,
        acknowledgedByPic: true,
        acknowledgedAt: new Date().toLocaleTimeString('en-MY', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))
    );
    showToast('All high alerts acknowledged.');
  };

  // Simulate a new high alert that is unnoticed by PIC (to demonstrate the rule)
  const handleTriggerSimulatedAlert = () => {
    const normalDrains = drains.filter(
      (d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) !== 'high'
    );
    if (normalDrains.length === 0) {
      // If all are already high, unacknowledge one
      setDrains((prev) =>
        prev.map((d, i) => (i === 0 ? { ...d, acknowledgedByPic: false } : d))
      );
      showToast('Unacknowledged status reset for demonstration.');
      return;
    }

    const target = normalDrains[0];
    const newLevel = 93;
    const newFlow = 0.06;

    setDrains((prev) =>
      prev.map((d) =>
        d.id === target.id
          ? {
              ...d,
              waterLevelPercent: newLevel,
              waterFlowM3s: newFlow,
              acknowledgedByPic: false, // Rule trigger: Person In Charge has NOT noticed yet!
              debrisType: 'Sudden flash runoff blockage: fallen branches & sediment build-up',
              waterLevelHistory24h: generate24hTrendData(newLevel, 'high'),
              prediction: generateConsequencePrediction({
                name: target.name,
                kolejZone: target.kolejZone,
                waterLevelPercent: newLevel,
                waterFlowM3s: newFlow,
                contractPriceRM: target.contractPriceRM,
              }),
            }
          : d
      )
    );
    showToast(`Simulated high alert at ${target.kolejZone}! Alert popup triggered.`);
  };

  // Simulate contractor resolving / jetting a drain
  const handleSimulateClearance = (drainId: string) => {
    setDrains((prev) =>
      prev.map((d) => {
        if (d.id !== drainId) return d;
        const isCurrentlyBlocked = d.waterLevelPercent > 40;
        const newLevel = isCurrentlyBlocked ? 24 : 89;
        const newFlow = isCurrentlyBlocked ? 1.75 : 0.08;
        const newAlert = calculateAlertLevel(newLevel, newFlow);
        return {
          ...d,
          waterLevelPercent: newLevel,
          waterFlowM3s: newFlow,
          acknowledgedByPic: true,
          waterLevelHistory24h: generate24hTrendData(newLevel, newAlert),
          debrisType: isCurrentlyBlocked
            ? 'Fully cleared & hydro-jetted by contractor crew'
            : 'Silt trap debris accumulated',
          prediction: generateConsequencePrediction({
            name: d.name,
            kolejZone: d.kolejZone,
            waterLevelPercent: newLevel,
            waterFlowM3s: newFlow,
            contractPriceRM: d.contractPriceRM,
          }),
        };
      })
    );
    showToast('Contractor hydro-jetting work status updated.');
  };

  return (
    <div className="min-h-screen bg-[#F6F4ED] text-[#1E2922] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sticky Top Header */}
      <Header
        highAlertCount={counts.high}
        unacknowledgedCount={unnoticedHighAlertDrains.length}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onTriggerSimulatedAlert={handleTriggerSimulatedAlert}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto pb-16">
        {/* Mobile Summary KPI Ribbon */}
        <DrainSummaryStats
          drains={drains}
          onSelectFilter={(f) => setSelectedFilter(f)}
          selectedFilter={selectedFilter}
        />

        {/* Feature 3: Arrangement & Filtering Controls */}
        <ArrangeControls
          currentArrangement={arrangement}
          onChangeArrangement={setArrangement}
          selectedFilter={selectedFilter}
          onSelectFilter={setSelectedFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          counts={counts}
        />

        {/* Live List of Drain Areas (Feature 2) & Simple Drain Flow Map */}
        <section className="px-4 py-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <h2 className="font-bold uppercase tracking-wider text-[11px] text-[#2D6A4F] flex items-center gap-1.5">
              <Waves className="w-4 h-4" />
              <span>
                {arrangedAndFilteredDrains.length} Drain Areas Equipped with NoSumbat System
              </span>
            </h2>

            {/* View Mode Toggle: Cards vs Drain Flow Map */}
            <div className="flex items-center gap-1 bg-[#EAE4D7] p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-[#204E38] text-white shadow-xs'
                    : 'text-[#554D41] hover:text-[#1E2922]'
                }`}
                aria-label="View as cards list"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards ({arrangedAndFilteredDrains.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-[#204E38] text-white shadow-xs'
                    : 'text-[#554D41] hover:text-[#1E2922]'
                }`}
                aria-label="View as simple drain flow map"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Drain Flow Map</span>
              </button>
            </div>
          </div>

          {viewMode === 'map' ? (
            /* Simple Drain Flow Map View */
            <DrainFlowMap
              drains={drains}
              onViewPrediction={(d) => setSelectedPredictionDrain(d)}
              onAcknowledge={handleAcknowledge}
              onSimulateClearance={handleSimulateClearance}
            />
          ) : (
            /* Cards View */
            arrangedAndFilteredDrains.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E5DFD2] space-y-2">
                <p className="text-sm font-semibold text-[#5A5247]">No drain areas match your filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#2D6A4F] font-bold underline cursor-pointer"
                >
                  Reset filters to view all 15 drains
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {arrangedAndFilteredDrains.map((drain) => (
                  <DrainCard
                    key={drain.id}
                    drain={drain}
                    onViewPrediction={(d) => setSelectedPredictionDrain(d)}
                    onAcknowledge={handleAcknowledge}
                    onSimulateClearance={handleSimulateClearance}
                    onSaveSchedule={handleSaveSchedule}
                  />
                ))}
              </div>
            )
          )}
        </section>
      </main>

      {/* Pop Up Rule: If the person in charge not notice about high alert drain, then alert notification pop up */}
      <AlertBannerModal
        unnoticedDrains={unnoticedHighAlertDrains}
        onAcknowledge={handleAcknowledge}
        onAcknowledgeAll={handleAcknowledgeAll}
        onViewPrediction={(drain) => {
          handleAcknowledge(drain.id);
          setSelectedPredictionDrain(drain);
        }}
      />

      {/* Consequence Prediction Modal (Feature: predict what happens if high alert drain does not resolve quickly) */}
      <PredictionModal
        drain={selectedPredictionDrain}
        onClose={() => setSelectedPredictionDrain(null)}
        onDispatchCrew={(drainId) => {
          handleSimulateClearance(drainId);
          showToast('Emergency Contractor Crew Dispatched to Kolej Area!');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 bg-[#1B3B2B] text-white px-4 py-3 rounded-xl shadow-xl border border-[#2D6A4F] flex items-center gap-2.5 text-xs font-semibold"
        >
          <CheckCircle2 className="w-4 h-4 text-[#95D5B2] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
