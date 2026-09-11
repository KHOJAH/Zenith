import React from 'react';
import { View, StyleSheet } from 'react-native';
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
}

export function WeeklyBarChart({ weeklyBurn, currency = 'USD' }: WeeklyBarChartProps) {
  const { colors, isDark } = useTheme();

  const data = [
    { label: 'W1', value: weeklyBurn.week1, isEst: false, isActive: false },
    { label: 'W2', value: weeklyBurn.week2, isEst: false, isActive: false },
    { label: 'W3', value: weeklyBurn.week3, isEst: false, isActive: true },
    {
      label: 'W4 (est)',
      value: weeklyBurn.week4 > 0 ? weeklyBurn.week4 : (weeklyBurn.week1 + weeklyBurn.week2 + weeklyBurn.week3) / 3 || 0,
      isEst: true,
      isActive: false,
    },
  ];

  const maxVal = Math.max(...data.map((d) => d.value), 100);

  return (
    <View style={styles.container}>
      <View style={styles.chartRow}>
        {data.map((item, idx) => {
          const heightPercent = Math.min(100, Math.max(12, (item.value / maxVal) * 100));

          return (
            <View key={item.label} style={styles.barColumn}>
              <ThemedText
                variant="labelSm"
                color={item.isActive ? colors.primary : colors.textTertiary}
                style={styles.amountLabel}
              >
                {item.value > 0 ? `$${Math.round(item.value)}` : '$0'}
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
