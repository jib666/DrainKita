import React, { useState } from 'react';
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  HardHat,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { DrainRecord, ScheduledMaintenance } from '../types/drain';
import { formatScheduledDateTime } from '../utils/drainRules';

interface ScheduleMaintenanceModalProps {
  drain: DrainRecord;
  isOpen: boolean;
  onClose: () => void;
  onSaveSchedule: (drainId: string, schedule: ScheduledMaintenance | null) => void;
}

export const ScheduleMaintenanceModal: React.FC<ScheduleMaintenanceModalProps> = ({
  drain,
  isOpen,
  onClose,
  onSaveSchedule,
}) => {
  // Pre-fill tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const existing = drain.scheduledMaintenance;

  const [date, setDate] = useState<string>(existing?.scheduledDate || defaultDateStr);
  const [time, setTime] = useState<string>(existing?.scheduledTime || '09:00');
  const [taskType, setTaskType] = useState<string>(
    existing?.taskType || 'Routine Preventive Hydro-Jetting'
  );
  const [contractorPIC, setContractorPIC] = useState<string>(
    existing?.contractorPIC || drain.picName
  );
  const [estimatedCostRM, setEstimatedCostRM] = useState<number>(
    existing?.estimatedCostRM || Math.round(drain.contractPriceRM * 0.5)
  );
  const [notes, setNotes] = useState<string>(
    existing?.notes || 'Preventive flush and debris clearance before monsoon convective peak.'
  );

  if (!isOpen) return null;

  const handleApplyPreset = (daysFromNow: number, presetTime: string) => {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    setDate(target.toISOString().split('T')[0]);
    setTime(presetTime);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    const formatted = formatScheduledDateTime(date, time);
    const newSchedule: ScheduledMaintenance = {
      id: existing?.id || `sched-${drain.id}-${Date.now()}`,
      scheduledDate: date,
      scheduledTime: time,
      formattedDateTime: formatted,
      taskType,
      contractorPIC,
      estimatedCostRM: Number(estimatedCostRM) || 800,
      notes,
      createdAt: new Date().toISOString(),
    };

    onSaveSchedule(drain.id, newSchedule);
    onClose();
  };

  const handleRemoveSchedule = () => {
    onSaveSchedule(drain.id, null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in"
    >
      <div className="bg-[#FFFDFB] text-[#1E2922] w-full max-w-lg rounded-2xl shadow-2xl border border-[#D5CDC0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1B3B2B] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-[#95D5B2]">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="schedule-modal-title" className="text-base font-bold text-white leading-snug">
                Schedule Preventive Maintenance
              </h3>
              <p className="text-xs text-[#B7C7BD]">
                {drain.drainCode} • {drain.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-[#D2DFD8] hover:bg-white/10"
            aria-label="Close scheduling modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Date Presets */}
          <div>
            <label className="block text-[11px] font-bold text-[#554D41] uppercase tracking-wider mb-1.5">
              Quick Schedule Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset(1, '09:00')}
                className="px-2.5 py-1 rounded-lg border border-[#D5CDC0] bg-[#FAF8F3] hover:bg-[#EAE4D7] text-[#332C24] font-medium transition-colors"
              >
                Tomorrow 09:00 AM
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(2, '09:00')}
                className="px-2.5 py-1 rounded-lg border border-[#D5CDC0] bg-[#FAF8F3] hover:bg-[#EAE4D7] text-[#332C24] font-medium transition-colors"
              >
                In 2 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(5, '08:30')}
                className="px-2.5 py-1 rounded-lg border border-[#D5CDC0] bg-[#FAF8F3] hover:bg-[#EAE4D7] text-[#332C24] font-medium transition-colors"
              >
                Next Weekend
              </button>
            </div>
          </div>

          {/* Date & Time Picker Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="schedule-date"
                className="block text-[11px] font-bold text-[#3E382F] mb-1 flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Scheduled Date</span>
              </label>
              <input
                id="schedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#D5CDC0] bg-white font-medium text-xs text-[#2D2821] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            <div>
              <label
                htmlFor="schedule-time"
                className="block text-[11px] font-bold text-[#3E382F] mb-1 flex items-center gap-1"
              >
                <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Scheduled Time</span>
              </label>
              <input
                id="schedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#D5CDC0] bg-white font-medium text-xs text-[#2D2821] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>
          </div>

          {/* Task Type Selection */}
          <div>
            <label
              htmlFor="schedule-task-type"
              className="block text-[11px] font-bold text-[#3E382F] mb-1 flex items-center gap-1"
            >
              <Wrench className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Routine Preventive Task Type</span>
            </label>
            <select
              id="schedule-task-type"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D5CDC0] bg-white font-medium text-xs text-[#2D2821] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            >
              <option value="Routine Preventive Hydro-Jetting">
                Routine Preventive Hydro-Jetting (Clear line before storm)
              </option>
              <option value="Culvert Screen & Grate Desiltation">
                Culvert Screen & Grate Desiltation (Remove trapped debris)
              </option>
              <option value="Bi-Weekly Sump Raking & Weed Clearing">
                Bi-Weekly Sump Raking & Weed Clearing (Invert line maintenance)
              </option>
              <option value="Heavy Silt Vacuum Dredging">
                Heavy Silt Vacuum Dredging (Deep suction for retention sump)
              </option>
              <option value="Pre-Monsoon Catchment Flushing">
                Pre-Monsoon Catchment Flushing (Hydraulic baseline verify)
              </option>
            </select>
          </div>

          {/* Assigned PIC & Rate in RM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="schedule-pic"
                className="block text-[11px] font-bold text-[#3E382F] mb-1 flex items-center gap-1"
              >
                <HardHat className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>Assigned PIC</span>
              </label>
              <input
                id="schedule-pic"
                type="text"
                value={contractorPIC}
                onChange={(e) => setContractorPIC(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-[#D5CDC0] bg-white font-medium text-xs text-[#2D2821] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            <div>
              <label
                htmlFor="schedule-cost"
                className="block text-[11px] font-bold text-[#3E382F] mb-1 flex items-center gap-1"
              >
                <span>Estimated Cost (RM)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#7A7366] font-bold text-xs">RM</span>
                <input
                  id="schedule-cost"
                  type="number"
                  min="100"
                  step="50"
                  value={estimatedCostRM}
                  onChange={(e) => setEstimatedCostRM(Number(e.target.value))}
                  required
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#D5CDC0] bg-white font-mono font-bold text-xs text-[#2D2821] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>
          </div>

          {/* Work Order Instructions / Notes */}
          <div>
            <label
              htmlFor="schedule-notes"
              className="block text-[11px] font-bold text-[#3E382F] mb-1 flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Operational Instructions for Crew</span>
            </label>
            <textarea
              id="schedule-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#D5CDC0] bg-white font-medium text-xs text-[#2D2821] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none"
              placeholder="e.g. Ensure culvert screen is inspected and jetting team logs photos upon completion."
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#EAE3D5] flex items-center justify-between gap-2">
            {existing ? (
              <button
                type="button"
                onClick={handleRemoveSchedule}
                className="px-3 py-2 rounded-xl text-[#B8422A] hover:bg-[#FDF0ED] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Schedule</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl border border-[#D5CDC0] text-[#554D41] hover:bg-[#F2ECE1] font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#204E38] hover:bg-[#2B664A] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-[#95D5B2]" />
                <span>Confirm & Save Schedule</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
