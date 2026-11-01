import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Eye,
  Info,
  Maximize2,
  Sparkles,
  Waves,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import { AlertLevel, DrainRecord } from '../types/drain';
import { calculateAlertLevel, generateAreaWeather } from '../utils/drainRules';
import { WeatherWidget } from './WeatherWidget';

interface DrainFlowMapProps {
  drains: DrainRecord[];
  onViewPrediction: (drain: DrainRecord) => void;
  onAcknowledge: (drainId: string) => void;
  onSimulateClearance: (drainId: string) => void;
}

export const DrainFlowMap: React.FC<DrainFlowMapProps> = ({
  drains,
  onViewPrediction,
  onAcknowledge,
  onSimulateClearance,
}) => {
  const [selectedDrainId, setSelectedDrainId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'high' | 'choked'>('all');

  const selectedDrain = drains.find((d) => d.id === selectedDrainId) || null;

  // Map canvas dimensions
  const MAP_WIDTH = 800;
  const MAP_HEIGHT = 620;

  // Drain dictionary for quick lookups
  const drainMap = new Map<string, DrainRecord>();
  drains.forEach((d) => drainMap.set(d.id, d));

  // Determine flow vectors from upstream to downstream
  const flowVectors = drains
    .filter((d) => d.mapCoords && d.mapCoords.flowsToId)
    .map((source) => {
      const target = drainMap.get(source.mapCoords!.flowsToId!);
      if (!target || !target.mapCoords) return null;

      const x1 = (source.mapCoords!.x / 100) * MAP_WIDTH;
      const y1 = (source.mapCoords!.y / 100) * MAP_HEIGHT;
      const x2 = (target.mapCoords.x / 100) * MAP_WIDTH;
      const y2 = (target.mapCoords.y / 100) * MAP_HEIGHT;

      const sourceLevel = calculateAlertLevel(source.waterLevelPercent, source.waterFlowM3s);
      const isChoked = source.waterFlowM3s <= 0.25;

      return {
        id: `${source.id}->${target.id}`,
        source,
        target,
        x1,
        y1,
        x2,
        y2,
        isChoked,
        sourceLevel,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    source: DrainRecord;
    target: DrainRecord;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    isChoked: boolean;
    sourceLevel: AlertLevel;
  }>;

  // Filtered nodes
  const visibleDrains = drains.filter((d) => {
    if (!d.mapCoords) return false;
    const level = calculateAlertLevel(d.waterLevelPercent, d.waterFlowM3s);
    if (filterMode === 'high') return level === 'high';
    if (filterMode === 'choked') return d.waterFlowM3s <= 0.25;
    return true;
  });

  return (
    <div className="bg-[#FAF8F3] rounded-2xl border border-[#DFD8CB] p-3 sm:p-4 space-y-3 shadow-xs">
      {/* Top Map Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2D5] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#204E38] rounded-lg text-white">
            <Waves className="w-4 h-4 text-[#95D5B2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1B3B2B] flex items-center gap-1.5">
              <span>PBT Catchment Flow Map</span>
              <span className="text-[10px] bg-[#E2ECE6] text-[#245841] font-semibold px-2 py-0.5 rounded-full border border-[#BEDECC]">
                Live Hydraulics
              </span>
            </h3>
            <p className="text-[11px] text-[#696155]">
              Directional flow vectors from hillside Kolej catchments down to retention basin weir
            </p>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filterMode === 'all'
                ? 'bg-[#204E38] text-white'
                : 'bg-[#EEE8DB] text-[#554D41] hover:bg-[#E2D9CB]'
            }`}
          >
            All Drains (15)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('high')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              filterMode === 'high'
                ? 'bg-[#B8422A] text-white'
                : 'bg-[#FBEBE7] text-[#9E3621] hover:bg-[#F6DCD6]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#B8422A]" />
            High Alert
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('choked')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
              filterMode === 'choked'
                ? 'bg-[#C27D26] text-white'
                : 'bg-[#FDF3E5] text-[#9A5F16] hover:bg-[#F9E6CD]'
            }`}
          >
            <Wind className="w-3 h-3" />
            Choked Flow
          </button>
        </div>
      </div>

      {/* Interactive Flow Map Canvas (SVG) */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#F2EDE2] rounded-xl border border-[#DDD5C5] overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full"
          style={{ touchAction: 'pan-x pan-y' }}
        >
          <defs>
            {/* Pattern grid for engineering map look */}
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5DECf" strokeWidth="0.8" />
            </pattern>

            {/* Normal flow marker arrow */}
            <marker
              id="flow-arrow-normal"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#2D6A4F" />
            </marker>

            {/* Choked flow marker arrow */}
            <marker
              id="flow-arrow-choked"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#B8422A" />
            </marker>

            {/* Pulsing beacon glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />

          {/* Catchment Elevation Bands */}
          <path
            d="M 0 140 Q 250 170 500 130 T 800 160 L 800 0 L 0 0 Z"
            fill="#E8E2D2"
            opacity="0.6"
          />
          <path
            d="M 0 380 Q 280 410 520 370 T 800 400 L 800 160 L 0 140 Z"
            fill="#ECE7DA"
            opacity="0.4"
          />
          <path
            d="M 0 620 L 800 620 L 800 400 Q 520 370 280 410 T 0 380 Z"
            fill="#E3DEC8"
            opacity="0.5"
          />

          {/* Catchment Zone Labels */}
          <text x="25" y="32" fill="#887F72" fontSize="11" fontWeight="700" letterSpacing="0.08em">
            ZONE A: NORTH HILLSIDE & INGRESS CATCHMENT (EL. +45M)
          </text>
          <text x="25" y="240" fill="#887F72" fontSize="11" fontWeight="700" letterSpacing="0.08em">
            ZONE B: CENTRAL KOLEJ RESIDENTIAL & COMMERCIAL BASIN (EL. +24M)
          </text>
          <text x="25" y="470" fill="#887F72" fontSize="11" fontWeight="700" letterSpacing="0.08em">
            ZONE C: LOW-LYING RETENTION POND & RIVER DISCHARGE (EL. +8M)
          </text>

          {/* Flow Vectors connecting upstream to downstream */}
          {flowVectors.map((vec) => {
            const isSelected = selectedDrainId === vec.source.id || selectedDrainId === vec.target.id;
            const strokeColor = vec.isChoked ? '#B8422A' : '#2D6A4F';
            const strokeDash = vec.isChoked ? '6 4' : '8 4';

            // Curvature control point
            const midX = (vec.x1 + vec.x2) / 2 + (vec.x2 - vec.x1 > 0 ? 15 : -15);
            const midY = (vec.y1 + vec.y2) / 2;
            const pathD = `M ${vec.x1} ${vec.y1} Q ${midX} ${midY} ${vec.x2} ${vec.y2}`;

            return (
              <g key={vec.id}>
                {/* Background wider track */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#1B3B2B' : '#D0C8B6'}
                  strokeWidth={isSelected ? 4 : 2.5}
                  strokeLinecap="round"
                />

                {/* Animated Directional Flow Vector */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={vec.isChoked ? 3 : 2.2}
                  strokeDasharray={strokeDash}
                  markerEnd={vec.isChoked ? 'url(#flow-arrow-choked)' : 'url(#flow-arrow-normal)'}
                  strokeLinecap="round"
                  className={vec.isChoked ? 'opacity-90' : 'opacity-80'}
                />

                {/* Bottleneck warning indicator on choked vectors */}
                {vec.isChoked && (
                  <g transform={`translate(${midX - 10}, ${midY - 10})`}>
                    <circle cx="10" cy="10" r="10" fill="#B8422A" />
                    <text x="10" y="14" fill="#FFFFFF" fontSize="10" fontWeight="900" textAnchor="middle">
                      !
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Final PBT River Discharge Canal Marker at TT-02 */}
          <g transform={`translate(${MAP_WIDTH * 0.58}, ${MAP_HEIGHT * 0.88 + 26})`}>
            <text x="0" y="16" fill="#245841" fontSize="11" fontWeight="800" textAnchor="middle">
              ⬇ Main PBT Sungai Pulai Weir Outlet
            </text>
          </g>

          {/* Drain Nodes */}
          {visibleDrains.map((drain) => {
            const x = (drain.mapCoords!.x / 100) * MAP_WIDTH;
            const y = (drain.mapCoords!.y / 100) * MAP_HEIGHT;
            const alertLevel = calculateAlertLevel(drain.waterLevelPercent, drain.waterFlowM3s);
            const isSelected = selectedDrainId === drain.id;
            const isHighAlert = alertLevel === 'high';
            const isUnacknowledged = isHighAlert && !drain.acknowledgedByPic;

            const nodeBg = {
              high: '#B8422A',
              medium: '#C27D26',
              normal: '#2D6A4F',
            }[alertLevel];

            return (
              <g
                key={drain.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => setSelectedDrainId(drain.id)}
                className="cursor-pointer transition-transform duration-200 hover:scale-110"
                role="button"
                aria-label={`Drain node ${drain.drainCode} at ${drain.kolejZone}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedDrainId(drain.id);
                  }
                }}
              >
                {/* Pulsing ring for high alert or unacknowledged */}
                {isHighAlert && (
                  <circle
                    r={isSelected ? 26 : 22}
                    fill="none"
                    stroke="#B8422A"
                    strokeWidth="2.5"
                    opacity={isUnacknowledged ? '0.8' : '0.4'}
                  />
                )}

                {/* Selected Halo */}
                {isSelected && (
                  <circle
                    r="28"
                    fill="none"
                    stroke="#1E2922"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                  />
                )}

                {/* Node Solid Circle */}
                <circle
                  r={isHighAlert ? 17 : 14}
                  fill={nodeBg}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  filter={isHighAlert ? 'url(#glow)' : undefined}
                />

                {/* Water Level Numeric Label Inside Circle */}
                <text
                  x="0"
                  y={isHighAlert ? 4 : 3.5}
                  fill="#FFFFFF"
                  fontSize={isHighAlert ? '10' : '9'}
                  fontWeight="800"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {drain.waterLevelPercent}%
                </text>

                {/* Drain Code & Zone Pill Beneath Node */}
                <g transform="translate(0, 22)">
                  <rect
                    x="-42"
                    y="0"
                    width="84"
                    height="16"
                    rx="4"
                    fill={isSelected ? '#1B3B2B' : '#FFFFFF'}
                    stroke={isSelected ? '#2D6A4F' : '#D0C8B6'}
                    strokeWidth="1"
                    opacity="0.95"
                  />
                  <text
                    x="0"
                    y="11.5"
                    fill={isSelected ? '#FFFFFF' : '#2D2821'}
                    fontSize="8.5"
                    fontWeight="700"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {drain.drainCode.replace('PBT-', '')}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay at bottom left */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs border border-[#D5CDC0] rounded-xl p-2.5 text-[11px] space-y-1 shadow-xs pointer-events-none">
          <div className="font-bold text-[#2A241D] flex items-center gap-1 text-[10px] uppercase tracking-wider">
            <Info className="w-3 h-3 text-[#2D6A4F]" /> Hydraulic Flow Legend
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1 font-semibold text-[#8A2C18]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B8422A] inline-block" />
              High Alert / Choked (&gt;80%)
            </span>
            <span className="flex items-center gap-1 font-semibold text-[#8E5B1A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C27D26] inline-block" />
              Medium Warning
            </span>
            <span className="flex items-center gap-1 font-semibold text-[#245841]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F] inline-block" />
              Normal Flow
            </span>
          </div>
          <div className="text-[10px] text-[#696155] pt-0.5 border-t border-[#E8E2D5] flex items-center gap-1">
            <ArrowRight className="w-3 h-3 text-[#2D6A4F]" />
            Dashed Arrows indicate water flow direction downhill
          </div>
        </div>
      </div>

      {/* Selected Drain Inspection Mini Drawer (when a node on the map is tapped) */}
      {selectedDrain && (
        <div className="p-3.5 bg-white rounded-xl border-2 border-[#204E38] shadow-md space-y-3 animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-[#E8EFEA] text-[#1B3B2B] px-2 py-0.5 rounded border border-[#C5D9CC]">
                  {selectedDrain.drainCode}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                    calculateAlertLevel(selectedDrain.waterLevelPercent, selectedDrain.waterFlowM3s) === 'high'
                      ? 'bg-[#FBE8E4] text-[#A63721]'
                      : calculateAlertLevel(selectedDrain.waterLevelPercent, selectedDrain.waterFlowM3s) === 'medium'
                      ? 'bg-[#FEF5E7] text-[#9E6116]'
                      : 'bg-[#EBF5EF] text-[#246345]'
                  }`}
                >
                  {calculateAlertLevel(selectedDrain.waterLevelPercent, selectedDrain.waterFlowM3s)} Alert
                </span>
                <WeatherWidget
                  weather={
                    selectedDrain.weather ||
                    generateAreaWeather(
                      selectedDrain.waterLevelPercent,
                      calculateAlertLevel(selectedDrain.waterLevelPercent, selectedDrain.waterFlowM3s)
                    )
                  }
                  drainCode={selectedDrain.drainCode}
                  kolejZone={selectedDrain.kolejZone}
                />
              </div>
              <h4 className="font-bold text-sm text-[#1E2922] mt-1 leading-snug">
                {selectedDrain.name}
              </h4>
              <p className="text-xs text-[#5D554B]">
                📍 {selectedDrain.kolejZone} • {selectedDrain.sector}
              </p>
            </div>

            <button
              onClick={() => setSelectedDrainId(null)}
              type="button"
              className="p-1 rounded-lg text-[#888073] hover:bg-[#F2EDE2]"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fast telemetry snippet */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-[#FAF8F3] rounded-lg border border-[#E9E4D7]">
              <span className="text-[10px] text-[#726A5F] block">Water Level</span>
              <span className="font-mono font-black text-sm text-[#B8422A]">
                {selectedDrain.waterLevelPercent}%
              </span>
            </div>
            <div className="p-2 bg-[#FAF8F3] rounded-lg border border-[#E9E4D7]">
              <span className="text-[10px] text-[#726A5F] block">Flow Rate</span>
              <span className="font-mono font-black text-sm text-[#1E2922]">
                {selectedDrain.waterFlowM3s.toFixed(2)} m³/s
              </span>
            </div>
            <div className="p-2 bg-[#FAF8F3] rounded-lg border border-[#E9E4D7]">
              <span className="text-[10px] text-[#726A5F] block">Contract RM</span>
              <span className="font-mono font-bold text-xs text-[#204E38]">
                RM {selectedDrain.contractPriceRM.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action buttons from map */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#EAE4D7]">
            <button
              onClick={() => onViewPrediction(selectedDrain)}
              type="button"
              className="flex-1 py-2 px-3 rounded-xl bg-[#204E38] hover:bg-[#2B664A] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#95D5B2]" />
              Predict Consequence
            </button>

            {!selectedDrain.acknowledgedByPic &&
              calculateAlertLevel(selectedDrain.waterLevelPercent, selectedDrain.waterFlowM3s) === 'high' && (
                <button
                  onClick={() => onAcknowledge(selectedDrain.id)}
                  type="button"
                  className="py-2 px-3 rounded-xl bg-[#B8422A] hover:bg-[#8F3925] text-white font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Acknowledge
                </button>
              )}

            <button
              onClick={() => onSimulateClearance(selectedDrain.id)}
              type="button"
              className="py-2 px-3 rounded-xl border border-[#D5CDC0] bg-[#FAF8F3] hover:bg-[#EDE8DC] text-[#423C34] text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-[#2D6A4F]" />
              {selectedDrain.waterLevelPercent > 40 ? 'Clear Sump' : 'Re-test'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
