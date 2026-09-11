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
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { Transaction } from '@/db/schema';
import { formatCurrency, formatDateGroup, getCurrentMonthName } from '@/utils/formatters';
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
  'Housing & Utilities',
  'Entertainment',
  'Transport',
  'Health & Wellness',
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
  } = useTransactions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchCat =
        selectedCategory === 'All' ||
        tx.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        tx.merchant.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.note && tx.note.toLowerCase().includes(q)) ||
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
      `Delete "${merchant}" from your records?`,
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
      <Header title="Zenith" subtitle="Ledger" />

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
                {getCurrentMonthName()} Overview
              </ThemedText>
            </View>

            <View style={styles.trackedBadge}>
              <ThemedText variant="labelSm" color="#FFFFFF">
                {analytics.daysPassed} Days In
              </ThemedText>
            </View>
          </View>

          <View style={styles.spendInsightBottom}>
            <View>
              <ThemedText variant="bodySm" color="rgba(255,255,255,0.7)">
                Current Spend
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
                Burn Pace
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
              placeholder="Search by payee, note, amount..."
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
                      : colors.surfaceContainerLow,
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
          <Card padding="lg" bordered={false}>
            <EmptyState
              title="No Transactions Yet"
              description="Your ledger is completely clean. Tap below to log an expense or income."
              onAction={() => router.push('/(tabs)/quick-add')}
              actionTitle="Log First Transaction"
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card padding="lg" bordered={false}>
            <EmptyState
              title="No Matching Records"
              description="No transactions found matching your search. Try changing your search query or category filter."
              onAction={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              actionTitle="Reset Filter"
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
                    {group.netTotal >= 0
                      ? `+${formatCurrency(group.netTotal, currency)} Net`
                      : `-${formatCurrency(Math.abs(group.netTotal), currency)}`}
                  </ThemedText>
                </View>

                {/* Items in date group */}
                <Card padding="xs" style={styles.groupCard} bordered={false}>
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
                            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
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
                                {isExpense
                                  ? `-${formatCurrency(tx.amount, currency)}`
                                  : `+${formatCurrency(tx.amount, currency)}`}
                              </ThemedText>
                            </View>

                            <View style={styles.metaLine}>
                              <ThemedText variant="bodySm" color={colors.textSecondary}>
                                {tx.category}
                              </ThemedText>
                              <View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} />
                              <ThemedText variant="bodySm" color={colors.textTertiary}>
                                {tx.payment_method || 'Card'}
                              </ThemedText>
                              {tx.note ? (
                                <>
                                  <View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} />
                                  <ThemedText
                                    variant="bodySm"
                                    color={colors.textTertiary}
                                    numberOfLines={1}
                                    style={{ flex: 1 }}
                                  >
                                    {tx.note}
                                  </ThemedText>
                                </>
                              ) : null}
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
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 3,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
