import React from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import { ThemedText } from './ThemedText';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface DateIntervalNavProps {
  onOpenModal: () => void;
  style?: StyleProp<ViewStyle>;
}

export function DateIntervalNav({ onOpenModal, style }: DateIntervalNavProps) {
  const { colors } = useTheme();
  const {
    dateInterval,
    stepDateInterval,
    resetDateIntervalToCurrent,
    isCurrentInterval,
    canGoNext,
  } = useTransactions();

  const handlePrev = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    stepDateInterval('prev');
  };

  const handleNext = () => {
    if (!canGoNext) return;
    try {
      Haptics.selectionAsync();
    } catch {}
    stepDateInterval('next');
  };

  const handleOpenCenter = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    onOpenModal();
  };

  const handleResetToday = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    resetDateIntervalToCurrent();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Flanked Stepping Controls & Center Pill */}
      <View style={styles.navGroup}>
        {/* Previous Chevron Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous date interval"
          hitSlop={6}
          onPress={handlePrev}
          style={({ pressed }) => [
            styles.chevronBtn,
            {
              backgroundColor: colors.surfaceContainerLow,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
        >
          <Feather name="chevron-left" size={15} color={colors.text} />
        </Pressable>

        {/* Center Interval Pill */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Date interval: ${dateInterval.label}. Tap to choose interval`}
          onPress={handleOpenCenter}
          style={({ pressed }) => [
            styles.periodBadge,
            {
              backgroundColor: colors.surfaceContainerLow,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Feather name="calendar" size={13} color={colors.textSecondary} />
          <ThemedText variant="labelMd" numberOfLines={1} style={styles.labelText}>
            {dateInterval.label}
          </ThemedText>
          <Feather name="chevron-down" size={12} color={colors.textSecondary} />
        </Pressable>

        {/* Next Chevron Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next date interval"
          accessibilityState={{ disabled: !canGoNext }}
          disabled={!canGoNext}
          hitSlop={6}
          onPress={handleNext}
          style={({ pressed }) => [
            styles.chevronBtn,
            {
              backgroundColor: colors.surfaceContainerLow,
              opacity: canGoNext ? (pressed ? 0.92 : 1) : 0.35,
              transform: [{ scale: pressed && canGoNext ? 0.92 : 1 }],
            },
          ]}
        >
          <Feather name="chevron-right" size={15} color={colors.text} />
        </Pressable>
      </View>

      {/* Subtle 'Today' Pill when away from current period */}
      {!isCurrentInterval && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset to current period"
          hitSlop={6}
          onPress={handleResetToday}
          style={({ pressed }) => [
            styles.todayPill,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.borderStrong,
              transform: [{ scale: pressed ? 0.93 : 1 }],
            },
          ]}
        >
          <Feather name="rotate-ccw" size={10} color={colors.textSecondary} />
          <ThemedText variant="labelSm" color={colors.text} style={styles.todayText}>
            Today
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chevronBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    gap: spacing.xs,
  },
  labelText: {
    fontWeight: '600',
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.xs + 4,
    borderRadius: radius.full,
    borderCurve: 'continuous',
    borderWidth: 1,
    gap: 4,
  },
  todayText: {
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
  },
});
