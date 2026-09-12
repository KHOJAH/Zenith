import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { formatCurrency } from '@/utils/formatters';
import { getOrdinalSuffix } from '@/utils/salary';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';
import { Button } from './Button';
import { Card } from './Card';
import type { RecurringBill } from '@/db/schema';

interface ManageRecurringModalProps {
  visible: boolean;
  onClose: () => void;
}

const POPULAR_DUE_DAYS = [1, 5, 10, 15, 20, 25, 27, 28, 30];

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function ManageRecurringModal({ visible, onClose }: ManageRecurringModalProps) {
  const { colors, isDark } = useTheme();
  const {
    recurringBills,
    categories,
    currency,
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
  } = useTransactions();

  const scrollViewRef = useRef<ScrollView>(null);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.category || 'Housing & Utilities');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash'>('Card');
  const [dueDay, setDueDay] = useState(1);
  const [dueMonth, setDueMonth] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEditingBill(null);
    setName('');
    setAmount('');
    setCategory(categories[0]?.category || 'Housing & Utilities');
    setFrequency('monthly');
    setPaymentMethod('Card');
    setDueDay(1);
    setDueMonth(1);
    setShowAddForm(false);
  };

  const handleStartEdit = (bill: RecurringBill) => {
    try { Haptics.selectionAsync(); } catch {}
    setEditingBill(bill);
    setName(bill.name);
    setAmount(String(bill.amount));
    setCategory(bill.category);
    setFrequency(bill.frequency);
    setPaymentMethod(bill.payment_method);
    setDueDay(bill.due_day);
    setDueMonth(bill.due_month || 1);
    setShowAddForm(true);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSaveBill = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter a bill name (e.g. Netflix, Rent).');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (editingBill) {
        await updateRecurringBill({
          ...editingBill,
          name: trimmedName,
          amount: parsedAmount,
          category,
          frequency,
          payment_method: paymentMethod,
          due_day: dueDay,
          due_month: frequency === 'yearly' ? dueMonth : undefined,
          icon: getCategoryIcon(category),
        });
      } else {
        await addRecurringBill({
          name: trimmedName,
          amount: parsedAmount,
          category,
          currency,
          payment_method: paymentMethod,
          frequency,
          due_day: dueDay,
          due_month: frequency === 'yearly' ? dueMonth : undefined,
          icon: getCategoryIcon(category),
          is_active: true,
        });
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save recurring bill:', err);
      Alert.alert('Error', 'Failed to save recurring bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (bill: RecurringBill) => {
    try {
      Haptics.selectionAsync();
      await updateRecurringBill({
        ...bill,
        is_active: !bill.is_active,
      });
    } catch (err) {
      console.error('Failed to toggle bill status:', err);
    }
  };

  const handleDeleteBill = (bill: RecurringBill) => {
    Alert.alert(
      'Delete Recurring Bill',
      `Are you sure you want to delete "${bill.name}"? This will not delete previously logged transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (editingBill?.id === bill.id) {
                resetForm();
              }
              await deleteRecurringBill(bill.id);
            } catch (err) {
              console.error('Failed to delete recurring bill:', err);
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (catName: string) => {
    switch (catName) {
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

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <ThemedText variant="headlineSm">Recurring Bills</ThemedText>
                <ThemedText variant="bodySm" color={colors.textSecondary}>
                  Fixed subscriptions & commitments
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
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  },
                ]}
              >
                <Feather name="x" size={18} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Add New Bill Action Header */}
              <View style={styles.sectionHeader}>
                <ThemedText variant="labelMd" color={colors.textSecondary} style={{ fontWeight: '700' }}>
                  {editingBill ? 'EDIT BILL DETAILS' : showAddForm ? 'NEW BILL DETAILS' : 'COMMITTED BILLS'}
                </ThemedText>

                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (showAddForm) {
                      resetForm();
                    } else {
                      setShowAddForm(true);
                      setEditingBill(null);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.toggleAddBtn,
                    {
                      backgroundColor: showAddForm
                        ? colors.surfaceContainer
                        : isDark
                        ? colors.secondaryContainer
                        : colors.surfaceContainerLow,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    },
                  ]}
                >
                  <Feather
                    name={showAddForm ? 'x' : 'plus'}
                    size={14}
                    color={showAddForm ? colors.text : isDark ? colors.secondaryMint : colors.text}
                  />
                  <ThemedText
                    variant="labelSm"
                    color={showAddForm ? colors.text : isDark ? colors.secondaryMint : colors.text}
                    style={{ fontWeight: '700' }}
                  >
                    {showAddForm ? 'Cancel' : 'Add Bill'}
                  </ThemedText>
                </Pressable>
              </View>

              {/* Add Bill Form */}
              {showAddForm && (
                <Card padding="md" style={styles.formCard} bordered>
                  {/* Name Input */}
                  <View style={styles.inputGroup}>
                    <ThemedText variant="labelSm" color={colors.textSecondary}>
                      BILL NAME
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surfaceContainerLow,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="e.g. Netflix, Gym, Rent"
                      placeholderTextColor={colors.textTertiary}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  {/* Amount Input */}
                  <View style={styles.inputGroup}>
                    <ThemedText variant="labelSm" color={colors.textSecondary}>
                      AMOUNT ({currency})
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: colors.surfaceContainerLow,
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                      placeholder="0.00"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="decimal-pad"
                      value={amount}
                      onChangeText={setAmount}
                    />
                  </View>

                  {/* Frequency Toggle */}
                  <View style={styles.inputGroup}>
                    <ThemedText variant="labelSm" color={colors.textSecondary}>
                      FREQUENCY
                    </ThemedText>
                    <View style={styles.segmentRow}>
                      {(['monthly', 'yearly'] as const).map((freq) => {
                        const isSelected = frequency === freq;
                        return (
                          <Pressable
                            key={freq}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setFrequency(freq);
                            }}
                            style={[
                              styles.segmentBtn,
                              {
                                backgroundColor: isSelected
                                  ? isDark
                                    ? colors.secondary
                                    : colors.primary
                                  : colors.surfaceContainerLow,
                              },
                            ]}
                          >
                            <ThemedText
                              variant="labelMd"
                              color={isSelected ? (isDark ? '#052E16' : colors.onPrimary) : colors.text}
                              style={{ fontWeight: isSelected ? '700' : '500', textTransform: 'capitalize' }}
                            >
                              {freq}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Payment Method Toggle */}
                  <View style={styles.inputGroup}>
                    <ThemedText variant="labelSm" color={colors.textSecondary}>
                      PAYMENT METHOD
                    </ThemedText>
                    <View style={styles.segmentRow}>
                      {(['Card', 'Cash'] as const).map((pm) => {
                        const isSelected = paymentMethod === pm;
                        return (
                          <Pressable
                            key={pm}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setPaymentMethod(pm);
                            }}
                            style={[
                              styles.segmentBtn,
                              {
                                backgroundColor: isSelected
                                  ? isDark
                                    ? colors.secondary
                                    : colors.primary
                                  : colors.surfaceContainerLow,
                              },
                            ]}
                          >
                            <ThemedText
                              variant="labelMd"
                              color={isSelected ? (isDark ? '#052E16' : colors.onPrimary) : colors.text}
                              style={{ fontWeight: isSelected ? '700' : '500' }}
                            >
                              {pm}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Yearly Month Picker */}
                  {frequency === 'yearly' && (
                    <View style={styles.inputGroup}>
                      <ThemedText variant="labelSm" color={colors.textSecondary}>
                        DUE MONTH
                      </ThemedText>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipsScroll}
                      >
                        {MONTH_SHORT_NAMES.map((mName, idx) => {
                          const mNum = idx + 1;
                          const isSelected = dueMonth === mNum;
                          return (
                            <Pressable
                              key={mName}
                              onPress={() => {
                                Haptics.selectionAsync();
                                setDueMonth(mNum);
                              }}
                              style={[
                                styles.chip,
                                {
                                  backgroundColor: isSelected
                                    ? isDark
                                      ? colors.secondary
                                      : colors.primary
                                    : colors.surfaceContainerLow,
                                  borderColor: isSelected ? 'transparent' : colors.border,
                                },
                              ]}
                            >
                              <ThemedText
                                variant="labelSm"
                                color={isSelected ? (isDark ? '#052E16' : colors.onPrimary) : colors.text}
                                style={{ fontWeight: isSelected ? '700' : '500' }}
                              >
                                {mName}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Due Day Stepper & Quick Pills */}
                  <View style={styles.inputGroup}>
                    <View style={styles.dueDayHeaderRow}>
                      <ThemedText variant="labelSm" color={colors.textSecondary}>
                        DUE DAY
                      </ThemedText>
                      <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: '700' }}>
                        {getOrdinalSuffix(dueDay)} of month
                      </ThemedText>
                    </View>

                    <View style={styles.stepperRow}>
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setDueDay((d) => (d <= 1 ? 31 : d - 1));
                        }}
                        style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerLow }]}
                      >
                        <Feather name="minus" size={16} color={colors.text} />
                      </Pressable>

                      <View style={[styles.stepperDisplay, { backgroundColor: colors.surfaceContainerLow }]}>
                        <ThemedText variant="headlineSm" style={{ fontWeight: '800' }}>
                          {dueDay}
                        </ThemedText>
                      </View>

                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setDueDay((d) => (d >= 31 ? 1 : d + 1));
                        }}
                        style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerLow }]}
                      >
                        <Feather name="plus" size={16} color={colors.text} />
                      </Pressable>
                    </View>

                    {/* Quick popular due day pills */}
                    <View style={styles.quickPillsRow}>
                      {POPULAR_DUE_DAYS.map((d) => {
                        const isCurrent = d === dueDay;
                        return (
                          <Pressable
                            key={d}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setDueDay(d);
                            }}
                            style={[
                              styles.quickPill,
                              {
                                backgroundColor: isCurrent
                                  ? isDark
                                    ? colors.secondary
                                    : colors.primary
                                  : colors.surfaceContainerLow,
                                borderColor: isCurrent ? 'transparent' : colors.border,
                              },
                            ]}
                          >
                            <ThemedText
                              variant="labelSm"
                              color={isCurrent ? (isDark ? '#052E16' : colors.onPrimary) : colors.text}
                              style={{ fontWeight: isCurrent ? '700' : '500' }}
                            >
                              {getOrdinalSuffix(d)}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Category Selection */}
                  <View style={styles.inputGroup}>
                    <ThemedText variant="labelSm" color={colors.textSecondary}>
                      CATEGORY
                    </ThemedText>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsScroll}
                    >
                      {categories.map((cat) => {
                        const isSelected = category === cat.category;
                        return (
                          <Pressable
                            key={cat.category}
                            onPress={() => {
                              Haptics.selectionAsync();
                              setCategory(cat.category);
                            }}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: isSelected
                                  ? isDark
                                    ? colors.secondary
                                    : colors.primary
                                  : colors.surfaceContainerLow,
                                borderColor: isSelected ? 'transparent' : colors.border,
                              },
                            ]}
                          >
                            <Feather
                              name={getCategoryIcon(cat.category) as any}
                              size={12}
                              color={isSelected ? (isDark ? '#052E16' : colors.onPrimary) : colors.text}
                            />
                            <ThemedText
                              variant="labelSm"
                              color={isSelected ? (isDark ? '#052E16' : colors.onPrimary) : colors.text}
                              style={{ fontWeight: isSelected ? '700' : '500' }}
                            >
                              {cat.category}
                            </ThemedText>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* Submit Button */}
                  <View style={{ marginTop: spacing.xs }}>
                    <Button
                      title={editingBill ? 'Save Changes' : 'Save Recurring Bill'}
                      variant="primary"
                      size="md"
                      loading={isSubmitting}
                      onPress={handleSaveBill}
                    />
                  </View>
                </Card>
              )}

              {/* List of Configured Bills */}
              {recurringBills.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Feather name="calendar" size={24} color={colors.textTertiary} />
                  </View>
                  <ThemedText variant="headlineSm" style={{ marginTop: spacing.xs }}>
                    No Recurring Bills
                  </ThemedText>
                  <ThemedText
                    variant="bodySm"
                    color={colors.textSecondary}
                    style={{ textAlign: 'center', marginTop: 4 }}
                  >
                    Add recurring commitments (rent, subscriptions, utilities) to track upcoming due dates.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.billsList}>
                  {recurringBills.map((bill) => {
                    const isYearly = bill.frequency === 'yearly';
                    const isEditingThisBill = editingBill?.id === bill.id;
                    return (
                      <Card
                        key={bill.id}
                        padding="md"
                        bordered
                        style={[
                          styles.billCard,
                          {
                            opacity: bill.is_active ? 1 : 0.6,
                            borderColor: isEditingThisBill ? colors.secondary : colors.border,
                            borderWidth: isEditingThisBill ? 1.5 : 1,
                          },
                        ]}
                      >
                        <View style={styles.billTopRow}>
                          <View style={styles.billLeft}>
                            <View
                              style={[
                                styles.billIconWrap,
                                {
                                  backgroundColor: colors.surfaceContainerLow,
                                },
                              ]}
                            >
                              <Feather
                                name={getCategoryIcon(bill.category) as any}
                                size={18}
                                color={colors.text}
                              />
                            </View>

                            <View style={{ flex: 1, minWidth: 0 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <ThemedText variant="headlineSm" numberOfLines={1}>
                                  {bill.name}
                                </ThemedText>
                                {isEditingThisBill && (
                                  <View
                                    style={[
                                      styles.pausedBadge,
                                      { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)' },
                                    ]}
                                  >
                                    <ThemedText variant="labelSm" color={colors.secondary} style={{ fontSize: 10, fontWeight: '700' }}>
                                      EDITING
                                    </ThemedText>
                                  </View>
                                )}
                                {!bill.is_active && (
                                  <View
                                    style={[
                                      styles.pausedBadge,
                                      { backgroundColor: colors.surfaceContainer },
                                    ]}
                                  >
                                    <ThemedText variant="labelSm" color={colors.textTertiary} style={{ fontSize: 10 }}>
                                      PAUSED
                                    </ThemedText>
                                  </View>
                                )}
                              </View>

                              <ThemedText variant="bodySm" color={colors.textSecondary} numberOfLines={1}>
                                {bill.category} • {isYearly ? `Yearly (${MONTH_SHORT_NAMES[(bill.due_month || 1) - 1]} ${bill.due_day})` : `Due ${getOrdinalSuffix(bill.due_day)}`}
                              </ThemedText>
                            </View>
                          </View>

                          <View style={styles.billRight}>
                            <ThemedText variant="headlineSm" style={{ fontWeight: '700' }}>
                              {formatCurrency(bill.amount, bill.currency || currency)}
                            </ThemedText>
                            <ThemedText variant="labelSm" color={colors.textTertiary}>
                              {isYearly ? '/yr' : '/mo'} • {bill.payment_method}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Bill Actions Bar */}
                        <View style={[styles.billActionRow, { borderTopColor: colors.border }]}>
                          <View style={styles.switchRow}>
                            <Switch
                              value={bill.is_active}
                              onValueChange={() => handleToggleActive(bill)}
                              trackColor={{
                                false: colors.surfaceContainerHigh,
                                true: colors.secondary,
                              }}
                              thumbColor="#FFFFFF"
                            />
                            <ThemedText variant="labelSm" color={colors.textSecondary}>
                              {bill.is_active ? 'Active' : 'Paused'}
                            </ThemedText>
                          </View>

                          <View style={styles.cardActionsRight}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Edit ${bill.name}`}
                              onPress={() => handleStartEdit(bill)}
                              hitSlop={8}
                              style={({ pressed }) => [
                                styles.actionBtn,
                                {
                                  backgroundColor: isEditingThisBill
                                    ? (isDark ? colors.secondary : colors.primary)
                                    : colors.surfaceContainerLow,
                                  transform: [{ scale: pressed ? 0.92 : 1 }],
                                },
                              ]}
                            >
                              <Feather
                                name="edit-2"
                                size={14}
                                color={
                                  isEditingThisBill
                                    ? (isDark ? '#052E16' : colors.onPrimary)
                                    : colors.text
                                }
                              />
                            </Pressable>

                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Delete ${bill.name}`}
                              onPress={() => handleDeleteBill(bill)}
                              hitSlop={8}
                              style={({ pressed }) => [
                                styles.actionBtn,
                                styles.deleteBtn,
                                {
                                  backgroundColor: colors.surfaceContainerLow,
                                  transform: [{ scale: pressed ? 0.92 : 1 }],
                                },
                              ]}
                            >
                              <Feather name="trash-2" size={14} color={colors.error} />
                            </Pressable>
                          </View>
                        </View>
                      </Card>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardWrap: {
    maxHeight: '90%',
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: spacing.lg,
    maxHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 520,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
  },
  formCard: {
    gap: spacing.sm,
  },
  inputGroup: {
    gap: 4,
  },
  textInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueDayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperDisplay: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  quickPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  chipsScroll: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billsList: {
    gap: spacing.sm,
  },
  billCard: {
    gap: spacing.xs,
  },
  billTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  billIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pausedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: 0,
  },
});
