import React from 'react';

interface IFMoonPhaseCanvasProps {
  cycleDay: number;
  cycleLength: number;
  phaseColor: string;
}

export const IFMoonPhaseCanvas: React.FC<IFMoonPhaseCanvasProps> = ({
  cycleDay,
  cycleLength,
  phaseColor
}) => {
  const radius = 60;
  const halfCycle = cycleLength / 2;
  const isFullMoon = cycleDay >= Math.floor(halfCycle) - 1 && cycleDay <= Math.ceil(halfCycle) + 1;

  // Calculate fraction (0 to 1 to 0)
  const fraction = cycleDay <= halfCycle
    ? cycleDay / halfCycle
    : (cycleLength - cycleDay) / halfCycle;

  // Shadow offset multiplier
  const shadowOffset = cycleDay <= halfCycle
    ? radius * (1.1 - fraction * 1.5)
    : -radius * (1.1 - fraction * 1.5);

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      {/* Ambient Radial Glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-40 transition-colors duration-500"
        style={{ backgroundColor: phaseColor }}
      />

      <svg className="w-36 h-36 relative z-10" viewBox="0 0 140 140">
        <defs>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={phaseColor} stopOpacity="1" />
            <stop offset="100%" stopColor={phaseColor} stopOpacity="0.5" />
          </radialGradient>
          <radialGradient id="fullMoonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB800" stopOpacity="1" />
            <stop offset="60%" stopColor="#FF3366" stopOpacity="0.8" />
            <stop offset="100%" stopColor={phaseColor} stopOpacity="0.4" />
          </radialGradient>
          <clipPath id="moonClip">
            <circle cx="70" cy="70" r="55" />
          </clipPath>
        </defs>

        {/* Outer Ring */}
        <circle
          cx="70"
          cy="70"
          r="62"
          fill="none"
          stroke={phaseColor}
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Backing Moon Sphere Base */}
        <circle cx="70" cy="70" r="55" fill="#18122B" />

        {/* Lit Area */}
        <g clipPath="url(#moonClip)">
          {isFullMoon ? (
            <circle cx="70" cy="70" r="55" fill="url(#fullMoonGlow)" />
          ) : (
            <>
              {/* Illuminated circle */}
              <circle cx="70" cy="70" r="55" fill={phaseColor} />
              {/* Overlapping shadow sphere */}
              <circle
                cx={70 + shadowOffset}
                cy="70"
                r={54}
                fill="#0D0A1A"
              />
            </>
          )}

          {/* Craters */}
          <circle cx="55" cy="55" r="11" fill="#FFFFFF" fillOpacity="0.08" />
          <circle cx="90" cy="85" r="7" fill="#FFFFFF" fillOpacity="0.08" />
          <circle cx="65" cy="95" r="5" fill="#FFFFFF" fillOpacity="0.08" />
        </g>
      </svg>
    </div>
  );
};
