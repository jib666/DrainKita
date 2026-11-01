import React from 'react';
import { AlertTriangle, Bell, BellOff, Droplets, ShieldCheck, Waves } from 'lucide-react';

interface HeaderProps {
  highAlertCount: number;
  unacknowledgedCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerSimulatedAlert: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  highAlertCount,
  unacknowledgedCount,
  soundEnabled,
  onToggleSound,
  onTriggerSimulatedAlert,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#1B3B2B] text-[#F3F4EE] border-b border-[#2C523C] shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Top brand line */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-inner border border-[#408564]">
              <Waves className="w-6 h-6 text-[#95D5B2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                  NoSumbat
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#2D6A4F] text-[#B7E4C7] px-2 py-0.5 rounded-full border border-[#408564]">
                  PBT Contractor
                </span>
              </div>
              <p className="text-xs text-[#B7C7BD]">
                Drain Blockage & Flash Flood Response
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSound}
              type="button"
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'bg-[#2D6A4F] border-[#408564] text-white hover:bg-[#387F5F]'
                  : 'bg-[#152C21] border-[#254A37] text-[#8EA095] hover:text-white'
              }`}
              title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              aria-label={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
            >
              {soundEnabled ? (
                <Bell className="w-4 h-4 text-[#95D5B2]" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onTriggerSimulatedAlert}
              type="button"
              className="px-2.5 py-1.5 rounded-lg bg-[#8F3925] hover:bg-[#A5432D] text-white text-xs font-medium border border-[#B34E35] flex items-center gap-1 shadow-sm transition-all active:scale-95"
              title="Test the unnoticed alert popup rule"
              aria-label="Simulate unacknowledged high alert"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#FFCDBC]" />
              <span className="hidden sm:inline">Simulate</span> Alert
            </button>
          </div>
        </div>

        {/* Live system status strip */}
        <div className="mt-2.5 pt-2 border-t border-[#274836] flex items-center justify-between text-xs text-[#C2D1C8]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#52B788] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#52B788]"></span>
              </span>
              15 Monitored PBT Drains
            </span>
          </div>

          <div className="flex items-center gap-2">
            {unacknowledgedCount > 0 ? (
              <span className="flex items-center gap-1 bg-[#8F3925] text-white px-2 py-0.5 rounded-md font-semibold text-[11px] animate-pulse">
                <AlertTriangle className="w-3 h-3 text-[#FFCDBC]" />
                {unacknowledgedCount} Unnoticed High Alert!
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[#95D5B2] text-[11px] bg-[#1E3E2E] px-2 py-0.5 rounded-md border border-[#2D5A43]">
                <ShieldCheck className="w-3 h-3" />
                All High Alerts Acknowledged
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
