import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { formatCurrency, formatDateGroup } from '@/utils/formatters';
import { convertCurrency } from '@/utils/currencies';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { DateIntervalModal } from '@/components/DateIntervalModal';

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
    clearAll,
  } = useTransactions();

  const [intervalModalVisible, setIntervalModalVisible] = useState(false);

  // Net worth is data-driven for the active interval
  const netWorth = analytics.netSavings;

  const startMs = new Date(dateInterval.startDate).getTime();
  const endMs = new Date(dateInterval.endDate).getTime();
  const intervalTransactions = transactions.filter((tx) => {
    const t = new Date(tx.date).getTime();
    return t >= startMs && t <= endMs;
  });
  const recentTransactions = intervalTransactions.slice(0, 5);

  const handleClear = () => {
    Alert.alert(
      'Reset All Records',
      'Are you sure you want to delete all transactions and reset your ledger?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => clearAll() },
      ]
    );
  };

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
      >
        {/* Dynamic Interval Badge */}
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select Date Interval"
            onPress={() => setIntervalModalVisible(true)}
            style={({ pressed }) => [
              styles.periodBadge,
              {
                backgroundColor: colors.surfaceContainerLow,
                opacity: pressed ? 0.8 : 1,
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
                  analytics.budgetUsedPercent > 90
                    ? colors.errorContainer
                    : isDark
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(0, 108, 73, 0.1)',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    analytics.budgetUsedPercent > 90 ? colors.error : colors.secondary,
                },
              ]}
            />
            <ThemedText
              variant="labelSm"
              color={analytics.budgetUsedPercent > 90 ? colors.error : colors.secondary}
              style={{ fontWeight: '700', letterSpacing: 0.6 }}
            >
              {analytics.budgetUsedPercent > 90 ? 'NEAR LIMIT' : 'ON TRACK'}
            </ThemedText>
          </View>
        </View>

        {/* Hero Card: Net Balance */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#111726' : '#0F172A',
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
              onPress={toggleBalanceVisibility}
              hitSlop={8}
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
            <ThemedText variant="headlineMd" style={{ marginVertical: 4 }}>
              {formatCurrency(analytics.totalIncome, currency)}
            </ThemedText>
            <View style={styles.matrixPillRow}>
              <Feather name="trending-up" size={12} color={colors.secondary} />
              <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: '600' }}>
                Received
              </ThemedText>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceContainer }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: analytics.totalIncome > 0 ? '100%' : '0%',
                    backgroundColor: colors.secondary,
                  },
                ]}
              />
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
            <ThemedText variant="headlineMd" style={{ marginVertical: 4 }}>
              {formatCurrency(analytics.totalExpenses, currency)}
            </ThemedText>
            <View style={styles.matrixPillRow}>
              <Feather name="clock" size={12} color={colors.textSecondary} />
              <ThemedText variant="labelSm" color={colors.textSecondary}>
                {analytics.daysRemaining} days left
              </ThemedText>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceContainer }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, analytics.budgetUsedPercent)}%`,
                    backgroundColor: isDark ? colors.text : colors.primary,
                  },
                ]}
              />
            </View>
          </Card>
        </View>

        {/* Budget Progress Gauge */}
        <Card padding="md" style={styles.spendCapCard} bordered={false}>
          <View style={styles.spendCapHeader}>
            <View style={styles.spendCapTitle}>
              <Feather name="pie-chart" size={16} color={colors.primary} />
              <ThemedText variant="headlineSm">Budget</ThemedText>
            </View>
            <ThemedText variant="labelMd" style={{ fontWeight: '700' }}>
              {Math.round(analytics.budgetUsedPercent)}%
            </ThemedText>
          </View>

          <View style={[styles.gaugeTrack, { backgroundColor: colors.surfaceContainer }]}>
            <View
              style={[
                styles.gaugeFill,
                {
                  width: `${Math.min(100, analytics.budgetUsedPercent)}%`,
                  backgroundColor:
                    analytics.budgetUsedPercent > 90
                      ? colors.error
                      : isDark
                      ? colors.secondary
                      : colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.spendCapFooter}>
            <ThemedText variant="bodySm" color={colors.textSecondary}>
              <ThemedText variant="bodySm" style={{ fontWeight: '700' }}>
                {formatCurrency(analytics.totalExpenses, currency)}
              </ThemedText>{' '}
              of {formatCurrency(analytics.budgetCap, currency)}
            </ThemedText>
            <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: '700' }}>
              {formatCurrency(analytics.budgetRemaining, currency)} remaining
            </ThemedText>
          </View>
        </Card>

        {/* Recent Transactions Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <ThemedText variant="headlineSm">Recent Transactions</ThemedText>
            {intervalTransactions.length > 0 && (
              <Pressable onPress={() => router.push('/(tabs)/transactions')}>
                <ThemedText variant="labelMd" color={colors.text}>
                  See all
                </ThemedText>
              </Pressable>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <Card padding="lg" bordered={false}>
              <EmptyState
                title="No Transactions"
                description="No transactions recorded for this interval."
                onAction={() => router.push('/(tabs)/quick-add')}
                actionTitle="Quick Add Transaction"
              />
            </Card>
          ) : (
            <Card padding="xs" style={styles.activityCard} bordered={false}>
              {recentTransactions.map((tx, idx) => {
                const isExpense = tx.type === 'expense';
                const isLast = idx === recentTransactions.length - 1;
                const convertedAmount = convertCurrency(tx.amount, tx.currency || 'USD', currency);

                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.txRow,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
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
                                : colors.surfaceContainerLow,
                          },
                        ]}
                      >
                        <Feather
                          name={getCategoryIcon(tx.category) as any}
                          size={18}
                          color={tx.type === 'income' ? colors.secondary : colors.text}
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
                        color={isExpense ? colors.text : colors.secondary}
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
                  </View>
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
    gap: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroCard: {
    borderRadius: radius.xxl,
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
    marginBottom: spacing.xs,
  },
  progressBarBg: {
    height: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
    width: '100%',
    marginTop: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  spendCapCard: {
    gap: spacing.sm,
  },
  spendCapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spendCapTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gaugeTrack: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  spendCapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
