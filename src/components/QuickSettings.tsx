// src/components/QuickSettings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { useSettings } from '../hooks/useSettings';

interface QuickSettingsProps {
  visible: boolean;
  onClose: () => void;
  onApplyAndNavigate?: () => void;
}

const QuickSettings: React.FC<QuickSettingsProps> = ({ 
  visible, 
  onClose, 
  onApplyAndNavigate 
}) => {
  const { 
    settings, 
    updateSettings, 
    getCurrentMode, 
    builtInPresets, 
    applyPreset,
    loading 
  } = useSettings();
  
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingToggle = async (setting: keyof typeof settings, value: any) => {
    const success = await updateSettings({ [setting]: value });
    if (success) {
      setHasChanges(true);
    } else {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handlePresetApply = async (presetId: string) => {
    const preset = builtInPresets.find(p => p.id === presetId);
    if (!preset) return;

    const success = await applyPreset(presetId);
    if (success) {
      setHasChanges(true);
      Alert.alert('Applied', `"${preset.name}" preset applied!`);
    } else {
      Alert.alert('Error', 'Failed to apply preset');
    }
  };

  const handleApplyAndGo = () => {
    if (onApplyAndNavigate) {
      onApplyAndNavigate();
    }
    onClose();
  };

  const currentMode = getCurrentMode();

  const QuickToggle = ({ 
    label, 
    value, 
    onToggle, 
    icon 
  }: {
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    icon: string;
  }) => (
    <View style={styles.quickToggle}>
      <View style={styles.quickToggleInfo}>
        <Text style={styles.quickToggleIcon}>{icon}</Text>
        <Text style={styles.quickToggleLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={loading}
        trackColor={{ false: '#767577', true: '#FF0000' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
      />
    </View>
  );

  const PresetChip = ({ preset }: { preset: any }) => {
    const isActive = currentMode === preset.name;
    
    return (
      <TouchableOpacity
        style={[styles.presetChip, isActive && styles.presetChipActive]}
        onPress={() => handlePresetApply(preset.id)}
        disabled={loading}
      >
        <Text style={styles.presetChipIcon}>{preset.icon}</Text>
        <Text style={[styles.presetChipText, isActive && styles.presetChipTextActive]}>
          {preset.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Settings</Text>
          <View style={styles.headerRight}>
            {hasChanges && (
              <View style={styles.changesIndicator}>
                <Text style={styles.changesText}>●</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Current Mode */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Mode</Text>
            <View style={styles.currentModeContainer}>
              <Text style={styles.currentMode}>{currentMode}</Text>
              {hasChanges && (
                <Text style={styles.changesNote}>Changes applied</Text>
              )}
            </View>
          </View>

          {/* Quick Presets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Presets</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.presetsContainer}>
                {builtInPresets.slice(0, 4).map((preset) => (
                  <PresetChip key={preset.id} preset={preset} />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Quick Toggles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Controls</Text>
            <View style={styles.quickTogglesContainer}>
              <QuickToggle
                label="Recommendations"
                value={settings.showRecommendations}
                onToggle={(value) => handleSettingToggle('showRecommendations', value)}
                icon="🏠"
              />
              <QuickToggle
                label="Related Videos"
                value={settings.showRelatedVideos}
                onToggle={(value) => handleSettingToggle('showRelatedVideos', value)}
                icon="📺"
              />
              <QuickToggle
                label="Comments"
                value={settings.showComments}
                onToggle={(value) => handleSettingToggle('showComments', value)}
                icon="💬"
              />
              <QuickToggle
                label="YouTube Shorts"
                value={settings.showShorts}
                onToggle={(value) => handleSettingToggle('showShorts', value)}
                icon="📱"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {onApplyAndNavigate && (
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={handleApplyAndGo}
            >
              <Text style={styles.applyButtonText}>Apply & Open YouTube</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 34,
    alignItems: 'flex-end',
  },
  changesIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  changesText: {
    color: '#4CAF50',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  currentModeContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentMode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  changesNote: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  presetsContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  presetChipActive: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
  presetChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  presetChipTextActive: {
    color: 'white',
  },
  quickTogglesContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
  },
  quickToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  quickToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickToggleIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  quickToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  applyButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  doneButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default QuickSettings;