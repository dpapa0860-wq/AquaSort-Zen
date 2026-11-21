import React, { useEffect, useState } from 'react';
import { Crown, Gift, Palette, Settings, Volume2, VolumeX } from 'lucide-react';
import { type ThemePalette } from '../game/catalog';
import { DAILY_GIFT_COINS } from '../game/rules';
import {
  canClaimDailyGift,
  formatCooldown,
  getDailyGiftRemainingMs,
  hasAdFreeVip,
} from '../game/storage';
import type { PersistedProgress } from '../game/types';
import { TubeVisual } from './TubeVisual';

interface TitleScreenProps {
  progress: PersistedProgress;
  theme: ThemePalette;
  onStartGame: () => void;
  onClaimDailyGift: () => void;
  onOpenShop: () => void;
  onOpenVip: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  progress,
  theme,
  onStartGame,
  onClaimDailyGift,
  onOpenShop,
  onOpenVip,
  onOpenSettings,
  onToggleMute,
}) => {
  const [now, setNow] = useState(() => Date.now());
  const [giftToast, setGiftToast] = useState(false);

  const giftReady = canClaimDailyGift(progress.lastDailyGiftAt, now);
  const remainingMs = getDailyGiftRemainingMs(progress.lastDailyGiftAt, now);
  const vipActive = hasAdFreeVip(progress);

  useEffect(() => {
    if (giftReady) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [giftReady]);

  const handleGiftClick = () => {
    if (!giftReady) return;
    onClaimDailyGift();
    setGiftToast(true);
    window.setTimeout(() => setGiftToast(false), 2200);
  };

  return (
    <div className="relative flex flex-col justify-between h-full w-full px-5 pt-4 pb-3 overflow-hidden">
      {/* Minimal Top Utility Row: Coins + Mute + Settings */}
      <div className="flex items-center justify-between z-10">
        <div
          className="flex items-center gap-2 text-sm font-semibold tabular-nums"
          style={{ color: theme.textPrimary }}
          aria-label={`Coins: ${progress.coins}`}
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#F59E0B" />
            <circle cx="12" cy="12" r="7" fill="#FBBF24" />
            <path d="M12 7.5V16.5M9.5 10H14.5" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="font-mono text-base">{progress.coins}</span>
          {vipActive && (
            <span
              className="ml-1 inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: theme.accentBg }}
            >
              <Crown className="w-3.5 h-3.5" aria-hidden="true" />
              VIP
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
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
      </div>

      {/* Center Hero Showcase: Calm negative space + SVG Title Emblem + Live Glass Vessels */}
      <div className="flex flex-col items-center justify-center flex-1 gap-5 py-2 z-10">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="flex flex-col items-center text-center">
          <svg
            viewBox="0 0 280 86"
            className="w-[248px] sm:w-[272px] h-auto"
            role="img"
            aria-label="AquaSort Zen"
          >
            {/* Minimalist Water Droplet Crest */}
            <path
              d="M140 4 C140 4 150 17 150 23.5 A10 10 0 1 1 130 23.5 C130 17 140 4 140 4 Z"
              fill={theme.accentBg}
            />
            <path
              d="M137 19 C135.5 21.5 135 24 136 26.5"
              stroke={theme.accentText}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
            <text
              x="140"
              y="62"
              textAnchor="middle"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '34px',
                fontWeight: 700,
                fill: theme.textPrimary,
                letterSpacing: '-0.02em',
              }}
            >
              AquaSort
            </text>
            <text
              x="140"
              y="81"
              textAnchor="middle"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 600,
                fill: theme.textMuted,
                letterSpacing: '0.28em',
              }}
            >
              ZEN PUZZLE
            </text>
          </svg>
        </div>

        {/* Hero Centerpiece: 3 Live Floating Glass Vessels */}
        <div
          className="flex items-end justify-center gap-4 py-2 pointer-events-none"
          aria-hidden="true"
        >
          <div className="animate-float-slow" style={{ animationDelay: '0ms' }}>
            <TubeVisual
              tube={['ocean', 'ocean', 'coral', 'amber']}
              index={0}
              tubeStyle={progress.selectedTubeStyle}
              theme={theme}
              isSelected={false}
              isValidTarget={false}
              isHintSource={false}
              isHintTarget={false}
              isPourSource={false}
              pourDirection={null}
              justLocked={false}
              colorblindSymbols={progress.colorblindSymbols}
              compact
              onSelect={() => {}}
            />
          </div>
          <div className="animate-float-slow -translate-y-2" style={{ animationDelay: '450ms' }}>
            <TubeVisual
              tube={['jade', 'jade', 'jade', 'jade']}
              index={1}
              tubeStyle={progress.selectedTubeStyle}
              theme={theme}
              isSelected={false}
              isValidTarget={false}
              isHintSource={false}
              isHintTarget={false}
              isPourSource={false}
              pourDirection={null}
              justLocked={false}
              colorblindSymbols={progress.colorblindSymbols}
              onSelect={() => {}}
            />
          </div>
          <div className="animate-float-slow" style={{ animationDelay: '900ms' }}>
            <TubeVisual
              tube={['amber', 'coral', 'plum', 'ocean']}
              index={2}
              tubeStyle={progress.selectedTubeStyle}
              theme={theme}
              isSelected={false}
              isValidTarget={false}
              isHintSource={false}
              isHintTarget={false}
              isPourSource={false}
              pourDirection={null}
              justLocked={false}
              colorblindSymbols={progress.colorblindSymbols}
              compact
              onSelect={() => {}}
            />
          </div>
        </div>

        {/* Primary Play CTA + Daily Gift + Secondary Actions */}
        <div className="w-full max-w-[300px] flex flex-col gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onStartGame}
            className="w-full min-h-[52px] px-6 py-3 rounded-2xl text-base font-semibold tracking-tight shadow-md transition-transform duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: theme.accentBg,
              color: theme.accentText,
            }}
          >
            Play Level {progress.level}
          </button>

          {/* Daily Gift Chest */}
          <button
            type="button"
            onClick={handleGiftClick}
            disabled={!giftReady}
            aria-label={
              giftReady
                ? `Claim Daily Gift of ${DAILY_GIFT_COINS} coins`
                : `Daily Gift available in ${formatCooldown(remainingMs)}`
            }
            className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border flex items-center justify-between text-sm font-medium transition-transform duration-150 active:scale-[0.98] disabled:opacity-75 cursor-pointer disabled:cursor-default"
            style={{
              backgroundColor: theme.surfaceBg,
              borderColor: giftReady ? theme.accentBg : theme.surfaceBorder,
              color: theme.textPrimary,
            }}
          >
            <span className="flex items-center gap-2.5 whitespace-nowrap">
              <Gift
                className="w-4 h-4 shrink-0"
                style={{ color: giftReady ? theme.accentBg : theme.textMuted }}
              />
              <span>{giftToast ? 'Daily Gift Claimed!' : 'Daily Gift'}</span>
            </span>
            <span
              className="font-mono text-xs font-semibold tabular-nums whitespace-nowrap"
              style={{ color: giftReady ? theme.accentBg : theme.textMuted }}
            >
              {giftReady ? `+${DAILY_GIFT_COINS} Coins` : formatCooldown(remainingMs)}
            </span>
          </button>

          {/* Secondary Shop & VIP Row */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onOpenShop}
              className="min-h-[44px] px-3 py-2 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-transform duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: theme.surfaceBg,
                borderColor: theme.surfaceBorder,
                color: theme.textPrimary,
              }}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span>Shop</span>
            </button>

            <button
              type="button"
              onClick={onOpenVip}
              className="min-h-[44px] px-3 py-2 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-transform duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: theme.surfaceBg,
                borderColor: theme.surfaceBorder,
                color: theme.textPrimary,
              }}
            >
              <Crown className="w-4 h-4 shrink-0" style={{ color: '#F59E0B' }} />
              <span>{vipActive ? 'VIP Active' : 'No Ads'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Single flat control-hint line in bottom safe margin */}
      <p
        className="text-center text-xs font-medium tracking-tight pb-1 z-10"
        style={{ color: theme.textMuted }}
      >
        Tap Tube to Lift · Tap Target to Pour · U Undo · R Restart
      </p>
    </div>
  );
};
