import React, { useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';
import { Button } from './Button';

interface CustomDatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function CustomDatePickerModal({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
}: CustomDatePickerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [year, setYear] = useState<number>(selectedDate.getFullYear());
  const [month, setMonth] = useState<number>(selectedDate.getMonth()); // 0-indexed
  const [day, setDay] = useState<number>(selectedDate.getDate());

  // Keep state in sync when modal opens
  React.useEffect(() => {
    if (visible) {
      setYear(selectedDate.getFullYear());
      setMonth(selectedDate.getMonth());
      setDay(selectedDate.getDate());
    }
  }, [visible, selectedDate]);

  // Number of days in chosen month/year
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(day, daysInMonth);

  const changeMonth = (delta: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    let newM = month + delta;
    let newY = year;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    } else if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    setMonth(newM);
    setYear(newY);
    const maxDays = new Date(newY, newM + 1, 0).getDate();
    if (day > maxDays) setDay(maxDays);
  };

  const changeDay = (delta: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    const newDay = day + delta;
    if (newDay >= 1 && newDay <= daysInMonth) {
      setDay(newDay);
    } else if (newDay < 1) {
      changeMonth(-1);
      const prevMax = new Date(year, month, 0).getDate();
      setDay(prevMax);
    } else {
      changeMonth(1);
      setDay(1);
    }
  };

  const changeYear = (delta: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setYear((y) => y + delta);
  };

  const handlePreset = (presetDaysAgo: number) => {
    try { Haptics.selectionAsync(); } catch {}
    const target = new Date();
    target.setDate(target.getDate() - presetDaysAgo);
    setYear(target.getFullYear());
    setMonth(target.getMonth());
    setDay(target.getDate());
  };

  const handleConfirm = () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    const finalDate = new Date(year, month, safeDay, 12, 0, 0);
    onSelectDate(finalDate);
    onClose();
  };

  const isCurrentSelectionToday = () => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === safeDay
    );
  };

  const isCurrentSelectionYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return (
      yest.getFullYear() === year &&
      yest.getMonth() === month &&
      yest.getDate() === safeDay
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
          <View>
            <ThemedText variant="headlineMd">Select Date</ThemedText>
            <ThemedText variant="bodySm" color={colors.textSecondary}>
              Log transaction for any day
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceContainerLow }]}
          >
            <Feather name="x" size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Quick Presets */}
          <ThemedText variant="labelSm" color={colors.textSecondary} style={styles.sectionLabel}>
            QUICK PRESETS
          </ThemedText>
          <View style={styles.presetRow}>
            <Pressable
              onPress={() => handlePreset(0)}
              style={[
                styles.presetBtn,
                { backgroundColor: colors.surfaceContainerLow },
                isCurrentSelectionToday() && {
                  backgroundColor: isDark ? colors.secondary : colors.primary,
                },
              ]}
            >
              <ThemedText
                variant="labelMd"
                color={
                  isCurrentSelectionToday()
                    ? isDark
                      ? '#052E16'
                      : colors.onPrimary
                    : colors.text
                }
              >
                Today
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handlePreset(1)}
              style={[
                styles.presetBtn,
                { backgroundColor: colors.surfaceContainerLow },
                isCurrentSelectionYesterday() && {
                  backgroundColor: isDark ? colors.secondary : colors.primary,
                },
              ]}
            >
              <ThemedText
                variant="labelMd"
                color={
                  isCurrentSelectionYesterday()
                    ? isDark
                      ? '#052E16'
                      : colors.onPrimary
                    : colors.text
                }
              >
                Yesterday
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handlePreset(2)}
              style={[styles.presetBtn, { backgroundColor: colors.surfaceContainerLow }]}
            >
              <ThemedText variant="labelMd" color={colors.text}>
                2 Days Ago
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handlePreset(7)}
              style={[styles.presetBtn, { backgroundColor: colors.surfaceContainerLow }]}
            >
              <ThemedText variant="labelMd" color={colors.text}>
                1 Week Ago
              </ThemedText>
            </Pressable>
          </View>

          {/* Stepper Adjusters */}
          <ThemedText variant="labelSm" color={colors.textSecondary} style={styles.sectionLabel}>
            ADJUST DATE
          </ThemedText>

          {/* Month Stepper */}
          <View style={[styles.stepperCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText variant="labelSm" color={colors.textSecondary}>
              MONTH
            </ThemedText>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => changeMonth(-1)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <Feather name="chevron-left" size={20} color={colors.text} />
              </Pressable>
              <ThemedText variant="headlineSm" style={styles.stepperValue}>
                {MONTH_NAMES[month]}
              </ThemedText>
              <Pressable
                onPress={() => changeMonth(1)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <Feather name="chevron-right" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Day Stepper */}
          <View style={[styles.stepperCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText variant="labelSm" color={colors.textSecondary}>
              DAY
            </ThemedText>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => changeDay(-1)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <Feather name="chevron-left" size={20} color={colors.text} />
              </Pressable>
              <ThemedText variant="headlineSm" style={styles.stepperValue}>
                {safeDay}
              </ThemedText>
              <Pressable
                onPress={() => changeDay(1)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <Feather name="chevron-right" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Year Stepper */}
          <View style={[styles.stepperCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText variant="labelSm" color={colors.textSecondary}>
              YEAR
            </ThemedText>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => changeYear(-1)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <Feather name="chevron-left" size={20} color={colors.text} />
              </Pressable>
              <ThemedText variant="headlineSm" style={styles.stepperValue}>
                {year}
              </ThemedText>
              <Pressable
                onPress={() => changeYear(1)}
                style={[styles.stepBtn, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <Feather name="chevron-right" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.footer}>
          <Button
            title={`Set Date: ${MONTH_NAMES[month].slice(0, 3)} ${safeDay}, ${year}`}
            variant="primary"
            size="lg"
            onPress={handleConfirm}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  stepperCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontWeight: '700',
  },
  footer: {
    paddingTop: spacing.md,
  },
});
