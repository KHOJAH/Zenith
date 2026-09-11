import React, { useState, useMemo } from "react";
import {
  View,
  Pressable,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { ThemedText } from "./ThemedText";
import { spacing } from "@/theme/spacing";
import { radius } from "@/theme/radius";

export interface CalendarPickerProps {
  mode?: "single" | "range";
  selectedDate?: Date;
  onSelectDate?: (date: Date) => void;
  startDate?: Date;
  endDate?: Date;
  onSelectRange?: (start: Date, end: Date) => void;
  maxDate?: Date;
  minDate?: Date;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function CalendarPicker({
  mode = "single",
  selectedDate,
  onSelectDate,
  startDate,
  endDate,
  onSelectRange,
  maxDate,
  minDate,
}: CalendarPickerProps) {
  const { colors, isDark } = useTheme();

  // Determine initial month to display
  const initialMonth = useMemo(() => {
    if (mode === "single" && selectedDate) {
      return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    }
    if (mode === "range" && startDate) {
      return new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [mode, selectedDate, startDate]);

  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);

  // For range mode, track temporary start date when user is picking second date
  const [rangeStart, setRangeStart] = useState<Date | null>(startDate || null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(endDate || null);

  // Keep internal range in sync with props
  React.useEffect(() => {
    if (startDate) setRangeStart(startDate);
    if (endDate) setRangeEnd(endDate);
  }, [startDate, endDate]);

  const today = useMemo(() => new Date(), []);

  const changeMonth = (delta: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setCurrentMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const jumpToToday = () => {
    try { Haptics.selectionAsync(); } catch {}
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: {
      date: Date;
      isCurrentMonth: boolean;
      dayNumber: number;
    }[] = [];

    // Preceding days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dayNumber: daysInPrevMonth - i,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
        dayNumber: d,
      });
    }

    // Trailing days from next month to complete the row of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
        dayNumber: d,
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfWeek, daysInPrevMonth]);

  const isDateDisabled = (d: Date): boolean => {
    const dayStart = startOfDay(d);
    if (maxDate && dayStart.getTime() > startOfDay(maxDate).getTime()) {
      return true;
    }
    if (minDate && dayStart.getTime() < startOfDay(minDate).getTime()) {
      return true;
    }
    return false;
  };

  const handleDayPress = (dayItem: { date: Date; isCurrentMonth: boolean }) => {
    if (!dayItem.isCurrentMonth) {
      setCurrentMonth(new Date(dayItem.date.getFullYear(), dayItem.date.getMonth(), 1));
    }

    if (isDateDisabled(dayItem.date)) return;

    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}

    if (mode === "single") {
      onSelectDate?.(dayItem.date);
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dayItem.date);
        setRangeEnd(null);
        onSelectRange?.(dayItem.date, dayItem.date);
      } else {
        if (dayItem.date.getTime() >= rangeStart.getTime()) {
          setRangeEnd(dayItem.date);
          onSelectRange?.(rangeStart, dayItem.date);
        } else {
          setRangeStart(dayItem.date);
          setRangeEnd(null);
          onSelectRange?.(dayItem.date, dayItem.date);
        }
      }
    }
  };

  const isCurrentMonthVisible =
    today.getFullYear() === year && today.getMonth() === month;

  const activePillBg = isDark ? colors.secondary : colors.primary;
  const activePillText = isDark ? "#052E16" : colors.onPrimary;
  const rangeBandBg = isDark
    ? "rgba(16, 185, 129, 0.18)"
    : "rgba(15, 23, 42, 0.08)";

  return (
    <View style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.header}>
        <View style={styles.monthTitleRow}>
          <ThemedText variant="headlineSm" style={styles.monthTitle}>
            {MONTH_NAMES[month]} {year}
          </ThemedText>
          {!isCurrentMonthVisible && (
            <Pressable
              onPress={jumpToToday}
              style={({ pressed }) => [
                styles.todayBadge,
                { backgroundColor: colors.surfaceContainerLow, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <ThemedText variant="labelSm" color={colors.secondary} style={{ fontWeight: "700" }}>
                Today
              </ThemedText>
            </Pressable>
          )}
        </View>

        <View style={styles.navButtons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => changeMonth(-1)}
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: colors.surfaceContainerLow, transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Feather name="chevron-left" size={18} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => changeMonth(1)}
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: colors.surfaceContainerLow, transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <Feather name="chevron-right" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Weekday Row */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_NAMES.map((w, idx) => (
          <View key={idx} style={styles.weekdayCell}>
            <ThemedText variant="labelSm" color={colors.textTertiary} style={styles.weekdayText}>
              {w}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.grid}>
        {calendarDays.map((dayItem, index) => {
          const date = dayItem.date;
          const disabled = isDateDisabled(date);
          const isTodayDate = isSameDay(date, today);

          const isSingleSelected =
            mode === "single" && selectedDate && isSameDay(date, selectedDate);

          const isRangeStart =
            mode === "range" && rangeStart && isSameDay(date, rangeStart);
          const isRangeEnd =
            mode === "range" && rangeEnd && isSameDay(date, rangeEnd);
          const isBetweenRange =
            mode === "range" &&
            rangeStart &&
            rangeEnd &&
            startOfDay(date).getTime() > startOfDay(rangeStart).getTime() &&
            startOfDay(date).getTime() < startOfDay(rangeEnd).getTime();

          const isRangeCap = isRangeStart || isRangeEnd;
          const hasFullRange = rangeStart && rangeEnd;

          return (
            <View key={index} style={styles.dayCellWrapper}>
              {/* Range Background Connector Pill */}
              {mode === "range" && hasFullRange && (
                <View
                  style={[
                    styles.rangeConnector,
                    isBetweenRange && {
                      left: 0,
                      right: 0,
                      backgroundColor: rangeBandBg,
                    },
                    isRangeStart && {
                      left: "50%",
                      right: 0,
                      backgroundColor: rangeBandBg,
                    },
                    isRangeEnd && {
                      left: 0,
                      right: "50%",
                      backgroundColor: rangeBandBg,
                    },
                  ]}
                />
              )}

              {/* Interactive Day Button */}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: disabled || !dayItem.isCurrentMonth }}
                onPress={() => handleDayPress(dayItem)}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.dayButton,
                  (isSingleSelected || isRangeCap) && {
                    backgroundColor: activePillBg,
                  },
                  isTodayDate && !isSingleSelected && !isRangeCap && {
                    borderColor: isDark ? colors.secondary : colors.primary,
                    borderWidth: 1.5,
                  },
                  disabled && { opacity: 0.25 },
                  {
                    transform: [{ scale: pressed && !disabled ? 0.92 : 1 }],
                  },
                ]}
              >
                <ThemedText
                  variant="labelMd"
                  color={
                    isSingleSelected || isRangeCap
                      ? activePillText
                      : !dayItem.isCurrentMonth
                      ? colors.textTertiary
                      : isTodayDate
                      ? isDark
                        ? colors.secondary
                        : colors.primary
                      : colors.text
                  }
                  style={[
                    styles.dayText,
                    (isSingleSelected || isRangeCap || isTodayDate) && {
                      fontWeight: "700",
                    },
                  ]}
                >
                  {dayItem.dayNumber}
                </ThemedText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xxs,
  },
  monthTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  monthTitle: {
    fontWeight: "700",
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  weekdayText: {
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCellWrapper: {
    width: "14.285%",
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 2,
  },
  rangeConnector: {
    position: "absolute",
    top: 3,
    bottom: 3,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  dayText: {
    fontSize: 14,
  },
});
