export interface ThemeColors {
  background: string;
  surface: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceDim: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryMint: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  border: string;
  borderStrong: string;
  accentCyan: string;
  tabBarBackground: string;
  heroCardBackground: string;
  heroCardText: string;
}

export const palette: Record<'light' | 'dark', ThemeColors> = {
  light: {
    background: '#F8F9FF',
    surface: '#FFFFFF',
    surfaceContainerLow: '#EFF4FF',
    surfaceContainer: '#E5EEFF',
    surfaceContainerHigh: '#DCE9FF',
    surfaceContainerHighest: '#D3E4FE',
    surfaceDim: '#CBDBF5',
    text: '#0B1C30',
    textSecondary: '#45464D',
    textTertiary: '#76777D',
    primary: '#000000',
    onPrimary: '#FFFFFF',
    primaryContainer: '#131B2E',
    onPrimaryContainer: '#DAE2FD',
    secondary: '#006C49',
    secondaryMint: '#10B981',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#6CF8BB',
    onSecondaryContainer: '#005236',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#93000A',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    accentCyan: '#0284C7',
    tabBarBackground: 'rgba(248, 249, 255, 0.95)',
    heroCardBackground: '#0F172A',
    heroCardText: '#FFFFFF',
  },
  dark: {
    background: '#0A0E17',
    surface: '#181B25',
    surfaceContainerLow: '#12151E',
    surfaceContainer: '#1F2432',
    surfaceContainerHigh: '#282F40',
    surfaceContainerHighest: '#333C52',
    surfaceDim: '#080B12',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    primary: '#FFFFFF',
    onPrimary: '#0A0E17',
    primaryContainer: '#222B3D',
    onPrimaryContainer: '#E2E8F0',
    secondary: '#10B981',
    secondaryMint: '#34D399',
    onSecondary: '#052E16',
    secondaryContainer: '#064E3B',
    onSecondaryContainer: '#6EE7B7',
    error: '#EF4444',
    onError: '#450A0A',
    errorContainer: '#7F1D1D',
    onErrorContainer: '#FCA5A5',
    border: '#353943',
    borderStrong: '#474D5A',
    accentCyan: '#06B6D4',
    tabBarBackground: 'rgba(10, 14, 23, 0.95)',
    heroCardBackground: '#131824',
    heroCardText: '#FFFFFF',
  },
};

export type ThemeMode = 'light' | 'dark';
