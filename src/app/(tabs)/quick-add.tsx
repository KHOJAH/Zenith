import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { TransactionType } from '@/db/schema';
import { getCurrencyInfo } from '@/utils/currencies';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { NumericKeypad } from '@/components/NumericKeypad';
import { CategoryGrid } from '@/components/CategoryGrid';
import { CurrencyModal } from '@/components/CurrencyModal';
import { Button } from '@/components/Button';

const PAYMENT_METHODS = ['Card', 'Cash', 'Bank Transfer', 'Apple / Google Pay'];

export default function QuickAddScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addTransaction, currency, setCurrency } = useTransactions();

  const [flowType, setFlowType] = useState<TransactionType>('expense');
  const [rawAmount, setRawAmount] = useState<string>('0');
  const [category, setCategory] = useState<string>('Food & Dining');
  const [merchant, setMerchant] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Card');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  // Blinking caret effect
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (key: string) => {
    if (key === '.') {
      if (!rawAmount.includes('.')) {
        setRawAmount((prev) => (prev === '0' ? '0.' : prev + '.'));
      }
    } else {
      setRawAmount((prev) => {
        if (prev === '0') return key;
        const parts = prev.split('.');
        if (parts[1] && parts[1].length >= 2) return prev; // max 2 decimals
        if (prev.length >= 8) return prev;
        return prev + key;
      });
    }
  };

  const handleBackspace = () => {
    setRawAmount((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const currentCurrencyInfo = getCurrencyInfo(currency);
  const currencySymbol = currentCurrencyInfo.symbol;

  const handleSave = async () => {
    const numAmount = parseFloat(rawAmount);
    if (!numAmount || numAmount <= 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
      return;
    }

    try {
      setIsSaving(true);
      await addTransaction({
        amount: numAmount,
        type: flowType,
        category: flowType === 'income' ? 'Income' : category,
        merchant:
          merchant.trim() ||
          (flowType === 'income' ? 'Income Deposit' : category),
        note: note.trim(),
        date: new Date().toISOString(),
        payment_method: paymentMethod,
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      setSavedSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        setSavedSuccess(false);
        setRawAmount('0');
        setMerchant('');
        setNote('');
        router.push('/(tabs)');
      }, 600);
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Zenith"
        subtitle="Quick Add"
        showBack
        onBack={() => router.push('/(tabs)')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Transaction Type Segmented Bar */}
        <View
          style={[
            styles.typeSelector,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          {(['expense', 'income', 'transfer'] as const).map((type) => {
            const isSelected = flowType === type;
            return (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setFlowType(type)}
                style={[
                  styles.typeBtn,
                  isSelected && {
                    backgroundColor: isDark ? colors.secondary : colors.primary,
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
                  style={{ textTransform: 'capitalize', fontWeight: isSelected ? '700' : '500' }}
                >
                  {type}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {/* Hero Amount Display Area */}
        <View style={styles.amountDisplayCard}>
          {/* Currency Pill opening Currency Modal */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change Currency"
            onPress={() => setCurrencyModalVisible(true)}
            style={({ pressed }) => [
              styles.currencyPill,
              {
                backgroundColor: colors.surfaceContainer,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText style={{ fontSize: 13 }}>
              {currentCurrencyInfo.flag}
            </ThemedText>
            <ThemedText variant="labelSm" color={colors.text} style={{ fontWeight: '700' }}>
              {currency} ({currencySymbol})
            </ThemedText>
            <Feather name="chevron-down" size={12} color={colors.textSecondary} />
          </Pressable>

          {/* Big Amount Number with Blinking Caret */}
          <View style={styles.amountRow}>
            <ThemedText
              variant="displayHero"
              color={colors.textSecondary}
              style={styles.currencyPrefix}
            >
              {currencySymbol}
            </ThemedText>
            <ThemedText
              variant="displayHero"
              color={colors.text}
              style={styles.amountValue}
            >
              {rawAmount}
            </ThemedText>
            <View
              style={[
                styles.blinkingCaret,
                {
                  backgroundColor: isDark ? colors.secondary : colors.primary,
                  opacity: cursorVisible ? 1 : 0,
                },
              ]}
            />
          </View>

          <ThemedText variant="bodySm" color={colors.textSecondary}>
            Zero latency • Stored locally
          </ThemedText>
        </View>

        {/* Category Grid (for expense/transfer) */}
        {flowType !== 'income' && (
          <View style={styles.sectionBlock}>
            <ThemedText
              variant="labelSm"
              color={colors.textSecondary}
              style={styles.sectionHeader}
            >
              CATEGORY
            </ThemedText>
            <CategoryGrid
              selectedCategory={category}
              onSelectCategory={(cat) => setCategory(cat)}
            />
          </View>
        )}

        {/* Merchant / Payee Field */}
        <View style={styles.sectionBlock}>
          <ThemedText
            variant="labelSm"
            color={colors.textSecondary}
            style={styles.sectionHeader}
          >
            {flowType === 'income' ? 'PAYEE / SOURCE' : 'MERCHANT / PAYEE'}
          </ThemedText>

          <Card padding="sm" style={styles.merchantCard} bordered={false}>
            <View style={styles.inputRow}>
              <Feather name="user-check" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder={flowType === 'income' ? 'e.g. Salary, Client Payout' : 'e.g. Grocery Store, Coffee, Rent'}
                placeholderTextColor={colors.textTertiary}
                value={merchant}
                onChangeText={setMerchant}
              />
              {merchant.length > 0 && (
                <Pressable onPress={() => setMerchant('')}>
                  <Feather name="x-circle" size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          </Card>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.sectionBlock}>
          <ThemedText
            variant="labelSm"
            color={colors.textSecondary}
            style={styles.sectionHeader}
          >
            PAYMENT METHOD
          </ThemedText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentMethodList}>
            {PAYMENT_METHODS.map((method) => {
              const isSelected = paymentMethod === method;
              return (
                <Pressable
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={({ pressed }) => [
                    styles.methodPill,
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
                    color={isSelected ? (isDark ? '#052E16' : colors.onPrimary) : colors.textSecondary}
                    style={{ fontWeight: isSelected ? '700' : '500' }}
                  >
                    {method}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Optional Note */}
        <Card padding="sm" style={styles.noteCard} bordered={false}>
          <Feather name="edit-3" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Add optional note..."
            placeholderTextColor={colors.textTertiary}
            value={note}
            onChangeText={setNote}
          />
          {note.length > 0 && (
            <Pressable onPress={() => setNote('')}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </Card>

        {/* Ergonomic Tactile Numeric Keypad */}
        <View style={styles.keypadContainer}>
          <NumericKeypad
            onPressKey={handleKeyPress}
            onBackspace={handleBackspace}
          />
        </View>

        {/* Full-width High-contrast Save Button */}
        <View style={styles.saveContainer}>
          <Button
            title={
              savedSuccess
                ? 'Recorded!'
                : isSaving
                ? 'Saving...'
                : `Save ${flowType === 'income' ? 'Income' : 'Expense'} (${currencySymbol} ${rawAmount || '0.00'})`
            }
            size="lg"
            variant="primary"
            loading={isSaving}
            onPress={handleSave}
            icon={
              savedSuccess ? (
                <Feather name="check" size={20} color={colors.onPrimary} />
              ) : undefined
            }
          />
        </View>
      </ScrollView>

      {/* Currency Modal for selecting any world currency */}
      <CurrencyModal
        visible={currencyModalVisible}
        selectedCode={currency}
        onSelect={(code) => setCurrency(code)}
        onClose={() => setCurrencyModalVisible(false)}
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
    paddingBottom: 110,
    gap: spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  amountDisplayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    gap: 4,
    marginBottom: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
  },
  currencyPrefix: {
    fontSize: 32,
    marginRight: 4,
  },
  amountValue: {
    fontSize: 44,
    fontWeight: '700',
  },
  blinkingCaret: {
    width: 3,
    height: 38,
    borderRadius: 2,
    marginLeft: 4,
  },
  sectionBlock: {
    gap: spacing.xs,
  },
  sectionHeader: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  merchantCard: {
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
  },
  paymentMethodList: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  methodPill: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  keypadContainer: {
    width: '100%',
  },
  saveContainer: {
    width: '100%',
    paddingTop: spacing.xs,
  },
});
