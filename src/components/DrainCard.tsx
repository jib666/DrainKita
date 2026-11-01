import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Droplets,
  HardHat,
  History,
  Phone,
  Sparkles,
  TrendingDown,
  Waves,
  Wind,
  Wrench,
} from 'lucide-react';
import { DrainRecord, ScheduledMaintenance } from '../types/drain';
import {
  calculateAlertLevel,
  calculatePredictiveAlert,
  generate24hTrendData,
  generateAreaWeather,
  generateSampleMaintenanceHistory,
} from '../utils/drainRules';
import { MaintenanceHistorySection } from './MaintenanceHistorySection';
import { PredictiveAlertBanner } from './PredictiveAlertBanner';
import { ScheduleMaintenanceModal } from './ScheduleMaintenanceModal';
import { WaterLevelSparkline } from './WaterLevelSparkline';
import { WeatherWidget } from './WeatherWidget';

interface DrainCardProps {
  drain: DrainRecord;
  onViewPrediction: (drain: DrainRecord) => void;
  onAcknowledge: (drainId: string) => void;
  onSimulateClearance: (drainId: string) => void;
  onSaveSchedule?: (drainId: string, schedule: ScheduledMaintenance | null) => void;
}

export const DrainCard: React.FC<DrainCardProps> = ({
  drain,
  onViewPrediction,
  onAcknowledge,
  onSimulateClearance,
  onSaveSchedule,
}) => {
  const alertLevel = calculateAlertLevel(drain.waterLevelPercent, drain.waterFlowM3s);
  const trendData = drain.waterLevelHistory24h || generate24hTrendData(drain.waterLevelPercent, alertLevel);
  const currentWeather = drain.weather || generateAreaWeather(drain.waterLevelPercent, alertLevel);
  const predictiveAlert =
    drain.predictiveAlert ||
    calculatePredictiveAlert(drain.waterLevelPercent, drain.waterFlowM3s, trendData);
  const [showHistory, setShowHistory] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const maintenanceEvents =
    drain.maintenanceHistory ||
    generateSampleMaintenanceHistory(
      drain.drainCode,
      drain.kolejZone,
      drain.picName,
      drain.contractPriceRM
    );

  // Styling presets based on alert level
  const badgeStyle = {
    high: 'bg-[#FBE8E4] text-[#A63721] border-[#F4BEB4] font-bold',
    medium: 'bg-[#FEF5E7] text-[#9E6116] border-[#F6D7A7] font-semibold',
    normal: 'bg-[#EBF5EF] text-[#246345] border-[#BEDECC] font-medium',
  }[alertLevel];

  const levelBarColor = {
    high: 'bg-[#B8422A]',
    medium: 'bg-[#C27D26]',
    normal: 'bg-[#2D6A4F]',
  }[alertLevel];

  const cardBorder =
    alertLevel === 'high'
      ? !drain.acknowledgedByPic
        ? 'border-[#B8422A] ring-2 ring-[#B8422A]/30 bg-[#FFFDFB]'
        : 'border-[#F1CDC5] bg-[#FFFDFC]'
      : predictiveAlert.isTriggered
      ? 'border-[#D95338] ring-2 ring-[#D95338]/30 bg-[#FFFDFC]'
      : alertLevel === 'medium'
      ? 'border-[#EADBCA] bg-[#FFFDFC]'
      : 'border-[#DEE6E0] bg-[#FAFCFA]';

  return (
    <article
      className={`rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md ${cardBorder} relative overflow-hidden`}
    >
      {/* High alert urgency glow if unacknowledged */}
      {alertLevel === 'high' && !drain.acknowledgedByPic && (
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#B8422A] animate-pulse" />
      )}

      {/* Top row: Code, Alert Level, Price in RM */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#554D41] bg-[#F1ECE1] px-2 py-0.5 rounded-md border border-[#E0D8CA]">
            {drain.drainCode}
          </span>
          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${badgeStyle}`}
          >
            {alertLevel === 'high' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8422A] animate-ping" />
            )}
            {alertLevel === 'high' ? 'High Alert' : alertLevel === 'medium' ? 'Medium Level' : 'Normal Level'}
          </span>
          {predictiveAlert.isTriggered && alertLevel !== 'high' && (
            <span
              className="text-[10px] bg-[#FFF0ED] text-[#9E3621] border border-[#F6C6BC] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-2xs"
              title={`Predictive Alert: 24h trend indicates water level will reach High Alert in ~${predictiveAlert.estimatedHoursUntilHigh} hours`}
            >
              <Sparkles className="w-3 h-3 text-[#B8422A] animate-pulse" />
              <span>Predictive Alert: ~{predictiveAlert.estimatedHoursUntilHigh}h</span>
            </span>
          )}
        </div>

        {/* Price in RM */}
        <div className="text-right">
          <span className="text-xs text-[#6F675A] font-medium block text-[10px]">Contract Price</span>
          <span className="font-mono font-bold text-sm text-[#1B3B2B] bg-[#E8EFEA] px-2 py-0.5 rounded border border-[#C5D9CC]">
            RM {drain.contractPriceRM.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Drain title, Location & Weather Icon Widget */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-base text-[#1E2922] leading-snug">
            {drain.name}
          </h3>
          {/* Weather icon widget showing active rain correlation */}
          <WeatherWidget
            weather={currentWeather}
            drainCode={drain.drainCode}
            kolejZone={drain.kolejZone}
          />
        </div>
        <p className="text-xs text-[#5D554B] flex items-center gap-1.5 mt-0.5">
          <span className="font-semibold text-[#2D6A4F]">{drain.kolejZone}</span>
          <span>•</span>
          <span>{drain.sector}</span>
        </p>
      </div>

      {/* Active Scheduled Routine Preventive Clearing Highlight */}
      {drain.scheduledMaintenance && (
        <div className="mb-3 p-2.5 rounded-xl bg-[#EAF5EF] border border-[#BFDFCD] flex items-center justify-between gap-2 text-xs shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#2D6A4F] text-white shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-[#1B3B2B] text-[11px] truncate">
                  📅 Scheduled: {drain.scheduledMaintenance.formattedDateTime}
                </span>
                <span className="text-[9px] font-bold text-[#204E38] bg-[#D6EBE0] px-1.5 py-0.2 rounded uppercase">
                  Routine Preventive
                </span>
              </div>
              <span className="text-[10px] text-[#426150] block mt-0.5 truncate">
                {drain.scheduledMaintenance.taskType} • PIC: {drain.scheduledMaintenance.contractorPIC} (RM {drain.scheduledMaintenance.estimatedCostRM.toLocaleString()})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="text-[10px] font-bold text-[#204E38] hover:text-[#163626] bg-white px-2 py-1 rounded-lg border border-[#C6DFD2] shadow-2xs whitespace-nowrap cursor-pointer transition-colors shrink-0"
          >
            Edit
          </button>
        </div>
      )}

      {/* Telemetry Grid: Water Level & Water Flow */}
      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#F6F3EC] border border-[#EAE4D7] mb-3">
        {/* Water Level */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6A6357] font-medium flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-[#2D6A4F]" /> Water Level
            </span>
            <span
              className={`font-mono font-extrabold ${
                alertLevel === 'high'
                  ? 'text-[#B8422A]'
                  : alertLevel === 'medium'
                  ? 'text-[#C27D26]'
                  : 'text-[#2D6A4F]'
              }`}
            >
              {drain.waterLevelPercent}%
            </span>
          </div>
          <div className="w-full bg-[#E3DDCF] h-2 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${levelBarColor}`}
              style={{ width: `${drain.waterLevelPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-[#787063] block mt-1">
            Sensor depth: {drain.drainDepthMeters}m U-Drain
          </span>
        </div>

        {/* Water Flow */}
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6A6357] font-medium flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-[#3A6B53]" /> Water Flow
            </span>
            <span className="font-mono font-extrabold text-[#1E2922]">
              {drain.waterFlowM3s.toFixed(2)}{' '}
              <span className="text-[10px] text-[#6A6357] font-normal">m³/s</span>
            </span>
          </div>
          <div className="w-full bg-[#E3DDCF] h-2 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#3D8562] transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.round((drain.waterFlowM3s / 2.0) * 100))}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-[#787063] block mt-1">
            {drain.waterFlowM3s <= 0.25
              ? '⚠️ Choked / Low velocity'
              : drain.waterFlowM3s <= 0.6
              ? 'Moderate flow'
              : 'Smooth discharge'}
          </span>
        </div>
      </div>

      {/* Predictive Alert: Visual warning if 24h trend indicates water level will likely reach high in next 4h */}
      {predictiveAlert.isTriggered && (
        <div className="mb-3">
          <PredictiveAlertBanner
            predictiveAlert={predictiveAlert}
            drainCode={drain.drainCode}
            drainName={drain.name}
            kolejZone={drain.kolejZone}
            currentLevel={drain.waterLevelPercent}
            currentFlow={drain.waterFlowM3s}
            onPreemptiveClearance={() => onSimulateClearance(drain.id)}
          />
        </div>
      )}

      {/* Data Visualization Section: 24h Water Level Trend Sparkline */}
      <div className="mb-3">
        <WaterLevelSparkline
          data={trendData}
          alertLevel={alertLevel}
          drainCode={drain.drainCode}
          predictiveAlert={predictiveAlert}
        />
      </div>

      {/* Debris & PIC info */}
      <div className="space-y-1.5 text-xs text-[#5D554B] mb-3.5 bg-white/70 p-2.5 rounded-lg border border-[#EDE7DB]">
        <div className="flex items-start gap-1.5">
          <span className="text-[11px] font-semibold text-[#7D7569] min-w-16">Blockage:</span>
          <span className="text-[11px] text-[#332C24] line-clamp-1 font-medium">
            {drain.debrisType}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="text-[#7D7569] font-semibold">PIC Assigned:</span>
          <span className="text-[#1E2922] font-medium flex items-center gap-1">
            <HardHat className="w-3 h-3 text-[#2D6A4F]" />
            {drain.picName} ({drain.contractorName})
          </span>
        </div>

        {/* Unnoticed High Alert warning if applicable */}
        {alertLevel === 'high' && (
          <div className="pt-1.5 mt-1 border-t border-[#F0E6DE] flex items-center justify-between">
            <span className="text-[11px] text-[#8A2C18] font-bold flex items-center gap-1">
              {!drain.acknowledgedByPic ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-[#B8422A] animate-bounce" />
                  ⚠️ Unnoticed by PIC!
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  Acknowledged by {drain.picName}
                </>
              )}
            </span>
            {!drain.acknowledgedByPic && (
              <button
                type="button"
                onClick={() => onAcknowledge(drain.id)}
                className="text-[10px] font-bold text-white bg-[#B8422A] hover:bg-[#8F3925] px-2 py-0.5 rounded transition-colors"
                aria-label={`Acknowledge alert for ${drain.name}`}
              >
                Acknowledge Now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions: Predict Consequence, View History & Contractor Resolve */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EAE4D7]">
        {/* Feature: Predict what happens if high alert drain does not resolve quickly */}
        <button
          type="button"
          onClick={() => onViewPrediction(drain)}
          className={`flex-1 min-w-[140px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
            alertLevel === 'high'
              ? 'bg-[#B8422A] hover:bg-[#9E3621] text-white active:scale-95'
              : 'bg-[#204E38] hover:bg-[#2B664A] text-white active:scale-95'
          }`}
          aria-label={`Predict impact and consequence for ${drain.name}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Predict Consequence</span>
          {alertLevel === 'high' && (
            <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded font-mono">
              ~{drain.prediction.timeToOverflowMinutes}m
            </span>
          )}
        </button>

        {/* View History Button */}
        <button
          type="button"
          onClick={() => setShowHistory((prev) => !prev)}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            showHistory
              ? 'bg-[#204E38] text-white border-[#204E38] shadow-xs'
              : 'border-[#D5CDC0] bg-[#FAF8F3] hover:bg-[#EDE8DC] text-[#423C34]'
          }`}
          aria-expanded={showHistory}
          aria-label={`View maintenance history for ${drain.name}`}
        >
          <History className={`w-3.5 h-3.5 ${showHistory ? 'text-[#95D5B2]' : 'text-[#2D6A4F]'}`} />
          <span>{showHistory ? 'Hide History' : 'View History'}</span>
        </button>

        {/* Schedule Maintenance Button */}
        <button
          type="button"
          onClick={() => setIsScheduleModalOpen(true)}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            drain.scheduledMaintenance
              ? 'bg-[#EBF5EF] text-[#204E38] border-[#A8D5BC] hover:bg-[#DDF0E5]'
              : 'border-[#D5CDC0] bg-[#FAF8F3] hover:bg-[#EDE8DC] text-[#423C34]'
          }`}
          title="Set a future date and time for routine preventive clearing"
          aria-label={`Schedule maintenance for ${drain.name}`}
        >
          <CalendarClock
            className={`w-3.5 h-3.5 ${
              drain.scheduledMaintenance ? 'text-[#204E38]' : 'text-[#2D6A4F]'
            }`}
          />
          <span>{drain.scheduledMaintenance ? 'Reschedule' : 'Schedule Maintenance'}</span>
        </button>

        {/* Interactive action to clear/resolve drain */}
        <button
          type="button"
          onClick={() => onSimulateClearance(drain.id)}
          className="py-2 px-2.5 rounded-xl border border-[#D5CDC0] bg-[#F7F4EC] hover:bg-[#EDE8DC] text-[#423C34] text-xs font-semibold flex items-center gap-1 transition-colors"
          title="Simulate jetting / clearing drain blockage"
          aria-label={`Resolve blockage for ${drain.name}`}
        >
          <Wrench className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>{drain.waterLevelPercent > 40 ? 'Clear Sump' : 'Re-test'}</span>
        </button>
      </div>

      {/* Expandable Maintenance History Section (Last 3 Events) */}
      <MaintenanceHistorySection
        events={maintenanceEvents}
        drainName={drain.name}
        drainCode={drain.drainCode}
        kolejZone={drain.kolejZone}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        variant="inline"
      />

      {/* Schedule Maintenance Modal */}
      <ScheduleMaintenanceModal
        drain={drain}
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSaveSchedule={(drainId, schedule) => {
          if (onSaveSchedule) {
            onSaveSchedule(drainId, schedule);
          }
        }}
      />
    </article>
  );
};
