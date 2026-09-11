import React from 'react';
import { View, ViewProps, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export interface CardProps extends ViewProps {
  variant?: 'surface' | 'low' | 'high' | 'hero';
  padding?: keyof typeof spacing;
  bordered?: boolean;
}

export function Card({
  variant = 'surface',
  padding = 'md',
  bordered = false,
  style,
  children,
  ...props
}: CardProps) {
  const { colors, isDark } = useTheme();

  let backgroundColor: string = colors.surface;
  if (variant === 'low') backgroundColor = colors.surfaceContainerLow;
  if (variant === 'high') backgroundColor = colors.surfaceContainerHigh;
  if (variant === 'hero') backgroundColor = colors.heroCardBackground;

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderRadius: radius.xl,
    padding: spacing[padding],
    borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
    borderColor: variant === 'hero' ? (isDark ? '#2D3748' : '#1E293B') : colors.border,
  };

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}
