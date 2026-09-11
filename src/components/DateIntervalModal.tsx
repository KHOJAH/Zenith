import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { DateInterval } from "@/db/schema";
import { ThemedText } from "./ThemedText";
import { Button } from "./Button";
import { spacing } from "@/theme/spacing";
import { radius } from "@/theme/radius";
import { getItem, setItem, STORAGE_KEYS } from "@/utils/storage";
import { getSalaryCycleDates, getOrdinalSuffix } from "@/utils/salary";

interface DateIntervalModalProps {
  visible: boolean;
  currentInterval: DateInterval;
  onSelectInterval: (interval: DateInterval) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const POPULAR_SALARY_DAYS = [1, 15, 20, 25, 27, 28, 30];

export function DateIntervalModal({
  visible,
  currentInterval,
  onSelectInterval,
  onClose,
}: DateIntervalModalProps) {
  const { colors, isDark } = useTheme();

  const [selectedType, setSelectedType] = useState<DateInterval["id"]>(
    currentInterval.id === "custom" ? "salary_cycle" : currentInterval.id
  );

  const [salaryDay, setSalaryDay] = useState<number>(27);

  // Load saved salary day
  useEffect(() => {
    getItem(STORAGE_KEYS.SALARY_DAY, "27").then((val) => {
      const parsed = parseInt(val, 10);
      if (parsed >= 1 && parsed <= 31) {
        setSalaryDay(parsed);
      }
    });
  }, []);

  const handleDaySelect = (day: number) => {
    const bounded = Math.max(1, Math.min(31, Math.round(day)));
    setSalaryDay(bounded);
    setItem(STORAGE_KEYS.SALARY_DAY, String(bounded));
    try {
      Haptics.selectionAsync();
    } catch {}
  };

  const adjustDay = (delta: number) => {
    let next = salaryDay + delta;
    if (next < 1) next = 31;
    if (next > 31) next = 1;
    handleDaySelect(next);
  };

  const currentSalaryCycle = useMemo(() => {
    return getSalaryCycleDates(salaryDay);
  }, [salaryDay]);

  const getPresets = (): {
    id: DateInterval["id"];
    label: string;
    sublabel: string;
    getDates: () => { start: Date; end: Date; label: string };
  }[] => {
    const now = new Date();
    return [
      {
        id: "salary_cycle",
        label: "Salary Cycle",
        sublabel: `${currentSalaryCycle.label} • Cycles on the ${getOrdinalSuffix(salaryDay)}`,
        getDates: () => ({
          start: currentSalaryCycle.start,
          end: currentSalaryCycle.endDate,
          label: currentSalaryCycle.label,
        }),
      },
      {
        id: "current_month",
        label: "Calendar Month",
        sublabel: `${MONTH_NAMES[now.getMonth()]} 1 – ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`,
        getDates: () => {
          const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const end = new Date(now.getFullYear(), now.getMonth(), lastDay, 23, 59, 59, 999);
          return {
            start,
            end,
            label: now.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          };
        },
      },
      {
        id: "last_30_days",
        label: "Last 30 Days",
        sublabel: "Past 30 rolling days",
        getDates: () => {
          const s = new Date(now);
          s.setDate(now.getDate() - 30);
          s.setHours(0, 0, 0, 0);
          const e = new Date(now);
          e.setHours(23, 59, 59, 999);
          return { start: s, end: e, label: "Last 30 Days" };
        },
      },
      {
        id: "last_7_days",
        label: "Last 7 Days",
        sublabel: "Past week",
        getDates: () => {
          const s = new Date(now);
          s.setDate(now.getDate() - 7);
          s.setHours(0, 0, 0, 0);
          const e = new Date(now);
          e.setHours(23, 59, 59, 999);
          return { start: s, end: e, label: "Last 7 Days" };
        },
      },
    ];
  };

  const handleApply = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const presets = getPresets();
    const activePreset = presets.find((p) => p.id === selectedType);

    if (activePreset) {
      const dates = activePreset.getDates();
      onSelectInterval({
        id: selectedType,
        label: dates.label,
        startDate: dates.start.toISOString(),
        endDate: dates.end.toISOString(),
      });
    }

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
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
              <ThemedText variant="headlineSm">Date Interval</ThemedText>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Choose timeframe for totals and cash flow
              </ThemedText>
            </View>
            <Pressable
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

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {/* Preset Options */}
            {getPresets().map((item) => {
              const isSelected = selectedType === item.id;
              return (
                <View key={item.id}>
                  <Pressable
                    onPress={() => {
                      setSelectedType(item.id);
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                    }}
                    style={({ pressed }) => [
                      styles.presetRow,
                      {
                        backgroundColor: isSelected
                          ? colors.surfaceContainerLow
                          : "transparent",
                        borderColor: isSelected
                          ? colors.borderStrong
                          : colors.border,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <View style={styles.presetLeft}>
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected
                              ? isDark
                                ? colors.secondary
                                : colors.primary
                              : colors.borderStrong,
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.radioInner,
                              {
                                backgroundColor: isDark
                                  ? colors.secondary
                                  : colors.primary,
                              },
                            ]}
                          />
                        )}
                      </View>
                      <View>
                        <ThemedText variant="labelMd" style={{ fontWeight: isSelected ? "700" : "500" }}>
                          {item.label}
                        </ThemedText>
                        <ThemedText variant="bodySm" color={colors.textSecondary}>
                          {item.sublabel}
                        </ThemedText>
                      </View>
                    </View>
                  </Pressable>

                  {/* Salary Day Configuration section inside Salary Cycle option */}
                  {item.id === "salary_cycle" && isSelected && (
                    <View
                      style={[
                        styles.salaryConfigContainer,
                        {
                          backgroundColor: colors.surfaceContainerLow,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.salaryHeaderRow}>
                        <Feather name="calendar" size={16} color={colors.secondary} />
                        <ThemedText
                          variant="labelSm"
                          color={colors.secondary}
                          style={styles.salarySectionTitle}
                        >
                          SET SALARY DAY (PAYDAY)
                        </ThemedText>
                      </View>

                      {/* Prominent Stepper & Badge */}
                      <View style={styles.stepperBadgeRow}>
                        <Pressable
                          onPress={() => adjustDay(-5)}
                          style={({ pressed }) => [
                            styles.stepperJumpBtn,
                            { backgroundColor: colors.surface, transform: [{ scale: pressed ? 0.92 : 1 }] },
                          ]}
                        >
                          <ThemedText variant="labelSm" color={colors.textSecondary}>
                            -5d
                          </ThemedText>
                        </Pressable>

                        <Pressable
                          onPress={() => adjustDay(-1)}
                          style={({ pressed }) => [
                            styles.stepperStepBtn,
                            { backgroundColor: colors.surface, transform: [{ scale: pressed ? 0.92 : 1 }] },
                          ]}
                        >
                          <Feather name="minus" size={16} color={colors.text} />
                        </Pressable>

                        <View
                          style={[
                            styles.dayHeroBadge,
                            {
                              backgroundColor: isDark ? colors.secondary : colors.primary,
                            },
                          ]}
                        >
                          <ThemedText
                            variant="headlineMd"
                            color={isDark ? "#052E16" : colors.onPrimary}
                            style={{ fontWeight: "800" }}
                          >
                            {salaryDay}
                          </ThemedText>
                          <ThemedText
                            variant="labelSm"
                            color={isDark ? "#052E16" : colors.onPrimary}
                            style={{ opacity: 0.9, fontWeight: "600", fontSize: 11 }}
                          >
                            {getOrdinalSuffix(salaryDay)} of month
                          </ThemedText>
                        </View>

                        <Pressable
                          onPress={() => adjustDay(1)}
                          style={({ pressed }) => [
                            styles.stepperStepBtn,
                            { backgroundColor: colors.surface, transform: [{ scale: pressed ? 0.92 : 1 }] },
                          ]}
                        >
                          <Feather name="plus" size={16} color={colors.text} />
                        </Pressable>

                        <Pressable
                          onPress={() => adjustDay(5)}
                          style={({ pressed }) => [
                            styles.stepperJumpBtn,
                            { backgroundColor: colors.surface, transform: [{ scale: pressed ? 0.92 : 1 }] },
                          ]}
                        >
                          <ThemedText variant="labelSm" color={colors.textSecondary}>
                            +5d
                          </ThemedText>
                        </Pressable>
                      </View>

                      {/* Quick Popular Payday Pills */}
                      <ThemedText variant="labelSm" color={colors.textSecondary} style={{ marginTop: spacing.xs }}>
                        POPULAR PAYDAYS:
                      </ThemedText>
                      <View style={styles.quickPillsRow}>
                        {POPULAR_SALARY_DAYS.map((d) => {
                          const isCurrent = d === salaryDay;
                          return (
                            <Pressable
                              key={d}
                              onPress={() => handleDaySelect(d)}
                              style={({ pressed }) => [
                                styles.quickPill,
                                {
                                  backgroundColor: isCurrent
                                    ? isDark
                                      ? colors.secondary
                                      : colors.primary
                                    : colors.surface,
                                  borderColor: isCurrent ? "transparent" : colors.border,
                                  transform: [{ scale: pressed ? 0.92 : 1 }],
                                },
                              ]}
                            >
                              <ThemedText
                                variant="labelSm"
                                color={
                                  isCurrent
                                    ? isDark
                                      ? "#052E16"
                                      : colors.onPrimary
                                    : colors.text
                                }
                                style={{ fontWeight: isCurrent ? "700" : "500" }}
                              >
                                {getOrdinalSuffix(d)}
                              </ThemedText>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Live Cycle Summary Result */}
                      <View
                        style={[
                          styles.liveCycleCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.liveCycleHeader}>
                          <ThemedText variant="labelSm" color={colors.textSecondary}>
                            CURRENT CYCLE
                          </ThemedText>
                          <ThemedText
                            variant="labelSm"
                            color={colors.secondary}
                            style={{ fontWeight: "700" }}
                          >
                            {currentSalaryCycle.daysRemaining} days left
                          </ThemedText>
                        </View>
                        <ThemedText variant="headlineSm" style={{ fontWeight: "700", marginTop: 2 }}>
                          {currentSalaryCycle.label}
                        </ThemedText>
                        <ThemedText variant="bodySm" color={colors.textTertiary} style={{ marginTop: 2 }}>
                          Starts {currentSalaryCycle.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · Ends {currentSalaryCycle.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <Button
              title="Apply Interval"
              variant="primary"
              size="lg"
              onPress={handleApply}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: spacing.lg,
    maxHeight: "90%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  optionsList: {
    marginBottom: spacing.md,
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  presetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  salaryConfigContainer: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing.xxs,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  salaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xxs,
  },
  salarySectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  stepperBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  stepperJumpBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperStepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayHeroBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  quickPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  quickPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  liveCycleCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  liveCycleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footer: {
    paddingTop: spacing.xs,
  },
});
