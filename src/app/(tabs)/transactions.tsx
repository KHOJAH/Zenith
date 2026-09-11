import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
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
import { Button } from '@/components/Button';
import { TransactionDetailModal } from '@/components/TransactionDetailModal';

export default function TransactionsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    transactions,
    categories,
    analytics,
    currency,
    dateInterval,
    setDateInterval,
    deleteTransaction,
    clearAll,
  } = useTransactions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [intervalModalVisible, setIntervalModalVisible] = useState(false);
  const [clearAllModalVisible, setClearAllModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filterCategories = useMemo(() => {
    const list = ['All', ...categories.map((b) => b.category), 'Income'];
    return Array.from(new Set(list));
  }, [categories]);

  // Filter transactions within selected date interval and query (inclusive of entire start and end days)
  const filtered = useMemo(() => {
    const start = new Date(dateInterval.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateInterval.endDate);
    end.setHours(23, 59, 59, 999);
    const startMs = start.getTime();
    const endMs = end.getTime();

    return transactions.filter((tx) => {
      const txTime = new Date(tx.date).getTime();
      const inInterval = txTime >= startMs && txTime <= endMs;
      if (!inInterval) return false;

      const matchCat =
        selectedCategory === 'All' ||
        tx.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        tx.category.toLowerCase().includes(q) ||
        (tx.note && tx.note.toLowerCase().includes(q)) ||
        (tx.payment_method && tx.payment_method.toLowerCase().includes(q)) ||
        tx.amount.toString().includes(q);

      return matchCat && matchQuery;
    });
  }, [transactions, selectedCategory, searchQuery, dateInterval]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { [dateGroup: string]: { items: Transaction[]; netTotal: number } } = {};

    filtered.forEach((tx) => {
      const groupKey = formatDateGroup(tx.date);
      if (!groups[groupKey]) {
        groups[groupKey] = { items: [], netTotal: 0 };
      }
      groups[groupKey].items.push(tx);
      const converted = convertCurrency(tx.amount, tx.currency || 'USD', currency);
      if (tx.type === 'income') {
        groups[groupKey].netTotal += converted;
      } else {
        groups[groupKey].netTotal -= converted;
      }
    });

    return Object.entries(groups).map(([dateLabel, data]) => ({
      dateLabel,
      items: data.items,
      netTotal: Math.round(data.netTotal * 100) / 100,
    }));
  }, [filtered, currency]);

  const handleDelete = (id: string, category: string, amount: number) => {
    Alert.alert(
      'Delete Transaction',
      `Delete "${category}" (${formatCurrency(amount, currency)}) from your records?`,
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
      <Header
        title="Zenith"
        subtitle="Transactions"
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all transactions"
            disabled={transactions.length === 0}
            onPress={() => {
              if (transactions.length === 0) return;
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch {}
              setClearAllModalVisible(true);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearAllBtn,
              {
                backgroundColor: colors.surfaceContainerLow,
                opacity: transactions.length === 0 ? 0.3 : pressed ? 0.7 : 1,
                transform: [{ scale: pressed && transactions.length > 0 ? 0.94 : 1 }],
              },
            ]}
          >
            <Feather
              name="trash-2"
              size={16}
              color={transactions.length === 0 ? colors.textTertiary : colors.error}
            />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {/* Spend Insight Card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change Date Interval"
          onPress={() => {
            try { Haptics.selectionAsync(); } catch {}
            setIntervalModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.spendInsightCard,
            {
              backgroundColor: isDark ? '#0D111A' : '#131B2E',
              transform: [{ scale: pressed ? 0.96 : 1 }],
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
                {dateInterval.label}
              </ThemedText>
              <Feather name="chevron-down" size={12} color="rgba(218, 226, 253, 0.7)" />
            </View>

            <View style={styles.trackedBadge}>
              <ThemedText variant="labelSm" color="#FFFFFF">
                {analytics.daysRemaining} Days Left
              </ThemedText>
            </View>
          </View>

          <View style={styles.spendInsightBottom}>
            <View>
              <ThemedText variant="bodySm" color="rgba(255,255,255,0.7)">
                Total Spent
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
                Daily Average
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
        </Pressable>

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
              placeholder="Search by category, note, amount..."
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
          {filterCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch {}
                  setSelectedCategory(cat);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? colors.secondary
                        : colors.primary
                      : colors.surfaceContainerLow,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
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
          <Animated.View entering={FadeIn.duration(200)}>
            <Card padding="lg" bordered={false}>
              <EmptyState
                title="No Transactions Yet"
                description="Your ledger is completely clean. Tap below to log an expense or income."
                onAction={() => router.push('/(tabs)/quick-add')}
                actionTitle="Log First Transaction"
              />
            </Card>
          </Animated.View>
        ) : filtered.length === 0 ? (
          <Animated.View entering={FadeIn.duration(200)}>
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
          </Animated.View>
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
                    color={group.netTotal >= 0 ? colors.secondary : colors.error}
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
                    const convertedAmount = convertCurrency(
                      tx.amount,
                      tx.currency || 'USD',
                      currency
                    );

                    return (
                      <Animated.View
                        key={tx.id}
                        layout={LinearTransition.springify().damping(15)}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${tx.category}, ${tx.amount} ${tx.currency}`}
                          onPress={() => {
                            try { Haptics.selectionAsync(); } catch {}
                            setSelectedTx(tx);
                          }}
                          onLongPress={() => handleDelete(tx.id, tx.category, convertedAmount)}
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
                              <View style={styles.titleLine}>
                                <ThemedText variant="headlineSm" numberOfLines={1} style={{ flex: 1 }}>
                                  {tx.category}
                                </ThemedText>
                                <ThemedText
                                  variant="numericCurrency"
                                  color={isExpense ? colors.error : colors.secondary}
                                  style={{ fontWeight: '700', marginLeft: spacing.xs }}
                                >
                                  {isExpense
                                    ? `-${formatCurrency(convertedAmount, currency)}`
                                    : `+${formatCurrency(convertedAmount, currency)}`}
                                </ThemedText>
                              </View>

                              <View style={styles.metaLine}>
                                <ThemedText variant="bodySm" color={colors.textSecondary}>
                                  {tx.payment_method || 'Card'}
                                </ThemedText>
                                <View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} />
                                <ThemedText variant="bodySm" color={colors.textTertiary}>
                                  {formatDateGroup(tx.date)}
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
                      </Animated.View>
                    );
                  })}
                </Card>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Date Interval Selector Modal */}
      <DateIntervalModal
        visible={intervalModalVisible}
        currentInterval={dateInterval}
        onSelectInterval={(inv) => setDateInterval(inv)}
        onClose={() => setIntervalModalVisible(false)}
      />

      {/* Confirmation Modal to Clear All Transactions */}
      <Modal
        visible={clearAllModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClearAllModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.confirmCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.dangerIconWrap, { backgroundColor: colors.errorContainer }]}>
              <Feather name="alert-triangle" size={24} color={colors.error} />
            </View>

            <ThemedText variant="headlineSm" style={{ textAlign: 'center', marginTop: spacing.sm }}>
              Clear All Transactions?
            </ThemedText>

            <ThemedText
              variant="bodyMd"
              color={colors.textSecondary}
              style={{ textAlign: 'center', marginTop: spacing.xs, lineHeight: 22 }}
            >
              This will permanently delete all {transactions.length} recorded {transactions.length === 1 ? 'transaction' : 'transactions'}. This action cannot be undone.
            </ThemedText>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                style={{ flex: 1 }}
                onPress={() => setClearAllModalVisible(false)}
              />
              <Button
                title="Delete All"
                variant="danger"
                size="md"
                style={{ flex: 1 }}
                onPress={async () => {
                  try {
                    await clearAll();
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch (e) {
                    console.error(e);
                  }
                  setClearAllModalVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

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
  spendInsightCard: {
    borderRadius: radius.xl,
    borderCurve: 'continuous',
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
    borderCurve: 'continuous',
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
    borderCurve: 'continuous',
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
    borderCurve: 'continuous',
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
    borderRadius: radius.xl,
    borderCurve: 'continuous',
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
  clearAllBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl,
    borderCurve: 'continuous',
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  dangerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
});
