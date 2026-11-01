import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  Droplets,
  FileText,
  Flame,
  HardHat,
  MapPin,
  ShieldAlert,
  Sparkles,
  Truck,
  Wind,
  X,
} from 'lucide-react';
import { DrainRecord } from '../types/drain';
import { calculateAlertLevel } from '../utils/drainRules';

interface PredictionModalProps {
  drain: DrainRecord | null;
  onClose: () => void;
  onDispatchCrew: (drainId: string) => void;
}

export const PredictionModal: React.FC<PredictionModalProps> = ({
  drain,
  onClose,
  onDispatchCrew,
}) => {
  const [dispatchConfirmed, setDispatchConfirmed] = useState(false);

  if (!drain) return null;

  const alertLevel = calculateAlertLevel(drain.waterLevelPercent, drain.waterFlowM3s);
  const prediction = drain.prediction;

  const handleDispatch = () => {
    onDispatchCrew(drain.id);
    setDispatchConfirmed(true);
    setTimeout(() => {
      setDispatchConfirmed(false);
      onClose();
    }, 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prediction-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto"
    >
      <div className="bg-[#FFFDFB] text-[#1E2922] w-full max-w-lg rounded-2xl shadow-2xl border border-[#D5CDC0] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1B3B2B] text-white px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#2D6A4F] rounded-xl text-[#95D5B2] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#95D5B2]">
                PBT Predictive Consequence Engine
              </span>
              <h2 id="prediction-modal-title" className="text-lg font-bold leading-tight text-white">
                Impact Forecast If Unresolved
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#D2DFD8] transition-colors"
            aria-label="Close prediction modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Target Drain Info */}
          <div className="bg-[#F8F5EE] border border-[#E5DFD2] p-3.5 rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-[#2D6A4F] bg-[#E3ECE6] px-2 py-0.5 rounded">
                {drain.drainCode}
              </span>
              <span className="text-[#686055] font-medium">
                PBT Contract: <strong className="text-[#1B3B2B]">RM {drain.contractPriceRM.toLocaleString()}</strong>
              </span>
            </div>
            <h3 className="font-bold text-base text-[#1E2922] mt-1.5 leading-snug">
              {drain.name}
            </h3>
            <p className="text-xs text-[#5D554B] mt-0.5">
              📍 {drain.kolejZone} • {drain.sector}
            </p>
          </div>

          {/* Critical Prediction Banner */}
          <div
            className={`p-4 rounded-xl border ${
              alertLevel === 'high'
                ? 'bg-[#FFF2EE] border-[#F2B5A8] text-[#852714]'
                : alertLevel === 'medium'
                ? 'bg-[#FEF7ED] border-[#F6D7A7] text-[#8E5B1A]'
                : 'bg-[#F0F7F3] border-[#C2DFCF] text-[#245841]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4" />
                Flood Risk Level: {prediction.floodRiskLevel}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/80 shadow-2xs">
                Overflow in ~{prediction.timeToOverflowMinutes} Mins
              </span>
            </div>
            <p className="text-xs font-bold mt-2 leading-relaxed text-[#2E1F1A]">
              {prediction.primaryImpactSummary}
            </p>
          </div>

          {/* Current telemetry diagnosis */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#FAF8F3] rounded-xl border border-[#E9E4D7]">
              <span className="text-[#726A5F] flex items-center gap-1 text-[11px]">
                <Droplets className="w-3 h-3 text-[#2D6A4F]" /> Water Level Depth
              </span>
              <span className="text-lg font-black text-[#1E2922] block mt-0.5 font-mono">
                {drain.waterLevelPercent}% Full
              </span>
              <span className="text-[10px] text-[#873623]">
                {drain.waterLevelPercent >= 80 ? 'Threshold breached (>80%)' : 'Within retention bounds'}
              </span>
            </div>

            <div className="p-2.5 bg-[#FAF8F3] rounded-xl border border-[#E9E4D7]">
              <span className="text-[#726A5F] flex items-center gap-1 text-[11px]">
                <Wind className="w-3 h-3 text-[#2D6A4F]" /> Discharge Velocity
              </span>
              <span className="text-lg font-black text-[#1E2922] block mt-0.5 font-mono">
                {drain.waterFlowM3s.toFixed(2)} m³/s
              </span>
              <span className="text-[10px] text-[#873623]">
                {drain.waterFlowM3s <= 0.25 ? 'Flow bottleneck detected' : 'Acceptable discharge velocity'}
              </span>
            </div>
          </div>

          {/* Facilities at Risk */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-[#4B443B] flex items-center gap-1.5 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-[#2D6A4F]" /> Facilities & Infrastructure At Risk
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {prediction.affectedFacilities.map((facility, idx) => (
                <div
                  key={idx}
                  className="text-xs p-2 rounded-lg bg-[#FAF7F0] border border-[#E7E1D4] text-[#3A332B] flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8422A]" />
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Damage vs Resolution Cost Comparison */}
          <div className="p-3.5 rounded-xl bg-[#F6F2EA] border border-[#E4DDD0] space-y-2.5">
            <h4 className="text-xs font-bold text-[#352F28] flex items-center justify-between uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#204E38]" /> Financial Cost vs Prevention
              </span>
              <span className="text-[10px] font-mono text-[#524B42]">Ringgit Malaysia (RM)</span>
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white rounded-lg border border-[#E2DBD0]">
                <span className="text-[10px] text-[#6E6659] block">Clearance Cost</span>
                <span className="font-mono font-bold text-xs text-[#204E38]">
                  RM {drain.contractPriceRM.toLocaleString()}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-[#F3C4B9]">
                <span className="text-[10px] text-[#8A2C18] block">Flood Damage</span>
                <span className="font-mono font-bold text-xs text-[#B8422A]">
                  RM {prediction.estimatedDamageRM.toLocaleString()}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-[#F3C4B9]">
                <span className="text-[10px] text-[#8A2C18] block">PBT Penalty</span>
                <span className="font-mono font-bold text-xs text-[#8A2C18]">
                  RM {prediction.municipalPenaltyRM.toLocaleString()}/d
                </span>
              </div>
            </div>

            {/* Projected savings callout */}
            {prediction.estimatedDamageRM > 0 && (
              <div className="text-[11px] p-2 bg-[#E6F3EB] border border-[#BEDECC] text-[#1D5139] rounded-lg font-medium flex items-center justify-between">
                <span>Preventive Net Savings:</span>
                <strong className="font-mono font-bold text-sm">
                  RM {(prediction.estimatedDamageRM - drain.contractPriceRM).toLocaleString()}
                </strong>
              </div>
            )}
          </div>

          {/* MetMalaysia Weather Advisory */}
          <div className="text-xs p-3 rounded-xl bg-[#F5F8F6] border border-[#D3E5DC] text-[#245841]">
            <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider mb-0.5">
              <Wind className="w-3.5 h-3.5 text-[#2D6A4F]" /> Weather Risk Factor
            </span>
            <p className="text-[#365A48] font-medium">{prediction.weatherRiskFactor}</p>
          </div>

          {/* Recommended Contractor Action Plan */}
          <div className="text-xs p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E0D2] space-y-1">
            <span className="font-bold text-[#1E2922] flex items-center gap-1.5 text-xs">
              <HardHat className="w-3.5 h-3.5 text-[#2D6A4F]" /> Contractor Required Equipment:
            </span>
            <p className="text-[#554D43] leading-relaxed font-medium">
              {prediction.recommendedAction}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#FAF7F0] border-t border-[#EAE3D5] flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            type="button"
            className="py-2.5 px-4 rounded-xl border border-[#D5CDC0] text-[#554D43] hover:bg-[#EFE9DD] font-semibold text-xs transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleDispatch}
            disabled={dispatchConfirmed}
            type="button"
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              dispatchConfirmed
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[#B8422A] hover:bg-[#9E3621] text-white'
            }`}
          >
            {dispatchConfirmed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#A8D5BA]" />
                Emergency Jetting Lorry Dispatched!
              </>
            ) : (
              <>
                <Truck className="w-4 h-4" />
                Dispatch Clearance Crew (RM {drain.contractPriceRM.toLocaleString()})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
