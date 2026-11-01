import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  HardHat,
  History,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { MaintenanceEvent } from '../types/drain';

interface MaintenanceHistorySectionProps {
  events: MaintenanceEvent[];
  drainName: string;
  drainCode: string;
  kolejZone: string;
  isOpen: boolean;
  onClose: () => void;
  variant?: 'inline' | 'modal';
}

export const MaintenanceHistorySection: React.FC<MaintenanceHistorySectionProps> = ({
  events,
  drainName,
  drainCode,
  kolejZone,
  isOpen,
  onClose,
  variant = 'inline',
}) => {
  if (!isOpen) return null;

  const content = (
    <div className="space-y-2.5 text-xs">
      <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-2">
        <div className="flex items-center gap-1.5 font-bold text-[#1B3B2B]">
          <History className="w-4 h-4 text-[#2D6A4F]" />
          <span>Last 3 Maintenance Work Orders</span>
        </div>
        <span className="text-[10px] bg-[#E3EFE8] text-[#245841] font-mono px-2 py-0.5 rounded font-bold border border-[#C5DDCF]">
          PBT Logged
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-[#7A7366] italic py-2">No prior maintenance events logged.</p>
      ) : (
        <div className="space-y-2">
          {events.map((event, index) => (
            <div
              key={event.id || index}
              className="p-2.5 bg-[#FAF7F0] rounded-xl border border-[#E5DFD2] space-y-1.5 transition-all hover:border-[#2D6A4F]/40"
            >
              {/* Event Header: Date & Status */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1 text-[#696155] font-medium">
                  <Calendar className="w-3 h-3 text-[#2D6A4F]" />
                  <span className="font-mono font-bold text-[#2D2821]">{event.date}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    event.status === 'Verified by PBT'
                      ? 'bg-[#E3EFE8] text-[#204E38] border border-[#BFDFCD]'
                      : 'bg-[#F2ECE1] text-[#696052] border border-[#DDD5C5]'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {event.status}
                </span>
              </div>

              {/* Action Title */}
              <div className="font-bold text-[#1E2922] text-xs flex items-start gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0 mt-0.5" />
                <span>{event.actionType}</span>
              </div>

              {/* Notes */}
              <p className="text-[11px] text-[#554D41] leading-relaxed pl-5 bg-white/60 p-1.5 rounded-lg border border-[#EDE7DB]">
                {event.notes}
              </p>

              {/* PIC & Cost in RM */}
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#EFE9DE] text-[#6E6659]">
                <span className="flex items-center gap-1">
                  <HardHat className="w-3 h-3 text-[#2D6A4F]" />
                  <span>PIC: {event.contractorPIC}</span>
                </span>
                <span className="font-mono font-bold text-[#1B3B2B] bg-[#E8EFEA] px-1.5 py-0.2 rounded border border-[#C5D9CC]">
                  RM {event.costRM.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (variant === 'modal') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs"
      >
        <div className="bg-[#FFFDFB] text-[#1E2922] w-full max-w-md rounded-2xl shadow-2xl border border-[#D5CDC0] overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="bg-[#1B3B2B] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#95D5B2]" />
              <div>
                <h3 id="history-modal-title" className="text-sm font-bold text-white">
                  Maintenance History
                </h3>
                <p className="text-[10px] text-[#B7C7BD]">
                  {drainCode} • {kolejZone}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-[#D2DFD8] hover:bg-white/10"
              aria-label="Close history modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto">{content}</div>

          <div className="p-3 bg-[#FAF7F0] border-t border-[#EAE3D5] text-right">
            <button
              onClick={onClose}
              type="button"
              className="py-1.5 px-3 rounded-lg bg-[#204E38] text-white font-bold text-xs"
            >
              Close History
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inline expandable section
  return (
    <div className="mt-2.5 pt-2.5 border-t border-[#E8E2D5] bg-[#FDFCF9] -mx-4 -mb-4 p-4 rounded-b-2xl border-b border-x border-[#DEE6E0]">
      {content}
    </div>
  );
};
