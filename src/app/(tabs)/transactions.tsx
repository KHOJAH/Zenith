import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { Transaction } from '@/db/schema';
import { formatCurrency, formatDateGroup } from '@/utils/formatters';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';

const FILTER_CATEGORIES = [
  'All',
  'Food & Dining',
  'Shopping & Tech',
  'Entertainment',
  'Transport',
  'Health & Wellness',
  'Housing & Utilities',
  'Income',
];

export default function TransactionsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    transactions,
    analytics,
    currency,
    deleteTransaction,
    populateDemoData,
  } = useTransactions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchCat =
        selectedCategory === 'All' ||
        tx.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Food & Dining' && (tx.category.includes('Food') || tx.category.includes('Dining') || tx.category.includes('Groceries')));

      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        tx.merchant.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        (tx.tags && tx.tags.toLowerCase().includes(q)) ||
        tx.amount.toString().includes(q);

      return matchCat && matchQuery;
    });
  }, [transactions, selectedCategory, searchQuery]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { [dateGroup: string]: { items: Transaction[]; netTotal: number } } = {};

    filtered.forEach((tx) => {
      const groupKey = formatDateGroup(tx.date);
      if (!groups[groupKey]) {
        groups[groupKey] = { items: [], netTotal: 0 };
      }
      groups[groupKey].items.push(tx);
      if (tx.type === 'income') {
        groups[groupKey].netTotal += tx.amount;
      } else {
        groups[groupKey].netTotal -= tx.amount;
      }
    });

    return Object.entries(groups).map(([dateLabel, data]) => ({
      dateLabel,
      items: data.items,
      netTotal: data.netTotal,
    }));
  }, [filtered]);

  const handleDelete = (id: string, merchant: string) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to remove "${merchant}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
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
      <Header title="Zenith" subtitle="Transactions" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Spend Insight Header Pill */}
        <View
          style={[
            styles.spendInsightCard,
            {
              backgroundColor: isDark ? '#131A29' : '#131B2E',
              borderColor: isDark ? '#28334B' : '#1E293B',
            },
          ]}
        >
          <View style={styles.spendInsightTop}>
            <View style={styles.calendarRow}>
              <Feather name="calendar" size={14} color="#DAE2FD" />
              <ThemedText
                variant="labelSm"
                color="#DAE2FD"
                style={{ letterSpacing: 0.8, textTransform: 'uppercase' }}
              >
                October Overview
              </ThemedText>
            </View>

            <View style={styles.trackedBadge}>
              <ThemedText variant="labelSm" color="#FFFFFF">
                {analytics.daysPassed} Days Tracked
              </ThemedText>
            </View>
          </View>

          <View style={styles.spendInsightBottom}>
            <View>
              <ThemedText variant="bodySm" color="rgba(255,255,255,0.7)">
                October Spend
              </ThemedText>
              <ThemedText
                variant="displayHeroSm"
                color="#FFFFFF"
                style={{ marginTop: 2 }}
              >
                {formatCurrency(analytics.totalExpenses, currency)}
              </ThemedText>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText variant="bodySm" color="rgba(255,255,255,0.7)">
                Pace
              </ThemedText>
              <ThemedText
                variant="headlineSm"
                color="#10B981"
                style={{ marginTop: 2, fontWeight: '700' }}
              >
                {formatCurrency(analytics.dailyVelocity, currency)}
                <ThemedText
                  variant="bodySm"
                  color="rgba(255,255,255,0.7)"
                  style={{ fontWeight: '400' }}
                >
                  /day
                </ThemedText>
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Omni-Search & Filter Bar */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[
                styles.searchInput,
                { color: colors.text },
              ]}
              placeholder="Search merchant, tag, or amount..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Category Filter Chips Horizontal List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsList}
        >
          {FILTER_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? colors.secondary
                        : colors.primary
                      : isDark
                      ? colors.surfaceContainerLow
                      : colors.surfaceContainerLow,
                    borderColor: isSelected
                      ? isDark
                        ? colors.secondary
                        : colors.primary
                      : colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText
                  variant="labelMd"
                  color={
                    isSelected
                      ? isDark
                        ? '#052E16'
                        : colors.onPrimary
                      : colors.textSecondary
                  }
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                >
                  {cat}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Transactions Feed Groups */}
        {transactions.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              title="Ledger is Clean"
              description="You have no recorded expenses or payouts yet. Tap below to log one or load demo records."
              onAction={() => router.push('/(tabs)/quick-add')}
              actionTitle="Add Transaction"
              onLoadDemo={populateDemoData}
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              title="No transactions found"
              description="Try adjusting your search terms or clearing your category filters."
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              actionTitle="Reset Filters"
            />
          </Card>
        ) : (
          <View style={styles.groupsContainer}>
            {groupedTransactions.map((group) => (
              <View key={group.dateLabel} style={styles.groupBlock}>
                {/* Date Header */}
                <View style={styles.dateHeaderRow}>
                  <ThemedText variant="headlineSm" style={{ fontSize: 15 }}>
                    {group.dateLabel}
                  </ThemedText>
                  <ThemedText
                    variant="bodySm"
                    color={group.netTotal >= 0 ? colors.secondary : colors.textSecondary}
                    style={{ fontWeight: '600' }}
                  >
                    {group.netTotal >= 0 ? `+${formatCurrency(group.netTotal, currency)} Net` : `-${formatCurrency(Math.abs(group.netTotal), currency)}`}
                  </ThemedText>
                </View>

                {/* Items in date group */}
                <Card padding="xs" style={styles.groupCard}>
                  {group.items.map((tx, idx) => {
                    const isExpense = tx.type === 'expense';
                    const isLast = idx === group.items.length - 1;

                    return (
                      <Pressable
                        key={tx.id}
                        onLongPress={() => handleDelete(tx.id, tx.merchant)}
                        style={({ pressed }) => [
                          styles.itemRow,
                          {
                            borderBottomColor: colors.border,
                            borderBottomWidth: isLast ? 0 : 1,
                            backgroundColor: pressed
                              ? colors.surfaceContainerLow
                              : 'transparent',
                          },
                        ]}
                      >
                        <View style={styles.itemLeft}>
                          <View
                            style={[
                              styles.itemIconWrap,
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
                            <View style={styles.titleLine}>
                              <ThemedText variant="headlineSm" numberOfLines={1} style={{ flex: 1 }}>
                                {tx.merchant}
                              </ThemedText>
                              <ThemedText
                                variant="numericCurrency"
                                color={isExpense ? colors.text : colors.secondary}
                                style={{ fontWeight: '700', marginLeft: spacing.xs }}
                              >
                                {isExpense ? `-${formatCurrency(tx.amount, currency)}` : `+${formatCurrency(tx.amount, currency)}`}
                              </ThemedText>
                            </View>

                            {/* Tags & Metadata */}
                            <View style={styles.tagsLine}>
                              <ThemedText variant="bodySm" color={colors.textSecondary}>
                                {tx.category}
                              </ThemedText>
                              <View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} />
                              <ThemedText variant="bodySm" color={colors.textSecondary}>
                                {tx.payment_method || 'Card'}
                              </ThemedText>

                              {tx.is_split === 1 && (
                                <View style={[styles.inlineBadge, { backgroundColor: colors.surfaceContainer }]}>
                                  <Feather name="users" size={10} color={colors.textSecondary} />
                                  <ThemedText variant="labelSm" color={colors.textSecondary}>
                                    Split {tx.split_count ? `${tx.split_count}p` : '50/50'}
                                  </ThemedText>
                                </View>
                              )}

                              {tx.tags && tx.tags.includes('#work') && (
                                <View style={[styles.inlineBadge, { backgroundColor: isDark ? '#243048' : '#D3E4FE' }]}>
                                  <ThemedText variant="labelSm" color={isDark ? '#93C5FD' : '#1D4ED8'}>
                                    Work
                                  </ThemedText>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </Card>
              </View>
            ))}
          </View>
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
  spendInsightCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  spendInsightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trackedBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  spendInsightBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  searchSection: {
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  categoryChipsList: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  groupsContainer: {
    gap: spacing.md,
  },
  groupBlock: {
    gap: spacing.xs,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  groupCard: {
    overflow: 'hidden',
  },
  itemRow: {
    padding: spacing.md,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
});
