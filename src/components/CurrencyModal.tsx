import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CURRENCIES, CurrencyInfo } from '@/utils/currencies';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';

interface CurrencyModalProps {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}

export function CurrencyModal({
  visible,
  selectedCode,
  onSelect,
  onClose,
}: CurrencyModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState('');

  const filtered = CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText variant="headlineMd">Select Currency</ThemedText>
            <ThemedText variant="bodySm" color={colors.textSecondary}>
              Choose your primary display currency
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceContainerLow }]}
          >
            <Feather name="x" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search currency code or country..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Feather name="x-circle" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Currency List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = item.code === selectedCode;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item.code);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.currencyRow,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(0, 108, 73, 0.08)'
                      : pressed
                      ? colors.surfaceContainerLow
                      : 'transparent',
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={styles.leftInfo}>
                  <ThemedText style={{ fontSize: 24, marginRight: spacing.sm }}>
                    {item.flag}
                  </ThemedText>
                  <View>
                    <ThemedText variant="headlineSm" style={{ fontSize: 16 }}>
                      {item.code} ({item.symbol})
                    </ThemedText>
                    <ThemedText variant="bodySm" color={colors.textSecondary}>
                      {item.name}
                    </ThemedText>
                  </View>
                </View>

                {isSelected && (
                  <Feather name="check" size={18} color={colors.secondary} />
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
