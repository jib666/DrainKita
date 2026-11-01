import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AlertLevel, PredictiveAlert } from '../types/drain';

interface WaterLevelSparklineProps {
  data: number[]; // 13 data points (-24h to 0h/now)
  alertLevel: AlertLevel;
  drainCode: string;
  predictiveAlert?: PredictiveAlert;
}

export const WaterLevelSparkline: React.FC<WaterLevelSparklineProps> = ({
  data,
  alertLevel,
  drainCode,
  predictiveAlert,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length < 2) return null;

  const width = 320;
  const height = 64;
  const paddingX = 10;
  const paddingTop = 8;
  const paddingBottom = 16;
  const chartHeight = height - paddingTop - paddingBottom;

  // If predictive alert is active, reserve 35px on right for +4h future projection
  const hasFutureProjection = predictiveAlert?.isTriggered;
  const chartWidth = hasFutureProjection ? width - paddingX * 2 - 35 : width - paddingX * 2;

  const minVal = Math.max(0, Math.min(...data) - 5);
  const maxVal = Math.min(
    100,
    Math.max(...data, hasFutureProjection ? predictiveAlert.projectedLevelIn4h : 0) + 5
  );
  const range = Math.max(1, maxVal - minVal);

  // Compute point coordinates
  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;
    return { x, y, val };
  });

  // Future projection point (+4h)
  const futurePoint = hasFutureProjection
    ? {
        x: width - paddingX,
        y:
          paddingTop +
          chartHeight -
          ((predictiveAlert.projectedLevelIn4h - minVal) / range) * chartHeight,
        val: predictiveAlert.projectedLevelIn4h,
      }
    : null;

  // Build smooth cubic bezier SVG path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  // Area path for gradient fill
  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  // Trend color palette
  const strokeColor = {
    high: '#B8422A', // terracotta
    medium: '#C27D26', // warm amber
    normal: '#2D6A4F', // forest green
  }[alertLevel];

  const gradientId = `spark-grad-${drainCode.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Trend metrics
  const firstVal = data[0];
  const lastVal = data[data.length - 1];
  const diff = lastVal - firstVal;
  const minHistorical = Math.min(...data);
  const maxHistorical = Math.max(...data);

  // Hours corresponding to hovered index (13 points spaced 2 hours apart: idx 0 = -24h, idx 12 = Now)
  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];
  const activeHoursAgo = hoverIndex !== null ? (12 - hoverIndex) * 2 : 0;

  return (
    <div className="bg-[#FAF8F3] rounded-xl border border-[#E4DDD0] p-2.5 space-y-1.5 text-xs">
      {/* Top Header of Sparkline Section */}
      <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
        <div className="flex items-center gap-1.5 font-bold text-[#3E382F]">
          <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
          <span>24h Water Level Trend</span>
        </div>

        {/* Dynamic Trend Indicator */}
        <div className="flex items-center gap-1">
          {hasFutureProjection ? (
            <span className="flex items-center gap-0.5 text-[#9E3621] font-bold bg-[#FCECE9] px-1.5 py-0.5 rounded text-[10px] border border-[#F6C6BC]">
              <Sparkles className="w-3 h-3 text-[#B8422A]" />
              +4h Forecast: {predictiveAlert.projectedLevelIn4h}% (High Risk)
            </span>
          ) : diff > 5 ? (
            <span className="flex items-center gap-0.5 text-[#8A2C18] font-bold bg-[#FCECE9] px-1.5 py-0.5 rounded text-[10px]">
              <ArrowUpRight className="w-3 h-3 text-[#B8422A]" />
              +{diff}% Surge
            </span>
          ) : diff < -5 ? (
            <span className="flex items-center gap-0.5 text-[#245841] font-bold bg-[#E7F3ED] px-1.5 py-0.5 rounded text-[10px]">
              <ArrowDownRight className="w-3 h-3 text-[#2D6A4F]" />
              {diff}% Receding
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[#696155] font-semibold bg-[#EFEAE0] px-1.5 py-0.5 rounded text-[10px]">
              <Minus className="w-3 h-3" />
              Stable
            </span>
          )}

          <span className="text-[#787063] font-mono text-[10px]">
            (Min: {minHistorical}% / Max: {maxHistorical}%)
          </span>
        </div>
      </div>

      {/* Sparkline Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-14 overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Guide baseline */}
          <line
            x1={paddingX}
            y1={paddingTop + chartHeight}
            x2={width - paddingX}
            y2={paddingTop + chartHeight}
            stroke="#E3DDCF"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Gradient Area Fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Sparkline Historical Curve */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Predictive Alert: +4h Future Trajectory Line */}
          {futurePoint && (
            <g>
              <line
                x1={points[points.length - 1].x}
                y1={points[points.length - 1].y}
                x2={futurePoint.x}
                y2={futurePoint.y}
                stroke="#D95338"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              <circle
                cx={futurePoint.x}
                cy={futurePoint.y}
                r="4.5"
                fill="#D95338"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
              <text
                x={futurePoint.x}
                y={futurePoint.y - 6}
                fill="#B8422A"
                fontSize="8"
                fontWeight="800"
                fontFamily="monospace"
                textAnchor="end"
              >
                {futurePoint.val}%
              </text>
            </g>
          )}

          {/* Interactive Touch/Hover Column Hitboxes */}
          {points.map((p, idx) => (
            <g
              key={idx}
              onMouseEnter={() => setHoverIndex(idx)}
              onTouchStart={() => setHoverIndex(idx)}
              className="cursor-pointer"
            >
              <rect
                x={p.x - chartWidth / (data.length * 2)}
                y={0}
                width={chartWidth / data.length}
                height={height}
                fill="transparent"
              />
            </g>
          ))}

          {/* Active Hover / Current Live Point Marker */}
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="4.5"
            fill={strokeColor}
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* Live pulsing ring for current point when not hovering past */}
          {hoverIndex === null && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="7"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
              className="animate-ping opacity-60"
            />
          )}

          {/* Time axis text labels at bottom */}
          <text
            x={paddingX}
            y={height - 2}
            fill="#8F8778"
            fontSize="8"
            fontWeight="600"
            fontFamily="monospace"
          >
            -24h
          </text>
          <text
            x={chartWidth / 2}
            y={height - 2}
            fill="#8F8778"
            fontSize="8"
            fontWeight="600"
            fontFamily="monospace"
            textAnchor="middle"
          >
            -12h
          </text>
          <text
            x={points[points.length - 1].x}
            y={height - 2}
            fill={hoverIndex === null ? strokeColor : '#8F8778'}
            fontSize="8"
            fontWeight="700"
            fontFamily="monospace"
            textAnchor="end"
          >
            Now
          </text>
          {futurePoint && (
            <text
              x={futurePoint.x}
              y={height - 2}
              fill="#B8422A"
              fontSize="8"
              fontWeight="800"
              fontFamily="monospace"
              textAnchor="end"
            >
              +4h
            </text>
          )}
        </svg>

        {/* Hover / Live Tooltip Callout */}
        <div className="absolute top-0 right-1 pointer-events-none bg-white/90 backdrop-blur-xs border border-[#D5CDC0] px-1.5 py-0.5 rounded shadow-2xs text-[10px] font-mono flex items-center gap-1">
          <span className="text-[#6D6559]">
            {activeHoursAgo === 0 ? 'Now' : `-${activeHoursAgo}h`}:
          </span>
          <strong
            className={`font-extrabold ${
              alertLevel === 'high'
                ? 'text-[#B8422A]'
                : alertLevel === 'medium'
                ? 'text-[#C27D26]'
                : 'text-[#2D6A4F]'
            }`}
          >
            {activePoint.val}%
          </strong>
        </div>
      </div>
    </div>
  );
};
