import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { formatCurrency, getCurrentMonthName } from '@/utils/formatters';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { DonutChart } from '@/components/DonutChart';
import { WeeklyBarChart } from '@/components/WeeklyBarChart';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useRouter } from 'expo-router';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    transactions,
    analytics,
    currency,
    dateInterval,
  } = useTransactions();

  const handleExport = () => {
    Alert.alert(
      'Export Statement',
      `Your ${dateInterval.label} financial summary statement has been prepared.`,
      [{ text: 'OK' }]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Housing & Utilities':
        return 'home';
      case 'Food & Dining':
        return 'coffee';
      case 'Shopping & Tech':
        return 'shopping-bag';
      case 'Entertainment':
        return 'film';
      case 'Transport':
        return 'navigation';
      case 'Health & Wellness':
        return 'activity';
      default:
        return 'dollar-sign';
    }
  };

  // Dynamic real data insight
  const topCategory = analytics.categorySummaries.reduce(
    (max, cat) => (cat.spent > max.spent ? cat : max),
    analytics.categorySummaries[0]
  );

  const savingsRate =
    analytics.totalIncome > 0
      ? Math.max(0, Math.round((analytics.netSavings / analytics.totalIncome) * 100))
      : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Zenith" subtitle="Analytics" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Interval Banner */}
        <View style={styles.topRow}>
          <View style={[styles.periodBadge, { backgroundColor: colors.surfaceContainerLow }]}>
            <Feather name="calendar" size={14} color={colors.textSecondary} />
            <ThemedText variant="labelMd" style={{ fontWeight: '600' }}>
              {dateInterval.label}
            </ThemedText>
          </View>
        </View>

        {transactions.length === 0 ? (
          <Card padding="lg" bordered={false}>
            <EmptyState
              title="No Analytics"
              description="Analytics require logged transactions to calculate your cash flow."
              onAction={() => router.push('/(tabs)/quick-add')}
              actionTitle="Log Transaction"
            />
          </Card>
        ) : (
          <>
            {/* Spending Insight Card */}
            <Card padding="md" style={styles.insightCard} bordered={false}>
              <View style={styles.insightHeader}>
                <View
                  style={[
                    styles.sparkleWrap,
                    { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                  ]}
                >
                  <Feather name="zap" size={18} color={colors.secondary} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.insightTitleRow}>
                    <ThemedText
                      variant="labelSm"
                      color={colors.secondary}
                      style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}
                    >
                      Spending Insight
                    </ThemedText>
                    <View style={[styles.pulseDot, { backgroundColor: colors.secondary }]} />
                  </View>

                  <ThemedText variant="bodyMd" style={{ marginTop: spacing.xxs, lineHeight: 20 }}>
                    {topCategory && topCategory.spent > 0 ? (
                      <>
                        Highest spending category is{' '}
                        <ThemedText variant="bodyMd" color={colors.secondary} style={{ fontWeight: '700' }}>
                          {topCategory.category}
                        </ThemedText>{' '}
                        at {formatCurrency(topCategory.spent, currency)} ({Math.round(topCategory.percentage)}% of total outflow).
                      </>
                    ) : (
                      <>
                        Maintaining pacing with{' '}
                        <ThemedText variant="bodyMd" color={colors.secondary} style={{ fontWeight: '700' }}>
                          {formatCurrency(analytics.dailyVelocity, currency)}/day
                        </ThemedText>{' '}
                        daily burn rate.
                      </>
                    )}
                  </ThemedText>
                </View>
              </View>
            </Card>

            {/* Donut Ring Overview */}
            <Card padding="lg" style={styles.donutCard} bordered={false}>
              <View style={styles.donutHeader}>
                <View>
                  <ThemedText variant="headlineSm">Category Distribution</ThemedText>
                  <ThemedText
                    variant="bodySm"
                    color={colors.textSecondary}
                  >
                    Spending by category
                  </ThemedText>
                </View>

                <View
                  style={[
                    styles.pacedBadge,
                    { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                  ]}
                >
                  <Feather name="pie-chart" size={12} color={colors.secondary} />
                  <ThemedText
                    variant="labelSm"
                    color={colors.secondary}
                    style={{ fontWeight: '700' }}
                  >
                    {analytics.categorySummaries.filter((c) => c.spent > 0).length} Active
                  </ThemedText>
                </View>
              </View>

              <DonutChart
                categorySummaries={analytics.categorySummaries}
                totalSpent={analytics.totalExpenses}
                currency={currency}
              />
            </Card>

            {/* Weekly Spending Bar Chart */}
            <Card padding="md" style={styles.runRateCard} bordered={false}>
              <View style={styles.runRateHeader}>
                <View>
                  <ThemedText variant="headlineSm">Weekly Spending</ThemedText>
                  <ThemedText
                    variant="bodySm"
                    color={colors.textSecondary}
                  >
                    Outflow pace
                  </ThemedText>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText variant="labelMd" color={colors.secondary} style={{ fontWeight: '700' }}>
                    {formatCurrency(analytics.totalExpenses, currency)}
                  </ThemedText>
                  <ThemedText variant="bodySm" color={colors.textTertiary}>
                    Total outflow
                  </ThemedText>
                </View>
              </View>

              <WeeklyBarChart weeklyBurn={analytics.weeklyBurn} currency={currency} />
            </Card>

            {/* Savings Rate Banner */}
            <View
              style={[
                styles.editorialBanner,
                {
                  backgroundColor: isDark ? '#161D2B' : '#0F172A',
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <ThemedText
                  variant="labelSm"
                  color="#10B981"
                  style={{ textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' }}
                >
                  Savings Rate
                </ThemedText>
                <ThemedText variant="headlineSm" color="#FFFFFF" style={{ marginTop: 2 }}>
                  {savingsRate}% Saved This Period
                </ThemedText>
                <ThemedText variant="bodySm" color="rgba(255,255,255,0.7)">
                  Net saved: {formatCurrency(analytics.netSavings, currency)}
                </ThemedText>
              </View>

              <View style={styles.bannerIconWrap}>
                <Feather name="trending-up" size={20} color="#FFFFFF" />
              </View>
            </View>

            {/* Category Spending Section */}
            <View style={styles.categoriesSection}>
              <View style={styles.catHeaderRow}>
                <ThemedText variant="headlineMd">Category Spending</ThemedText>
              </View>

              <View style={styles.categoryStack}>
                {analytics.categorySummaries.map((cat) => {
                  return (
                    <Card key={cat.category} padding="md" style={styles.categoryCard} bordered={false}>
                      <View style={styles.catTopRow}>
                        <View style={styles.catLeft}>
                          <View
                            style={[
                              styles.catIconWrap,
                              { backgroundColor: colors.surfaceContainerLow },
                            ]}
                          >
                            <Feather
                              name={getCategoryIcon(cat.category) as any}
                              size={18}
                              color={colors.text}
                            />
                          </View>
                          <View style={{ minWidth: 0, flex: 1 }}>
                            <ThemedText variant="headlineSm" numberOfLines={1}>
                              {cat.category}
                            </ThemedText>
                            <ThemedText variant="bodySm" color={colors.textSecondary}>
                              {Math.round(cat.percentage)}% of total expenses
                            </ThemedText>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <ThemedText variant="headlineSm" style={{ fontWeight: '700' }}>
                            {formatCurrency(cat.spent, currency)}
                          </ThemedText>
                        </View>
                      </View>

                      {/* Progress Meter */}
                      <View style={[styles.meterTrack, { backgroundColor: colors.surfaceContainer }]}>
                        <View
                          style={[
                            styles.meterFill,
                            {
                              width: `${cat.percentage}%`,
                              backgroundColor: cat.color || (isDark ? colors.secondary : colors.primary),
                            },
                          ]}
                        />
                      </View>
                    </Card>
                  );
                })}
              </View>
            </View>

            {/* Export Statement CTA */}
            <View style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}>
              <Button
                title="Export Detailed Statement"
                variant="outline"
                size="md"
                onPress={handleExport}
                icon={<Feather name="download" size={16} color={colors.text} />}
              />
            </View>
          </>
        )}
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
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  insightCard: {
    gap: spacing.xs,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  sparkleWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  donutCard: {
    gap: spacing.md,
  },
  donutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pacedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  runRateCard: {
    gap: spacing.sm,
  },
  runRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editorialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesSection: {
    gap: spacing.sm,
  },
  catHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryStack: {
    gap: spacing.sm,
  },
  categoryCard: {
    gap: spacing.sm,
  },
  catTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  catIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.full,
    marginTop: 2,
  },
  meterTrack: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
