import { DAILY_GIFT_COOLDOWN_MS } from './rules';
import type { PersistedProgress, ThemeId, TubeStyleId } from './types';

export const SAVE_STORAGE_KEY = 'aquasort_zen_save_v1';

export const DEFAULT_PROGRESS: PersistedProgress = {
  level: 1,
  coins: 50,
  unlockedTubeStyles: ['classic'],
  selectedTubeStyle: 'classic',
  unlockedThemes: ['sage'],
  selectedTheme: 'sage',
  isVip: false,
  testVipMode: false,
  muted: false,
  colorblindSymbols: false,
  lastDailyGiftAt: null,
  levelsCompletedTotal: 0,
};

const VALID_TUBE_STYLES: TubeStyleId[] = ['classic', 'potion', 'goblet'];
const VALID_THEMES: ThemeId[] = ['sage', 'neon', 'sunset'];

export function sanitizeProgress(raw: unknown): PersistedProgress {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PROGRESS };
  }
  const obj = raw as Record<string, unknown>;

  const unlockedTubeStyles: TubeStyleId[] = Array.isArray(obj.unlockedTubeStyles)
    ? obj.unlockedTubeStyles.filter((s): s is TubeStyleId =>
        VALID_TUBE_STYLES.includes(s as TubeStyleId),
      )
    : ['classic'];
  if (!unlockedTubeStyles.includes('classic')) unlockedTubeStyles.unshift('classic');

  const selectedTubeStyle: TubeStyleId = VALID_TUBE_STYLES.includes(
    obj.selectedTubeStyle as TubeStyleId,
  )
    ? (obj.selectedTubeStyle as TubeStyleId)
    : 'classic';

  const unlockedThemes: ThemeId[] = Array.isArray(obj.unlockedThemes)
    ? obj.unlockedThemes.filter((t): t is ThemeId => VALID_THEMES.includes(t as ThemeId))
    : ['sage'];
  if (!unlockedThemes.includes('sage')) unlockedThemes.unshift('sage');

  const selectedTheme: ThemeId = VALID_THEMES.includes(obj.selectedTheme as ThemeId)
    ? (obj.selectedTheme as ThemeId)
    : 'sage';

  return {
    level:
      typeof obj.level === 'number' && Number.isFinite(obj.level) && obj.level >= 1
        ? Math.floor(obj.level)
        : 1,
    coins:
      typeof obj.coins === 'number' && Number.isFinite(obj.coins) && obj.coins >= 0
        ? Math.floor(obj.coins)
        : DEFAULT_PROGRESS.coins,
    unlockedTubeStyles,
    selectedTubeStyle: unlockedTubeStyles.includes(selectedTubeStyle)
      ? selectedTubeStyle
      : 'classic',
    unlockedThemes,
    selectedTheme: unlockedThemes.includes(selectedTheme) ? selectedTheme : 'sage',
    isVip: Boolean(obj.isVip),
    testVipMode: Boolean(obj.testVipMode),
    muted: Boolean(obj.muted),
    colorblindSymbols: Boolean(obj.colorblindSymbols),
    lastDailyGiftAt:
      typeof obj.lastDailyGiftAt === 'number' && Number.isFinite(obj.lastDailyGiftAt)
        ? obj.lastDailyGiftAt
        : null,
    levelsCompletedTotal:
      typeof obj.levelsCompletedTotal === 'number' &&
      Number.isFinite(obj.levelsCompletedTotal) &&
      obj.levelsCompletedTotal >= 0
        ? Math.floor(obj.levelsCompletedTotal)
        : 0,
  };
}

export function loadProgress(): PersistedProgress {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_PROGRESS };
  }
  try {
    const raw = window.localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: PersistedProgress): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function resetProgressStorage(): PersistedProgress {
  const fresh: PersistedProgress = { ...DEFAULT_PROGRESS };
  saveProgress(fresh);
  return fresh;
}

export function hasAdFreeVip(progress: Pick<PersistedProgress, 'isVip' | 'testVipMode'>): boolean {
  return progress.isVip || progress.testVipMode;
}

export function getDailyGiftRemainingMs(
  lastDailyGiftAt: number | null,
  now = Date.now(),
): number {
  if (lastDailyGiftAt === null) return 0;
  const elapsed = now - lastDailyGiftAt;
  return Math.max(0, DAILY_GIFT_COOLDOWN_MS - elapsed);
}

export function canClaimDailyGift(
  lastDailyGiftAt: number | null,
  now = Date.now(),
): boolean {
  return getDailyGiftRemainingMs(lastDailyGiftAt, now) === 0;
}

export function formatCooldown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}
