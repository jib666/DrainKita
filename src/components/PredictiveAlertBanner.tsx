import React from 'react';
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  Droplets,
  HardHat,
  Hourglass,
  Sparkles,
  TrendingUp,
  Waves,
  Wind,
  Wrench,
} from 'lucide-react';
import { PredictiveAlert } from '../types/drain';

interface PredictiveAlertBannerProps {
  predictiveAlert: PredictiveAlert;
  drainCode: string;
  drainName: string;
  kolejZone: string;
  currentLevel: number;
  currentFlow: number;
  onPreemptiveClearance: () => void;
}

export const PredictiveAlertBanner: React.FC<PredictiveAlertBannerProps> = ({
  predictiveAlert,
  drainCode,
  drainName,
  kolejZone,
  currentLevel,
  currentFlow,
  onPreemptiveClearance,
}) => {
  if (!predictiveAlert.isTriggered) return null;

  return (
    <div className="rounded-xl border-2 border-dashed border-[#D95338] bg-[#FFF8F6] p-3 space-y-2 shadow-xs transition-all animate-fade-in relative overflow-hidden">
      {/* Top Warning Ribbon */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="p-1 rounded-lg bg-[#FBEBE7] text-[#B8422A]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-[#9E3621] uppercase tracking-wider flex items-center gap-1">
                Predictive Alert: High Alert in ~{predictiveAlert.estimatedHoursUntilHigh} hrs
              </span>
            </div>
            <span className="text-[10px] text-[#7A5B53] font-medium block">
              24h surging trend + constricted flow pattern
            </span>
          </div>
        </div>

        <span className="text-[10px] bg-[#B8422A] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-tight flex items-center gap-1">
          <Hourglass className="w-3 h-3" />
          Preemptive Window: {predictiveAlert.estimatedHoursUntilHigh}h
        </span>
      </div>

      {/* Trajectory Forecast Card */}
      <div className="grid grid-cols-2 gap-2 text-xs bg-white/90 p-2 rounded-lg border border-[#F3DDD7]">
        <div>
          <span className="text-[10px] text-[#7A5B53] flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-[#B8422A]" /> Water Level Trajectory
          </span>
          <div className="font-mono text-xs font-bold text-[#1E2922] mt-0.5 flex items-center gap-1">
            <span className="text-[#6D6559]">{currentLevel}%</span>
            <ArrowRight className="w-3 h-3 text-[#B8422A]" />
            <span className="text-[#B8422A] text-sm font-extrabold">
              {predictiveAlert.projectedLevelIn4h}% in 4h
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-[#7A5B53] flex items-center gap-1">
            <Wind className="w-3 h-3 text-[#3A6B53]" /> Hydraulic Capacity
          </span>
          <div className="font-mono text-xs font-bold text-[#1E2922] mt-0.5">
            <span>{currentFlow.toFixed(2)} m³/s</span>{' '}
            <span className="text-[10px] font-sans font-semibold text-[#8A2C18]">
              (Choke Hazard)
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Preemptive Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#F2DDD7]">
        <p className="text-[11px] text-[#554D41] leading-tight flex-1">
          <strong className="text-[#2D2821]">Preemptive Action:</strong> {predictiveAlert.preemptiveAction}
        </p>

        <button
          type="button"
          onClick={onPreemptiveClearance}
          className="self-end sm:self-auto px-3 py-1.5 rounded-lg bg-[#204E38] hover:bg-[#2B664A] text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer shrink-0"
          title="Clear drain now before water level breaches High Alert"
        >
          <Wrench className="w-3.5 h-3.5 text-[#95D5B2]" />
          <span>Preemptive Jetting</span>
        </button>
      </div>
    </div>
  );
};
