import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/context/TransactionContext';
import {
  ZenithBackupPayload,
  validateBackupPayload,
  exportBackupFile,
  readBackupFile,
} from '@/utils/backup';

import { formatDateGroup } from '@/utils/formatters';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { ThemedText } from './ThemedText';
import { Card } from './Card';
import { Button } from './Button';

interface BackupRestoreModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabType = 'export' | 'import';

export function BackupRestoreModal({ visible, onClose }: BackupRestoreModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    transactions,
    categories,
    recurringBills,
    currency,
    salaryDay,
    exportBackup,
    importBackup,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState<TabType>('export');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Import state
  const [stagedPayload, setStagedPayload] = useState<ZenithBackupPayload | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string | null>(null);

  // Reset staged state when modal closes
  React.useEffect(() => {
    if (!visible) {
      setStagedPayload(null);
      setValidationError(null);
      setSourceLabel(null);
      setCopied(false);
    }
  }, [visible]);

  const handleTabChange = (tab: TabType) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setActiveTab(tab);
  };

  const handleExportFile = async () => {
    setIsExporting(true);
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      const payload = exportBackup();
      await exportBackupFile(payload);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      if (Platform.OS === 'web') {
        Alert.alert('Backup Exported', 'Zenith JSON backup file downloaded successfully.');
      }
    } catch (err: any) {
      console.error('Export backup failed:', err);
      Alert.alert('Export Failed', err?.message || 'Unable to export backup file.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyJSON = async () => {
    try {
      try {
        Haptics.selectionAsync();
      } catch {}

      const payload = exportBackup();
      const jsonStr = JSON.stringify(payload, null, 2);
      await Clipboard.setStringAsync(jsonStr);

      setCopied(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setTimeout(() => setCopied(false), 2500);
    } catch (err: any) {
      console.error('Copy JSON failed:', err);
    }
  };

  const handleProcessRawContent = (rawText: string, label: string) => {
    const result = validateBackupPayload(rawText);
    if (result.valid && result.payload) {
      setStagedPayload(result.payload);
      setValidationError(null);
      setSourceLabel(label);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } else {
      setStagedPayload(null);
      setValidationError(result.error || 'Invalid Zenith backup payload format.');
      setSourceLabel(label);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };

  const handleSelectFile = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const content = await readBackupFile(asset.uri, asset.file);

      handleProcessRawContent(content, asset.name || 'Selected File');
    } catch (err: any) {
      console.error('Select file error:', err);
      setValidationError(`Failed to load file: ${err?.message || 'unknown error'}`);
      setStagedPayload(null);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  };


  const handlePasteClipboard = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      const text = await Clipboard.getStringAsync();
      if (!text || !text.trim()) {
        setValidationError('Clipboard is empty. Copy valid Zenith backup JSON first.');
        setStagedPayload(null);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch {}
        return;
      }

      handleProcessRawContent(text, 'Clipboard Data');
    } catch (err: any) {
      setValidationError(`Failed to read clipboard: ${err?.message || 'unknown error'}`);
      setStagedPayload(null);
    }
  };

  const handlePerformRestore = async (mode: 'merge' | 'overwrite') => {
    if (!stagedPayload) return;

    if (mode === 'overwrite') {
      const promptTitle = 'Confirm Full Overwrite';
      const promptMsg =
        'This will permanently wipe all existing transactions, categories, and recurring bills, replacing them with the backup data. This action CANNOT be undone.';

      if (Platform.OS === 'web') {
        const confirmed =
          typeof window !== 'undefined' &&
          window.confirm(`⚠️ ${promptTitle}\n\n${promptMsg}\n\nDo you want to proceed?`);
        if (!confirmed) return;
        executeRestore(mode);
      } else {
        Alert.alert(promptTitle, promptMsg, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Overwrite All',
            style: 'destructive',
            onPress: () => executeRestore(mode),
          },
        ]);
      }
    } else {
      executeRestore(mode);
    }
  };

  const executeRestore = async (mode: 'merge' | 'overwrite') => {
    if (!stagedPayload) return;
    setIsProcessing(true);

    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}

      await importBackup(stagedPayload, mode);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      const successTitle = mode === 'overwrite' ? 'Database Overwritten' : 'Data Merged';
      const successMsg =
        mode === 'overwrite'
          ? `Successfully restored ${stagedPayload.metadata.transaction_count} transactions, ${stagedPayload.metadata.category_count} categories, and ${stagedPayload.metadata.recurring_bills_count} recurring bills.`
          : 'Backup records successfully merged. Existing duplicate records were preserved.';

      Alert.alert(successTitle, successMsg, [
        {
          text: 'Done',
          onPress: () => {
            setStagedPayload(null);
            setValidationError(null);
            setSourceLabel(null);
            onClose();
          },
        },
      ]);
    } catch (err: any) {
      console.error('Restore execution failed:', err);
      Alert.alert('Restore Failed', err?.message || 'Unable to restore data from backup.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } finally {
      setIsProcessing(false);
    }
  };

  const clearStagedPayload = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setStagedPayload(null);
    setValidationError(null);
    setSourceLabel(null);
  };

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
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText variant="headlineMd">Data Backup & Restore</ThemedText>
            <ThemedText variant="bodySm" color={colors.textSecondary}>
              Export JSON snapshots or restore your data
            </ThemedText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: colors.surfaceContainerLow,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
          >
            <Feather name="x" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'export' }}
            onPress={() => handleTabChange('export')}
            style={[
              styles.tabBtn,
              activeTab === 'export' && {
                backgroundColor: colors.surface,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
          >
            <Feather
              name="upload"
              size={15}
              color={activeTab === 'export' ? colors.primary : colors.textSecondary}
            />
            <ThemedText
              variant="labelMd"
              color={activeTab === 'export' ? colors.text : colors.textSecondary}
              style={{ fontWeight: activeTab === 'export' ? '700' : '500' }}
            >
              Export
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'import' }}
            onPress={() => handleTabChange('import')}
            style={[
              styles.tabBtn,
              activeTab === 'import' && {
                backgroundColor: colors.surface,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 3,
                elevation: 2,
              },
            ]}
          >
            <Feather
              name="download"
              size={15}
              color={activeTab === 'import' ? colors.primary : colors.textSecondary}
            />
            <ThemedText
              variant="labelMd"
              color={activeTab === 'import' ? colors.text : colors.textSecondary}
              style={{ fontWeight: activeTab === 'import' ? '700' : '500' }}
            >
              Import & Restore
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {activeTab === 'export' ? (
            /* ================= EXPORT TAB ================= */
            <View style={styles.tabSection}>
              {/* Snapshot Card */}
              <Card padding="md" bordered={false} style={styles.cardBox}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.headerLeft}>
                    <View
                      style={[
                        styles.iconWrap,
                        {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(5, 150, 105, 0.1)',
                        },
                      ]}
                    >
                      <Feather name="database" size={18} color={colors.secondary} />
                    </View>
                    <View>
                      <ThemedText variant="headlineSm">Current Ledger</ThemedText>
                      <ThemedText variant="bodySm" color={colors.textSecondary}>
                        Ready for backup
                      </ThemedText>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.versionPill,
                      { backgroundColor: colors.surfaceContainerLow },
                    ]}
                  >
                    <ThemedText variant="labelSm" color={colors.textSecondary}>
                      v1.0 · {currency}
                    </ThemedText>
                  </View>
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <View
                    style={[
                      styles.metricCard,
                      { backgroundColor: colors.surfaceContainerLow },
                    ]}
                  >
                    <ThemedText variant="headlineMd" style={{ fontWeight: '700' }}>
                      {transactions.length}
                    </ThemedText>
                    <ThemedText variant="labelSm" color={colors.textSecondary}>
                      Transactions
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.metricCard,
                      { backgroundColor: colors.surfaceContainerLow },
                    ]}
                  >
                    <ThemedText variant="headlineMd" style={{ fontWeight: '700' }}>
                      {categories.length}
                    </ThemedText>
                    <ThemedText variant="labelSm" color={colors.textSecondary}>
                      Categories
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.metricCard,
                      { backgroundColor: colors.surfaceContainerLow },
                    ]}
                  >
                    <ThemedText variant="headlineMd" style={{ fontWeight: '700' }}>
                      {recurringBills.length}
                    </ThemedText>
                    <ThemedText variant="labelSm" color={colors.textSecondary}>
                      Recurring
                    </ThemedText>
                  </View>
                </View>

                <ThemedText variant="bodySm" color={colors.textTertiary} style={{ marginTop: 4 }}>
                  Includes active currency ({currency}), salary anchor day ({salaryDay}th), and all
                  custom categories.
                </ThemedText>
              </Card>

              {/* Action Buttons */}
              <View style={styles.buttonStack}>
                <Button
                  title={isExporting ? 'Exporting...' : 'Export .json File'}
                  variant="primary"
                  size="lg"
                  loading={isExporting}
                  disabled={isExporting}
                  onPress={handleExportFile}
                  icon={<Feather name="share-2" size={18} color={colors.onPrimary} />}
                />

                <Button
                  title={copied ? 'JSON Copied to Clipboard!' : 'Copy JSON'}
                  variant="outline"
                  size="md"
                  onPress={handleCopyJSON}
                  icon={
                    <Feather
                      name={copied ? 'check' : 'copy'}
                      size={16}
                      color={copied ? colors.secondary : colors.text}
                    />
                  }
                />
              </View>

              {/* Info note */}
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border },
                ]}
              >
                <Feather name="shield" size={16} color={colors.secondary} />
                <ThemedText variant="bodySm" color={colors.textSecondary} style={{ flex: 1 }}>
                  Your data stays strictly local. The backup file is pure JSON and can be safely
                  stored on your drive or imported on any device running Zenith.
                </ThemedText>
              </View>
            </View>
          ) : (
            /* ================= IMPORT TAB ================= */
            <View style={styles.tabSection}>
              {/* Input Sources */}
              <View style={styles.importSourcesRow}>
                <Button
                  title="Select .json File"
                  variant="secondary"
                  size="md"
                  onPress={handleSelectFile}
                  style={{ flex: 1 }}
                  icon={<Feather name="file-text" size={16} color={colors.text} />}
                />
                <Button
                  title="Paste from Clipboard"
                  variant="secondary"
                  size="md"
                  onPress={handlePasteClipboard}
                  style={{ flex: 1 }}
                  icon={<Feather name="clipboard" size={16} color={colors.text} />}
                />
              </View>

              {/* Validation Error Banner */}
              {validationError && (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(239, 68, 68, 0.1)',
                      borderColor: colors.error,
                    },
                  ]}
                >
                  <Feather name="alert-circle" size={18} color={colors.error} />
                  <View style={{ flex: 1 }}>
                    <ThemedText
                      variant="labelMd"
                      color={colors.error}
                      style={{ fontWeight: '700' }}
                    >
                      Invalid Backup Payload
                    </ThemedText>
                    <ThemedText variant="bodySm" color={colors.error} style={{ marginTop: 2 }}>
                      {validationError}
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Live Payload Preview Card */}
              {stagedPayload ? (
                <Card padding="md" bordered={false} style={styles.previewCard}>
                  <View style={styles.previewHeaderRow}>
                    <View style={styles.headerLeft}>
                      <View
                        style={[
                          styles.iconWrap,
                          {
                            backgroundColor: isDark
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(5, 150, 105, 0.1)',
                          },
                        ]}
                      >
                        <Feather name="check-circle" size={18} color={colors.secondary} />
                      </View>
                      <View>
                        <ThemedText variant="headlineSm">Payload Verified</ThemedText>
                        <ThemedText variant="bodySm" color={colors.textSecondary}>
                          {sourceLabel || 'Backup File'}
                        </ThemedText>
                      </View>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear staged payload"
                      onPress={clearStagedPayload}
                      style={({ pressed }) => [
                        styles.clearBtn,
                        {
                          backgroundColor: colors.surfaceContainerLow,
                          transform: [{ scale: pressed ? 0.94 : 1 }],
                        },
                      ]}
                    >
                      <Feather name="trash-2" size={16} color={colors.error} />
                    </Pressable>
                  </View>

                  <View
                    style={[
                      styles.timestampRow,
                      { backgroundColor: colors.surfaceContainerLow },
                    ]}
                  >
                    <Feather name="clock" size={13} color={colors.textTertiary} />
                    <ThemedText variant="bodySm" color={colors.textSecondary}>
                      Exported on:{' '}
                      <ThemedText variant="bodySm" style={{ fontWeight: '600' }}>
                        {formatDateGroup(stagedPayload.exported_at)}
                      </ThemedText>
                    </ThemedText>
                  </View>

                  {/* Detected counts preview */}
                  <View style={styles.metricsGrid}>
                    <View
                      style={[
                        styles.metricCard,
                        { backgroundColor: colors.surfaceContainerLow },
                      ]}
                    >
                      <ThemedText variant="headlineMd" style={{ fontWeight: '700' }}>
                        {stagedPayload.metadata.transaction_count}
                      </ThemedText>
                      <ThemedText variant="labelSm" color={colors.textSecondary}>
                        Transactions
                      </ThemedText>
                    </View>

                    <View
                      style={[
                        styles.metricCard,
                        { backgroundColor: colors.surfaceContainerLow },
                      ]}
                    >
                      <ThemedText variant="headlineMd" style={{ fontWeight: '700' }}>
                        {stagedPayload.metadata.category_count}
                      </ThemedText>
                      <ThemedText variant="labelSm" color={colors.textSecondary}>
                        Categories
                      </ThemedText>
                    </View>

                    <View
                      style={[
                        styles.metricCard,
                        { backgroundColor: colors.surfaceContainerLow },
                      ]}
                    >
                      <ThemedText variant="headlineMd" style={{ fontWeight: '700' }}>
                        {stagedPayload.metadata.recurring_bills_count}
                      </ThemedText>
                      <ThemedText variant="labelSm" color={colors.textSecondary}>
                        Recurring
                      </ThemedText>
                    </View>
                  </View>

                  {/* Restore Action Buttons */}
                  <View style={styles.restoreActions}>
                    <View style={{ gap: 4 }}>
                      <Button
                        title={isProcessing ? 'Merging...' : 'Merge Data (Safe)'}
                        variant="primary"
                        size="lg"
                        loading={isProcessing}
                        disabled={isProcessing}
                        onPress={() => handlePerformRestore('merge')}
                        icon={<Feather name="plus-circle" size={18} color={colors.onPrimary} />}
                      />
                      <ThemedText
                        variant="labelSm"
                        color={colors.textTertiary}
                        style={{ textAlign: 'center', marginTop: 2 }}
                      >
                        Safely appends non-duplicate records. Existing data is preserved.
                      </ThemedText>
                    </View>

                    <View style={{ gap: 4, marginTop: spacing.xs }}>
                      <Button
                        title={isProcessing ? 'Overwriting...' : 'Full Overwrite (Clean)'}
                        variant="danger"
                        size="md"
                        disabled={isProcessing}
                        onPress={() => handlePerformRestore('overwrite')}
                        icon={<Feather name="alert-triangle" size={16} color={colors.error} />}
                      />
                      <ThemedText
                        variant="labelSm"
                        color={colors.error}
                        style={{ textAlign: 'center', marginTop: 2 }}
                      >
                        Destructive: Replaces all transactions and categories with this backup.
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              ) : (
                /* Empty / Awaiting Import state */
                <View
                  style={[
                    styles.awaitingBox,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrapLarge,
                      { backgroundColor: colors.surfaceContainerLow },
                    ]}
                  >
                    <Feather name="upload-cloud" size={28} color={colors.textTertiary} />
                  </View>

                  <ThemedText variant="headlineSm" style={{ textAlign: 'center', marginTop: 8 }}>
                    Select a Backup Payload
                  </ThemedText>
                  <ThemedText
                    variant="bodySm"
                    color={colors.textSecondary}
                    style={{ textAlign: 'center', maxWidth: 300, lineHeight: 20 }}
                  >
                    Select a exported .json file from your device storage or paste a Zenith JSON
                    payload directly from your clipboard.
                  </ThemedText>
                </View>
              )}
            </View>
          )}
        </ScrollView>
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
  tabBar: {
    flexDirection: 'row',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    gap: 6,
  },
  content: {
    gap: spacing.md,
    paddingBottom: 32,
  },
  tabSection: {
    gap: spacing.md,
  },
  cardBox: {
    gap: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapLarge: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metricCard: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  buttonStack: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  importSourcesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewCard: {
    gap: spacing.md,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  restoreActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  awaitingBox: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
