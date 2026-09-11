import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';
import { Button } from './Button';

interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onAddCategory: (name: string, icon: string) => void;
}

const AVAILABLE_ICONS = [
  'tag',
  'book',
  'gift',
  'briefcase',
  'heart',
  'smile',
  'compass',
  'award',
  'tool',
  'truck',
  'shield',
  'smartphone',
  'tv',
  'camera',
  'music',
];

export function AddCategoryModal({
  visible,
  onClose,
  onAddCategory,
}: AddCategoryModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [categoryName, setCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tag');

  const handleSave = () => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, selectedIcon);
    setCategoryName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <ThemedText variant="headlineMd">New Category</ThemedText>
              <ThemedText variant="bodySm" color={colors.textSecondary}>
                Create a custom expense category
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            {/* Category Name Input */}
            <View style={styles.inputGroup}>
              <ThemedText variant="labelSm" color={colors.textSecondary} style={styles.label}>
                CATEGORY NAME
              </ThemedText>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Feather name="folder-plus" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Travel, Pet Care, Education"
                  placeholderTextColor={colors.textTertiary}
                  value={categoryName}
                  onChangeText={setCategoryName}
                  autoFocus
                />
              </View>
            </View>



            {/* Icon Picker */}
            <View style={styles.inputGroup}>
              <ThemedText variant="labelSm" color={colors.textSecondary} style={styles.label}>
                CATEGORY ICON
              </ThemedText>
              <View style={styles.iconsGrid}>
                {AVAILABLE_ICONS.map((icon) => {
                  const isSelected = selectedIcon === icon;
                  return (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(icon)}
                      style={({ pressed }) => [
                        styles.iconBtn,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? colors.secondary
                              : colors.primary
                            : colors.surfaceContainerLow,
                          transform: [{ scale: pressed ? 0.92 : 1 }],
                        },
                      ]}
                    >
                      <Feather
                        name={icon as any}
                        size={20}
                        color={
                          isSelected
                            ? isDark
                              ? '#052E16'
                              : colors.onPrimary
                            : colors.textSecondary
                        }
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.saveWrap}>
              <Button
                title="Create Category"
                size="lg"
                variant="primary"
                disabled={!categoryName.trim()}
                onPress={handleSave}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  content: {
    gap: spacing.md,
    paddingBottom: 24,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    letterSpacing: 0.8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveWrap: {
    marginTop: spacing.md,
  },
});
