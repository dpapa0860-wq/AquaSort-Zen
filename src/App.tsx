import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ConfettiCanvas } from './components/ConfettiCanvas';
import { GameBoard } from './components/GameBoard';
import {
  BottomBannerAd,
  InterstitialAdModal,
  LevelCompleteModal,
  RewardedAdModal,
  SettingsModal,
  ShopModal,
  VipModal,
} from './components/Modals';
import { TitleScreen } from './components/TitleScreen';
import {
  ADMOB_CONFIG,
  syncNativeBanner,
  triggerInterstitialAd,
  triggerRewardedAd,
} from './game/admob';
import { THEMES } from './game/catalog';
import { generateLevel } from './game/generator';
import {
  AD_BONUS_UNDOS,
  BASE_LEVEL_COINS,
  DAILY_GIFT_COINS,
  INITIAL_FREE_UNDOS,
  INTERSTITIAL_INTERVAL,
  canPour,
  cloneTubes,
  executePour,
  findHintMove,
  isLevelWon,
  isTubeComplete,
} from './game/rules';
import { soundEngine } from './game/sound';
import {
  canClaimDailyGift,
  hasAdFreeVip,
  loadProgress,
  resetProgressStorage,
  saveProgress,
} from './game/storage';
import type {
  MoveRecord,
  PersistedProgress,
  PourAnimationState,
  ScreenState,
  ThemeId,
  Tube,
  TubeStyleId,
} from './game/types';

type PendingRewardType = 'extra_tube' | 'more_undos' | 'double_coins';

