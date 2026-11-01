import React from 'react';
import {
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  DollarSign,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { DrainRecord } from '../types/drain';
import { calculateAlertLevel, calculatePredictiveAlert } from '../utils/drainRules';

interface DrainSummaryStatsProps {
  drains: DrainRecord[];
  onSelectFilter: (filter: 'all' | 'high' | 'medium' | 'normal' | 'scheduled') => void;
  selectedFilter?: string;
}

export const DrainSummaryStats: React.FC<DrainSummaryStatsProps> = ({
  drains,
  onSelectFilter,
  selectedFilter,
}) => {
  const highCount = drains.filter((d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) === 'high').length;
  const medCount = drains.filter((d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) === 'medium').length;
  const normalCount = drains.filter((d) => calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s) === 'normal').length;
  const scheduledDrains = drains.filter((d) => Boolean(d.scheduledMaintenance));
  const scheduledCount = scheduledDrains.length;
  const nextScheduled = scheduledDrains[0]?.scheduledMaintenance?.formattedDateTime;

  const predictiveCount = drains.filter((d) => {
    const alertLevel = calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s);
    if (alertLevel === 'high') return false;
    const alert = d.predictiveAlert || calculatePredictiveAlert(d.waterLevelPercent, d.waterFlowM3s, d.waterLevelHistory24h);
    return alert.isTriggered;
  }).length;
  const totalRM = drains.reduce((acc, d) => acc + d.contractPriceRM, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-[#F2EDE2]">
      {/* High Alert Card */}
      <button
        type="button"
        onClick={() => onSelectFilter('high')}
        className="p-3 bg-white rounded-xl border border-[#F3C4B9] text-left shadow-xs hover:border-[#B8422A] transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between text-[#8A2C18] text-xs font-bold">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-[#B8422A]" /> High Alert
          </span>
          <span className="w-2 h-2 rounded-full bg-[#B8422A] group-hover:scale-125 transition-transform" />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-black text-[#B8422A]">{highCount}</span>
          <span className="text-[11px] text-[#7A5B53]">drains choked</span>
        </div>
        <p className="text-[10px] text-[#9E3621] font-semibold mt-1">SLA: Immediate jetting</p>
      </button>

      {/* Medium Level Card */}
      <button
        type="button"
        onClick={() => onSelectFilter('medium')}
        className="p-3 bg-white rounded-xl border border-[#F6DEBA] text-left shadow-xs hover:border-[#C27D26] transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between text-[#8E5B1A] text-xs font-bold">
          <span className="flex items-center gap-1">
            <Clock3 className="w-3.5 h-3.5 text-[#C27D26]" /> Medium Level
          </span>
          <span className="w-2 h-2 rounded-full bg-[#C27D26] group-hover:scale-125 transition-transform" />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-black text-[#C27D26]">{medCount}</span>
          <span className="text-[11px] text-[#78634B]">restricted</span>
        </div>
        <p className="text-[10px] text-[#8E5B1A] font-semibold mt-1">
          SLA: Clear in 4h {predictiveCount > 0 && `• ${predictiveCount} Preemptive Alerts`}
        </p>
      </button>

      {/* Normal Level Card */}
      <button
        type="button"
        onClick={() => onSelectFilter('normal')}
        className="p-3 bg-white rounded-xl border border-[#C5DEC9] text-left shadow-xs hover:border-[#2D6A4F] transition-colors group cursor-pointer"
      >
        <div className="flex items-center justify-between text-[#245841] text-xs font-bold">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" /> Normal Level
          </span>
          <span className="w-2 h-2 rounded-full bg-[#2D6A4F] group-hover:scale-125 transition-transform" />
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-black text-[#2D6A4F]">{normalCount}</span>
          <span className="text-[11px] text-[#556F5E]">flowing well</span>
        </div>
        <p className="text-[10px] text-[#245841] font-semibold mt-1">Status: Routine</p>
      </button>

      {/* Total Contract Value in RM */}
      <div className="p-3 bg-[#E9E4D6] rounded-xl border border-[#D5CEBD] text-left shadow-xs">
        <div className="flex items-center justify-between text-[#534B41] text-xs font-bold">
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-[#375443]" /> Contract Value
          </span>
          <span className="text-[10px] bg-[#DDD6C5] px-1.5 py-0.5 rounded font-mono text-[#4A4238]">PBT</span>
        </div>
        <div className="mt-1">
          <span className="text-lg font-black text-[#1E3A2B] font-mono">
            RM {totalRM.toLocaleString()}
          </span>
        </div>
        <p className="text-[10px] text-[#5D554B] font-semibold mt-1">15 Active Work Orders</p>
      </div>

      {/* Highlight Scheduled Tasks in Summary View */}
      <div className="col-span-2 sm:col-span-4 p-3 rounded-xl bg-[#EAF5EF] border border-[#B6DBC7] flex items-center justify-between gap-3 text-xs flex-wrap shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#2D6A4F] text-white shadow-2xs shrink-0">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-[#1B3B2B] text-xs">
                {scheduledCount > 0
                  ? `${scheduledCount} Routine Preventive Clearing ${scheduledCount === 1 ? 'Task' : 'Tasks'} Scheduled`
                  : '0 Routine Tasks Scheduled'}
              </span>
              {scheduledCount > 0 && nextScheduled && (
                <span className="text-[10px] bg-[#D6EBE0] text-[#1E543B] font-bold px-2 py-0.5 rounded-full border border-[#B7DECB]">
                  Next: {nextScheduled}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#426150] mt-0.5">
              {scheduledCount > 0
                ? 'Preventive clearing work orders confirmed for contractor crews before storm surge.'
                : 'Click "Schedule Maintenance" on any drain card to plan future routine clearing.'}
            </p>
          </div>
        </div>

        {scheduledCount > 0 ? (
          <button
            type="button"
            onClick={() => onSelectFilter('scheduled')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 ${
              selectedFilter === 'scheduled'
                ? 'bg-[#163626] text-white ring-2 ring-white/50'
                : 'bg-[#204E38] hover:bg-[#2B664A] text-white'
            }`}
          >
            <span>View {scheduledCount} Scheduled</span>
          </button>
        ) : (
          <span className="text-[10px] text-[#637A6D] font-medium hidden sm:inline">
            Status: No pending routine backlog
          </span>
        )}
      </div>
    </div>
  );
};
