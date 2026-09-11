import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut, FadeIn, LinearTransition } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { Transaction } from '@/db/schema';
import { formatCurrency, formatDateGroup } from '@/utils/formatters';
import { convertCurrency } from '@/utils/currencies';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { DateIntervalModal } from '@/components/DateIntervalModal';
import { TransactionDetailModal } from '@/components/TransactionDetailModal';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    transactions,
    analytics,
    currency,
    isBalanceHidden,
    dateInterval,
    setDateInterval,
    toggleBalanceVisibility,
  } = useTransactions();

  const [intervalModalVisible, setIntervalModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Net worth is data-driven for the active interval
  const netWorth = analytics.netSavings;

  // Filter interval transactions with normalized start and end boundaries
  const start = new Date(dateInterval.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateInterval.endDate);
  end.setHours(23, 59, 59, 999);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const intervalTransactions = transactions.filter((tx) => {
    const t = new Date(tx.date).getTime();
    return t >= startMs && t <= endMs;
  });
  const recentTransactions = intervalTransactions.slice(0, 5);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food & Dining':
        return 'coffee';
      case 'Shopping & Tech':
        return 'shopping-bag';
      case 'Housing & Utilities':
        return 'home';
      case 'Entertainment':
        return 'film';
      case 'Transport':
        return 'navigation';
      case 'Health & Wellness':
        return 'activity';
      case 'Income':
        return 'arrow-down-left';
      default:
        return 'dollar-sign';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Zenith" subtitle="Dashboard" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Dynamic Interval Badge */}
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select Date Interval"
            onPress={() => {
              try { Haptics.selectionAsync(); } catch {}
              setIntervalModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.periodBadge,
              {
                backgroundColor: colors.surfaceContainerLow,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
          >
            <Feather name="calendar" size={14} color={colors.textSecondary} />
            <ThemedText variant="labelMd" style={{ fontWeight: '600' }}>
              {dateInterval.label}
            </ThemedText>
            <Feather name="chevron-down" size={12} color={colors.textSecondary} />
          </Pressable>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  analytics.netSavings >= 0
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(5, 150, 105, 0.12)'
                    : colors.errorContainer,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    analytics.netSavings >= 0 ? colors.secondary : colors.error,
                },
              ]}
            />
            <ThemedText
              variant="labelSm"
              color={analytics.netSavings >= 0 ? colors.secondary : colors.error}
              style={{ fontWeight: '700', letterSpacing: 0.6 }}
            >
              {analytics.netSavings >= 0 ? 'NET POSITIVE' : 'NET DEFICIT'}
            </ThemedText>
          </View>
        </View>

        {/* Hero Card: Net Balance */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#0A0E1A' : '#0F172A',
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <ThemedText
              variant="labelSm"
              color="rgba(255,255,255,0.6)"
              style={{ letterSpacing: 0.8 }}
            >
              NET BALANCE
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle Balance Visibility"
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                toggleBalanceVisibility();
              }}
              hitSlop={8}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}
            >
              <Feather
                name={isBalanceHidden ? 'eye-off' : 'eye'}
                size={18}
                color="rgba(255,255,255,0.7)"
              />
            </Pressable>
          </View>

          <ThemedText
            variant="displayHero"
            color="#FFFFFF"
            style={styles.heroAmount}
          >
            {isBalanceHidden ? '••••••••' : formatCurrency(netWorth, currency)}
          </ThemedText>

          <View style={styles.heroDeltaRow}>
            <View
              style={[
                styles.deltaPill,
                {
                  backgroundColor:
                    netWorth >= 0
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(239, 68, 68, 0.2)',
                },
              ]}
            >
              <Feather
                name={netWorth >= 0 ? 'arrow-up-right' : 'arrow-down-right'}
                size={13}
                color={netWorth >= 0 ? '#10B981' : '#EF4444'}
              />
              <ThemedText
                variant="labelSm"
                color={netWorth >= 0 ? '#10B981' : '#EF4444'}
                style={{ fontWeight: '700' }}
              >
                {intervalTransactions.length} {intervalTransactions.length === 1 ? 'record' : 'records'}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Cash Flow Matrix (Income vs Expenses) */}
        <View style={styles.matrixRow}>
          {/* Card 1: Income */}
          <Card style={styles.matrixCard} padding="md" bordered={false}>
            <View style={styles.matrixHeader}>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Income
              </ThemedText>
              <View style={[styles.miniDot, { backgroundColor: colors.secondary }]} />
            </View>
            <ThemedText variant="headlineMd" color={colors.secondary} style={{ marginVertical: 4 }}>
              {formatCurrency(analytics.totalIncome, currency)}
            </ThemedText>
            <View style={styles.matrixPillRow}>
              <Feather name="trending-up" size={12} color={colors.secondary} />
              <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: '600' }}>
                Received
              </ThemedText>
            </View>
          </Card>

          {/* Card 2: Expenses */}
          <Card style={styles.matrixCard} padding="md" bordered={false}>
            <View style={styles.matrixHeader}>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Expenses
              </ThemedText>
              <View style={[styles.miniDot, { backgroundColor: colors.error }]} />
            </View>
            <ThemedText variant="headlineMd" color={colors.error} style={{ marginVertical: 4 }}>
              {formatCurrency(analytics.totalExpenses, currency)}
            </ThemedText>
            <View style={styles.matrixPillRow}>
              <Feather name="clock" size={12} color={colors.textSecondary} />
              <ThemedText variant="labelSm" color={colors.textSecondary}>
                {analytics.daysRemaining} days left
              </ThemedText>
            </View>
          </Card>
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <ThemedText variant="headlineSm">Recent Transactions</ThemedText>
            {intervalTransactions.length > 0 && (
              <Pressable
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch {}
                  router.push('/(tabs)/transactions');
                }}
                style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
              >
                <ThemedText variant="labelMd" color={colors.text}>
                  See all
                </ThemedText>
              </Pressable>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <Animated.View entering={FadeIn.duration(200)}>
              <Card padding="lg" bordered={false}>
                <EmptyState
                  title="No Transactions"
                  description="No transactions recorded for this interval."
                  onAction={() => router.push('/(tabs)/quick-add')}
                  actionTitle="Quick Add Transaction"
                />
              </Card>
            </Animated.View>
          ) : (
            <Card padding="xs" style={styles.activityCard} bordered={false}>
              {recentTransactions.map((tx, idx) => {
                const isExpense = tx.type === 'expense';
                const isLast = idx === recentTransactions.length - 1;
                const convertedAmount = convertCurrency(tx.amount, tx.currency || 'USD', currency);

                return (
                  <Animated.View
                    key={tx.id}
                    entering={FadeInDown.duration(200).delay(Math.min(idx * 25, 200))}
                    exiting={FadeOut.duration(150)}
                    layout={LinearTransition.duration(200)}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${tx.category}, ${formatCurrency(convertedAmount, currency)}`}
                      onPress={() => {
                        try { Haptics.selectionAsync(); } catch {}
                        setSelectedTx(tx);
                      }}
                      style={({ pressed }) => [
                        styles.txRow,
                        {
                          borderBottomColor: colors.border,
                          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                          backgroundColor: pressed ? colors.surfaceContainerLow : 'transparent',
                        },
                      ]}
                    >
                      <View style={styles.txLeft}>
                        <View
                          style={[
                            styles.txIconWrap,
                            {
                              backgroundColor:
                                tx.type === 'income'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : isDark
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(220, 38, 38, 0.1)',
                            },
                          ]}
                        >
                          <Feather
                            name={getCategoryIcon(tx.category) as any}
                            size={18}
                            color={tx.type === 'income' ? colors.secondary : colors.error}
                          />
                        </View>

                        <View style={{ flex: 1, minWidth: 0 }}>
                          <ThemedText variant="headlineSm" numberOfLines={1}>
                            {tx.category}
                          </ThemedText>
                          <View style={styles.txMetaRow}>
                            {tx.note ? (
                              <>
                                <ThemedText
                                  variant="bodySm"
                                  color={colors.textSecondary}
                                  numberOfLines={1}
                                  style={{ maxWidth: 130 }}
                                >
                                  {tx.note}
                                </ThemedText>
                                <View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} />
                              </>
                            ) : null}
                            <ThemedText variant="bodySm" color={colors.textTertiary}>
                              {formatDateGroup(tx.date)}
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      <View style={styles.txRight}>
                        <ThemedText
                          variant="headlineSm"
                          color={isExpense ? colors.error : colors.secondary}
                          style={{ fontWeight: '700' }}
                        >
                          {isExpense
                            ? `-${formatCurrency(convertedAmount, currency)}`
                            : `+${formatCurrency(convertedAmount, currency)}`}
                        </ThemedText>
                        <ThemedText variant="labelSm" color={colors.textTertiary}>
                          {tx.payment_method || 'Card'}
                        </ThemedText>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Date Interval Modal */}
      <DateIntervalModal
        visible={intervalModalVisible}
        currentInterval={dateInterval}
        onSelectInterval={(inv) => setDateInterval(inv)}
        onClose={() => setIntervalModalVisible(false)}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        visible={!!selectedTx}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 100,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    gap: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroCard: {
    borderRadius: radius.xxl,
    borderCurve: 'continuous',
    padding: spacing.lg,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroAmount: {
    marginVertical: spacing.sm,
  },
  heroDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 4,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    gap: 4,
  },
  matrixRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  matrixCard: {
    flex: 1,
    justifyContent: 'space-between',
  },
  matrixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  matrixPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xxs,
  },
  activitySection: {
    gap: spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityCard: {
    overflow: 'hidden',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  txRight: {
    alignItems: 'flex-end',
  },
});
