import React from 'react';
import { View, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';
import { Button } from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionTitle?: string;
}

export function EmptyState({
  title = 'No transactions recorded',
  description = 'Start tracking your expenses with the tactile quick-add keypad.',
  onAction,
  actionTitle = 'Log First Expense',
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <Feather name="inbox" size={30} color={colors.textSecondary} />
      </View>

      <ThemedText variant="headlineSm" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText
        variant="bodySm"
        color={colors.textSecondary}
        style={styles.description}
      >
        {description}
      </ThemedText>

      {onAction && (
        <View style={styles.buttonGroup}>
          <Button
            title={actionTitle}
            size="md"
            variant="primary"
            onPress={onAction}
            icon={<Feather name="plus" size={16} color={colors.onPrimary} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  buttonGroup: {
    width: '100%',
    maxWidth: 220,
  },
});
