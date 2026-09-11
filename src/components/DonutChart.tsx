import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { CategorySummary } from '@/db/schema';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/formatters';
import { ThemedText } from './ThemedText';
import { spacing } from '@/theme/spacing';

interface DonutChartProps {
  categorySummaries: CategorySummary[];
  totalSpent: number;
  totalLimit?: number;
  currency?: string;
  size?: number;
}

export function DonutChart({
  categorySummaries,
  totalSpent,
  currency = 'USD',
  size = 220,
}: DonutChartProps) {
  const { colors, isDark } = useTheme();

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Filter only categories with spend > 0
  const activeCategories = categorySummaries.filter((c) => c.spent > 0);
  const total = activeCategories.reduce((acc, c) => acc + c.spent, 0);

  // Pre-calculate segments
  let cumulativeLength = 0;
  const segments = activeCategories.map((cat) => {
    const ratio = total > 0 ? cat.spent / total : 0;
    const length = ratio * circumference;
    const offset = -cumulativeLength;
    cumulativeLength += length;
    return {
      category: cat.category,
      color: cat.color,
      length,
      offset,
    };
  });

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Background Track */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={isDark ? colors.surfaceContainer : colors.surfaceContainerLow}
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Segments */}
            {segments.map((seg, i) => (
              <Circle
                key={seg.category + i}
                cx={center}
                cy={center}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${Math.max(0, seg.length - 2)} ${circumference}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="round"
                fill="transparent"
              />
            ))}
          </G>
        </Svg>

        {/* Center Typography Stat */}
        <View style={styles.innerLabel}>
          <ThemedText variant="labelSm" color={colors.textSecondary} style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Total Spent
          </ThemedText>
          <ThemedText variant="headlineMd" style={{ marginVertical: 2 }}>
            {formatCurrency(totalSpent, currency)}
          </ThemedText>
          <ThemedText variant="bodySm" color={colors.textTertiary}>
            {activeCategories.length} {activeCategories.length === 1 ? 'category' : 'categories'}
          </ThemedText>
        </View>
      </View>

      {/* Mini Legend */}
      <View style={styles.legendGrid}>
        {categorySummaries.slice(0, 4).map((cat) => (
          <View key={cat.category} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
            <ThemedText variant="bodySm" color={colors.textSecondary} numberOfLines={1}>
              {cat.category.split(' ')[0]} ({formatCurrency(cat.spent, currency)})
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: spacing.sm,
    width: '100%',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
