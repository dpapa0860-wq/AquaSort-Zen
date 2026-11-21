import React, { useEffect, useState } from 'react';
import {
  Check,
  Crown,
  Eye,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  THEME_LIST,
  TUBE_STYLES,
  type ThemePalette,
} from '../game/catalog';
import { ADMOB_CONFIG } from '../game/admob';
import { hasAdFreeVip } from '../game/storage';
import type {
  PersistedProgress,
  ThemeId,
  TubeStyleId,
} from '../game/types';

/* -------------------------------------------------------------------------- */
/* Bottom 50px Banner Ad Bar (Hidden automatically when VIP/Ad-Free active)   */
/* -------------------------------------------------------------------------- */
interface BottomBannerAdProps {
  theme: ThemePalette;
  onUpgradeClick: () => void;
}

export const BottomBannerAd: React.FC<BottomBannerAdProps> = ({
  theme,
  onUpgradeClick,
}) => {
  return (
    <aside
      aria-label="Advertisement banner"
      className="w-full h-[50px] shrink-0 border-t px-3 flex items-center justify-between gap-2"
      style={{
        backgroundColor: theme.surfaceBg,
        borderColor: theme.surfaceBorder,
        color: theme.textMuted,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0"
          style={{
            borderColor: theme.surfaceBorder,
            color: theme.textMuted,
          }}
        >
          AD
        </span>
        <span className="text-xs font-medium truncate">
          Mindful Soundscapes · Free Zen Preview
        </span>
      </div>
      <button
        type="button"
        onClick={onUpgradeClick}
        className="min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-opacity hover:opacity-85"
        style={{
          backgroundColor: theme.accentBg,
          color: theme.accentText,
        }}
      >
        Remove Ads
      </button>
    </aside>
  );
};

/* -------------------------------------------------------------------------- */
/* Level Complete Modal                                                       */
/* -------------------------------------------------------------------------- */
interface LevelCompleteModalProps {
  level: number;
  movesCount: number;
  coinsEarned: number;
  doubledClaimed: boolean;
  theme: ThemePalette;
  onDoubleCoinsAd: () => void;
  onNextLevel: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  level,
  movesCount,
  coinsEarned,
  doubledClaimed,
  theme,
  onDoubleCoinsAd,
  onNextLevel,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div
        className="w-full max-w-[360px] rounded-3xl border p-6 shadow-xl flex flex-col items-center text-center gap-4"
        style={{
          backgroundColor: theme.canvasBg,
          borderColor: theme.surfaceBorder,
          color: theme.textPrimary,
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: theme.surfaceBg, color: theme.accentBg }}
        >
          <Sparkles className="w-7 h-7" aria-hidden="true" />
        </div>

        <div>
          <h2 id="win-title" className="font-display text-2xl font-bold tracking-tight">
            Level {level} Cleared
          </h2>
          <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
            All vessels harmonized smoothly.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
          <div
            className="rounded-2xl border p-3 flex flex-col items-center"
            style={{ backgroundColor: theme.surfaceBg, borderColor: theme.surfaceBorder }}
          >
            <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
              Moves
            </span>
            <span className="font-mono text-xl font-bold tabular-nums mt-0.5">
              {movesCount}
            </span>
          </div>

          <div
            className="rounded-2xl border p-3 flex flex-col items-center"
            style={{ backgroundColor: theme.surfaceBg, borderColor: theme.surfaceBorder }}
          >
            <span className="text-xs font-medium" style={{ color: theme.textMuted }}>
              Coins Earned
            </span>
            <span
              className="font-mono text-xl font-bold tabular-nums mt-0.5"
              style={{ color: '#D97706' }}
            >
              +{coinsEarned}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onDoubleCoinsAd}
          disabled={doubledClaimed}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-default whitespace-nowrap"
          style={{
            backgroundColor: theme.surfaceBg,
            borderColor: doubledClaimed ? theme.surfaceBorder : '#F59E0B',
            color: theme.textPrimary,
          }}
        >
          <Play className="w-4 h-4 shrink-0" style={{ color: '#F59E0B' }} />
          <span>{doubledClaimed ? '2x Coins Claimed' : `Watch Ad · 2x Coins (+${coinsEarned})`}</span>
        </button>

        <button
          type="button"
          data-start="true"
          onClick={onNextLevel}
          className="w-full min-h-[50px] px-5 py-3 rounded-2xl text-base font-semibold tracking-tight transition-transform active:scale-[0.98] cursor-pointer whitespace-nowrap"
          style={{
            backgroundColor: theme.accentBg,
            color: theme.accentText,
          }}
        >
          Next Level ({level + 1})
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3-Second Simulated Rewarded Ad Preview Modal                               */
/* -------------------------------------------------------------------------- */
interface RewardedAdModalProps {
  rewardLabel: string;
  theme: ThemePalette;
  onComplete: () => void;
  onCancel: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  rewardLabel,
  theme,
  onComplete,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const progressPct = ((3 - secondsLeft) / 3) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-ad-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
    >
      <div
        className="w-full max-w-[360px] rounded-3xl border p-5 shadow-2xl flex flex-col gap-4"
        style={{
          backgroundColor: theme.canvasBg,
          borderColor: theme.surfaceBorder,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold" style={{ color: theme.textMuted }}>
            SIMULATED REWARDED AD
          </span>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close ad without claiming reward"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Simulated Ad Creative Preview */}
        <div
          className="rounded-2xl border p-5 flex flex-col items-center text-center gap-2"
          style={{
            backgroundColor: theme.surfaceBg,
            borderColor: theme.surfaceBorder,
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
            style={{ backgroundColor: theme.accentBg, color: theme.accentText }}
          >
            <Play className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 id="reward-ad-title" className="font-display text-lg font-bold">
            Reward: {rewardLabel}
          </h3>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            {secondsLeft > 0
              ? `Preview finishes in ${secondsLeft}s...`
              : 'Reward unlocked! Tap below to claim.'}
          </p>

          <div
            className="w-full h-2 rounded-full overflow-hidden mt-2"
            style={{ backgroundColor: theme.surfaceBorder }}
          >
            <div
              className="h-full transition-all duration-700 ease-linear rounded-full"
              style={{
                width: `${progressPct}%`,
                backgroundColor: theme.accentBg,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onComplete}
          disabled={secondsLeft > 0}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl font-semibold text-sm transition-transform active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
          style={{
            backgroundColor: theme.accentBg,
            color: theme.accentText,
          }}
        >
          {secondsLeft > 0 ? `Wait ${secondsLeft}s...` : `Claim ${rewardLabel}`}
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Skippable Interstitial Ad Modal (Every 3 Levels when not VIP)              */
/* -------------------------------------------------------------------------- */
interface InterstitialAdModalProps {
  theme: ThemePalette;
  onSkip: () => void;
  onOpenVip: () => void;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  theme,
  onSkip,
  onOpenVip,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="interstitial-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
    >
      <div
        className="w-full max-w-[360px] rounded-3xl border p-5 shadow-2xl flex flex-col gap-4"
        style={{
          backgroundColor: theme.canvasBg,
          borderColor: theme.surfaceBorder,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold" style={{ color: theme.textMuted }}>
            INTERSTITIAL AD · EVERY 3 LEVELS
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[36px] px-3 py-1 rounded-xl border text-xs font-semibold cursor-pointer hover:opacity-80 whitespace-nowrap"
            style={{
              backgroundColor: theme.surfaceBg,
              borderColor: theme.surfaceBorder,
              color: theme.textPrimary,
            }}
          >
            Skip Ad
          </button>
        </div>

        <div
          className="rounded-2xl border p-6 flex flex-col items-center text-center gap-2"
          style={{
            backgroundColor: theme.surfaceBg,
            borderColor: theme.surfaceBorder,
          }}
        >
          <h3 id="interstitial-title" className="font-display text-xl font-bold">
            Tranquil Ambient Collection
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: theme.textMuted }}>
            AdMob Interstitial Test Slot active. Upgrade to VIP to remove forced ads forever.
          </p>
          <code
            data-testid="admob-interstitial-id"
            className="mt-1 font-mono text-[11px] px-2.5 py-1 rounded-lg border select-all"
            style={{
              backgroundColor: theme.canvasBg,
              borderColor: theme.surfaceBorder,
              color: theme.textPrimary,
            }}
          >
            {ADMOB_CONFIG.interstitialId}
          </code>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl text-sm font-semibold cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: theme.accentBg,
              color: theme.accentText,
            }}
          >
            Continue to Next Level
          </button>
          <button
            type="button"
            onClick={onOpenVip}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-80 whitespace-nowrap"
            style={{ color: theme.textMuted }}
          >
            <Crown className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
            <span>Remove Ads Forever — ₹199 ($2.99)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Cosmetic Shop Modal (Tube Styles & Calming Themes)                         */
/* -------------------------------------------------------------------------- */
interface ShopModalProps {
  progress: PersistedProgress;
  theme: ThemePalette;
  onSelectOrBuyTube: (id: TubeStyleId, price: number) => void;
  onSelectOrBuyTheme: (id: ThemeId, price: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  progress,
  theme,
  onSelectOrBuyTube,
  onSelectOrBuyTheme,
  onClose,
}) => {
  const [tab, setTab] = useState<'tubes' | 'themes'>('tubes');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
    >
      <div
        className="w-full max-w-[390px] max-h-[85dvh] rounded-3xl border p-5 shadow-2xl flex flex-col gap-4 overflow-hidden"
        style={{
          backgroundColor: theme.canvasBg,
          borderColor: theme.surfaceBorder,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 id="shop-title" className="font-display text-xl font-bold">
              Zen Atelier Shop
            </h2>
            <p className="text-xs font-mono font-semibold tabular-nums mt-0.5" style={{ color: '#D97706' }}>
              Balance: {progress.coins} Coins
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shop"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:opacity-75 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Filter Tabs */}
        <div
          className="grid grid-cols-2 gap-1 p-1 rounded-xl border"
          style={{ backgroundColor: theme.surfaceBg, borderColor: theme.surfaceBorder }}
        >
          <button
            type="button"
            onClick={() => setTab('tubes')}
            className="min-h-[40px] rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: tab === 'tubes' ? theme.accentBg : 'transparent',
              color: tab === 'tubes' ? theme.accentText : theme.textMuted,
            }}
          >
            Tube Styles
          </button>
          <button
            type="button"
            onClick={() => setTab('themes')}
            className="min-h-[40px] rounded-lg text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            style={{
              backgroundColor: tab === 'themes' ? theme.accentBg : 'transparent',
              color: tab === 'themes' ? theme.accentText : theme.textMuted,
            }}
          >
            Themes
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-0.5">
          {tab === 'tubes' &&
            TUBE_STYLES.map((item) => {
              const unlocked = progress.unlockedTubeStyles.includes(item.id);
              const equipped = progress.selectedTubeStyle === item.id;
              const affordable = progress.coins >= item.price;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border p-3.5 flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: theme.surfaceBg,
                    borderColor: equipped ? theme.accentBg : theme.surfaceBorder,
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{item.name}</div>
                    <div className="text-xs mt-0.5 leading-snug" style={{ color: theme.textMuted }}>
                      {item.subtitle}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectOrBuyTube(item.id, item.price)}
                    disabled={!unlocked && !affordable}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-transform active:scale-95 disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: equipped
                        ? theme.surfaceBorder
                        : unlocked || affordable
                        ? theme.accentBg
                        : theme.canvasBg,
                      borderColor: unlocked || affordable || equipped ? 'transparent' : theme.surfaceBorder,
                      color: equipped ? theme.textPrimary : unlocked || affordable ? theme.accentText : theme.textMuted,
                    }}
                  >
                    {equipped ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </span>
                    ) : unlocked ? (
                      'Equip'
                    ) : (
                      `${item.price} Coins`
                    )}
                  </button>
                </div>
              );
            })}

          {tab === 'themes' &&
            THEME_LIST.map((item) => {
              const unlocked = progress.unlockedThemes.includes(item.id);
              const equipped = progress.selectedTheme === item.id;
              const affordable = progress.coins >= item.price;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border p-3.5 flex items-center justify-between gap-3"
                  style={{
                    backgroundColor: theme.surfaceBg,
                    borderColor: equipped ? theme.accentBg : theme.surfaceBorder,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 rounded-xl border shrink-0"
                      style={{
                        background: item.canvasAmbient,
                        borderColor: item.accentBg,
                      }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{item.name}</div>
                      <div className="text-xs mt-0.5 leading-snug" style={{ color: theme.textMuted }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectOrBuyTheme(item.id, item.price)}
                    disabled={!unlocked && !affordable}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-transform active:scale-95 disabled:opacity-75 cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: equipped
                        ? theme.surfaceBorder
                        : unlocked || affordable
                        ? theme.accentBg
                        : theme.canvasBg,
                      borderColor: unlocked || affordable || equipped ? 'transparent' : theme.surfaceBorder,
                      color: equipped ? theme.textPrimary : unlocked || affordable ? theme.accentText : theme.textMuted,
                    }}
                  >
                    {equipped ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : unlocked ? (
                      'Apply'
                    ) : (
                      `${item.price} Coins`
                    )}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Remove Ads + VIP Modal                                                     */
/* -------------------------------------------------------------------------- */
interface VipModalProps {
  progress: PersistedProgress;
  theme: ThemePalette;
  onSimulateVipPurchase: () => void;
  onToggleTestVip: () => void;
  onClose: () => void;
}

export const VipModal: React.FC<VipModalProps> = ({
  progress,
  theme,
  onSimulateVipPurchase,
  onToggleTestVip,
  onClose,
}) => {
  const vipActive = hasAdFreeVip(progress);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vip-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
    >
      <div
        className="w-full max-w-[360px] rounded-3xl border p-6 shadow-2xl flex flex-col gap-4"
        style={{
          backgroundColor: theme.canvasBg,
          borderColor: theme.surfaceBorder,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.surfaceBg }}
            >
              <Crown className="w-5 h-5" style={{ color: '#F59E0B' }} />
            </div>
            <div>
              <h2 id="vip-title" className="font-display text-xl font-bold">
                Remove Ads + VIP
              </h2>
              <p className="text-xs" style={{ color: theme.textMuted }}>
                Pure uninterrupted zen play
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close VIP modal"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:opacity-75 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul
          className="rounded-2xl border p-4 flex flex-col gap-2.5 text-sm"
          style={{ backgroundColor: theme.surfaceBg, borderColor: theme.surfaceBorder }}
        >
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" style={{ color: theme.accentBg }} />
            <span>Removes bottom banner ad bar permanently</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" style={{ color: theme.accentBg }} />
            <span>Skips all forced interstitial ads every 3 levels</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" style={{ color: theme.accentBg }} />
            <span>Includes +100 bonus coins on purchase</span>
          </li>
        </ul>

        <button
          type="button"
          onClick={onSimulateVipPurchase}
          disabled={progress.isVip}
          className="w-full min-h-[50px] px-4 py-3 rounded-2xl text-sm font-semibold transition-transform active:scale-[0.98] disabled:opacity-65 cursor-pointer disabled:cursor-default whitespace-nowrap"
          style={{
            backgroundColor: theme.accentBg,
            color: theme.accentText,
          }}
        >
          {progress.isVip
            ? 'VIP Purchased & Active'
            : 'Remove Forced Ads Forever — ₹199 ($2.99)'}
        </button>

        {/* Quick Test Mode Toggle directly accessible */}
        <button
          type="button"
          role="switch"
          aria-checked={progress.testVipMode}
          onClick={onToggleTestVip}
          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border flex items-center justify-between text-xs font-medium cursor-pointer"
          style={{
            backgroundColor: theme.surfaceBg,
            borderColor: theme.surfaceBorder,
            color: theme.textPrimary,
          }}
        >
          <span>Test Mode: Simulate Purchase</span>
          <span
            className="font-mono font-bold"
            style={{ color: vipActive ? theme.accentBg : theme.textMuted }}
          >
            {progress.testVipMode ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Settings Modal                                                             */
/* -------------------------------------------------------------------------- */
interface SettingsModalProps {
  progress: PersistedProgress;
  theme: ThemePalette;
  onToggleMute: () => void;
  onToggleColorblind: () => void;
  onToggleTestVip: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  progress,
  theme,
  onToggleMute,
  onToggleColorblind,
  onToggleTestVip,
  onResetProgress,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
    >
      <div
        className="w-full max-w-[360px] rounded-3xl border p-5 shadow-2xl flex flex-col gap-3.5"
        style={{
          backgroundColor: theme.canvasBg,
          borderColor: theme.surfaceBorder,
          color: theme.textPrimary,
        }}
      >
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="font-display text-xl font-bold">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:opacity-75 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sound Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={!progress.muted}
          onClick={onToggleMute}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border flex items-center justify-between text-sm font-medium cursor-pointer"
          style={{ backgroundColor: theme.surfaceBg, borderColor: theme.surfaceBorder }}
        >
          <span className="flex items-center gap-2.5">
            {progress.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>Sound Effects</span>
          </span>
          <span
            className="font-mono text-xs font-bold"
            style={{ color: !progress.muted ? theme.accentBg : theme.textMuted }}
          >
            {progress.muted ? 'MUTED' : 'ON'}
          </span>
        </button>

        {/* Colorblind Liquid Symbols Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={progress.colorblindSymbols}
          onClick={onToggleColorblind}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border flex items-center justify-between text-sm font-medium cursor-pointer"
          style={{ backgroundColor: theme.surfaceBg, borderColor: theme.surfaceBorder }}
        >
          <span className="flex items-center gap-2.5">
            <Eye className="w-4 h-4" />
            <span>Colorblind Liquid Symbols</span>
          </span>
          <span
            className="font-mono text-xs font-bold"
            style={{ color: progress.colorblindSymbols ? theme.accentBg : theme.textMuted }}
          >
            {progress.colorblindSymbols ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Test Mode: Simulate VIP Purchase Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={progress.testVipMode}
          onClick={onToggleTestVip}
          className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl border flex items-center justify-between text-sm font-medium cursor-pointer"
          style={{ backgroundColor: theme.surfaceBg, borderColor: theme.surfaceBorder }}
        >
          <span className="flex items-center gap-2.5">
            <Crown className="w-4 h-4" style={{ color: '#F59E0B' }} />
            <span>Test Mode: Simulate Purchase</span>
          </span>
          <span
            className="font-mono text-xs font-bold"
            style={{ color: progress.testVipMode ? theme.accentBg : theme.textMuted }}
          >
            {progress.testVipMode ? 'VIP ON' : 'OFF'}
          </span>
        </button>

        {/* Two-step safe Reset Progress */}
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl border flex items-center justify-center gap-2 text-sm font-semibold text-red-600 cursor-pointer"
            style={{ backgroundColor: theme.surfaceBg, borderColor: theme.surfaceBorder }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Progress</span>
          </button>
        ) : (
          <div
            className="rounded-2xl border p-3 flex flex-col gap-2"
            style={{ backgroundColor: theme.surfaceBg, borderColor: '#DC2626' }}
          >
            <p className="text-xs font-medium text-center">
              Reset level, coins, and unlocked cosmetics back to Level 1?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[40px] rounded-xl border text-xs font-semibold cursor-pointer"
                style={{ borderColor: theme.surfaceBorder }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                }}
                className="min-h-[40px] rounded-xl bg-red-600 text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
