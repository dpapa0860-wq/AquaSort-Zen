import React from 'react';
import { LIQUID_COLORS, type ThemePalette } from '../game/catalog';
import { TUBE_CAPACITY, getTopRun, isTubeComplete } from '../game/rules';
import type { ColorId, Tube, TubeStyleId } from '../game/types';

interface TubeVisualProps {
  tube: Tube;
  index: number;
  tubeStyle: TubeStyleId;
  theme: ThemePalette;
  isSelected: boolean;
  isValidTarget: boolean;
  isHintSource: boolean;
  isHintTarget: boolean;
  isPourSource: boolean;
  pourDirection: 'left' | 'right' | null;
  justLocked: boolean;
  colorblindSymbols: boolean;
  compact?: boolean;
  onSelect: (index: number) => void;
  buttonRef?: (el: HTMLButtonElement | null) => void;
}

interface VesselGeometry {
  viewBox: string;
  clipPathD: string;
  bodyOutlineD: string;
  rimD: string;
  highlightD: string;
  stemD?: string;
  liquidBottomY: number;
  liquidHeight: number;
  capY: number;
}

function getVesselGeometry(style: TubeStyleId): VesselGeometry {
  if (style === 'potion') {
    return {
      viewBox: '0 0 80 180',
      clipPathD:
        'M 29 28 L 51 28 L 51 54 C 66 64 72 86 72 114 C 72 148 58 166 40 166 C 22 166 8 148 8 114 C 8 86 14 64 29 54 Z',
      bodyOutlineD:
        'M 28 24 L 52 24 L 52 53 C 68 64 74 87 74 114 C 74 150 59 169 40 169 C 21 169 6 150 6 114 C 6 87 12 64 28 53 Z',
      rimD: 'M 24 20 Q 40 16 56 20 L 56 26 Q 40 23 24 26 Z',
      highlightD:
        'M 18 76 C 14 92 13 118 18 138',
      liquidBottomY: 164,
      liquidHeight: 112,
      capY: 14,
    };
  }

  if (style === 'goblet') {
    return {
      viewBox: '0 0 80 180',
      clipPathD:
        'M 13 24 L 67 24 L 64 88 C 62 118 51 132 40 132 C 29 132 18 118 16 88 Z',
      bodyOutlineD:
        'M 11 22 L 69 22 L 66 88 C 64 120 52 135 40 135 C 28 135 16 120 14 88 Z',
      rimD: 'M 9 19 Q 40 16 71 19 L 71 24 Q 40 22 9 24 Z',
      highlightD: 'M 20 34 L 22 92 C 23 106 27 118 31 123',
      stemD:
        'M 36 135 L 44 135 L 44 161 L 58 166 L 58 171 L 22 171 L 22 166 L 36 161 Z',
      liquidBottomY: 132,
      liquidHeight: 104,
      capY: 12,
    };
  }

  // Classic Test Tube
  return {
    viewBox: '0 0 80 180',
    clipPathD: 'M 19 24 L 61 24 L 61 142 A 21 21 0 0 1 19 142 Z',
    bodyOutlineD: 'M 17 22 L 63 22 L 63 142 A 23 23 0 0 1 17 142 Z',
    rimD: 'M 13 18 Q 40 15 67 18 L 67 24 Q 40 22 13 24 Z',
    highlightD: 'M 24 34 L 24 140',
    liquidBottomY: 163,
    liquidHeight: 130,
    capY: 12,
  };
}

