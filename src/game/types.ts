export type ColorId =
  | 'coral'
  | 'ocean'
  | 'amber'
  | 'jade'
  | 'plum'
  | 'rose'
  | 'sky'
  | 'ochre'
  | 'indigo'
  | 'lime'
  | 'crimson'
  | 'teal';

export type Tube = ColorId[]; // Bottom-to-top array, max length 4

export type ScreenState = 'title' | 'playing' | 'paused' | 'gameover';

export type TubeStyleId = 'classic' | 'potion' | 'goblet';

export type ThemeId = 'sage' | 'neon' | 'sunset';

export interface ColorMeta {
  id: ColorId;
  label: string;
  topHex: string;
  midHex: string;
  bottomHex: string;
  highlightHex: string;
  symbol: string;
}

export interface ShopItem<T extends string> {
  id: T;
  name: string;
  subtitle: string;
  price: number;
}

export interface PersistedProgress {
  level: number;
  coins: number;
  unlockedTubeStyles: TubeStyleId[];
  selectedTubeStyle: TubeStyleId;
  unlockedThemes: ThemeId[];
  selectedTheme: ThemeId;
  isVip: boolean;
  testVipMode: boolean;
  muted: boolean;
  colorblindSymbols: boolean;
  lastDailyGiftAt: number | null;
  levelsCompletedTotal: number;
}

export interface MoveRecord {
  tubes: Tube[];
  fromIdx: number;
  toIdx: number;
  movedCount: number;
}

export interface PourAnimationState {
  fromIdx: number;
  toIdx: number;
  color: ColorId;
  count: number;
  phase: 'tilting' | 'pouring';
}
