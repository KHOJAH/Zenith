import React from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { formatCurrency, formatTime, formatDateGroup } from '@/utils/formatters';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    transactions,
    analytics,
    currency,
    isBalanceHidden,
    toggleBalanceVisibility,
    populateDemoData,
    clearAll,
  } = useTransactions();

  // Net worth calculation: $14,850.40 baseline + net savings
  const baselineNetWorth = 14850.40;
  const currentNetWorth = transactions.length > 0
    ? baselineNetWorth + analytics.netSavings
    : 0;

  const recentTransactions = transactions.slice(0, 5);

  const handleClear = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to clear all transactions and reset to empty state?',
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
        {/* Month Selector & On-Track Pill */}
        <View style={styles.topRow}>
          <View style={[styles.periodBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText variant="headlineSm" style={{ fontSize: 15 }}>
              October 2024
            </ThemedText>
            <Feather name="chevron-down" size={14} color={colors.textSecondary} />
          </View>

          <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 108, 73, 0.1)' }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
            <ThemedText
              variant="labelSm"
              color={colors.secondary}
              style={{ fontWeight: '700', letterSpacing: 0.8 }}
            >
              ON TRACK
            </ThemedText>
          </View>
        </View>

        {/* Hero Card: Total Net Worth */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#111726' : '#0F172A',
              borderColor: isDark ? '#232C42' : '#1E293B',
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <ThemedText
              variant="labelSm"
              color="rgba(255,255,255,0.6)"
              style={{ letterSpacing: 0.8 }}
            >
              TOTAL NET WORTH
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
            {isBalanceHidden
              ? '••••••••'
              : formatCurrency(currentNetWorth, currency)}
          </ThemedText>

          <View style={styles.heroDeltaRow}>
            <View style={styles.deltaPill}>
              <Feather name="arrow-up-right" size={13} color="#10B981" />
              <ThemedText variant="labelSm" color="#10B981" style={{ fontWeight: '700' }}>
                +12.4%
              </ThemedText>
            </View>
            <ThemedText variant="bodySm" color="rgba(255,255,255,0.6)">
              vs last month
            </ThemedText>
          </View>
        </View>

        {/* Cash Flow Split Matrix (Inflow vs Outflow) */}
        <View style={styles.matrixRow}>
          {/* Card 1: Inflow */}
          <Card style={styles.matrixCard} padding="md">
            <View style={styles.matrixHeader}>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Cash Inflow
              </ThemedText>
              <View style={[styles.miniDot, { backgroundColor: colors.secondary }]} />
            </View>
            <ThemedText variant="headlineMd" style={{ marginVertical: 4 }}>
              {formatCurrency(analytics.totalIncome, currency)}
            </ThemedText>
            <View style={styles.matrixPillRow}>
              <Feather name="trending-up" size={12} color={colors.secondary} />
              <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: '600' }}>
                104% of goal
              </ThemedText>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceContainer }]}>
              <View style={[styles.progressBarFill, { width: '84%', backgroundColor: colors.secondary }]} />
            </View>
          </Card>

          {/* Card 2: Outflow / Expenses */}
          <Card style={styles.matrixCard} padding="md">
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

        {/* Monthly Spend Cap Visual Gauge */}
        <Card padding="md" style={styles.spendCapCard}>
          <View style={styles.spendCapHeader}>
            <View style={styles.spendCapTitle}>
              <Feather name="pie-chart" size={16} color={colors.primary} />
              <ThemedText variant="headlineSm">Monthly Spend Cap</ThemedText>
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
                  backgroundColor: analytics.budgetUsedPercent > 90 ? colors.error : isDark ? colors.secondary : colors.primary,
                },
              ]}
            />
          </View>

          <View style={styles.spendCapFooter}>
            <ThemedText variant="bodySm" color={colors.textSecondary}>
              <ThemedText variant="bodySm" style={{ fontWeight: '700' }}>
                {formatCurrency(analytics.totalExpenses, currency)}
              </ThemedText>{' '}
              of {formatCurrency(analytics.budgetCap, currency)} limit
            </ThemedText>
            <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: '700' }}>
              {formatCurrency(analytics.budgetRemaining, currency)} left
            </ThemedText>
          </View>
        </Card>

        {/* Quick Routine Shortcuts */}
        <View style={styles.routinesSection}>
          <ThemedText
            variant="labelSm"
            color={colors.textSecondary}
            style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: spacing.xs }}
          >
            Quick Routine
          </ThemedText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routineList}>
            <Pressable
              onPress={() => router.push('/(tabs)/quick-add')}
              style={({ pressed }) => [
                styles.routineBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="plus-circle" size={16} color={colors.text} />
              <ThemedText variant="labelMd">Log Expense</ThemedText>
            </Pressable>

            {transactions.length === 0 ? (
              <Pressable
                onPress={populateDemoData}
                style={({ pressed }) => [
                  styles.routineBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="download-cloud" size={16} color={colors.secondary} />
                <ThemedText variant="labelMd" color={colors.secondary}>
                  Load Demo Data
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleClear}
                style={({ pressed }) => [
                  styles.routineBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Feather name="trash-2" size={16} color={colors.error} />
                <ThemedText variant="labelMd" color={colors.error}>
                  Reset All
                </ThemedText>
              </Pressable>
            )}

            <Pressable
              onPress={() => router.push('/(tabs)/analytics')}
              style={({ pressed }) => [
                styles.routineBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather name="activity" size={16} color={colors.text} />
              <ThemedText variant="labelMd">Burn Rate</ThemedText>
            </Pressable>
          </ScrollView>
        </View>

        {/* Activity Stream Section */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <ThemedText variant="headlineSm">Activity Stream</ThemedText>
              <View style={[styles.recentPill, { backgroundColor: colors.surfaceContainer }]}>
                <ThemedText variant="labelSm" color={colors.textSecondary}>
                  Recent
                </ThemedText>
              </View>
            </View>

            <Pressable onPress={() => router.push('/(tabs)/transactions')}>
              <ThemedText variant="labelMd" color={colors.text}>
                See all
              </ThemedText>
            </Pressable>
          </View>

          {transactions.length === 0 ? (
            <Card padding="lg">
              <EmptyState
                title="Zero Transactions"
                description="Your activity stream is empty. Add a transaction or load the October demo ledger to see Zenith in action."
                onAction={() => router.push('/(tabs)/quick-add')}
                actionTitle="Quick Add Expense"
                onLoadDemo={populateDemoData}
              />
            </Card>
          ) : (
            <Card padding="xs" style={styles.activityCard}>
              {recentTransactions.map((tx, idx) => {
                const isExpense = tx.type === 'expense';
                const isLast = idx === recentTransactions.length - 1;

                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.txRow,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: isLast ? 0 : 1,
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
                          {tx.merchant}
                        </ThemedText>
                        <View style={styles.txMetaRow}>
                          <ThemedText variant="bodySm" color={colors.textSecondary}>
                            {tx.category}
                          </ThemedText>
                          <View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} />
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
                        {isExpense ? `-${formatCurrency(tx.amount, currency)}` : `+${formatCurrency(tx.amount, currency)}`}
                      </ThemedText>
                      <ThemedText variant="labelSm" color={colors.textTertiary}>
                        {tx.payment_method || 'Direct Debit'}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </Card>
          )}
        </View>

        {/* Auto-Categorization Footer Pill */}
        <Card padding="md" style={styles.footerSyncCard}>
          <View style={styles.footerSyncLeft}>
            <View
              style={[
                styles.shieldWrap,
                { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
              ]}
            >
              <Feather name="shield" size={18} color={colors.secondary} />
            </View>
            <View>
              <ThemedText variant="headlineSm" style={{ fontSize: 15 }}>
                Auto-Categorization
              </ThemedText>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                100% of statements synced on device
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textTertiary} />
        </Card>
      </ScrollView>
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
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
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
    borderWidth: 1,
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
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.full,
    gap: 3,
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
  routinesSection: {
    gap: spacing.xs,
  },
  routineList: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  routineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  activitySection: {
    gap: spacing.sm,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentPill: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.full,
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
  footerSyncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  footerSyncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shieldWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
