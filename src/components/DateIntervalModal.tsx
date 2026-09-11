import React, { useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { DateInterval } from '@/db/schema';
import { ThemedText } from './ThemedText';
import { Button } from './Button';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface DateIntervalModalProps {
  visible: boolean;
  currentInterval: DateInterval;
  onSelectInterval: (interval: DateInterval) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function formatDateDisplay(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function DateIntervalModal({
  visible,
  currentInterval,
  onSelectInterval,
  onClose,
}: DateIntervalModalProps) {
  const { colors, isDark } = useTheme();

  const [selectedType, setSelectedType] = useState<DateInterval['id']>(currentInterval.id);

  // Custom start and end dates state
  const [customStart, setCustomStart] = useState<Date>(
    new Date(currentInterval.startDate)
  );
  const [customEnd, setCustomEnd] = useState<Date>(
    new Date(currentInterval.endDate)
  );

  const getPresets = (): { id: DateInterval['id']; label: string; sublabel: string; getDates: () => { start: Date; end: Date } }[] => {
    const now = new Date();
    return [
      {
        id: 'current_month',
        label: 'This Month',
        sublabel: `${MONTH_NAMES[now.getMonth()]} 1 – ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`,
        getDates: () => ({
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        }),
      },
      {
        id: 'last_30_days',
        label: 'Last 30 Days',
        sublabel: 'Past 30 rolling days',
        getDates: () => {
          const s = new Date(now);
          s.setDate(now.getDate() - 30);
          return { start: s, end: now };
        },
      },
      {
        id: 'last_7_days',
        label: 'Last 7 Days',
        sublabel: 'Past week',
        getDates: () => {
          const s = new Date(now);
          s.setDate(now.getDate() - 7);
          return { start: s, end: now };
        },
      },
      {
        id: 'custom',
        label: 'Custom Range',
        sublabel: 'Specify exact start & end dates',
        getDates: () => ({ start: customStart, end: customEnd }),
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
      let label = activePreset.label;
      if (selectedType === 'current_month') {
        const now = new Date();
        label = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else if (selectedType === 'custom') {
        label = `${customStart.getDate()} ${MONTH_NAMES[customStart.getMonth()]} – ${customEnd.getDate()} ${MONTH_NAMES[customEnd.getMonth()]}`;
      }

      onSelectInterval({
        id: selectedType,
        label,
        startDate: dates.start.toISOString(),
        endDate: dates.end.toISOString(),
      });
    }

    onClose();
  };

  // Adjust date helpers
  const adjustStartDate = (daysDelta: number) => {
    setCustomStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + daysDelta);
      if (next > customEnd) return prev;
      return next;
    });
  };

  const adjustEndDate = (daysDelta: number) => {
    setCustomEnd((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + daysDelta);
      if (next < customStart) return prev;
      return next;
    });
  };

  const adjustStartMonth = (monthsDelta: number) => {
    setCustomStart((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + monthsDelta);
      if (next > customEnd) return prev;
      return next;
    });
  };

  const adjustEndMonth = (monthsDelta: number) => {
    setCustomEnd((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + monthsDelta);
      if (next < customStart) return prev;
      return next;
    });
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
                Choose timeframe for totals and analytics
              </ThemedText>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceContainerLow }]}
            >
              <Feather name="x" size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {/* Preset Options */}
            {getPresets().map((item) => {
              const isSelected = selectedType === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setSelectedType(item.id);
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                  }}
                  style={[
                    styles.presetRow,
                    {
                      backgroundColor: isSelected
                        ? colors.surfaceContainerLow
                        : 'transparent',
                      borderColor: isSelected
                        ? colors.borderStrong
                        : colors.border,
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
                      <ThemedText variant="labelMd" style={{ fontWeight: isSelected ? '700' : '500' }}>
                        {item.label}
                      </ThemedText>
                      <ThemedText variant="bodySm" color={colors.textSecondary}>
                        {item.sublabel}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {/* Custom Date Pickers when Custom Range is active */}
            {selectedType === 'custom' && (
              <View
                style={[
                  styles.customContainer,
                  { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}
              >
                <ThemedText
                  variant="labelSm"
                  color={colors.textSecondary}
                  style={styles.customSectionTitle}
                >
                  CUSTOM INTERVAL CONTROLS
                </ThemedText>

                {/* Start Date Selector */}
                <View style={styles.dateBlock}>
                  <ThemedText variant="labelSm" color={colors.textSecondary}>
                    Start Date:
                  </ThemedText>
                  <View style={styles.dateControlRow}>
                    <ThemedText variant="labelMd" style={{ fontWeight: '700', flex: 1 }}>
                      {formatDateDisplay(customStart)}
                    </ThemedText>
                    <View style={styles.stepperGroup}>
                      <Pressable
                        onPress={() => adjustStartDate(-1)}
                        style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                      >
                        <ThemedText variant="labelSm">-1d</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => adjustStartDate(1)}
                        style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                      >
                        <ThemedText variant="labelSm">+1d</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => adjustStartMonth(-1)}
                        style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                      >
                        <ThemedText variant="labelSm">-1m</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => adjustStartMonth(1)}
                        style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                      >
                        <ThemedText variant="labelSm">+1m</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* End Date Selector */}
                <View style={[styles.dateBlock, { marginTop: spacing.xs }]}>
                  <ThemedText variant="labelSm" color={colors.textSecondary}>
                    End Date:
                  </ThemedText>
                  <View style={styles.dateControlRow}>
                    <ThemedText variant="labelMd" style={{ fontWeight: '700', flex: 1 }}>
                      {formatDateDisplay(customEnd)}
                    </ThemedText>
                    <View style={styles.stepperGroup}>
                      <Pressable
                        onPress={() => adjustEndDate(-1)}
                        style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                      >
                        <ThemedText variant="labelSm">-1d</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => adjustEndDate(1)}
                        style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                      >
                        <ThemedText variant="labelSm">+1d</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => adjustEndMonth(-1)}
                        style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                      >
                        <ThemedText variant="labelSm">-1m</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => adjustEndMonth(1)}
                        style={[styles.stepBtn, { backgroundColor: colors.surface }]}
                      >
                        <ThemedText variant="labelSm">+1m</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            )}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.lg,
    maxHeight: '85%',
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
  optionsList: {
    marginBottom: spacing.md,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  presetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  customContainer: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  customSectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xxs,
  },
  dateBlock: {
    gap: 4,
  },
  dateControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  footer: {
    paddingTop: spacing.xs,
  },
});
