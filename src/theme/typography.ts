import { TextStyle, Platform } from 'react-native';

const fontFamilySans = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

const fontFamilyMedium = Platform.select({
  ios: 'System',
  android: 'sans-serif-medium',
  default: 'sans-serif-medium',
});

export const typography: Record<string, TextStyle> = {
  displayHero: {
    fontFamily: fontFamilySans,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  displayHeroSm: {
    fontFamily: fontFamilySans,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  headlineLg: {
    fontFamily: fontFamilyMedium,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headlineMd: {
    fontFamily: fontFamilyMedium,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headlineSm: {
    fontFamily: fontFamilyMedium,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bodyLg: {
    fontFamily: fontFamilySans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyMd: {
    fontFamily: fontFamilySans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  bodySm: {
    fontFamily: fontFamilySans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  labelMd: {
    fontFamily: fontFamilyMedium,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  labelSm: {
    fontFamily: fontFamilyMedium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  numericMetric: {
    fontFamily: fontFamilySans,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  numericCurrency: {
    fontFamily: fontFamilySans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  },
};

export type TypographyVariant = keyof typeof typography;
