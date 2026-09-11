import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({
  title = 'Zenith',
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftRow}>
          {showBack && (
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  opacity: pressed ? 0.7 : 1,
                  marginRight: spacing.xs,
                },
              ]}
            >
              <Feather name="chevron-left" size={20} color={colors.text} />
            </Pressable>
          )}

          <View style={styles.logoRow}>
            <View
              style={[
                styles.brandGlyph,
                { backgroundColor: isDark ? colors.secondary : colors.primary },
              ]}
            >
              <ThemedText
                variant="labelSm"
                color={isDark ? '#052E16' : '#FFFFFF'}
                style={{ fontWeight: '900' }}
              >
                Z
              </ThemedText>
            </View>
            <ThemedText variant="headlineSm" style={{ letterSpacing: -0.4 }}>
              {title}
            </ThemedText>
            {subtitle && (
              <ThemedText
                variant="bodySm"
                color={colors.textTertiary}
                style={{ marginLeft: spacing.xxs }}
              >
                / {subtitle}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.rightRow}>
          {rightAction}

          {/* Theme Mode Toggle Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle Theme"
            onPress={toggleTheme}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.surfaceContainerLow,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {isDark ? (
              <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
            ) : (
              <Ionicons name="moon-outline" size={18} color={colors.text} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  content: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandGlyph: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
