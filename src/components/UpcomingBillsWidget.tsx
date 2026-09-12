import React, { useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { formatCurrency } from '@/utils/formatters';
import { convertCurrency } from '@/utils/currencies';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';
import { Card } from './Card';
import { ManageRecurringModal } from './ManageRecurringModal';
import type { RecurringBill } from '@/db/schema';
import type { RecurringBillStatus } from '@/utils/recurring';

export function UpcomingBillsWidget() {
  const { colors, isDark } = useTheme();
  const {
    recurringBills,
    recurringStatuses,
    currency,
    logRecurringBillPayment,
  } = useTransactions();

  const [loggingBillId, setLoggingBillId] = useState<string | null>(null);
  const [manageModalVisible, setManageModalVisible] = useState(false);

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
        return 'calendar';
    }
  };

  const handleLogPayment = async (bill: RecurringBill) => {
    if (loggingBillId) return;
    setLoggingBillId(bill.id);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await logRecurringBillPayment(bill);
    } catch (error) {
      console.error('Failed to log recurring bill payment:', error);
    } finally {
      setLoggingBillId(null);
    }
  };

  const unpaidStatuses = recurringStatuses.filter((s) => s.status !== 'PAID');
  const allPaid = recurringStatuses.length > 0 && unpaidStatuses.length === 0;

  // If no recurring bills have been set up at all
  if (recurringBills.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.headerRow}>
          <ThemedText variant="headlineSm">Recurring Bills</ThemedText>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setManageModalVisible(true);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.manageBtn,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            <ThemedText variant="labelMd" color={colors.secondary} style={{ fontWeight: '600' }}>
              Set up
            </ThemedText>
          </Pressable>
        </View>

        <Card padding="md" bordered={false} style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceContainerLow }]}>
              <Feather name="calendar" size={20} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText variant="labelMd" style={{ fontWeight: '700' }}>
                Track Subscriptions & Bills
              </ThemedText>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Add Netflix, rent, or gym to see cycle due dates and 1-tap logging.
              </ThemedText>
            </View>
          </View>
        </Card>

        <ManageRecurringModal
          visible={manageModalVisible}
          onClose={() => setManageModalVisible(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithBadge}>
          <ThemedText variant="headlineSm">Recurring Commitments</ThemedText>
          {unpaidStatuses.length > 0 && (
            <View
              style={[
                styles.dueBadge,
                {
                  backgroundColor: unpaidStatuses.some((s) => s.status === 'OVERDUE')
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(16, 185, 129, 0.15)',
                },
              ]}
            >
              <ThemedText
                variant="labelSm"
                color={
                  unpaidStatuses.some((s) => s.status === 'OVERDUE')
                    ? colors.error
                    : colors.secondary
                }
                style={{ fontWeight: '700' }}
              >
                {unpaidStatuses.length} Due
              </ThemedText>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setManageModalVisible(true);
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.manageBtn,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <ThemedText variant="labelMd" color={colors.text}>
            Manage
          </ThemedText>
        </Pressable>
      </View>

      {/* When all bills for the cycle are paid */}
      {allPaid ? (
        <Card padding="md" bordered={false} style={styles.allPaidCard}>
          <View style={styles.allPaidRow}>
            <View style={[styles.allPaidIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Feather name="check" size={18} color={colors.secondary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText variant="headlineSm" color={colors.secondary} style={{ fontWeight: '700' }}>
                All recurring bills paid for this cycle ✓
              </ThemedText>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                {recurringStatuses.length} {recurringStatuses.length === 1 ? 'obligation' : 'obligations'} fulfilled this period.
              </ThemedText>
            </View>
          </View>
        </Card>
      ) : recurringStatuses.length === 0 ? (
        <Card padding="md" bordered={false}>
          <ThemedText variant="bodySm" color={colors.textSecondary}>
            No recurring bills due in this interval.
          </ThemedText>
        </Card>
      ) : (
        <Card padding="xs" bordered={false} style={styles.billsCard}>
          {recurringStatuses.map((item, idx) => {
            const isLast = idx === recurringStatuses.length - 1;
            const isPaid = item.status === 'PAID';
            const isOverdue = item.status === 'OVERDUE';
            const isDueToday = item.status === 'DUE_TODAY';
            const isLogging = loggingBillId === item.bill.id;

            const convertedAmount = convertCurrency(
              item.bill.amount,
              item.bill.currency || 'USD',
              currency
            );

            return (
              <Animated.View
                key={item.bill.id}
                entering={FadeInDown.duration(200).delay(Math.min(idx * 25, 200))}
                exiting={FadeOut.duration(150)}
                layout={LinearTransition.duration(200)}
              >
                <View
                  style={[
                    styles.billRow,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                      opacity: isPaid ? 0.7 : 1,
                    },
                  ]}
                >
                  {/* Left: Icon and Name/Category */}
                  <View style={styles.billLeft}>
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: isPaid
                            ? colors.surfaceContainerLow
                            : isOverdue
                            ? 'rgba(239, 68, 68, 0.15)'
                            : isDueToday
                            ? 'rgba(245, 158, 11, 0.15)'
                            : colors.surfaceContainerLow,
                        },
                      ]}
                    >
                      <Feather
                        name={getCategoryIcon(item.bill.category) as any}
                        size={18}
                        color={
                          isPaid
                            ? colors.textSecondary
                            : isOverdue
                            ? colors.error
                            : isDueToday
                            ? '#F59E0B'
                            : colors.text
                        }
                      />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <ThemedText variant="headlineSm" numberOfLines={1}>
                        {item.bill.name}
                      </ThemedText>

                      <View style={styles.metaRow}>
                        <ThemedText variant="bodySm" color={colors.textSecondary} numberOfLines={1}>
                          {item.bill.category}
                        </ThemedText>

                        <View style={[styles.metaDot, { backgroundColor: colors.borderStrong }]} />

                        {/* Status badge */}
                        {isPaid ? (
                          <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: '600' }}>
                            Paid ✓
                          </ThemedText>
                        ) : isOverdue ? (
                          <ThemedText variant="labelSm" color={colors.error} style={{ fontWeight: '700' }}>
                            Overdue ({Math.abs(item.daysUntil)}d)
                          </ThemedText>
                        ) : isDueToday ? (
                          <ThemedText variant="labelSm" color="#F59E0B" style={{ fontWeight: '700' }}>
                            Due Today
                          </ThemedText>
                        ) : (
                          <ThemedText variant="labelSm" color={colors.textTertiary}>
                            Due in {item.daysUntil}d
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Right: Amount & 1-tap Log Button or Paid indicator */}
                  <View style={styles.billRight}>
                    <ThemedText
                      variant="headlineSm"
                      style={{
                        fontWeight: '700',
                        color: isPaid ? colors.textSecondary : colors.text,
                      }}
                    >
                      {formatCurrency(convertedAmount, currency)}
                    </ThemedText>

                    {isPaid ? (
                      <View style={styles.paidIndicator}>
                        <Feather name="check-circle" size={14} color={colors.secondary} />
                        <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: '600' }}>
                          Logged
                        </ThemedText>
                      </View>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Log payment for ${item.bill.name}`}
                        disabled={isLogging}
                        onPress={() => handleLogPayment(item.bill)}
                        style={({ pressed }) => [
                          styles.logBtn,
                          {
                            backgroundColor: isDueToday
                              ? isDark
                                ? colors.secondary
                                : colors.primary
                              : colors.surfaceContainer,
                            borderColor: isOverdue ? colors.error : 'transparent',
                            transform: [{ scale: pressed ? 0.95 : 1 }],
                          },
                        ]}
                      >
                        {isLogging ? (
                          <ActivityIndicator
                            size="small"
                            color={isDueToday ? (isDark ? '#052E16' : colors.onPrimary) : colors.text}
                          />
                        ) : (
                          <ThemedText
                            variant="labelSm"
                            color={isDueToday ? (isDark ? '#052E16' : colors.onPrimary) : colors.text}
                            style={{ fontWeight: '700' }}
                          >
                            Log
                          </ThemedText>
                        )}
                      </Pressable>
                    )}
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </Card>
      )}

      {/* Manage Modal */}
      <ManageRecurringModal
        visible={manageModalVisible}
        onClose={() => setManageModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  manageBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  emptyCard: {
    overflow: 'hidden',
  },
  emptyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allPaidCard: {
    overflow: 'hidden',
  },
  allPaidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  allPaidIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billsCard: {
    overflow: 'hidden',
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  billLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
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
  billRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  logBtn: {
    minWidth: 54,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  paidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
  },
});
