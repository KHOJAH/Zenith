import React from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Transaction } from '@/db/schema';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { formatCurrency, formatTime } from '@/utils/formatters';
import { convertCurrency, getCurrencyInfo } from '@/utils/currencies';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';
import { Button } from './Button';

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function TransactionDetailModal({
  visible,
  transaction,
  onClose,
  onDelete,
}: TransactionDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currency, deleteTransaction } = useTransactions();

  if (!transaction) return null;

  const isExpense = transaction.type === 'expense';
  const txCurrency = transaction.currency || 'USD';
  const convertedAmount = convertCurrency(transaction.amount, txCurrency, currency);
  const isDifferentCurrency = txCurrency.toUpperCase() !== currency.toUpperCase();
  const originalCurrencyInfo = getCurrencyInfo(txCurrency);

  const txDate = new Date(transaction.date);
  const formattedFullDate = txDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = formatTime(transaction.date);

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

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      `Permanently remove this ${formatCurrency(convertedAmount, currency)} ${transaction.category} entry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {}
            if (onDelete) {
              onDelete(transaction.id);
            } else {
              await deleteTransaction(transaction.id);
            }
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="headlineMd">Transaction Details</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: colors.surfaceContainerLow,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
          >
            <Feather name="x" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Hero Icon & Amount Card */}
          <View
            style={[
              styles.heroBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isExpense
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(220, 38, 38, 0.1)'
                    : 'rgba(16, 185, 129, 0.15)',
                },
              ]}
            >
              <Feather
                name={getCategoryIcon(transaction.category) as any}
                size={28}
                color={isExpense ? colors.error : colors.secondary}
              />
            </View>

            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: isExpense
                    ? colors.errorContainer
                    : isDark
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(5, 150, 105, 0.15)',
                },
              ]}
            >
              <ThemedText
                variant="labelSm"
                color={isExpense ? colors.error : colors.secondary}
                style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }}
              >
                {transaction.type}
              </ThemedText>
            </View>

            <ThemedText
              variant="displayHero"
              color={isExpense ? colors.error : colors.secondary}
              style={{ marginTop: spacing.xs }}
            >
              {isExpense ? '-' : '+'}
              {formatCurrency(convertedAmount, currency)}
            </ThemedText>

            {isDifferentCurrency && (
              <ThemedText variant="bodySm" color={colors.textSecondary} style={{ marginTop: 2 }}>
                Original: {originalCurrencyInfo.symbol} {transaction.amount.toFixed(2)} {txCurrency}
              </ThemedText>
            )}
          </View>

          {/* Details Table */}
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Category */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Category
              </ThemedText>
              <ThemedText variant="labelMd" style={{ fontWeight: '600' }}>
                {transaction.category}
              </ThemedText>
            </View>

            {/* Date */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Date
              </ThemedText>
              <ThemedText variant="labelMd" style={{ fontWeight: '600' }}>
                {formattedFullDate}
              </ThemedText>
            </View>

            {/* Time */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Time
              </ThemedText>
              <ThemedText variant="labelMd" style={{ fontWeight: '600' }}>
                {formattedTime}
              </ThemedText>
            </View>

            {/* Payment Method */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Payment Method
              </ThemedText>
              <View style={styles.methodInline}>
                <Feather
                  name={transaction.payment_method === 'Cash' ? 'dollar-sign' : 'credit-card'}
                  size={14}
                  color={colors.text}
                />
                <ThemedText variant="labelMd" style={{ fontWeight: '600' }}>
                  {transaction.payment_method || 'Card'}
                </ThemedText>
              </View>
            </View>

            {/* Note */}
            {transaction.note ? (
              <View style={styles.detailRow}>
                <ThemedText variant="bodySm" color={colors.textSecondary}>
                  Note
                </ThemedText>
                <ThemedText
                  variant="labelMd"
                  style={{ fontWeight: '600', maxWidth: '60%', textAlign: 'right' }}
                  numberOfLines={2}
                >
                  {transaction.note}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <Button
            title="Delete Transaction"
            variant="danger"
            size="md"
            onPress={handleDelete}
            icon={<Feather name="trash-2" size={16} color={colors.error} />}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  heroBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  typeBadge: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.xxs,
  },
  detailsCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  methodInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.md,
  },
});
