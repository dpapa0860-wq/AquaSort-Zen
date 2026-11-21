import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Lightbulb,
  Palette,
  Plus,
  RotateCcw,
  Settings,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { LIQUID_COLORS, type ThemePalette } from '../game/catalog';
import { canPour, hasAnyValidMoves, isTubeComplete } from '../game/rules';
import type {
  PersistedProgress,
  PourAnimationState,
  Tube,
} from '../game/types';
import { TubeVisual } from './TubeVisual';

interface GameBoardProps {
  level: number;
  tubes: Tube[];
  selectedIdx: number | null;
  pourAnim: PourAnimationState | null;
  justLockedIndices: number[];
  hintPair: { fromIdx: number; toIdx: number } | null;
  undosLeft: number;
  canUndoHistory: boolean;
  extraTubeAdded: boolean;
  movesCount: number;
  progress: PersistedProgress;
  theme: ThemePalette;
  onSelectTube: (index: number) => void;
  onUndo: () => void;
  onAddTube: () => void;
  onHint: () => void;
  onRestart: () => void;
  onGoHome: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
}

interface PourCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  level,
  tubes,
  selectedIdx,
  pourAnim,
  justLockedIndices,
  hintPair,
  undosLeft,
  canUndoHistory,
  extraTubeAdded,
  movesCount,
  progress,
  theme,
  onSelectTube,
  onUndo,
  onAddTube,
  onHint,
  onRestart,
  onGoHome,
  onOpenShop,
  onOpenSettings,
  onToggleMute,
}) => {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const tubeRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [pourCoords, setPourCoords] = useState<PourCoords | null>(null);

  const selectedTube = selectedIdx !== null ? tubes[selectedIdx] : null;
  const noMovesLeft = !pourAnim && !hasAnyValidMoves(tubes);
  const compactTubes = tubes.length > 8;

  // Split tubes cleanly into 1 row (<= 5) or 2 balanced rows (6..15)
  const rows: number[][] = React.useMemo(() => {
    const indices = tubes.map((_, idx) => idx);
    if (indices.length <= 5) {
      return [indices];
    }
    const topCount = Math.ceil(indices.length / 2);
    return [indices.slice(0, topCount), indices.slice(topCount)];
  }, [tubes]);

  useLayoutEffect(() => {
    if (!pourAnim || !boardRef.current) {
      setPourCoords(null);
      return;
    }
    const boardRect = boardRef.current.getBoundingClientRect();
    const fromEl = tubeRefs.current[pourAnim.fromIdx];
    const toEl = tubeRefs.current[pourAnim.toIdx];
    if (!fromEl || !toEl) {
      setPourCoords(null);
      return;
    }
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const dir = toRect.left >= fromRect.left ? 1 : -1;

    setPourCoords({
      x1: fromRect.left - boardRect.left + fromRect.width * 0.5 + dir * 14,
      y1: fromRect.top - boardRect.top + 8,
      x2: toRect.left - boardRect.left + toRect.width * 0.5,
      y2: toRect.top - boardRect.top + 24,
    });
  }, [pourAnim, tubes.length]);

  const pourDirection: 'left' | 'right' | null = React.useMemo(() => {
    if (!pourAnim) return null;
    const fromEl = tubeRefs.current[pourAnim.fromIdx];
    const toEl = tubeRefs.current[pourAnim.toIdx];
    if (!fromEl || !toEl) {
      return pourAnim.toIdx >= pourAnim.fromIdx ? 'right' : 'left';
    }
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    return toRect.left >= fromRect.left ? 'right' : 'left';
  }, [pourAnim]);

  return (
    <div className="flex flex-col justify-between h-full w-full px-3 sm:px-5 pt-2.5 pb-2 select-none">
      {/* Top Perimeter HUD Bar */}
      <header className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Back to home screen"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 active:scale-95 cursor-pointer"
            style={{ color: theme.textPrimary }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col leading-tight">
            <span
              className="font-display text-lg font-bold tracking-tight tabular-nums"
              style={{ color: theme.textPrimary }}
            >
              Level {level}
            </span>
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: theme.textMuted }}
            >
              {movesCount} {movesCount === 1 ? 'move' : 'moves'}
            </span>
          </div>
        </div>

        {/* Right Utility Cluster: Coins · Shop · Mute · Settings */}
        <div className="flex items-center gap-1">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-sm font-semibold tabular-nums mr-0.5"
            style={{
              backgroundColor: theme.surfaceBg,
              borderColor: theme.surfaceBorder,
              color: theme.textPrimary,
            }}
            aria-label={`Coins: ${progress.coins}`}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#F59E0B" />
              <circle cx="12" cy="12" r="7" fill="#FBBF24" />
            </svg>
            <span className="font-mono text-xs sm:text-sm">{progress.coins}</span>
          </div>

          <button
            type="button"
            onClick={onOpenShop}
            aria-label="Open cosmetic shop"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 active:scale-95 cursor-pointer"
            style={{ color: theme.textPrimary }}
          >
            <Palette className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={progress.muted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-pressed={progress.muted}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 active:scale-95 cursor-pointer"
            style={{ color: theme.textPrimary }}
          >
            {progress.muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 active:scale-95 cursor-pointer"
            style={{ color: theme.textPrimary }}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Center Playfield: Balanced Glass Tube Rows */}
      <main
        ref={boardRef}
        className="relative flex-1 flex flex-col items-center justify-center gap-4 sm:gap-6 my-1"
      >
        {/* Animated liquid pour stream overlay */}
        {pourAnim && pourCoords && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full z-30 overflow-visible"
          >
            <path
              d={`M ${pourCoords.x1} ${pourCoords.y1} Q ${(pourCoords.x1 + pourCoords.x2) / 2} ${Math.min(pourCoords.y1, pourCoords.y2) - 24} ${pourCoords.x2} ${pourCoords.y2}`}
              fill="none"
              stroke={LIQUID_COLORS[pourAnim.color].midHex}
              strokeWidth="6"
              strokeLinecap="round"
              className="animate-pour-stream"
            />
            <circle
              cx={pourCoords.x2}
              cy={pourCoords.y2}
              r="5"
              fill={LIQUID_COLORS[pourAnim.color].topHex}
              opacity="0.85"
            />
          </svg>
        )}

        {rows.map((rowIndices, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-end justify-center gap-2 sm:gap-3 w-full"
          >
            {rowIndices.map((tubeIndex) => {
              const tube = tubes[tubeIndex];
              const isSelected = selectedIdx === tubeIndex;
              const isValidTarget =
                selectedIdx !== null &&
                selectedIdx !== tubeIndex &&
                selectedTube !== null &&
                !isTubeComplete(tube) &&
                canPour(selectedTube, tube);

              return (
                <TubeVisual
                  key={tubeIndex}
                  tube={tube}
                  index={tubeIndex}
                  tubeStyle={progress.selectedTubeStyle}
                  theme={theme}
                  isSelected={isSelected}
                  isValidTarget={isValidTarget}
                  isHintSource={hintPair?.fromIdx === tubeIndex}
                  isHintTarget={hintPair?.toIdx === tubeIndex}
                  isPourSource={pourAnim?.fromIdx === tubeIndex}
                  pourDirection={pourAnim?.fromIdx === tubeIndex ? pourDirection : null}
                  justLocked={justLockedIndices.includes(tubeIndex)}
                  colorblindSymbols={progress.colorblindSymbols}
                  compact={compactTubes}
                  onSelect={onSelectTube}
                  buttonRef={(el) => {
                    tubeRefs.current[tubeIndex] = el;
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Helpful non-blocking deadlock cue when no moves remain */}
        {noMovesLeft && (
          <div
            role="status"
            className="px-4 py-2 rounded-xl border text-xs font-medium text-center shadow-sm"
            style={{
              backgroundColor: theme.surfaceBg,
              borderColor: theme.accentBg,
              color: theme.textPrimary,
            }}
          >
            No valid pours left — tap Undo, +1 Tube, or Restart.
          </div>
        )}
      </main>

      {/* Bottom Ergonomic Thumb-Zone Dock */}
      <footer className="shrink-0 pt-1 pb-1">
        <div
          className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl border"
          style={{
            backgroundColor: theme.surfaceBg,
            borderColor: theme.surfaceBorder,
          }}
        >
          {/* Undo Button: 2 free per level, then Rewarded Ad (+3) */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndoHistory && undosLeft > 0}
            aria-label={
              undosLeft > 0
                ? `Undo move (${undosLeft} free remaining)`
                : 'Watch rewarded ad for +3 undos'
            }
            className="min-h-[50px] px-2 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-transform duration-150 active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            style={{ color: theme.textPrimary }}
          >
            <div className="relative flex items-center gap-1">
              <Undo2 className="w-4 h-4 shrink-0" />
              <span
                className="font-mono text-[11px] font-bold tabular-nums"
                style={{ color: undosLeft > 0 ? theme.accentBg : '#D97706' }}
              >
                {undosLeft > 0 ? undosLeft : 'AD+3'}
              </span>
            </div>
            <span className="text-[11px] font-medium whitespace-nowrap">Undo</span>
          </button>

          {/* +1 Empty Tube (Rewarded Ad) */}
          <button
            type="button"
            onClick={onAddTube}
            disabled={extraTubeAdded}
            aria-label={
              extraTubeAdded
                ? 'Extra tube already added this level'
                : 'Watch rewarded ad to add 1 empty tube'
            }
            className="min-h-[50px] px-2 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-transform duration-150 active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            style={{ color: theme.textPrimary }}
          >
            <div className="flex items-center gap-0.5">
              <Plus className="w-4 h-4 shrink-0" style={{ color: theme.accentBg }} />
              <span
                className="font-mono text-[11px] font-bold"
                style={{ color: extraTubeAdded ? theme.textMuted : '#D97706' }}
              >
                {extraTubeAdded ? 'USED' : 'AD'}
              </span>
            </div>
            <span className="text-[11px] font-medium whitespace-nowrap">+1 Tube</span>
          </button>

          {/* Free Hint */}
          <button
            type="button"
            onClick={onHint}
            aria-label="Show a valid move hint"
            className="min-h-[50px] px-2 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-transform duration-150 active:scale-95 cursor-pointer"
            style={{ color: theme.textPrimary }}
          >
            <Lightbulb className="w-4 h-4 shrink-0" style={{ color: '#F59E0B' }} />
            <span className="text-[11px] font-medium whitespace-nowrap">Hint</span>
          </button>

          {/* Restart Level */}
          <button
            type="button"
            onClick={onRestart}
            aria-label="Restart current level"
            className="min-h-[50px] px-2 py-1.5 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-transform duration-150 active:scale-95 cursor-pointer"
            style={{ color: theme.textPrimary }}
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-medium whitespace-nowrap">Restart</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
