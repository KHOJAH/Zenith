import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';

interface NumericKeypadProps {
  onPressKey: (val: string) => void;
  onBackspace: () => void;
}

export function NumericKeypad({ onPressKey, onBackspace }: NumericKeypadProps) {
  const { colors, isDark } = useTheme();

  const handlePress = (key: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    if (key === 'backspace') {
      onBackspace();
    } else {
      onPressKey(key);
    }
  };

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'backspace'],
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((key) => {
            const isBackspace = key === 'backspace';

            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={isBackspace ? 'Backspace' : `Number ${key}`}
                onPress={() => handlePress(key)}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: pressed
                      ? colors.surfaceContainer
                      : isDark
                      ? colors.surfaceContainerLow
                      : colors.surface,
                    borderColor: colors.border,
                    transform: [{ scale: pressed ? 0.94 : 1 }],
                  },
                ]}
              >
                {isBackspace ? (
                  <Feather name="delete" size={22} color={colors.textSecondary} />
                ) : (
                  <ThemedText
                    variant="headlineLg"
                    color={colors.text}
                    style={styles.keyText}
                  >
                    {key}
                  </ThemedText>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  key: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontWeight: '600',
  },
});
