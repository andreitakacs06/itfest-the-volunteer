import { MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  displayLarge:  { fontFamily: 'SpaceGrotesk_700Bold',   fontWeight: '700' as const },
  displayMedium: { fontFamily: 'SpaceGrotesk_700Bold',   fontWeight: '700' as const },
  displaySmall:  { fontFamily: 'SpaceGrotesk_700Bold',   fontWeight: '700' as const },
  headlineLarge: { fontFamily: 'SpaceGrotesk_700Bold',   fontWeight: '700' as const },
  headlineMedium:{ fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  headlineSmall: { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  titleLarge:    { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  titleMedium:   { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  titleSmall:    { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  bodyLarge:     { fontFamily: 'SpaceGrotesk_400Regular',fontWeight: '400' as const },
  bodyMedium:    { fontFamily: 'SpaceGrotesk_400Regular',fontWeight: '400' as const },
  bodySmall:     { fontFamily: 'SpaceGrotesk_400Regular',fontWeight: '400' as const },
  labelLarge:    { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  labelMedium:   { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
  labelSmall:    { fontFamily: 'SpaceGrotesk_500Medium', fontWeight: '500' as const },
};

// ─── Base Palette ────────────────────────────────────────────────────────────
export const PALETTE = {
  // Brand blues
  blue100: '#EFF6FF',
  blue200: '#DBEAFE',
  blue400: '#60A5FA',
  blue500: '#0A84FF',
  blue600: '#0B6BCB',
  blue700: '#1D4ED8',

  // Greens
  green100: '#DCFCE7',
  green500: '#22C55E',
  green600: '#16A34A',
  green700: '#166534',

  // Amber / warning
  amber100: '#FEF3C7',
  amber400: '#FBBF24',
  amber500: '#F59E0B',

  // Red / danger
  red100:  '#FEF2F2',
  red300:  '#FCA5A5',
  red600:  '#DC2626',

  // Orange
  orange100: '#FFF7ED',
  orange600: '#C2410C',

  // Purple
  purple100: '#F5F3FF',
  purple600: '#6D28D9',

  // Neutrals
  white:    '#FFFFFF',
  slate50:  '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  slate900: '#0F172A',
} as const;

// ─── Category Theming ─────────────────────────────────────────────────────────
export type TaskCategory = 'Environment' | 'Elder Care' | 'Animals' | 'Education' | 'Community' | 'Other';

export const CATEGORY_META: Record<TaskCategory, { label: string; emoji: string; bg: string; text: string }> = {
  'Environment': { label: 'Environment', emoji: '🌱', bg: '#DCFCE7', text: '#166534' },
  'Elder Care':  { label: 'Elder Care',  emoji: '🏠', bg: '#FEF3C7', text: '#92400E' },
  'Animals':     { label: 'Animals',     emoji: '🐾', bg: '#EDE9FE', text: '#5B21B6' },
  'Education':   { label: 'Education',   emoji: '🏫', bg: '#DBEAFE', text: '#1D4ED8' },
  'Community':   { label: 'Community',   emoji: '🤝', bg: '#FFE4E6', text: '#9F1239' },
  'Other':       { label: 'Other',       emoji: '✨', bg: '#F1F5F9', text: '#334155' },
};

export const ALL_CATEGORIES: TaskCategory[] = ['Environment', 'Elder Care', 'Animals', 'Education', 'Community', 'Other'];

// ─── Requester type colors ────────────────────────────────────────────────────
export const REQUESTER_COLORS = {
  juridic:  { bg: PALETTE.blue200,  text: PALETTE.blue700,  label: 'NGO / Org' },
  physical: { bg: PALETTE.green100, text: PALETTE.green700, label: 'Individual' },
  general:  { bg: PALETTE.slate100, text: PALETTE.slate700, label: 'General' },
} as const;

// ─── Shared shadow presets ────────────────────────────────────────────────────
export const SHADOW_SM = {
  shadowColor: PALETTE.slate900,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2,
};

export const SHADOW_MD = {
  shadowColor: PALETTE.slate900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 4,
};

export const SHADOW_LG = {
  shadowColor: PALETTE.slate900,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.16,
  shadowRadius: 20,
  elevation: 8,
};

// ─── Radius tokens ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
} as const;

// ─── React Native Paper theme ─────────────────────────────────────────────────
export const theme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary:          PALETTE.blue500,
    secondary:        PALETTE.blue400,
    tertiary:         PALETTE.blue600,
    background:       PALETTE.slate50,
    surface:          PALETTE.white,
    surfaceVariant:   PALETTE.slate100,
    outline:          PALETTE.slate200,
    onSurfaceVariant: PALETTE.slate600,
    error:            PALETTE.red600,
  },
};
