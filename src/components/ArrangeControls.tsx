import React from 'react';
import { ArrowDownUp, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { AlertLevel, SortArrangement } from '../types/drain';

interface ArrangeControlsProps {
  currentArrangement: SortArrangement;
  onChangeArrangement: (arrangement: SortArrangement) => void;
  selectedFilter: 'all' | AlertLevel | 'kolej' | 'scheduled';
  onSelectFilter: (filter: 'all' | AlertLevel | 'kolej' | 'scheduled') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    high: number;
    medium: number;
    normal: number;
    kolej: number;
    scheduled: number;
  };
}

export const ArrangeControls: React.FC<ArrangeControlsProps> = ({
  currentArrangement,
  onChangeArrangement,
  selectedFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  return (
    <div className="bg-[#FAF8F3] border-b border-[#E8E2D5] px-4 py-3.5 space-y-3">
      {/* Primary arrangement bar: Feature 3 Highlight */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#2A4B3A]">
          <ArrowDownUp className="w-4 h-4 text-[#2D6A4F]" />
          <span>Drain Arrangement Priority:</span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="arrange-select" className="sr-only">
            Arrange drains
          </label>
          <select
            id="arrange-select"
            value={currentArrangement}
            onChange={(e) => onChangeArrangement(e.target.value as SortArrangement)}
            className="w-full sm:w-auto text-xs font-semibold bg-white border-2 border-[#2D6A4F] text-[#1B3B2B] rounded-xl px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#52B788] cursor-pointer"
          >
            <option value="high-to-normal">
              ⚡ High Alert to Normal (Water Level & Flow) [Standard]
            </option>
            <option value="normal-to-high">
              🌱 Normal to High Alert
            </option>
            <option value="water-level-desc">
              🌊 Highest Water Level First (%)
            </option>
            <option value="water-flow-asc">
              ⚠️ Lowest Flow First (Most Blocked m³/s)
            </option>
            <option value="price-desc">
              💰 Highest Contract Price (RM) First
            </option>
            <option value="scheduled-first">
              📅 Scheduled Routine Clearing First
            </option>
          </select>
        </div>
      </div>

      {/* Search and Category Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C8477] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search drain, kolej (e.g. KTDI, KRP), PIC, code..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-xl border border-[#DCD6C7] text-[#1E2922] placeholder-[#9B9386] focus:outline-none focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F]"
          />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedFilter === 'all'
                ? 'bg-[#204E38] text-white shadow-xs'
                : 'bg-[#EEE8DB] text-[#5A5347] hover:bg-[#E3DC handle]'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter('high')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
              selectedFilter === 'high'
                ? 'bg-[#B8422A] text-white shadow-xs'
                : 'bg-[#FBEBE7] text-[#9E3621] hover:bg-[#F6DCD6]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#B8422A] inline-block"></span>
            High Alert ({counts.high})
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter('medium')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
              selectedFilter === 'medium'
                ? 'bg-[#C27D26] text-white shadow-xs'
                : 'bg-[#FDF3E5] text-[#9A5F16] hover:bg-[#F9E6CD]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#C27D26] inline-block"></span>
            Medium ({counts.medium})
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter('normal')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
              selectedFilter === 'normal'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'bg-[#EAF3EE] text-[#245841] hover:bg-[#DBEDE2]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F] inline-block"></span>
            Normal ({counts.normal})
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter('kolej')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedFilter === 'kolej'
                ? 'bg-[#534741] text-white shadow-xs'
                : 'bg-[#ECE7DF] text-[#554C46] hover:bg-[#E0D9CE]'
            }`}
          >
            Kolej Zones ({counts.kolej})
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter('scheduled')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
              selectedFilter === 'scheduled'
                ? 'bg-[#204E38] text-white shadow-xs'
                : 'bg-[#E7F3ED] text-[#245841] hover:bg-[#D5EADB]'
            }`}
          >
            <span>📅 Scheduled ({counts.scheduled})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
