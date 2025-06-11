import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettings } from '../hooks/useSettings';

// Define the navigation types locally to avoid import issues
type RootStackParamList = {
  Home: undefined;
  YouTube: undefined;
  Settings: undefined;
};

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, updateSettings, getAllPresets, applyPreset } = useSettings();

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      updateSettings({ [key]: !settings[key] });
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            updateSettings({
              showRecommendations: false,
              showSidebar: false,
              showComments: false,
              showRelatedVideos: false,
              showShorts: true, // Reset to default (enabled)
            });
            Alert.alert('Success', 'Settings have been reset to default.');
          },
        },
      ]
    );
  };

  const handlePresetSelect = (presetId: string) => {
    const presets = getAllPresets();
    const preset = presets.find(p => p.id === presetId);
    
    if (preset) {
      Alert.alert(
        `Apply ${preset.name}?`,
        preset.description,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Apply',
            onPress: async () => {
              const success = await applyPreset(presetId);
              if (success) {
                Alert.alert('Success', `${preset.name} has been applied!`);
              } else {
                Alert.alert('Error', 'Failed to apply preset');
              }
            },
          },
        ]
      );
    }
  };

  const settingsOptions = [
    {
      key: 'showRecommendations' as const,
      title: 'Show Recommendations',
      description: 'Display recommended videos on homepage and sidebar',
      icon: '📺',
    },
    {
      key: 'showSidebar' as const,
      title: 'Show Sidebar',
      description: 'Display the left navigation sidebar (desktop)',
      icon: '📋',
    },
    {
      key: 'showComments' as const,
      title: 'Show Comments',
      description: 'Display comments section under videos',
      icon: '💬',
    },
    {
      key: 'showRelatedVideos' as const,
      title: 'Show Related Videos',
      description: 'Display related videos and end screen suggestions',
      icon: '🔗',
    },
    {
      key: 'showShorts' as const,
      title: 'Show Shorts',
      description: 'Allow YouTube Shorts (short vertical videos)',
      icon: '📱',
      warning: !settings.showShorts ? 'Shorts will be redirected to regular video format' : undefined,
    },
  ];

  // Filter out family-safe preset from available presets
  const presets = getAllPresets().filter(preset => preset.id !== 'family-safe');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Presets Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <Text style={styles.sectionDescription}>
            Apply predefined configurations instantly
          </Text>
          <View style={styles.presetsGrid}>
            {presets.slice(0, 6).map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={styles.presetCard}
                onPress={() => handlePresetSelect(preset.id)}
              >
                <Text style={styles.presetIcon}>{preset.icon}</Text>
                <Text style={styles.presetName}>{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Visibility Controls Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Controls</Text>
          <Text style={styles.sectionDescription}>
            Choose what content to show or hide on YouTube
          </Text>
          {settingsOptions.map((option) => (
            <View key={option.key} style={styles.settingRow}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>{option.icon}</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{option.title}</Text>
                <Text style={styles.settingDescription}>{option.description}</Text>
                {option.warning && (
                  <Text style={styles.settingWarning}>{option.warning}</Text>
                )}
              </View>
              <Switch
                value={settings[option.key]}
                onValueChange={() => handleToggle(option.key)}
                trackColor={{ false: '#e0e0e0', true: '#FF0000' }}
                thumbColor={settings[option.key] ? '#fff' : '#f0f0f0'}
              />
            </View>
          ))}
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('YouTube')}
          >
            <Text style={styles.primaryButtonText}>Apply & Open YouTube</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleResetSettings}
          >
            <Text style={styles.secondaryButtonText}>Reset to Default</Text>
          </TouchableOpacity>
        </View>

        {/* Button Position Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Controls Info</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Draggable Settings Button:</Text> In YouTube, you can move the settings button (⚙️) by pressing and dragging it to any position on the screen for easy access.
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>Automatic Application:</Text> Settings are applied automatically. Simply navigate to YouTube to see your changes take effect.
            </Text>
          </View>
        </View>

        {/* Current Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Configuration</Text>
          <View style={styles.configPreview}>
            <Text style={styles.configText}>
              Mode: {settings.showRecommendations ? 'Full YouTube' : 'Restricted Mode'}
            </Text>
            <Text style={styles.configText}>
              Hidden Elements: {
                [
                  !settings.showRecommendations && 'Recommendations',
                  !settings.showSidebar && 'Sidebar',
                  !settings.showComments && 'Comments',
                  !settings.showRelatedVideos && 'Related Videos',
                  !settings.showShorts && 'Shorts',
                ].filter(Boolean).join(', ') || 'None'
              }
            </Text>
            {!settings.showShorts && (
              <Text style={styles.configWarning}>
                ⚠️ Shorts URLs will be redirected to regular video format
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  presetIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  presetName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  settingRow: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingWarning: {
    fontSize: 12,
    color: '#FF6B6B',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#FF0000',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
    color: '#333',
  },
  configPreview: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  configText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  configWarning: {
    fontSize: 14,
    color: '#FF6B6B',
    marginBottom: 8,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default SettingsScreen;