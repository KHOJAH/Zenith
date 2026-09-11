import React, { useState, useRef } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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
import { CategoryGrid } from '@/components/CategoryGrid';
import { CurrencyModal } from '@/components/CurrencyModal';
import { AddCategoryModal } from '@/components/AddCategoryModal';
import { CustomDatePickerModal } from '@/components/CustomDatePickerModal';
import { Button } from '@/components/Button';

const PAYMENT_METHODS = ['Card', 'Cash'] as const;

export default function QuickAddScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    addTransaction,
    categories,
    addCustomCategory,
    currency,
    setCurrency,
  } = useTransactions();

  const [flowType, setFlowType] = useState<TransactionType>('expense');
  const [rawAmount, setRawAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Food & Dining');
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Card');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const amountInputRef = useRef<TextInput>(null);

  const currentCurrencyInfo = getCurrencyInfo(currency);
  const currencySymbol = currentCurrencyInfo.symbol;

  const isToday = (d: Date) => {
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isYesterday = (d: Date) => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return (
      d.getDate() === y.getDate() &&
      d.getMonth() === y.getMonth() &&
      d.getFullYear() === y.getFullYear()
    );
  };

  const handleAmountChange = (text: string) => {
    // Sanitize input: allow only digits and single decimal point with up to 2 decimal places
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }
    if (parts[1] && parts[1].length > 2) {
      cleaned = `${parts[0]}.${parts[1].slice(0, 2)}`;
    }
    setRawAmount(cleaned);
  };

  const handleSave = async () => {
    const numAmount = parseFloat(rawAmount);
    if (!numAmount || numAmount <= 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
      amountInputRef.current?.focus();
      return;
    }

    try {
      setIsSaving(true);
      await addTransaction({
        amount: numAmount,
        type: flowType,
        category: flowType === 'income' ? 'Income' : category,
        merchant: flowType === 'income' ? 'Income' : category,
        note: note.trim(),
        date: selectedDate.toISOString(),
        payment_method: paymentMethod,
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      setSavedSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        setSavedSuccess(false);
        setRawAmount('');
        setNote('');
        router.push('/(tabs)');
      }, 600);
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setIsSaving(false);
    }
  };

  const categoriesList = categories.map((b) => ({
    category: b.category,
    icon: b.icon,
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="Zenith"
        subtitle="Quick Add"
        showBack
        onBack={() => router.push('/(tabs)')}
        hideCurrency
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Transaction Type Segmented Control */}
          <View
            style={[
              styles.typeSelector,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            {(['expense', 'income'] as const).map((type) => {
              const isSelected = flowType === type;
              return (
                <Pressable
                  key={type}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    try { Haptics.selectionAsync(); } catch {}
                    setFlowType(type);
                  }}
                  style={({ pressed }) => [
                    styles.typeBtn,
                    isSelected && {
                      backgroundColor:
                        type === 'expense'
                          ? colors.error
                          : isDark
                          ? colors.secondary
                          : '#059669',
                    },
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <ThemedText
                    variant="labelMd"
                    color={
                      isSelected
                        ? type === 'expense'
                          ? '#FFFFFF'
                          : isDark
                          ? '#052E16'
                          : '#FFFFFF'
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

          {/* Hero Amount Area with Native Device Number Pad */}
          <Pressable
            onPress={() => amountInputRef.current?.focus()}
            style={styles.amountDisplayCard}
          >
            {/* Currency Pill opening Currency Modal */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change Currency"
              onPress={() => {
                try { Haptics.selectionAsync(); } catch {}
                setCurrencyModalVisible(true);
              }}
              style={({ pressed }) => [
                styles.currencyPill,
                {
                  backgroundColor: colors.surfaceContainer,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
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

            {/* Native Numpad Input Display */}
            <View style={styles.amountInputRow}>
              <ThemedText
                variant="displayHero"
                color={
                  flowType === 'expense'
                    ? colors.error
                    : isDark
                    ? colors.secondary
                    : '#059669'
                }
                style={styles.currencyPrefix}
              >
                {currencySymbol}
              </ThemedText>
              <TextInput
                ref={amountInputRef}
                style={[
                  styles.nativeAmountInput,
                  {
                    color:
                      flowType === 'expense'
                        ? colors.error
                        : isDark
                        ? colors.secondary
                        : '#059669',
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textTertiary}
                value={rawAmount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                returnKeyType="done"
                selectTextOnFocus
              />
            </View>
          </Pressable>

          {/* Category Grid (with integrated + Custom category tile) */}
          {flowType !== 'income' && (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText
                  variant="labelSm"
                  color={colors.textSecondary}
                  style={styles.sectionHeader}
                >
                  CATEGORY
                </ThemedText>
              </View>

              <CategoryGrid
                categories={categoriesList}
                selectedCategory={category}
                onSelectCategory={(cat) => {
                  try { Haptics.selectionAsync(); } catch {}
                  setCategory(cat);
                }}
                onAddNewCategory={() => {
                  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
                  setAddCategoryModalVisible(true);
                }}
              />
            </View>
          )}

          {/* Date Selector */}
          <View style={styles.sectionBlock}>
            <ThemedText
              variant="labelSm"
              color={colors.textSecondary}
              style={styles.sectionHeader}
            >
              DATE
            </ThemedText>

            <View style={styles.dateSelectorRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Today"
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch {}
                  setSelectedDate(new Date());
                }}
                style={({ pressed }) => [
                  styles.datePill,
                  isToday(selectedDate)
                    ? { backgroundColor: isDark ? colors.secondary : colors.primary }
                    : { backgroundColor: colors.surfaceContainerLow },
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <ThemedText
                  variant="labelMd"
                  color={
                    isToday(selectedDate)
                      ? isDark
                        ? '#052E16'
                        : colors.onPrimary
                      : colors.textSecondary
                  }
                  style={{ fontWeight: isToday(selectedDate) ? '700' : '500' }}
                >
                  Today
                </ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Yesterday"
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch {}
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  setSelectedDate(y);
                }}
                style={({ pressed }) => [
                  styles.datePill,
                  isYesterday(selectedDate)
                    ? { backgroundColor: isDark ? colors.secondary : colors.primary }
                    : { backgroundColor: colors.surfaceContainerLow },
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <ThemedText
                  variant="labelMd"
                  color={
                    isYesterday(selectedDate)
                      ? isDark
                        ? '#052E16'
                        : colors.onPrimary
                      : colors.textSecondary
                  }
                  style={{ fontWeight: isYesterday(selectedDate) ? '700' : '500' }}
                >
                  Yesterday
                </ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Custom Date"
                onPress={() => {
                  try { Haptics.selectionAsync(); } catch {}
                  setDatePickerVisible(true);
                }}
                style={({ pressed }) => [
                  styles.datePill,
                  styles.customDatePill,
                  !isToday(selectedDate) && !isYesterday(selectedDate)
                    ? { backgroundColor: isDark ? colors.secondary : colors.primary }
                    : { backgroundColor: colors.surfaceContainerLow },
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <Feather
                  name="calendar"
                  size={14}
                  color={
                    !isToday(selectedDate) && !isYesterday(selectedDate)
                      ? isDark
                        ? '#052E16'
                        : colors.onPrimary
                      : colors.textSecondary
                  }
                />
                <ThemedText
                  variant="labelMd"
                  color={
                    !isToday(selectedDate) && !isYesterday(selectedDate)
                      ? isDark
                        ? '#052E16'
                        : colors.onPrimary
                      : colors.textSecondary
                  }
                  style={{
                    fontWeight:
                      !isToday(selectedDate) && !isYesterday(selectedDate) ? '700' : '500',
                  }}
                >
                  {isToday(selectedDate) || isYesterday(selectedDate)
                    ? 'Custom'
                    : selectedDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Payment Method Selector (Card & Cash) */}
          <View style={styles.sectionBlock}>
            <ThemedText
              variant="labelSm"
              color={colors.textSecondary}
              style={styles.sectionHeader}
            >
              PAYMENT METHOD
            </ThemedText>

            <View style={styles.paymentMethodRow}>
              {PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <Pressable
                    key={method}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      try { Haptics.selectionAsync(); } catch {}
                      setPaymentMethod(method);
                    }}
                    style={({ pressed }) => [
                      styles.methodPill,
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
                    <Feather
                      name={method === 'Card' ? 'credit-card' : 'dollar-sign'}
                      size={16}
                      color={
                        isSelected
                          ? isDark
                            ? '#052E16'
                            : colors.onPrimary
                          : colors.textSecondary
                      }
                    />
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
                      {method}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
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

          {/* Submit CTA */}
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
              style={{
                backgroundColor:
                  flowType === 'expense'
                    ? colors.error
                    : isDark
                    ? colors.secondary
                    : '#059669',
              }}
              textStyle={{
                color:
                  flowType === 'expense'
                    ? '#FFFFFF'
                    : isDark
                    ? '#052E16'
                    : '#FFFFFF',
              }}
              loading={isSaving}
              disabled={!parseFloat(rawAmount) || parseFloat(rawAmount) <= 0 || isSaving}
              onPress={handleSave}
              icon={
                savedSuccess ? (
                  <Feather
                    name="check"
                    size={20}
                    color={
                      flowType === 'expense'
                        ? '#FFFFFF'
                        : isDark
                        ? '#052E16'
                        : '#FFFFFF'
                    }
                  />
                ) : undefined
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Currency Picker Modal */}
      <CurrencyModal
        visible={currencyModalVisible}
        selectedCode={currency}
        onSelect={(code) => setCurrency(code)}
        onClose={() => setCurrencyModalVisible(false)}
      />

      {/* Add Custom Category Modal */}
      <AddCategoryModal
        visible={addCategoryModalVisible}
        onClose={() => setAddCategoryModalVisible(false)}
        onAddCategory={async (name, icon) => {
          await addCustomCategory(name, icon);
          setCategory(name);
        }}
      />

      {/* Custom Date Picker Modal */}
      <CustomDatePickerModal
        visible={datePickerVisible}
        selectedDate={selectedDate}
        onClose={() => setDatePickerVisible(false)}
        onSelectDate={(newD) => setSelectedDate(newD)}
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
    paddingBottom: 120,
    gap: spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    marginTop: spacing.xs,
  },
  typeBtn: {
    flex: 1,
    minHeight: 38,
    paddingVertical: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderCurve: 'continuous',
  },
  amountDisplayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    gap: 4,
    marginBottom: spacing.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xs,
    width: '100%',
  },
  currencyPrefix: {
    fontSize: 36,
    marginRight: 6,
  },
  nativeAmountInput: {
    fontSize: 48,
    fontWeight: '700',
    minWidth: 120,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    padding: 0,
    margin: 0,
  },
  sectionBlock: {
    gap: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeader: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  datePill: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
  },
  customDatePill: {
    flex: 1.2,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  methodPill: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
  },
  saveContainer: {
    width: '100%',
    paddingTop: spacing.xs,
    marginTop: spacing.sm,
  },
});
