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
    background: '#FFFFFF', // Clean White default
    surface: '#F8FAFC',
    surfaceContainerLow: '#F1F5F9',
    surfaceContainer: '#E2E8F0',
    surfaceContainerHigh: '#CBD5E1',
    surfaceContainerHighest: '#94A3B8',
    surfaceDim: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    primary: '#0F172A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#1E293B',
    onPrimaryContainer: '#F1F5F9',
    secondary: '#059669',
    secondaryMint: '#10B981',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D1FAE5',
    onSecondaryContainer: '#065F46',
    error: '#DC2626',
    onError: '#FFFFFF',
    errorContainer: '#FEE2E2',
    onErrorContainer: '#991B1B',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    accentCyan: '#0284C7',
    tabBarBackground: 'rgba(255, 255, 255, 0.95)',
    heroCardBackground: '#0F172A',
    heroCardText: '#FFFFFF',
  },
  dark: {
    background: '#000000', // Obsidian OLED Pure Black
    surface: '#0C0C0E',
    surfaceContainerLow: '#121215',
    surfaceContainer: '#1A1A1F',
    surfaceContainerHigh: '#24242B',
    surfaceContainerHighest: '#2E2E38',
    surfaceDim: '#000000',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    primary: '#FFFFFF',
    onPrimary: '#000000',
    primaryContainer: '#1C2333',
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
    border: '#1E1E24',
    borderStrong: '#2A2A34',
    accentCyan: '#06B6D4',
    tabBarBackground: 'rgba(0, 0, 0, 0.95)',
    heroCardBackground: '#0B0F19',
    heroCardText: '#FFFFFF',
  },
};

export type ThemeMode = 'light' | 'dark';
