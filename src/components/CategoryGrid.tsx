import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';

export interface CategoryItem {
  category: string;
  icon?: string;
}

interface CategoryGridProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddNewCategory?: () => void;
}

export function CategoryGrid({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddNewCategory,
}: CategoryGridProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.grid}>
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.category;
        const iconName = cat.icon || 'tag';

        return (
          <Pressable
            key={cat.category}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelectCategory(cat.category)}
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
                name={iconName as any}
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
              {cat.category.split(' ')[0]}
            </ThemedText>
          </Pressable>
        );
      })}

      {/* Add Custom Category Button */}
      {onAddNewCategory && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add Category"
          onPress={onAddNewCategory}
          style={({ pressed }) => [
            styles.card,
            styles.addCard,
            {
              backgroundColor: colors.surfaceContainerLow,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.surfaceContainer }]}>
            <Feather name="plus" size={16} color={colors.secondary} />
          </View>
          <ThemedText
            variant="labelSm"
            color={colors.secondary}
            numberOfLines={1}
            style={{ fontWeight: '700' }}
          >
            + Custom
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  card: {
    width: '31.8%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs + 2,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  addCard: {
    borderStyle: 'dashed',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
