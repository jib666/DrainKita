import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Droplets, Phone, Sparkles, Wind, X } from 'lucide-react';
import { DrainRecord } from '../types/drain';

interface AlertBannerModalProps {
  unnoticedDrains: DrainRecord[];
  onAcknowledge: (drainId: string) => void;
  onAcknowledgeAll: () => void;
  onViewPrediction: (drain: DrainRecord) => void;
}

export const AlertBannerModal: React.FC<AlertBannerModalProps> = ({
  unnoticedDrains,
  onAcknowledge,
  onAcknowledgeAll,
  onViewPrediction,
}) => {
  if (unnoticedDrains.length === 0) return null;

  const currentDrain = unnoticedDrains[0];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
    >
      <div className="bg-[#FFFDFB] text-[#1E2922] w-full max-w-md rounded-2xl shadow-2xl border-2 border-[#D95338] overflow-hidden flex flex-col">
        {/* Header with emergency terracotta color */}
        <div className="bg-[#B8422A] text-white px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest bg-white/25 px-2 py-0.5 rounded-full inline-block mb-1">
                PBT Emergency Rule Triggered
              </span>
              <h2 id="alert-dialog-title" className="text-lg font-bold leading-tight">
                High Alert Drain Unnoticed!
              </h2>
            </div>
          </div>
          {unnoticedDrains.length > 1 && (
            <span className="bg-black/30 text-white text-xs px-2 py-1 rounded-full font-mono">
              1 of {unnoticedDrains.length}
            </span>
          )}
        </div>

        {/* Content body */}
        <div className="p-5 space-y-4">
          <div className="bg-[#FFF2EE] border border-[#F5C2B7] p-3.5 rounded-xl space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-mono font-bold text-[#8A2C18]">
                {currentDrain.drainCode}
              </span>
              <span className="text-xs font-bold text-[#8A2C18] bg-[#FCD8CF] px-2 py-0.5 rounded">
                Overflow in ~{currentDrain.prediction.timeToOverflowMinutes} Mins
              </span>
            </div>
            <h3 className="font-bold text-base text-[#2E1F1A] leading-snug">
              {currentDrain.name}
            </h3>
            <p className="text-xs text-[#6B4F47] font-medium">
              📍 {currentDrain.kolejZone} • {currentDrain.sector}
            </p>
          </div>

          {/* Telemetry numbers: Water level & Water flow */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-[#FBF9F4] rounded-xl border border-[#E7E2D5]">
              <span className="text-[11px] text-[#7A7467] font-medium flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-[#B8422A]" /> Water Level
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-[#B8422A]">
                  {currentDrain.waterLevelPercent}%
                </span>
                <span className="text-xs text-[#8A2C18] font-bold">CRITICAL</span>
              </div>
              <div className="w-full bg-[#E8E3D8] h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#B8422A] h-full rounded-full"
                  style={{ width: `${currentDrain.waterLevelPercent}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-[#FBF9F4] rounded-xl border border-[#E7E2D5]">
              <span className="text-[11px] text-[#7A7467] font-medium flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-[#8F3925]" /> Water Flow
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-[#8F3925]">
                  {currentDrain.waterFlowM3s.toFixed(2)}
                </span>
                <span className="text-[11px] text-[#7A7467]">m³/s</span>
              </div>
              <p className="text-[11px] text-[#9A422F] font-semibold mt-1 flex items-center gap-1">
                Severely Restricted Flow
              </p>
            </div>
          </div>

          {/* PIC notice reminder */}
          <div className="text-xs text-[#524B42] bg-[#F4EFE6] p-3 rounded-xl border border-[#E3DC handle]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#665D52]">
                Assigned Contractor PIC:
              </span>
              <span className="font-bold text-[#1E2922]">{currentDrain.picName}</span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-[#665D52]">Clearance Contract:</span>
              <span className="font-mono font-bold text-[#204E38]">
                RM {currentDrain.contractPriceRM.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-[#A33D27] font-medium mt-2">
              ⚠️ PBT SLA requires immediate contractor acknowledgment before flood waters breach pavement.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-[#F8F5EE] border-t border-[#EAE3D5] flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onAcknowledge(currentDrain.id)}
            type="button"
            className="flex-1 py-3 px-4 rounded-xl bg-[#204E38] hover:bg-[#2A6549] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            aria-label={`Acknowledge alert for ${currentDrain.name}`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#A8D5BA]" />
            Acknowledge Alert (I Have Noticed)
          </button>

          <button
            onClick={() => onViewPrediction(currentDrain)}
            type="button"
            className="py-3 px-4 rounded-xl bg-[#FFFDFB] hover:bg-[#F3EDE2] text-[#8F3925] border border-[#DECFBE] font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#B8422A]" />
            Predict Consequence
          </button>
        </div>

        {unnoticedDrains.length > 1 && (
          <div className="px-4 py-2 bg-[#F3ECE0] text-center border-t border-[#E5DDD0]">
            <button
              onClick={onAcknowledgeAll}
              className="text-xs font-semibold text-[#204E38] hover:underline"
            >
              Acknowledge All ({unnoticedDrains.length}) Unnoticed High Alerts
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
