import React, { useState } from "react";
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { spacing } from "@/theme/spacing";
import { radius } from "@/theme/radius";
import { ThemedText } from "./ThemedText";
import { Button } from "./Button";
import { CalendarPicker } from "./CalendarPicker";

interface CustomDatePickerModalProps {
  visible: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function CustomDatePickerModal({
  visible,
  selectedDate,
  onClose,
  onSelectDate,
}: CustomDatePickerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [prevSelectedDate, setPrevSelectedDate] = useState(selectedDate);
  const [pickedDate, setPickedDate] = useState<Date>(selectedDate);

  if (selectedDate !== prevSelectedDate) {
    setPrevSelectedDate(selectedDate);
    setPickedDate(selectedDate);
  }

  const handlePreset = (presetDaysAgo: number) => {
    try { Haptics.selectionAsync(); } catch {}
    const target = new Date();
    target.setDate(target.getDate() - presetDaysAgo);
    setPickedDate(target);
  };

  const handleConfirm = () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    onSelectDate(pickedDate);
    onClose();
  };

  const isCurrentSelectionToday = () => {
    return isSameDay(new Date(), pickedDate);
  };

  const isCurrentSelectionYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return isSameDay(yest, pickedDate);
  };

  const formattedDate = `${MONTH_NAMES[pickedDate.getMonth()].slice(0, 3)} ${pickedDate.getDate()}, ${pickedDate.getFullYear()}`;

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
              Tap any date on the calendar
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: colors.surfaceContainerLow, transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
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
              style={({ pressed }) => [
                styles.presetBtn,
                { backgroundColor: colors.surfaceContainerLow },
                isCurrentSelectionToday() && {
                  backgroundColor: isDark ? colors.secondary : colors.primary,
                },
                { transform: [{ scale: pressed ? 0.94 : 1 }] },
              ]}
            >
              <ThemedText
                variant="labelMd"
                color={
                  isCurrentSelectionToday()
                    ? isDark
                      ? "#052E16"
                      : colors.onPrimary
                    : colors.text
                }
                style={{ fontWeight: isCurrentSelectionToday() ? "700" : "500" }}
              >
                Today
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handlePreset(1)}
              style={({ pressed }) => [
                styles.presetBtn,
                { backgroundColor: colors.surfaceContainerLow },
                isCurrentSelectionYesterday() && {
                  backgroundColor: isDark ? colors.secondary : colors.primary,
                },
                { transform: [{ scale: pressed ? 0.94 : 1 }] },
              ]}
            >
              <ThemedText
                variant="labelMd"
                color={
                  isCurrentSelectionYesterday()
                    ? isDark
                      ? "#052E16"
                      : colors.onPrimary
                    : colors.text
                }
                style={{ fontWeight: isCurrentSelectionYesterday() ? "700" : "500" }}
              >
                Yesterday
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handlePreset(2)}
              style={({ pressed }) => [
                styles.presetBtn,
                { backgroundColor: colors.surfaceContainerLow },
                { transform: [{ scale: pressed ? 0.94 : 1 }] },
              ]}
            >
              <ThemedText variant="labelMd" color={colors.text}>
                2 Days Ago
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => handlePreset(7)}
              style={({ pressed }) => [
                styles.presetBtn,
                { backgroundColor: colors.surfaceContainerLow },
                { transform: [{ scale: pressed ? 0.94 : 1 }] },
              ]}
            >
              <ThemedText variant="labelMd" color={colors.text}>
                1 Week Ago
              </ThemedText>
            </Pressable>
          </View>

          {/* Rectangular Calendar Card */}
          <View
            style={[
              styles.calendarCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <CalendarPicker
              mode="single"
              selectedDate={pickedDate}
              onSelectDate={(newDate) => setPickedDate(newDate)}
              maxDate={new Date()}
            />
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.footer}>
          <Button
            title={`Set Date: ${formattedDate}`}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  presetBtn: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderCurve: "continuous",
  },
  calendarCard: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
