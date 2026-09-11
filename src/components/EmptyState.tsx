import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  onLoadDemo?: () => void;
}

export function EmptyState({
  title = 'No transactions recorded',
  description = 'Start tracking your cashflow with the tactile quick-add keypad.',
  onAction,
  actionTitle = 'Log First Expense',
  onLoadDemo,
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
        <Feather name="inbox" size={32} color={colors.textSecondary} />
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

      <View style={styles.buttonGroup}>
        {onAction && (
          <Button
            title={actionTitle}
            size="md"
            variant="primary"
            onPress={onAction}
            icon={<Feather name="plus" size={16} color={colors.onPrimary} />}
          />
        )}

        {onLoadDemo && (
          <Button
            title="Load Sample Demo Data"
            size="sm"
            variant="outline"
            onPress={onLoadDemo}
            icon={<Feather name="download-cloud" size={14} color={colors.text} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 64,
    height: 64,
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
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  buttonGroup: {
    flexDirection: 'column',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 240,
  },
});
