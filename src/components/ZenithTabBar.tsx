import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { ThemedText } from './ThemedText';

export function ZenithTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // ignore
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Route: quick-add (Elevated Center Button)
          if (route.name === 'quick-add') {
            return (
              <View key={route.key} style={styles.centerButtonContainer}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Quick Add Transaction"
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.centerButton,
                    {
                      backgroundColor: isDark ? colors.secondary : colors.primary,
                      transform: [{ scale: pressed ? 0.94 : 1 }],
                      boxShadow: isDark
                        ? '0 4px 16px rgba(16, 185, 129, 0.45)'
                        : '0 4px 16px rgba(15, 23, 42, 0.28)',
                    },
                  ]}
                >
                  <Feather
                    name="plus"
                    size={28}
                    color={isDark ? '#052E16' : '#FFFFFF'}
                  />
                </Pressable>
              </View>
            );
          }

          let iconName: any = 'home';
          let label = 'Dashboard';

          if (route.name === 'index') {
            iconName = 'home';
            label = 'Dashboard';
          } else if (route.name === 'transactions') {
            iconName = 'file-text';
            label = 'Transactions';
          } else if (route.name === 'analytics') {
            iconName = 'pie-chart';
            label = 'Analytics';
          }

          const activeColor = isDark ? colors.secondary : colors.primary;
          const inactiveColor = colors.textTertiary;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tabItem,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Feather
                name={iconName}
                size={22}
                color={isFocused ? activeColor : inactiveColor}
              />
              <ThemedText
                variant="labelSm"
                color={isFocused ? activeColor : inactiveColor}
                style={{
                  fontWeight: isFocused ? '700' : '500',
                  marginTop: 2,
                }}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.04)',
  },
  tabRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerButtonContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
});
