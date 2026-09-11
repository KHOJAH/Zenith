import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DateInterval } from '@/db/schema';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/formatters';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';

interface WeeklyBarChartProps {
  weeklyBurn: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
  currency?: string;
  dateInterval?: DateInterval;
}

export function WeeklyBarChart({ weeklyBurn, currency = 'USD', dateInterval }: WeeklyBarChartProps) {
  const { colors, isDark } = useTheme();

  const [nowMs] = useState(() => Date.now());
  let currentWeekIdx = 3;
  let isPastInterval = false;

  if (dateInterval) {
    const startMs = new Date(dateInterval.startDate).getTime();
    const end = new Date(dateInterval.endDate);
    end.setHours(23, 59, 59, 999);
    const endMs = end.getTime();

    if (nowMs > endMs) {
      // Historical interval completely in the past
      isPastInterval = true;
      currentWeekIdx = 3;
    } else if (nowMs < startMs) {
      // Future interval
      currentWeekIdx = -1;
    } else {
      // Active ongoing interval
      const progress = (nowMs - startMs) / Math.max(1, endMs - startMs);
      currentWeekIdx = Math.min(3, Math.floor(progress * 4));
    }
  } else {
    const currentDay = new Date(nowMs).getDate();
    currentWeekIdx = Math.min(3, Math.floor((currentDay - 1) / 7));
  }

  const rawValues = [weeklyBurn.week1, weeklyBurn.week2, weeklyBurn.week3, weeklyBurn.week4];
  const priorSum = rawValues.slice(0, Math.max(0, currentWeekIdx + 1)).reduce((a, b) => a + b, 0);
  const priorAvg = priorSum / Math.max(1, currentWeekIdx + 1);

  const data = rawValues.map((val, idx) => {
    const isFuture = !isPastInterval && idx > currentWeekIdx;
    const isEst = isFuture && val === 0 && priorAvg > 0;
    const finalVal = isEst ? Math.round(priorAvg) : val;
    return {
      label: isEst ? `W${idx + 1} (est)` : `W${idx + 1}`,
      value: finalVal,
      isEst,
      isActive: !isPastInterval && idx === currentWeekIdx,
    };
  });

  const maxVal = Math.max(...data.map((d) => d.value), 50);

  return (
    <View style={styles.container}>
      <View style={styles.chartRow}>
        {data.map((item) => {
          const heightPercent =
            maxVal > 0 && item.value > 0
              ? Math.min(100, Math.max(14, (item.value / maxVal) * 100))
              : 8;

          return (
            <View key={item.label} style={styles.barColumn}>
              <ThemedText
                variant="labelSm"
                color={item.isActive ? colors.primary : colors.textTertiary}
                style={styles.amountLabel}
              >
                {formatCurrency(Math.round(item.value), currency)}
              </ThemedText>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: item.isActive
                        ? isDark
                          ? colors.secondary
                          : colors.primary
                        : item.isEst
                        ? colors.surfaceContainer
                        : colors.surfaceContainerHigh,
                    },
                  ]}
                >
                  {item.isEst && (
                    <View
                      style={[
                        styles.projectedCapLine,
                        { backgroundColor: colors.secondary },
                      ]}
                    />
                  )}
                </View>
              </View>

              <ThemedText
                variant="bodySm"
                color={item.isActive ? colors.text : colors.textSecondary}
                style={{ fontWeight: item.isActive ? '700' : '400', marginTop: spacing.xs }}
              >
                {item.label}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: spacing.sm,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    gap: spacing.sm,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  amountLabel: {
    marginBottom: spacing.xs,
    fontSize: 10,
  },
  barTrack: {
    width: '100%',
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    maxWidth: 52,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  projectedCapLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
});
