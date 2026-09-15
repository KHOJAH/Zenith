import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { formatCurrency } from '@/utils/formatters';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export interface CashFlowVelocityWidgetProps {
  onPressInterval?: () => void;
}

export function CashFlowVelocityWidget({ onPressInterval }: CashFlowVelocityWidgetProps) {
  const { colors, isDark } = useTheme();
  const {
    analytics,
    currency,
    isBalanceHidden,
    dateInterval,
    toggleBalanceVisibility,
  } = useTransactions();

  const totalIncome = analytics.totalIncome;
  const totalExpenses = analytics.totalExpenses;
  const netSavings = analytics.netSavings;

  // Savings rate calculation
  let savingsBadgeText = '0% Saved';
  let isSavingsPositive = true;

  if (totalIncome > 0) {
    const rate = Math.round(((totalIncome - totalExpenses) / totalIncome) * 100);
    if (rate >= 0) {
      savingsBadgeText = `${rate}% Saved`;
      isSavingsPositive = true;
    } else {
      savingsBadgeText = `${Math.abs(rate)}% Burn`;
      isSavingsPositive = false;
    }
  } else if (totalExpenses > 0) {
    savingsBadgeText = '100% Burn';
    isSavingsPositive = false;
  } else {
    savingsBadgeText = 'Balanced';
    isSavingsPositive = true;
  }

  // Split ratio calculation between Income and Expenses
  const totalFlow = totalIncome + totalExpenses;
  let inflowRatio = 0;
  let expenseRatio = 0;
  if (totalFlow > 0) {
    inflowRatio = Math.round((totalIncome / totalFlow) * 100);
    expenseRatio = 100 - inflowRatio;
  }

  // Pacing status calculation
  const dailySpend = analytics.dailyVelocity;
  const allowableDailySpend = totalIncome > 0 ? totalIncome / Math.max(1, analytics.totalDays) : 0;
  const isOptimal = totalIncome > 0
    ? dailySpend <= allowableDailySpend * 1.05
    : totalExpenses === 0;
  const pacingStatus = isOptimal ? 'Optimal' : 'Caution';

  const handleToggleEye = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics unavailable
    }
    toggleBalanceVisibility();
  };

  const formattedNetAmount = isBalanceHidden
    ? '••••••••'
    : `Net ${netSavings >= 0 ? '+' : '-'}${formatCurrency(Math.abs(netSavings), currency)}`;

  return (
    <GlassCard
      borderRadius={radius.xxl}
      style={styles.card}
      highlightColor={isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.9)'}
    >
      <View style={styles.content}>
        {/* Top Header: Title, Interval Badge, Net Flow, Savings Badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.titleRow}>
              <ThemedText variant="labelSm" color={colors.textTertiary} style={styles.sectionKicker}>
                CASH FLOW VELOCITY
              </ThemedText>
              {onPressInterval ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Interval: ${dateInterval.label}`}
                  onPress={() => {
                    try { Haptics.selectionAsync(); } catch {}
                    onPressInterval();
                  }}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.intervalTag,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  <Feather name="calendar" size={10} color={colors.textSecondary} />
                  <ThemedText variant="labelSm" color={colors.textSecondary} numberOfLines={1}>
                    {dateInterval.label}
                  </ThemedText>
                  <Feather name="chevron-right" size={10} color={colors.textTertiary} />
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.intervalTag,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
                    },
                  ]}
                >
                  <Feather name="calendar" size={10} color={colors.textSecondary} />
                  <ThemedText variant="labelSm" color={colors.textSecondary} numberOfLines={1}>
                    {dateInterval.label}
                  </ThemedText>
                </View>
              )}
            </View>

            <ThemedText
              variant="headlineMd"
              color={netSavings >= 0 ? colors.secondary : colors.error}
              style={styles.netAmountText}
            >
              {formattedNetAmount}
            </ThemedText>
          </View>

          <View style={styles.headerRight}>
            <View
              style={[
                styles.savingsBadge,
                {
                  backgroundColor: isSavingsPositive
                    ? (isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(5, 150, 105, 0.12)')
                    : (isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(220, 38, 38, 0.12)'),
                  borderColor: isSavingsPositive
                    ? (isDark ? 'rgba(16, 185, 129, 0.28)' : 'rgba(5, 150, 105, 0.22)')
                    : (isDark ? 'rgba(239, 68, 68, 0.28)' : 'rgba(220, 38, 38, 0.22)'),
                },
              ]}
            >
              <View
                style={[
                  styles.badgeDot,
                  { backgroundColor: isSavingsPositive ? colors.secondary : colors.error },
                ]}
              />
              <ThemedText
                variant="labelSm"
                color={isSavingsPositive ? colors.secondary : colors.error}
                style={{ fontWeight: '700' }}
              >
                {savingsBadgeText}
              </ThemedText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle Balance Visibility"
              onPress={handleToggleEye}
              hitSlop={8}
              style={({ pressed }) => [
                styles.eyeBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)',
                  transform: [{ scale: pressed ? 0.92 : 1 }],
                },
              ]}
            >
              <Feather
                name={isBalanceHidden ? 'eye-off' : 'eye'}
                size={15}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Side-by-Side Inflow and Expense Tiles */}
        <View style={styles.tilesRow}>
          {/* Inflow Tile */}
          <View
            style={[
              styles.tile,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
              },
            ]}
          >
            <View style={styles.tileHeader}>
              <View style={styles.tileHeaderLabel}>
                <View style={[styles.tileDot, { backgroundColor: '#10B981' }]} />
                <ThemedText variant="labelSm" color={colors.textSecondary}>
                  Inflow
                </ThemedText>
              </View>
              <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Feather name="arrow-down-left" size={13} color="#10B981" />
              </View>
            </View>

            <ThemedText variant="headlineMd" color={colors.text} style={styles.tileAmount}>
              {isBalanceHidden ? '••••••' : formatCurrency(totalIncome, currency)}
            </ThemedText>

            <View style={styles.tileFooter}>
              <Feather name="calendar" size={11} color="#10B981" />
              <ThemedText variant="labelSm" color={colors.textTertiary} numberOfLines={1}>
                {dateInterval.label}
              </ThemedText>
            </View>
          </View>

          {/* Expense Tile */}
          <View
            style={[
              styles.tile,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
              },
            ]}
          >
            <View style={styles.tileHeader}>
              <View style={styles.tileHeaderLabel}>
                <View style={[styles.tileDot, { backgroundColor: '#EF4444' }]} />
                <ThemedText variant="labelSm" color={colors.textSecondary}>
                  Expenses
                </ThemedText>
              </View>
              <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Feather name="arrow-up-right" size={13} color="#EF4444" />
              </View>
            </View>

            <ThemedText variant="headlineMd" color={colors.text} style={styles.tileAmount}>
              {isBalanceHidden ? '••••••' : formatCurrency(totalExpenses, currency)}
            </ThemedText>

            <View style={styles.tileFooter}>
              <Feather name="clock" size={11} color={colors.textTertiary} />
              <ThemedText variant="labelSm" color={colors.textTertiary}>
                {analytics.daysRemaining} {analytics.daysRemaining === 1 ? 'day' : 'days'} left
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Dual-Tone Split Ratio Progress Bar */}
        <View style={styles.splitRatioContainer}>
          <View style={styles.ratioMetaRow}>
            <View style={styles.ratioMetaItem}>
              <View style={[styles.ratioDot, { backgroundColor: '#10B981' }]} />
              <ThemedText variant="labelSm" color={colors.textSecondary}>
                Inflow {inflowRatio}%
              </ThemedText>
            </View>
            <View style={styles.ratioMetaItem}>
              <ThemedText variant="labelSm" color={colors.textSecondary}>
                Burn {expenseRatio}%
              </ThemedText>
              <View style={[styles.ratioDot, { backgroundColor: '#EF4444' }]} />
            </View>
          </View>

          <View
            style={[
              styles.progressBarTrack,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
          >
            {inflowRatio > 0 && (
              <View
                style={[
                  styles.progressSegment,
                  {
                    width: `${inflowRatio}%`,
                    backgroundColor: '#10B981',
                  },
                ]}
              />
            )}
            {expenseRatio > 0 && (
              <View
                style={[
                  styles.progressSegment,
                  {
                    width: `${expenseRatio}%`,
                    backgroundColor: '#EF4444',
                    borderLeftWidth: inflowRatio > 0 ? 1.5 : 0,
                    borderLeftColor: isDark ? '#0C0C0E' : '#FFFFFF',
                  },
                ]}
              />
            )}
          </View>
        </View>

        {/* Daily Spend Pace & Status Footer */}
        <View
          style={[
            styles.footer,
            {
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.07)',
            },
          ]}
        >
          <View style={styles.paceLeft}>
            <Feather name="activity" size={13} color={colors.textSecondary} />
            <ThemedText variant="bodySm" color={colors.textSecondary}>
              Daily Spend Pace:
            </ThemedText>
            <ThemedText variant="labelMd" color={colors.text} style={styles.dailyPaceValue}>
              {isBalanceHidden ? '•••' : `${formatCurrency(dailySpend, currency)}/day`}
            </ThemedText>
          </View>

          <View
            style={[
              styles.pacingPill,
              {
                backgroundColor: isOptimal
                  ? (isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(5, 150, 105, 0.12)')
                  : (isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(217, 119, 6, 0.14)'),
              },
            ]}
          >
            <View
              style={[
                styles.pacingDot,
                { backgroundColor: isOptimal ? '#10B981' : '#F59E0B' },
              ]}
            />
            <ThemedText
              variant="labelSm"
              color={isOptimal ? '#10B981' : (isDark ? '#FBBF24' : '#D97706')}
              style={{ fontWeight: '700' }}
            >
              {pacingStatus}
            </ThemedText>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  sectionKicker: {
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  intervalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  netAmountText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.4,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyeBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 6,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileHeaderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tileDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tileIconWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileAmount: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  splitRatioContainer: {
    gap: 6,
  },
  ratioMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratioMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressSegment: {
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  paceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  dailyPaceValue: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  pacingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  pacingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
