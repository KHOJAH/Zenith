import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { typography, TypographyVariant } from '@/theme/typography';
import { useTheme } from '@/context/ThemeContext';

export interface ThemedTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function ThemedText({
  variant = 'bodyMd',
  color,
  style,
  children,
  ...props
}: ThemedTextProps) {
  const { colors } = useTheme();
  const baseStyle = typography[variant] || typography.bodyMd;
  const textColor = color || colors.text;

  return (
    <Text style={[baseStyle, { color: textColor }, style]} {...props}>
      {children}
    </Text>
  );
}
