import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';

export interface CategoryOption {
  id: string;
  name: string;
  iconName: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'Food & Dining', name: 'Food & Dining', iconName: 'coffee' },
  { id: 'Shopping & Tech', name: 'Shopping & Tech', iconName: 'shopping-bag' },
  { id: 'Housing & Utilities', name: 'Housing & Utilities', iconName: 'home' },
  { id: 'Entertainment', name: 'Entertainment', iconName: 'film' },
  { id: 'Transport', name: 'Transport', iconName: 'navigation' },
  { id: 'Health & Wellness', name: 'Health & Wellness', iconName: 'activity' },
];

interface CategoryGridProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryGrid({
  selectedCategory,
  onSelectCategory,
}: CategoryGridProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.grid}>
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.id || selectedCategory === cat.name;

        return (
          <Pressable
            key={cat.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelectCategory(cat.name)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: isSelected
                  ? isDark
                    ? colors.secondary
                    : colors.primary
                  : isDark
                  ? colors.surfaceContainerLow
                  : colors.surface,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(0,0,0,0.3)'
                      : 'rgba(255,255,255,0.2)'
                    : colors.surfaceContainer,
                },
              ]}
            >
              <Feather
                name={cat.iconName as any}
                size={16}
                color={
                  isSelected
                    ? isDark
                      ? '#052E16'
                      : colors.onPrimary
                    : colors.textSecondary
                }
              />
            </View>

            <ThemedText
              variant="labelSm"
              color={
                isSelected
                  ? isDark
                    ? '#052E16'
                    : colors.onPrimary
                  : colors.text
              }
              numberOfLines={1}
              style={{ fontWeight: isSelected ? '700' : '500', flex: 1 }}
            >
              {cat.name.split(' ')[0]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  card: {
    width: '31.5%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
