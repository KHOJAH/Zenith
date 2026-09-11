import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Transaction, DateInterval } from '@/db/schema';
import { MonthAnalytics } from '@/utils/velocity';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency, formatDateGroup } from '@/utils/formatters';
import { convertCurrency } from '@/utils/currencies';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';
import { Button } from './Button';

interface StatementExportModalProps {
  visible: boolean;
  dateInterval: DateInterval;
  transactions: Transaction[];
  analytics: MonthAnalytics;
  currency: string;
  onClose: () => void;
}

export function StatementExportModal({
  visible,
  dateInterval,
  transactions,
  analytics,
  currency,
  onClose,
}: StatementExportModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);

  // Filter transactions within normalized interval bounds (inclusive of full start & end days)
  const start = new Date(dateInterval.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateInterval.endDate);
  end.setHours(23, 59, 59, 999);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const intervalTx = transactions.filter((tx) => {
    const t = new Date(tx.date).getTime();
    return t >= startMs && t <= endMs;
  });

  const generateCSV = (): string => {
    const headers = ['Date', 'Type', 'Category', 'Original Amount', 'Original Currency', 'Converted Amount', 'Display Currency', 'Payment Method', 'Note'];
    const rows = intervalTx.map((tx) => {
      const converted = convertCurrency(tx.amount, tx.currency || 'USD', currency);
      const cleanNote = (tx.note || '').replace(/"/g, '""');
      return [
        `"${tx.date}"`,
        `"${tx.type.toUpperCase()}"`,
        `"${tx.category}"`,
        tx.amount.toFixed(2),
        `"${tx.currency || 'USD'}"`,
        converted.toFixed(2),
        `"${currency}"`,
        `"${tx.payment_method || 'Card'}"`,
        `"${cleanNote}"`,
      ].join(',');
    });

    const summaryBlock = [
      `# Zenith Financial Statement - ${dateInterval.label}`,
      `# Generated: ${new Date().toISOString()}`,
      `# Period: ${dateInterval.startDate.split('T')[0]} to ${dateInterval.endDate.split('T')[0]}`,
      `# Total Income (${currency}): ${analytics.totalIncome.toFixed(2)}`,
      `# Total Expenses (${currency}): ${analytics.totalExpenses.toFixed(2)}`,
      `# Net Savings (${currency}): ${analytics.netSavings.toFixed(2)}`,
      `# Total Records: ${intervalTx.length}`,
      '',
    ].join('\n');

    return `${summaryBlock}${headers.join(',')}\n${rows.join('\n')}`;
  };

  const handleExportCSV = async () => {
    if (intervalTx.length === 0) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const csvData = generateCSV();
    const fileName = `Zenith_Statement_${dateInterval.label.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Browser download
      try {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('CSV Exported', `Downloaded ${fileName} successfully.`);
      } catch (err) {
        console.error('Web CSV download failed:', err);
      }
    } else {
      // Native iOS / Android Share sheet
      try {
        await Share.share({
          message: csvData,
          title: `Zenith Statement - ${dateInterval.label}`,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        console.error('Native share failed:', err);
      }
    }
  };

  const handleCopySummary = async () => {
    if (intervalTx.length === 0) return;

    try {
      Haptics.selectionAsync();
    } catch {}

    const summaryText = [
      `Zenith Financial Statement: ${dateInterval.label}`,
      `Total Income: ${formatCurrency(analytics.totalIncome, currency)}`,
      `Total Expenses: ${formatCurrency(analytics.totalExpenses, currency)}`,
      `Net Cash Flow: ${formatCurrency(analytics.netSavings, currency)}`,
      `Daily Outflow Rate: ${formatCurrency(analytics.dailyVelocity, currency)}/day`,
      `Transactions: ${intervalTx.length}`,
    ].join('\n');

    try {
      await Clipboard.setStringAsync(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary to clipboard:', err);
    }
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
          <View>
            <ThemedText variant="headlineMd">Statement Export</ThemedText>
            <ThemedText variant="bodySm" color={colors.textSecondary}>
              {dateInterval.label} · {intervalTx.length} records
            </ThemedText>
          </View>
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Summary Metric Box */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <View style={styles.metricItem}>
                <ThemedText variant="bodySm" color={colors.textSecondary}>
                  Total Income
                </ThemedText>
                <ThemedText variant="headlineSm" color={colors.secondary} style={{ fontWeight: '700' }}>
                  +{formatCurrency(analytics.totalIncome, currency)}
                </ThemedText>
              </View>

              <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

              <View style={styles.metricItem}>
                <ThemedText variant="bodySm" color={colors.textSecondary}>
                  Total Expenses
                </ThemedText>
                <ThemedText variant="headlineSm" color={colors.text} style={{ fontWeight: '700' }}>
                  -{formatCurrency(analytics.totalExpenses, currency)}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.horizontalDivider, { backgroundColor: colors.border }]} />

            <View style={styles.netRow}>
              <ThemedText variant="labelMd" style={{ fontWeight: '600' }}>
                Net Balance
              </ThemedText>
              <ThemedText
                variant="headlineMd"
                color={analytics.netSavings >= 0 ? colors.secondary : colors.error}
                style={{ fontWeight: '700' }}
              >
                {analytics.netSavings >= 0 ? '+' : ''}
                {formatCurrency(analytics.netSavings, currency)}
              </ThemedText>
            </View>
          </View>

          {/* Quick Copy Summary Action */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Copy Summary to Clipboard"
            disabled={intervalTx.length === 0}
            onPress={handleCopySummary}
            style={({ pressed }) => [
              styles.copyBtn,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.border,
                opacity: intervalTx.length === 0 ? 0.4 : pressed ? 0.8 : 1,
                transform: [{ scale: pressed && intervalTx.length > 0 ? 0.96 : 1 }],
              },
            ]}
          >
            <Feather
              name={copied ? 'check' : 'clipboard'}
              size={16}
              color={copied ? colors.secondary : intervalTx.length === 0 ? colors.textTertiary : colors.text}
            />
            <ThemedText
              variant="labelMd"
              color={copied ? colors.secondary : intervalTx.length === 0 ? colors.textTertiary : colors.text}
              style={{ fontWeight: '600' }}
            >
              {copied ? 'Summary Copied to Clipboard!' : 'Copy Summary to Clipboard'}
            </ThemedText>
          </Pressable>

          {/* Preview of Transactions included in Statement */}
          <View style={styles.previewSection}>
            <ThemedText variant="labelSm" color={colors.textSecondary} style={styles.sectionLabel}>
              TRANSACTIONS INCLUDED ({intervalTx.length})
            </ThemedText>

            {intervalTx.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ThemedText variant="bodySm" color={colors.textTertiary}>
                  No transactions recorded for this interval.
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.previewList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {intervalTx.slice(0, 10).map((tx, idx) => {
                  const converted = convertCurrency(tx.amount, tx.currency || 'USD', currency);
                  const isExpense = tx.type === 'expense';
                  const isLast = idx === Math.min(intervalTx.length - 1, 9);

                  return (
                    <View
                      key={tx.id}
                      style={[
                        styles.txPreviewRow,
                        {
                          borderBottomColor: colors.border,
                          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText variant="labelMd" numberOfLines={1}>
                          {tx.category}
                        </ThemedText>
                        <ThemedText variant="bodySm" color={colors.textTertiary}>
                          {formatDateGroup(tx.date)} · {tx.payment_method || 'Card'}
                        </ThemedText>
                      </View>
                      <ThemedText
                        variant="labelMd"
                        color={isExpense ? colors.text : colors.secondary}
                        style={{ fontWeight: '700' }}
                      >
                        {isExpense ? '-' : '+'}
                        {formatCurrency(converted, currency)}
                      </ThemedText>
                    </View>
                  );
                })}

                {intervalTx.length > 10 && (
                  <View style={[styles.moreRowsNotice, { borderTopColor: colors.border }]}>
                    <ThemedText variant="bodySm" color={colors.textTertiary}>
                      + {intervalTx.length - 10} more transactions in full CSV
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.footer}>
          <Button
            title={
              intervalTx.length === 0
                ? 'No Transactions to Export'
                : Platform.OS === 'web'
                ? `Download CSV (${intervalTx.length} Records)`
                : `Share CSV Statement (${intervalTx.length} Records)`
            }
            variant="primary"
            size="lg"
            disabled={intervalTx.length === 0}
            onPress={handleExportCSV}
            icon={<Feather name="download" size={18} color={colors.onPrimary} />}
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
    paddingBottom: 24,
  },
  summaryCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
  },
  horizontalDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  netRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    gap: spacing.xs,
  },
  previewSection: {
    gap: spacing.xs,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  emptyBox: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewList: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  txPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  moreRowsNotice: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.sm,
  },
});
