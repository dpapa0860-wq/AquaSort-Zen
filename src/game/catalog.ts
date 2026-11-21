import type { ColorId, ColorMeta, ShopItem, ThemeId, TubeStyleId } from './types';

export const LIQUID_COLORS: Record<ColorId, ColorMeta> = {
  coral: {
    id: 'coral',
    label: 'Coral',
    topHex: '#FF8A7A',
    midHex: '#F25C4D',
    bottomHex: '#C93A2B',
    highlightHex: '#FFD2CC',
    symbol: '●',
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean',
    topHex: '#56B8FF',
    midHex: '#1D8FE1',
    bottomHex: '#0F62A8',
    highlightHex: '#BFE4FF',
    symbol: '▲',
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    topHex: '#FFD166',
    midHex: '#F4A226',
    bottomHex: '#C4770B',
    highlightHex: '#FFF0C2',
    symbol: '◆',
  },
  jade: {
    id: 'jade',
    label: 'Jade',
    topHex: '#5CE0A8',
    midHex: '#1FB57A',
    bottomHex: '#108255',
    highlightHex: '#C4F7E1',
    symbol: '■',
  },
  plum: {
    id: 'plum',
    label: 'Plum',
    topHex: '#C78BFF',
    midHex: '#9352E5',
    bottomHex: '#6728B8',
    highlightHex: '#EAD4FF',
    symbol: '★',
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    topHex: '#FF8FC8',
    midHex: '#E84A97',
    bottomHex: '#B3246A',
    highlightHex: '#FFD6EB',
    symbol: '✿',
  },
  sky: {
    id: 'sky',
    label: 'Aqua',
    topHex: '#7CE8FF',
    midHex: '#23C1E8',
    bottomHex: '#0E8BB0',
    highlightHex: '#D1F7FF',
    symbol: '◐',
  },
  ochre: {
    id: 'ochre',
    label: 'Terracotta',
    topHex: '#F0A47A',
    midHex: '#CC6D3D',
    bottomHex: '#99471E',
    highlightHex: '#FADACC',
    symbol: '✚',
  },
  indigo: {
    id: 'indigo',
    label: 'Indigo',
    topHex: '#8C9EFF',
    midHex: '#4F63E7',
    bottomHex: '#2D3EB5',
    highlightHex: '#D4DBFF',
    symbol: '✦',
  },
  lime: {
    id: 'lime',
    label: 'Matcha',
    topHex: '#BBE66E',
    midHex: '#84BD2B',
    bottomHex: '#5A8A12',
    highlightHex: '#E8F7C6',
    symbol: '◈',
  },
  crimson: {
    id: 'crimson',
    label: 'Berry',
    topHex: '#E86884',
    midHex: '#BA2D4E',
    bottomHex: '#851631',
    highlightHex: '#FACCD6',
    symbol: '▼',
  },
  teal: {
    id: 'teal',
    label: 'Lagoon',
    topHex: '#5CD6D0',
    midHex: '#18A49E',
    bottomHex: '#0A736E',
    highlightHex: '#C2F4F2',
    symbol: '❖',
  },
};

export const COLOR_ORDER: ColorId[] = [
  'coral',
  'ocean',
  'amber',
  'jade',
  'plum',
  'rose',
  'sky',
  'ochre',
  'indigo',
  'lime',
  'crimson',
  'teal',
];

export const TUBE_STYLES: ShopItem<TubeStyleId>[] = [
  {
    id: 'classic',
    name: 'Classic Test Tube',
    subtitle: 'Sleek borosilicate cylinder with flared lip',
    price: 0,
  },
  {
    id: 'potion',
    name: 'Round Potion Flask',
    subtitle: 'Botanical apothecary bulb with narrow neck',
    price: 120,
  },
  {
    id: 'goblet',
    name: 'Crystal Goblet',
    subtitle: 'Faceted chalice silhouette with stemmed base',
    price: 240,
  },
];

export interface ThemePalette {
  id: ThemeId;
  name: string;
  subtitle: string;
  price: number;
  isDark: boolean;
  outerBg: string;
  canvasBg: string;
  canvasAmbient: string;
  surfaceBg: string;
  surfaceBorder: string;
  textPrimary: string;
  textMuted: string;
  accentBg: string;
  accentText: string;
  accentHover: string;
  glassStroke: string;
  glassHighlight: string;
  glassFill: string;
  lockGlow: string;
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  sage: {
    id: 'sage',
    name: 'Sage Zen',
    subtitle: 'Tranquil mist, warm stone, and botanical calm',
    price: 0,
    isDark: false,
    outerBg: '#DCE5DF',
    canvasBg: '#EEF3EF',
    canvasAmbient: 'radial-gradient(circle at 50% 18%, #F8FBF9 0%, #E6EFE9 55%, #D8E4DC 100%)',
    surfaceBg: 'rgba(255, 255, 255, 0.88)',
    surfaceBorder: 'rgba(30, 58, 47, 0.12)',
    textPrimary: '#162C23',
    textMuted: '#4A665A',
    accentBg: '#1F6E54',
    accentText: '#FFFFFF',
    accentHover: '#175742',
    glassStroke: 'rgba(22, 44, 35, 0.28)',
    glassHighlight: 'rgba(255, 255, 255, 0.72)',
    glassFill: 'rgba(255, 255, 255, 0.42)',
    lockGlow: '#1FB57A',
  },
  neon: {
    id: 'neon',
    name: 'Midnight Neon',
    subtitle: 'Deep twilight indigo with luminous prism accents',
    price: 150,
    isDark: true,
    outerBg: '#090D18',
    canvasBg: '#0F1629',
    canvasAmbient: 'radial-gradient(circle at 50% 15%, #1E294D 0%, #11182E 55%, #0A0F1F 100%)',
    surfaceBg: 'rgba(20, 29, 54, 0.90)',
    surfaceBorder: 'rgba(148, 179, 255, 0.18)',
    textPrimary: '#F1F5FF',
    textMuted: '#9BAEE0',
    accentBg: '#38BDF8',
    accentText: '#071526',
    accentHover: '#22A7E5',
    glassStroke: 'rgba(186, 214, 255, 0.36)',
    glassHighlight: 'rgba(255, 255, 255, 0.48)',
    glassFill: 'rgba(255, 255, 255, 0.08)',
    lockGlow: '#38BDF8',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Beach',
    subtitle: 'Golden horizon warmth over soft coral sand',
    price: 200,
    isDark: false,
    outerBg: '#F4DFCF',
    canvasBg: '#FDF3EA',
    canvasAmbient: 'radial-gradient(circle at 50% 14%, #FFF9F2 0%, #FBE7D6 52%, #F3D2BE 100%)',
    surfaceBg: 'rgba(255, 251, 246, 0.90)',
    surfaceBorder: 'rgba(120, 56, 32, 0.14)',
    textPrimary: '#361B12',
    textMuted: '#7A4D3C',
    accentBg: '#D95D39',
    accentText: '#FFFFFF',
    accentHover: '#BF4B29',
    glassStroke: 'rgba(110, 48, 28, 0.28)',
    glassHighlight: 'rgba(255, 255, 255, 0.78)',
    glassFill: 'rgba(255, 255, 255, 0.45)',
    lockGlow: '#F4A226',
  },
};

export const THEME_LIST: ThemePalette[] = [THEMES.sage, THEMES.neon, THEMES.sunset];
