import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';

export interface CategoryOption {
  id: string;
  name: string;
  iconName: string;
  iconSet: 'feather' | 'ionicons' | 'mci';
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'Food & Dining', name: 'Food & Dining', iconName: 'coffee', iconSet: 'feather' },
  { id: 'Shopping & Tech', name: 'Shopping', iconName: 'shopping-bag', iconSet: 'feather' },
  { id: 'Groceries', name: 'Groceries', iconName: 'shopping-cart', iconSet: 'feather' },
  { id: 'Transport', name: 'Transport', iconName: 'navigation', iconSet: 'feather' },
  { id: 'Bills', name: 'Bills', iconName: 'file-text', iconSet: 'feather' },
  { id: 'Entertainment', name: 'Entertainment', iconName: 'film', iconSet: 'feather' },
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
                  ? colors.primary
                  : isDark
                  ? colors.surfaceContainerLow
                  : colors.surface,
                borderColor: isSelected ? colors.primary : colors.border,
                transform: [{ scale: pressed ? 0.95 : 1 }],
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
                color={isSelected ? colors.onPrimary : colors.textSecondary}
              />
            </View>

            <ThemedText
              variant="labelSm"
              color={isSelected ? colors.onPrimary : colors.text}
              numberOfLines={1}
              style={{ fontWeight: isSelected ? '700' : '500' }}
            >
              {cat.name}
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
    borderWidth: 1,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
