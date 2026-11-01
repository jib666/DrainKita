import React, { useState } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Info,
  Sun,
  Umbrella,
  X,
} from 'lucide-react';
import { AreaWeather } from '../types/drain';

interface WeatherWidgetProps {
  weather: AreaWeather;
  drainCode: string;
  kolejZone: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  drainCode,
  kolejZone,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Pick weather icon and styling
  const getWeatherIcon = () => {
    switch (weather.condition) {
      case 'Thunderstorm':
        return <CloudLightning className="w-3.5 h-3.5 text-[#E65100] animate-pulse" />;
      case 'Heavy Rain':
        return <CloudRain className="w-3.5 h-3.5 text-[#1976D2] animate-bounce" />;
      case 'Moderate Rain':
        return <CloudRain className="w-3.5 h-3.5 text-[#0288D1]" />;
      case 'Light Drizzle':
        return <CloudDrizzle className="w-3.5 h-3.5 text-[#0097A7]" />;
      case 'Overcast':
        return <Cloud className="w-3.5 h-3.5 text-[#78909C]" />;
      default:
        return <CloudSun className="w-3.5 h-3.5 text-[#F57C00]" />;
    }
  };

  // Badge background and border styling based on rainfall severity
  const badgeColors = weather.hasActiveRain
    ? weather.rainfallMmPerHour >= 30
      ? 'bg-[#FCECE9] text-[#9E3621] border-[#F5C2B7]'
      : 'bg-[#EBF3FC] text-[#1967D2] border-[#C3DCF7]'
    : 'bg-[#F4F1EA] text-[#696155] border-[#E2DBD0]';

  return (
    <div className="relative inline-block">
      {/* Weather Icon Badge Button */}
      <button
        type="button"
        onClick={() => setShowDetails((prev) => !prev)}
        className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer ${badgeColors}`}
        title={`Current Weather: ${weather.condition} (${weather.rainfallMmPerHour} mm/h). Tap for rain correlation details.`}
        aria-label={`Current weather at ${kolejZone}: ${weather.condition}, ${weather.rainfallMmPerHour} mm per hour rain`}
      >
        {getWeatherIcon()}

        {weather.hasActiveRain ? (
          <span className="flex items-center gap-1 font-mono font-bold">
            <span>{weather.rainfallMmPerHour} mm/h</span>
            <span className="text-[10px] uppercase font-sans tracking-tight text-[#8A2C18] hidden sm:inline">
              Rain
            </span>
          </span>
        ) : (
          <span className="font-medium text-[10px]">
            {weather.condition} (0 mm/h)
          </span>
        )}
      </button>

      {/* Floating Weather & Water Level Spike Correlation Popover */}
      {showDetails && (
        <div
          role="dialog"
          aria-label="Local weather and rain spike details"
          className="absolute right-0 top-full mt-1.5 z-40 w-64 bg-white rounded-xl shadow-xl border border-[#D5CDC0] p-3 text-xs space-y-2 text-[#2D2821] animate-fade-in"
        >
          <div className="flex items-start justify-between gap-1 border-b border-[#EFE9DD] pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#1B3B2B]">
              <Umbrella className="w-3.5 h-3.5 text-[#2D6A4F]" />
              <span>Catchment Rain Telemetry</span>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              type="button"
              className="p-0.5 text-[#8A8275] hover:text-black rounded"
              aria-label="Close weather details"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#6D6559]">Condition:</span>
              <strong className="text-[#1E2922] flex items-center gap-1">
                {getWeatherIcon()}
                {weather.condition}
              </strong>
            </div>

            <div className="flex justify-between">
              <span className="text-[#6D6559]">Precipitation Rate:</span>
              <strong className={weather.hasActiveRain ? 'text-[#B8422A] font-mono' : 'text-[#2D6A4F] font-mono'}>
                {weather.rainfallMmPerHour} mm/hr
              </strong>
            </div>

            <div className="flex justify-between">
              <span className="text-[#6D6559]">Relative Humidity:</span>
              <span className="font-mono">{weather.humidityPercent}%</span>
            </div>
          </div>

          {/* Direct correlation explanation */}
          <div className="p-2 rounded-lg bg-[#FAF7F0] border border-[#E7DFD2] text-[10px] leading-relaxed text-[#554D41]">
            <span className="font-bold text-[#2A241D] block mb-0.5">
              🌧️ Rain & Water Level Correlation:
            </span>
            {weather.stormAdvisory}
          </div>
        </div>
      )}
    </div>
  );
};
