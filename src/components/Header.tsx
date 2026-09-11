import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { getCurrencyInfo } from '@/utils/currencies';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';
import { CurrencyModal } from './CurrencyModal';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  hideCurrency?: boolean;
}

export function Header({
  title = 'Zenith',
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  hideCurrency = false,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { currency, setCurrency } = useTransactions();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const currentCurrencyInfo = getCurrencyInfo(currency);

  return (
    <>
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
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch {}
                  onBack?.();
                }}
                style={({ pressed }) => [
                  styles.iconButton,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
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

            {/* Currency Picker Button */}
            {!hideCurrency && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select Currency"
                onPress={() => setCurrencyModalVisible(true)}
                style={({ pressed }) => [
                  styles.currencyPill,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <ThemedText style={{ fontSize: 13 }}>
                  {currentCurrencyInfo.flag}
                </ThemedText>
                <ThemedText variant="labelSm" color={colors.text} style={{ fontWeight: '700' }}>
                  {currency}
                </ThemedText>
              </Pressable>
            )}

            {/* Theme Mode Toggle Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle Theme"
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                toggleTheme();
              }}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
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

      <CurrencyModal
        visible={currencyModalVisible}
        selectedCode={currency}
        onSelect={(code) => setCurrency(code)}
        onClose={() => setCurrencyModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 4,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