export const TubeVisual: React.FC<TubeVisualProps> = ({
  tube,
  index,
  tubeStyle,
  theme,
  isSelected,
  isValidTarget,
  isHintSource,
  isHintTarget,
  isPourSource,
  pourDirection,
  justLocked,
  colorblindSymbols,
  compact = false,
  onSelect,
  buttonRef,
}) => {
  const locked = isTubeComplete(tube);
  const topRun = getTopRun(tube);
  const geom = getVesselGeometry(tubeStyle);
  const clipId = React.useId();

  const segmentHeight = geom.liquidHeight / TUBE_CAPACITY;

  // Build readable aria label for screen readers & Playwright accessibility snapshots
  const colorSummary =
    tube.length === 0
      ? 'Empty'
      : tube
          .slice()
          .reverse()
          .map((c) => LIQUID_COLORS[c].label)
          .join(', ');

  let actionHint = '';
  if (locked) {
    actionHint = 'Locked complete tube';
  } else if (isSelected) {
    actionHint = 'Selected, tap again to lower or tap another tube to pour';
  } else if (isValidTarget) {
    actionHint = 'Valid pour target';
  } else if (tube.length > 0 && topRun) {
    actionHint = `Top is ${LIQUID_COLORS[topRun.color].label}`;
  }

  const ariaLabel = `Tube ${index + 1}: ${colorSummary}${actionHint ? `. ${actionHint}` : ''}`;

  let transformClass = 'translate-y-0';
  if (isPourSource) {
    transformClass =
      pourDirection === 'left'
        ? '-translate-y-6 -rotate-[26deg]'
        : '-translate-y-6 rotate-[26deg]';
  } else if (isSelected) {
    transformClass = '-translate-y-3.5';
  } else if (isHintSource || isHintTarget) {
    transformClass = 'animate-hint-pulse';
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      data-tube-index={index}
      data-locked={locked ? 'true' : 'false'}
      data-selected={isSelected ? 'true' : 'false'}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      onClick={() => onSelect(index)}
      className={`group relative flex flex-col items-center justify-end focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-2xl transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer select-none ${
        compact ? 'w-[54px] h-[120px] sm:w-[60px] sm:h-[132px]' : 'w-[62px] h-[138px] sm:w-[68px] sm:h-[150px]'
      } ${transformClass}`}
      style={{
        ['--tw-ring-color' as string]: theme.accentBg,
      }}
    >
      {/* Valid target or hint pedestal underline indicator */}
      {(isValidTarget || isHintSource || isHintTarget) && !locked && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full transition-opacity duration-150"
          style={{
            backgroundColor: isHintSource || isHintTarget ? '#F59E0B' : theme.accentBg,
          }}
        />
      )}

      {/* Celebratory sparkles on tube completion */}
      {justLocked && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-3 inset-x-0 flex justify-center gap-2 z-20"
        >
          <svg className="w-5 h-5 animate-sparkle-burst" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
              fill="#FBBF24"
            />
          </svg>
          <svg
            className="w-4 h-4 animate-sparkle-burst"
            style={{ animationDelay: '90ms' }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"
              fill={theme.lockGlow}
            />
          </svg>
        </div>
      )}

      <svg
        viewBox={geom.viewBox}
        className="w-full h-full overflow-visible drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={geom.clipPathD} />
          </clipPath>

          {/* Define gradients for colors present in this tube */}
          {Array.from(new Set<ColorId>(tube)).map((colorId) => {
            const meta = LIQUID_COLORS[colorId];
            return (
              <linearGradient
                key={colorId}
                id={`${clipId}-grad-${colorId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={meta.topHex} />
                <stop offset="45%" stopColor={meta.midHex} />
                <stop offset="100%" stopColor={meta.bottomHex} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Glass interior backdrop */}
        <path d={geom.clipPathD} fill={theme.glassFill} />

        {/* Goblet stem / pedestal */}
        {geom.stemD && (
          <path
            d={geom.stemD}
            fill={theme.glassFill}
            stroke={theme.glassStroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {/* Layered liquid inside clipped vessel interior */}
        <g clipPath={`url(#${clipId})`}>
          {tube.map((colorId, segIdx) => {
            const meta = LIQUID_COLORS[colorId];
            const isTopSegment = segIdx === tube.length - 1;
            const inLiftedTopRun =
              isSelected && topRun && segIdx >= tube.length - topRun.count;

            // Lift the top matching run visually when selected
            const liftOffset = inLiftedTopRun ? -8 : 0;
            const y = geom.liquidBottomY - (segIdx + 1) * segmentHeight + liftOffset;
            // Extend downward slightly on non-lifted segments to avoid hairline gaps
            const h = segmentHeight + (segIdx === 0 ? 12 : 1.5);

            return (
              <g
                key={`${segIdx}-${colorId}`}
                className="transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <rect
                  x="4"
                  y={y}
                  width="72"
                  height={h}
                  fill={`url(#${clipId}-grad-${colorId})`}
                />
                {/* Crisp liquid meniscus rim on the top surface of each color block or topmost layer */}
                {(isTopSegment || tube[segIdx + 1] !== colorId) && (
                  <ellipse
                    cx="40"
                    cy={y + 1}
                    rx="28"
                    ry="3.2"
                    fill={meta.highlightHex}
                    opacity={isTopSegment ? 0.72 : 0.25}
                  />
                )}
                {/* Optional accessible colorblind symbol */}
                {colorblindSymbols && (
                  <text
                    x="40"
                    y={y + segmentHeight * 0.62}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#FFFFFF"
                    opacity="0.92"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
                  >
                    {meta.symbol}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Glass vessel outer stroke */}
        <path
          d={geom.bodyOutlineD}
          fill="none"
          stroke={isSelected ? theme.accentBg : locked ? theme.lockGlow : theme.glassStroke}
          strokeWidth={isSelected || locked ? '2.8' : '2.2'}
          strokeLinejoin="round"
        />

        {/* Vessel flared lip / rim */}
        <path
          d={geom.rimD}
          fill={theme.glassFill}
          stroke={isSelected ? theme.accentBg : locked ? theme.lockGlow : theme.glassStroke}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Specular glass reflection streak */}
        <path
          d={geom.highlightD}
          fill="none"
          stroke={theme.glassHighlight}
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.72"
        />

        {/* Cork / crystal seal when tube holds 4 matching colors */}
        {locked && (
          <g>
            <rect
              x="25"
              y={geom.capY - 5}
              width="30"
              height="10"
              rx="4"
              fill={theme.lockGlow}
              stroke={theme.canvasBg}
              strokeWidth="1.5"
            />
            <path
              d={`M 35 ${geom.capY} L 38.5 ${geom.capY + 3} L 45 ${geom.capY - 3}`}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </svg>
    </button>
  );
};
