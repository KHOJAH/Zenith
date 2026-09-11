import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { ThemedText } from './ThemedText';

export interface ButtonProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
  textStyle,
  children,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    onPress?.();
  };

  let bg: string = colors.primary;
  let textCol: string = colors.onPrimary;
  let borderCol: string = 'transparent';

  if (variant === 'secondary') {
    bg = colors.surfaceContainer;
    textCol = colors.text;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textCol = colors.text;
  } else if (variant === 'outline') {
    bg = 'transparent';
    textCol = colors.text;
    borderCol = colors.border;
  } else if (variant === 'danger') {
    bg = colors.errorContainer;
    textCol = colors.error;
  }

  const sizeStyles: Record<'sm' | 'md' | 'lg', ViewStyle> = {
    sm: { minHeight: 38, paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.sm + 4 },
    md: { minHeight: 44, paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
    lg: { minHeight: 50, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      disabled={disabled || loading}
      onPress={handlePress}
      hitSlop={size === 'sm' ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.full,
          borderCurve: 'continuous',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: borderCol,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
          gap: spacing.xs,
        },
        sizeStyles[size],
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textCol} />
      ) : (
        <>
          {icon}
          {title ? (
            <ThemedText
              variant={size === 'sm' ? 'labelSm' : size === 'lg' ? 'headlineSm' : 'labelMd'}
              color={textCol}
              style={textStyle}
            >
              {title}
            </ThemedText>
          ) : (
            children
          )}
        </>
      )}
    </Pressable>
  );
}
