import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  AppState,
  AppStateStatus,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { GlassCard } from '@/components/GlassCard';
import { ThemedText } from '@/components/ThemedText';
import { formatCurrency } from '@/utils/formatters';
import { convertCurrency } from '@/utils/currencies';
import { getPaydayCountdownDetails } from '@/utils/salary';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export interface PaydayCountdownWidgetProps {
  onAdjustDate?: () => void;
}

export function PaydayCountdownWidget({ onAdjustDate }: PaydayCountdownWidgetProps) {
  const { colors, isDark } = useTheme();
  const {
    salaryDay,
    currency,
    isBalanceHidden,
    transactions,
    analytics,
  } = useTransactions();

  // AppState-aware live timer that ticks every second when active
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (!intervalId) {
        intervalId = setInterval(() => {
          setNow(new Date());
        }, 1000);
      }
    };

    const stopTimer = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Start timer immediately upon mounting
    startTimer();

    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      if (status === 'active') {
        setNow(new Date());
        startTimer();
      } else {
        stopTimer();
      }
    });

    return () => {
      stopTimer();
      subscription.remove();
    };
  }, []);

  // Compute countdown, target date, and timeline progress
  const {
    paydayDateLabel,
    isPaydayToday,
    days,
    hours,
    minutes,
    seconds,
    totalCycleDays,
    elapsedDays,
    percentCompleted,
  } = getPaydayCountdownDetails(salaryDay, now);

  // Estimate deposit from recurring or past income transactions
  const incomeTxs = transactions.filter((t) => t.type === 'income');
  const salaryTx = incomeTxs.find((t) =>
    (t.merchant && /salary|payroll|paycheck|direct deposit/i.test(t.merchant)) ||
    (t.note && /salary|payroll|paycheck|direct deposit/i.test(t.note))
  );
  const lastIncome = incomeTxs[0];
  const estDeposit = salaryTx
    ? convertCurrency(salaryTx.amount, salaryTx.currency || 'USD', currency)
    : (analytics.totalIncome > 0
        ? analytics.totalIncome
        : (lastIncome
            ? convertCurrency(lastIncome.amount, lastIncome.currency || 'USD', currency)
            : 0));

  const formattedDeposit = isBalanceHidden
    ? '••••••'
    : (estDeposit > 0 ? formatCurrency(estDeposit, currency) : '--');

  return (
    <GlassCard
      borderRadius={radius.xxl}
      style={styles.card}
      highlightColor={isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(2, 132, 199, 0.15)'}
    >
      <View style={styles.content}>
        {/* Header: Title, Next Target Date, Badge */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.titleRow}>
              <ThemedText variant="labelSm" color={colors.textTertiary} style={styles.sectionKicker}>
                PAYDAY HORIZON
              </ThemedText>
              {isPaydayToday && (
                <View
                  style={[
                    styles.todayPill,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(5, 150, 105, 0.14)',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.25)',
                    },
                  ]}
                >
                  <View style={[styles.todayDot, { backgroundColor: colors.secondary }]} />
                  <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: '700' }}>
                    Payday Today!
                  </ThemedText>
                </View>
              )}
            </View>

            <ThemedText variant="headlineSm" color={colors.text} style={styles.targetDateText}>
              {paydayDateLabel}
            </ThemedText>
          </View>

          <View
            style={[
              styles.nextBadge,
              {
                backgroundColor: isDark ? 'rgba(6, 182, 212, 0.14)' : 'rgba(2, 132, 199, 0.1)',
                borderColor: isDark ? 'rgba(6, 182, 212, 0.28)' : 'rgba(2, 132, 199, 0.2)',
              },
            ]}
          >
            <Feather name="arrow-down-circle" size={12} color={colors.accentCyan} />
            <ThemedText variant="labelSm" color={colors.accentCyan} style={{ fontWeight: '700' }}>
              Next: {formattedDeposit}
            </ThemedText>
          </View>
        </View>

        {/* 4 Tactile Countdown Pill Blocks */}
        <View style={styles.pillsRow}>
          {/* Days */}
          <View
            style={[
              styles.pillBlock,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
              },
            ]}
          >
            <ThemedText variant="headlineLg" color={colors.text} style={styles.pillNumber}>
              {String(days).padStart(2, '0')}
            </ThemedText>
            <ThemedText variant="labelSm" color={colors.textSecondary} style={styles.pillLabel}>
              DAYS
            </ThemedText>
          </View>

          {/* Hours */}
          <View
            style={[
              styles.pillBlock,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
              },
            ]}
          >
            <ThemedText variant="headlineLg" color={colors.text} style={styles.pillNumber}>
              {String(hours).padStart(2, '0')}
            </ThemedText>
            <ThemedText variant="labelSm" color={colors.textSecondary} style={styles.pillLabel}>
              HOURS
            </ThemedText>
          </View>

          {/* Minutes */}
          <View
            style={[
              styles.pillBlock,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
              },
            ]}
          >
            <ThemedText variant="headlineLg" color={colors.text} style={styles.pillNumber}>
              {String(minutes).padStart(2, '0')}
            </ThemedText>
            <ThemedText variant="labelSm" color={colors.textSecondary} style={styles.pillLabel}>
              MINS
            </ThemedText>
          </View>

          {/* Seconds */}
          <View
            style={[
              styles.pillBlock,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.65)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
              },
            ]}
          >
            <ThemedText
              variant="headlineLg"
              color={colors.accentCyan}
              style={[styles.pillNumber, { fontWeight: '700' }]}
            >
              {String(seconds).padStart(2, '0')}
            </ThemedText>
            <ThemedText variant="labelSm" color={colors.textSecondary} style={styles.pillLabel}>
              SECS
            </ThemedText>
          </View>
        </View>

        {/* Cycle Timeline Bar */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineMetaRow}>
            <View style={styles.timelineMetaLeft}>
              <Feather name="clock" size={11} color={colors.textSecondary} />
              <ThemedText variant="labelSm" color={colors.textSecondary}>
                Cycle Timeline
              </ThemedText>
            </View>

            <ThemedText variant="labelSm" color={colors.textSecondary} style={{ fontVariant: ['tabular-nums'] }}>
              {elapsedDays} of {totalCycleDays} days • {percentCompleted}%
            </ThemedText>
          </View>

          <View
            style={[
              styles.timelineTrack,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
              },
            ]}
          >
            <View
              style={[
                styles.timelineFill,
                {
                  width: `${percentCompleted}%`,
                  backgroundColor: colors.accentCyan,
                },
              ]}
            />
          </View>
        </View>

        {/* Footnote & Action: Est Deposit & Adjust Date Button */}
        <View
          style={[
            styles.footer,
            {
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.07)',
            },
          ]}
        >
          <View style={styles.footerLeft}>
            <ThemedText variant="bodySm" color={colors.textSecondary}>
              Est. Net Deposit:
            </ThemedText>
            <ThemedText variant="labelMd" color={colors.text} style={styles.estDepositValue}>
              {formattedDeposit}
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adjust Salary Date"
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              onAdjustDate?.();
            }}
            hitSlop={6}
            style={({ pressed }) => [
              styles.adjustBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Feather name="sliders" size={12} color={colors.text} />
            <ThemedText variant="labelSm" color={colors.text} style={{ fontWeight: '600' }}>
              Adjust Date
            </ThemedText>
          </Pressable>
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
    gap: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    gap: 3,
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
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  targetDateText: {
    fontWeight: '600',
    marginTop: 2,
  },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  pillBlock: {
    flex: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pillNumber: {
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  },
  pillLabel: {
    letterSpacing: 0.8,
    fontWeight: '700',
    fontSize: 10,
  },
  timelineSection: {
    gap: 6,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  timelineFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  estDepositValue: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