export default function App() {
  const [progress, setProgress] = useState<PersistedProgress>(() => {
    const loaded = loadProgress();
    soundEngine.setMuted(loaded.muted);
    return loaded;
  });

  const [screen, setScreen] = useState<ScreenState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  // Active level board state
  const [activeLevelNumber, setActiveLevelNumber] = useState<number>(() => progress.level);
  const [tubes, setTubes] = useState<Tube[]>(() => generateLevel(progress.level).tubes);
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [pourAnim, setPourAnim] = useState<PourAnimationState | null>(null);
  const [justLockedIndices, setJustLockedIndices] = useState<number[]>([]);
  const [hintPair, setHintPair] = useState<{ fromIdx: number; toIdx: number } | null>(null);
  const [undosLeft, setUndosLeft] = useState<number>(INITIAL_FREE_UNDOS);
  const [extraTubeAdded, setExtraTubeAdded] = useState<boolean>(false);
  const [movesCount, setMovesCount] = useState<number>(0);

  // Victory snapshot
  const [winSnapshot, setWinSnapshot] = useState<{
    level: number;
    moves: number;
    coinsEarned: number;
    doubledClaimed: boolean;
  } | null>(null);

  // Modals
  const [showShop, setShowShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVip, setShowVip] = useState(false);
  const [pendingReward, setPendingReward] = useState<PendingRewardType | null>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);

  const pourTimerRef = useRef<number | null>(null);
  const sparkleTimerRef = useRef<number | null>(null);

  const theme = THEMES[progress.selectedTheme] || THEMES.sage;
  const vipActive = hasAdFreeVip(progress);

  // Sync body dataset state for testability and game-shell parity
  useEffect(() => {
    document.body.dataset.state = screen;
  }, [screen]);

  // Auto-save progress whenever it changes & sync native AdMob banner visibility
  useEffect(() => {
    saveProgress(progress);
    soundEngine.setMuted(progress.muted);
    void syncNativeBanner(!hasAdFreeVip(progress), ADMOB_CONFIG.bannerId);
  }, [progress]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pourTimerRef.current) window.clearTimeout(pourTimerRef.current);
      if (sparkleTimerRef.current) window.clearTimeout(sparkleTimerRef.current);
    };
  }, []);

  const loadBoardForLevel = useCallback((lvl: number) => {
    if (pourTimerRef.current) {
      window.clearTimeout(pourTimerRef.current);
      pourTimerRef.current = null;
    }
    const generated = generateLevel(lvl);
    setActiveLevelNumber(lvl);
    setTubes(generated.tubes);
    setHistory([]);
    setSelectedIdx(null);
    setPourAnim(null);
    setJustLockedIndices([]);
    setHintPair(null);
    setUndosLeft(INITIAL_FREE_UNDOS);
    setExtraTubeAdded(false);
    setMovesCount(0);
    setWinSnapshot(null);
  }, []);

  const startGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    loadBoardForLevel(progress.level);
    setScreen('playing');
  }, [loadBoardForLevel, progress.level]);

  const handleSelectTube = useCallback(
    (index: number) => {
      if (screen !== 'playing' || pourAnim) return;
      const tappedTube = tubes[index];
      if (!tappedTube) return;

      setHintPair(null);

      // Nothing selected yet: lift top matching layer if tube has liquid and isn't locked
      if (selectedIdx === null) {
        if (tappedTube.length === 0 || isTubeComplete(tappedTube)) {
          soundEngine.playInvalidTap();
          return;
        }
        setSelectedIdx(index);
        soundEngine.playGlassClink(1);
        return;
      }

      // Tapped same tube: lower it back down
      if (selectedIdx === index) {
        setSelectedIdx(null);
        soundEngine.playGlassClink(0.88);
        return;
      }

      const sourceTube = tubes[selectedIdx];
      if (!canPour(sourceTube, tappedTube)) {
        // Switch selection smoothly if user tapped another active non-locked tube
        if (tappedTube.length > 0 && !isTubeComplete(tappedTube)) {
          setSelectedIdx(index);
          soundEngine.playGlassClink(1.04);
        } else {
          setSelectedIdx(null);
          soundEngine.playInvalidTap();
        }
        return;
      }

      const preview = executePour(tubes, selectedIdx, index);
      if (!preview) {
        setSelectedIdx(null);
        soundEngine.playInvalidTap();
        return;
      }

      const fromIdx = selectedIdx;
      const toIdx = index;

      setSelectedIdx(null);
      setPourAnim({
        fromIdx,
        toIdx,
        color: preview.color,
        count: preview.movedCount,
        phase: 'pouring',
      });
      soundEngine.playWaterPour(preview.movedCount);

      pourTimerRef.current = window.setTimeout(() => {
        pourTimerRef.current = null;
        setHistory((prev) => [
          ...prev,
          {
            tubes: cloneTubes(tubes),
            fromIdx,
            toIdx,
            movedCount: preview.movedCount,
          },
        ]);
        setTubes(preview.nextTubes);
        setMovesCount((m) => m + 1);
        setPourAnim(null);

        if (preview.completedTarget) {
          setJustLockedIndices((prev) => [...prev, toIdx]);
          soundEngine.playTubeLockChime();
          if (sparkleTimerRef.current) window.clearTimeout(sparkleTimerRef.current);
          sparkleTimerRef.current = window.setTimeout(() => {
            setJustLockedIndices([]);
          }, 900);
        }

        if (isLevelWon(preview.nextTubes)) {
          const completedLvl = activeLevelNumber;
          const nextMoves = movesCount + 1;
          setWinSnapshot({
            level: completedLvl,
            moves: nextMoves,
            coinsEarned: BASE_LEVEL_COINS,
            doubledClaimed: false,
          });
          setProgress((prev) => ({
            ...prev,
            level: Math.max(prev.level, completedLvl + 1),
            coins: prev.coins + BASE_LEVEL_COINS,
            levelsCompletedTotal: prev.levelsCompletedTotal + 1,
          }));
          setScreen('gameover');
          soundEngine.playLevelWinFanfare();
        }
      }, 260);
    },
    [activeLevelNumber, movesCount, pourAnim, screen, selectedIdx, tubes],
  );

  const applyReward = useCallback((reward: PendingRewardType) => {
    soundEngine.playCoinReward();
    if (reward === 'extra_tube') {
      setTubes((prev) => [...prev, []]);
      setExtraTubeAdded(true);
    } else if (reward === 'more_undos') {
      setUndosLeft((u) => u + AD_BONUS_UNDOS);
    } else if (reward === 'double_coins') {
      setWinSnapshot((prev) => {
        if (!prev || prev.doubledClaimed) return prev;
        setProgress((p) => ({
          ...p,
          coins: p.coins + prev.coinsEarned,
        }));
        return {
          ...prev,
          coinsEarned: prev.coinsEarned * 2,
          doubledClaimed: true,
        };
      });
    }
  }, []);

  const requestRewardedAd = useCallback(
    (reward: PendingRewardType) => {
      void triggerRewardedAd(ADMOB_CONFIG.rewardedId).then((res) => {
        if (res.handledNatively) {
          if (res.rewarded) {
            applyReward(reward);
          }
        } else {
          setPendingReward(reward);
        }
      });
    },
    [applyReward],
  );

  const handleUndo = useCallback(() => {
    if (screen !== 'playing' || pourAnim) return;
    if (undosLeft <= 0) {
      requestRewardedAd('more_undos');
      return;
    }
    if (history.length === 0) return;

    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setTubes(last.tubes);
    setSelectedIdx(null);
    setHintPair(null);
    setUndosLeft((u) => Math.max(0, u - 1));
    soundEngine.playGlassClink(0.8);
  }, [history, pourAnim, requestRewardedAd, screen, undosLeft]);

  const handleAddTube = useCallback(() => {
    if (screen !== 'playing' || pourAnim || extraTubeAdded) return;
    requestRewardedAd('extra_tube');
  }, [extraTubeAdded, pourAnim, requestRewardedAd, screen]);

  const handleHint = useCallback(() => {
    if (screen !== 'playing' || pourAnim) return;
    const move = findHintMove(tubes);
    if (!move) {
      soundEngine.playInvalidTap();
      return;
    }
    setSelectedIdx(null);
    setHintPair(move);
    soundEngine.playGlassClink(1.15);
  }, [pourAnim, screen, tubes]);

  const handleRestart = useCallback(() => {
    if (screen !== 'playing') return;
    loadBoardForLevel(activeLevelNumber);
    soundEngine.playGlassClink(0.95);
  }, [activeLevelNumber, loadBoardForLevel, screen]);

  const handleToggleMute = useCallback(() => {
    setProgress((prev) => {
      const nextMuted = !prev.muted;
      soundEngine.setMuted(nextMuted);
      return { ...prev, muted: nextMuted };
    });
  }, []);

  const handleClaimDailyGift = useCallback(() => {
    const now = Date.now();
    setProgress((prev) => {
      if (!canClaimDailyGift(prev.lastDailyGiftAt, now)) return prev;
      soundEngine.playCoinReward();
      return {
        ...prev,
        coins: prev.coins + DAILY_GIFT_COINS,
        lastDailyGiftAt: now,
      };
    });
  }, []);

  const handleSelectOrBuyTube = useCallback((id: TubeStyleId, price: number) => {
    setProgress((prev) => {
      if (prev.unlockedTubeStyles.includes(id)) {
        soundEngine.playGlassClink(1.05);
        return { ...prev, selectedTubeStyle: id };
      }
      if (prev.coins < price) {
        soundEngine.playInvalidTap();
        return prev;
      }
      soundEngine.playCoinReward();
      return {
        ...prev,
        coins: prev.coins - price,
        unlockedTubeStyles: [...prev.unlockedTubeStyles, id],
        selectedTubeStyle: id,
      };
    });
  }, []);

  const handleSelectOrBuyTheme = useCallback((id: ThemeId, price: number) => {
    setProgress((prev) => {
      if (prev.unlockedThemes.includes(id)) {
        soundEngine.playGlassClink(1.05);
        return { ...prev, selectedTheme: id };
      }
      if (prev.coins < price) {
        soundEngine.playInvalidTap();
        return prev;
      }
      soundEngine.playCoinReward();
      return {
        ...prev,
        coins: prev.coins - price,
        unlockedThemes: [...prev.unlockedThemes, id],
        selectedTheme: id,
      };
    });
  }, []);

  const handleRewardComplete = useCallback(() => {
    const reward = pendingReward;
    setPendingReward(null);
    if (!reward) return;
    applyReward(reward);
  }, [applyReward, pendingReward]);

  const handleProceedToNextLevel = useCallback(() => {
    const nextLvl = progress.level;
    const shouldShowInterstitial =
      !hasAdFreeVip(progress) &&
      progress.levelsCompletedTotal > 0 &&
      progress.levelsCompletedTotal % INTERSTITIAL_INTERVAL === 0;

    if (shouldShowInterstitial) {
      void triggerInterstitialAd(ADMOB_CONFIG.interstitialId).then((res) => {
        if (res.handledNatively) {
          loadBoardForLevel(nextLvl);
          setScreen('playing');
        } else {
          setShowInterstitial(true);
        }
      });
    } else {
      loadBoardForLevel(nextLvl);
      setScreen('playing');
    }
  }, [loadBoardForLevel, progress]);

  const handleInterstitialDone = useCallback(() => {
    setShowInterstitial(false);
    loadBoardForLevel(progress.level);
    setScreen('playing');
  }, [loadBoardForLevel, progress.level]);

  const handleSimulateVipPurchase = useCallback(() => {
    setProgress((prev) => {
      if (prev.isVip) return prev;
      soundEngine.playCoinReward();
      return {
        ...prev,
        isVip: true,
        coins: prev.coins + 100,
      };
    });
  }, []);

  const handleToggleTestVip = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      testVipMode: !prev.testVipMode,
    }));
  }, []);

  const handleToggleColorblind = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      colorblindSymbols: !prev.colorblindSymbols,
    }));
  }, []);

  const handleResetProgress = useCallback(() => {
    const fresh = resetProgressStorage();
    setProgress(fresh);
    soundEngine.setMuted(fresh.muted);
    loadBoardForLevel(1);
    setShowSettings(false);
    setScreen('title');
  }, [loadBoardForLevel]);

  // Global keyboard bindings: Enter/Space on title, U Undo, R Restart, M Mute, Esc close modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const anyModalOpen =
        showShop ||
        showSettings ||
        showVip ||
        pendingReward !== null ||
        showInterstitial;

      if (e.key === 'Escape') {
        if (pendingReward) setPendingReward(null);
        else if (showShop) setShowShop(false);
        else if (showSettings) setShowSettings(false);
        else if (showVip) setShowVip(false);
        else if (showInterstitial) handleInterstitialDone();
        return;
      }

      if (anyModalOpen) return;

      if (screen === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        // Avoid double-triggering if user focused a secondary button
        if (
          document.activeElement instanceof HTMLButtonElement &&
          document.activeElement.dataset.start !== 'true'
        ) {
          return;
        }
        e.preventDefault();
        startGame();
        return;
      }

      if (screen === 'playing') {
        const key = e.key.toLowerCase();
        if (key === 'u') {
          e.preventDefault();
          handleUndo();
        } else if (key === 'r') {
          e.preventDefault();
          handleRestart();
        } else if (key === 'm') {
          e.preventDefault();
          handleToggleMute();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleInterstitialDone,
    handleRestart,
    handleToggleMute,
    handleUndo,
    pendingReward,
    screen,
    showInterstitial,
    showSettings,
    showShop,
    showVip,
    startGame,
  ]);

  const rewardLabel =
    pendingReward === 'extra_tube'
      ? '+1 Empty Tube'
      : pendingReward === 'more_undos'
      ? '+3 Undos'
      : '+25 Bonus Coins (2x)';

  return (
    <div
      className="w-full h-[100dvh] flex items-center justify-center md:p-4 overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: theme.outerBg }}
    >
      {/* Centered mobile game frame on desktop; full-screen edge-to-edge on phones */}
      <div
        data-testid="game-frame"
        className="relative w-full h-full md:max-w-[430px] md:h-[min(calc(100dvh-32px),844px)] md:rounded-[34px] md:border md:shadow-2xl flex flex-col overflow-hidden"
        style={{
          background: theme.canvasAmbient,
          borderColor: theme.surfaceBorder,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Main View Switcher */}
        <div className="flex-1 min-h-0 flex flex-col">
          {screen === 'title' ? (
            <TitleScreen
              progress={progress}
              theme={theme}
              onStartGame={startGame}
              onClaimDailyGift={handleClaimDailyGift}
              onOpenShop={() => setShowShop(true)}
              onOpenVip={() => setShowVip(true)}
              onOpenSettings={() => setShowSettings(true)}
              onToggleMute={handleToggleMute}
            />
          ) : (
            <GameBoard
              level={activeLevelNumber}
              tubes={tubes}
              selectedIdx={selectedIdx}
              pourAnim={pourAnim}
              justLockedIndices={justLockedIndices}
              hintPair={hintPair}
              undosLeft={undosLeft}
              canUndoHistory={history.length > 0}
              extraTubeAdded={extraTubeAdded}
              movesCount={movesCount}
              progress={progress}
              theme={theme}
              onSelectTube={handleSelectTube}
              onUndo={handleUndo}
              onAddTube={handleAddTube}
              onHint={handleHint}
              onRestart={handleRestart}
              onGoHome={() => {
                setSelectedIdx(null);
                setScreen('title');
              }}
              onOpenShop={() => setShowShop(true)}
              onOpenSettings={() => setShowSettings(true)}
              onToggleMute={handleToggleMute}
            />
          )}
        </div>

        {/* 50px Bottom Banner Ad Slot (Hidden when VIP/Ad-Free mode is active) */}
        {!vipActive && (
          <BottomBannerAd
            theme={theme}
            onUpgradeClick={() => setShowVip(true)}
          />
        )}
      </div>

      {/* Confetti celebration overlay */}
      <ConfettiCanvas active={screen === 'gameover' && !showInterstitial} />

      {/* Level Complete Modal */}
      {screen === 'gameover' && winSnapshot && !showInterstitial && !pendingReward && (
        <LevelCompleteModal
          level={winSnapshot.level}
          movesCount={winSnapshot.moves}
          coinsEarned={winSnapshot.coinsEarned}
          doubledClaimed={winSnapshot.doubledClaimed}
          theme={theme}
          onDoubleCoinsAd={() => requestRewardedAd('double_coins')}
          onNextLevel={handleProceedToNextLevel}
        />
      )}

      {/* Rewarded Ad Preview Modal (3-second timer) */}
      {pendingReward && (
        <RewardedAdModal
          rewardLabel={rewardLabel}
          theme={theme}
          onComplete={handleRewardComplete}
          onCancel={() => setPendingReward(null)}
        />
      )}

      {/* Skippable Interstitial Ad Modal (Every 3 levels) */}
      {showInterstitial && (
        <InterstitialAdModal
          theme={theme}
          onSkip={handleInterstitialDone}
          onOpenVip={() => {
            setShowInterstitial(false);
            setShowVip(true);
          }}
        />
      )}

      {/* Cosmetic Shop Modal */}
      {showShop && (
        <ShopModal
          progress={progress}
          theme={theme}
          onSelectOrBuyTube={handleSelectOrBuyTube}
          onSelectOrBuyTheme={handleSelectOrBuyTheme}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* Remove Ads + VIP Modal */}
      {showVip && (
        <VipModal
          progress={progress}
          theme={theme}
          onSimulateVipPurchase={handleSimulateVipPurchase}
          onToggleTestVip={handleToggleTestVip}
          onClose={() => setShowVip(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          progress={progress}
          theme={theme}
          onToggleMute={handleToggleMute}
          onToggleColorblind={handleToggleColorblind}
          onToggleTestVip={handleToggleTestVip}
          onResetProgress={handleResetProgress}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
