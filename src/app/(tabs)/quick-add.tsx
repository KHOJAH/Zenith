import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { TransactionType } from '@/db/schema';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { NumericKeypad } from '@/components/NumericKeypad';
import { CategoryGrid } from '@/components/CategoryGrid';
import { Button } from '@/components/Button';

const MERCHANT_SUGGESTIONS = [
  'Blue Bottle Coffee',
  'Whole Foods Market',
  'Uber Eats',
  'Starbucks Reserve',
  'Apple Store',
  'Amazon Fresh',
];

export default function QuickAddScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addTransaction, currency, setCurrency } = useTransactions();

  const [flowType, setFlowType] = useState<TransactionType>('expense');
  const [rawAmount, setRawAmount] = useState<string>('0');
  const [category, setCategory] = useState<string>('Food & Dining');
  const [merchant, setMerchant] = useState<string>('Blue Bottle Coffee');
  const [note, setNote] = useState<string>('');
  const [tags, setTags] = useState<string>('#coffee #meeting');
  const [paymentMethod, setPaymentMethod] = useState<string>('Apple Card (•• 8821)');
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [splitCount, setSplitCount] = useState<number>(2);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

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

  const cycleCurrency = () => {
    const options = ['USD', 'EUR', 'GBP'];
    const nextIdx = (options.indexOf(currency) + 1) % options.length;
    setCurrency(options[nextIdx]);
  };

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

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
        merchant: merchant.trim() || (flowType === 'income' ? 'Direct Deposit' : 'Expense Payee'),
        note: note.trim(),
        tags: tags.trim(),
        date: new Date().toISOString(),
        payment_method: paymentMethod,
        is_split: isSplit ? 1 : 0,
        split_count: isSplit ? splitCount : 1,
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      setSavedSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        setSavedSuccess(false);
        setRawAmount('0');
        router.push('/(tabs)');
      }, 700);
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
          {/* Currency Pill */}
          <Pressable
            onPress={cycleCurrency}
            style={({ pressed }) => [
              styles.currencyPill,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="dollar-sign" size={13} color={colors.secondary} />
            <ThemedText variant="labelSm" color={colors.text}>
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
            Instant tactile entry • Zero latency
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

        {/* Merchant & Metadata Field */}
        <View style={styles.sectionBlock}>
          <ThemedText
            variant="labelSm"
            color={colors.textSecondary}
            style={styles.sectionHeader}
          >
            {flowType === 'income' ? 'PAYEE / SOURCE' : 'MERCHANT / PAYEE'}
          </ThemedText>

          <Card padding="sm" style={styles.merchantCard}>
            <View style={styles.inputRow}>
              <Feather name="briefcase" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Merchant or payee name"
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

            {/* Quick Merchant Suggestions */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionList}
            >
              {MERCHANT_SUGGESTIONS.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setMerchant(item)}
                  style={({ pressed }) => [
                    styles.suggestionPill,
                    {
                      backgroundColor: colors.surfaceContainer,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <ThemedText variant="labelSm" color={colors.textSecondary}>
                    {item}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </Card>
        </View>

        {/* Dual Compact Options: Payment Method & Split Bill */}
        <View style={styles.dualOptionsRow}>
          {/* Option 1: Payment Method */}
          <Card padding="sm" style={styles.optionCard}>
            <ThemedText variant="labelSm" color={colors.textSecondary}>
              Payment Method
            </ThemedText>
            <Pressable
              onPress={() => {
                const methods = ['Apple Card (•• 8821)', 'Direct Debit', 'Cash', 'Zenith Visa'];
                const nextIdx = (methods.indexOf(paymentMethod) + 1) % methods.length;
                setPaymentMethod(methods[nextIdx]);
              }}
              style={styles.optionSelect}
            >
              <Feather name="credit-card" size={15} color={colors.text} />
              <ThemedText variant="labelMd" numberOfLines={1} style={{ flex: 1 }}>
                {paymentMethod}
              </ThemedText>
            </Pressable>
          </Card>

          {/* Option 2: Split with Friends */}
          <Card padding="sm" style={styles.optionCard}>
            <View style={styles.splitToggleRow}>
              <ThemedText variant="labelSm" color={colors.textSecondary}>
                Split Bill
              </ThemedText>
              <Switch
                value={isSplit}
                onValueChange={setIsSplit}
                trackColor={{ false: colors.surfaceContainer, true: colors.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.splitDetailsRow}>
              <Feather
                name="users"
                size={14}
                color={isSplit ? colors.secondary : colors.textTertiary}
              />
              <ThemedText
                variant="labelSm"
                color={isSplit ? colors.text : colors.textTertiary}
              >
                {isSplit ? `${splitCount} people` : 'Single'}
              </ThemedText>
            </View>
          </Card>
        </View>

        {/* Tags & Note Input */}
        <Card padding="sm" style={styles.tagsCard}>
          <Feather name="tag" size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="Add note or #tags..."
            placeholderTextColor={colors.textTertiary}
            value={tags}
            onChangeText={setTags}
          />
          <Pressable
            onPress={() => {
              if (!tags.includes('#team')) setTags((prev) => `${prev} #team`.trim());
            }}
            style={[styles.quickTagBtn, { backgroundColor: colors.surfaceContainer }]}
          >
            <ThemedText variant="labelSm" color={colors.textSecondary}>
              + #team
            </ThemedText>
          </Pressable>
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
                : `Save ${flowType === 'income' ? 'Income' : 'Expense'} (${currencySymbol}${rawAmount || '0.00'})`
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
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
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
    height: 38,
    fontSize: 15,
  },
  suggestionList: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  suggestionPill: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  dualOptionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionCard: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  optionSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  splitToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  splitDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickTagBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  keypadContainer: {
    width: '100%',
  },
  saveContainer: {
    width: '100%',
    paddingTop: spacing.xs,
  },
});
