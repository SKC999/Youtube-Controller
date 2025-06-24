import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, signOut } = useAuth();
  const { 
    settings, 
    updateSettings, 
    getCurrentMode, 
    builtInPresets, 
    applyPreset,
    loading 
  } = useSettings();
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Track when settings are updated
  useEffect(() => {
    setLastSaved(new Date());
  }, [settings]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.replace('Auth');
          },
        },
      ]
    );
  };

  const handleSettingToggle = async (setting: keyof typeof settings, value: any) => {
    const success = await updateSettings({ [setting]: value });
    if (!success) {
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handlePresetApply = async (presetId: string) => {
    const preset = builtInPresets.find(p => p.id === presetId);
    if (!preset) return;

    Alert.alert(
      'Apply Preset',
      `Apply "${preset.name}"?\n\n${preset.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            const success = await applyPreset(presetId);
            if (success) {
              Alert.alert('Success', `"${preset.name}" has been applied!`);
            } else {
              Alert.alert('Error', 'Failed to apply preset. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openYouTubeWithSettings = () => {
    navigation.navigate('YouTube');
  };

  const currentMode = getCurrentMode();
  const isCustomMode = currentMode === 'Custom';

  // Status indicators
  const getStatusColor = (enabled: boolean) => enabled ? '#4CAF50' : '#f44336';
  const getStatusText = (enabled: boolean) => enabled ? 'ON' : 'OFF';

  const ControlCard = ({ 
    title, 
    subtitle, 
    children, 
    icon 
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    icon?: string;
  }) => (
    <View style={styles.controlCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          {icon && <Text style={styles.cardIcon}>{icon}</Text>}
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
          </View>
        </View>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );

  const ToggleRow = ({ 
    label, 
    value, 
    onToggle, 
    description,
    disabled = false 
  }: {
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    description?: string;
    disabled?: boolean;
  }) => (
    <View style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, disabled && styles.toggleLabelDisabled]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.toggleDescription, disabled && styles.toggleDescriptionDisabled]}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.toggleContainer}>
        <Text style={[
          styles.statusText, 
          { color: getStatusColor(value) },
          disabled && styles.statusTextDisabled
        ]}>
          {getStatusText(value)}
        </Text>
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={disabled || loading}
          trackColor={{ false: '#767577', true: '#FF0000' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
          style={styles.switch}
        />
      </View>
    </View>
  );

  const PresetButton = ({ preset }: { preset: any }) => {
    const isActive = currentMode === preset.name;
    
    return (
      <TouchableOpacity
        style={[styles.presetButton, isActive && styles.presetButtonActive]}
        onPress={() => handlePresetApply(preset.id)}
        disabled={loading}
      >
        <Text style={styles.presetIcon}>{preset.icon}</Text>
        <Text style={[styles.presetName, isActive && styles.presetNameActive]}>
          {preset.name}
        </Text>
        <Text style={[styles.presetDescription, isActive && styles.presetDescriptionActive]}>
          {preset.description}
        </Text>
        {isActive && (
          <View style={styles.activeIndicator}>
            <Text style={styles.activeIndicatorText}>ACTIVE</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF0000" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>YouTube Controller</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleSignOut}>
          <Text style={styles.profileButtonText}>
            {user?.name?.charAt(0) || 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Mode Status */}
        <ControlCard 
          title="Current Mode" 
          subtitle={`Active since ${lastSaved?.toLocaleTimeString() || 'startup'}`}
          icon="⚙️"
        >
          <View style={styles.currentModeContainer}>
            <View style={styles.currentModeInfo}>
              <Text style={styles.currentModeName}>{currentMode}</Text>
              {isCustomMode && (
                <Text style={styles.customModeNote}>
                  Custom configuration active
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.launchButton}
              onPress={openYouTubeWithSettings}
            >
              <Text style={styles.launchButtonText}>🚀 Launch YouTube</Text>
            </TouchableOpacity>
          </View>
        </ControlCard>

        {/* Quick Presets */}
        <ControlCard title="Quick Modes" icon="🎯">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.presetsContainer}>
              {builtInPresets.map((preset) => (
                <PresetButton key={preset.id} preset={preset} />
              ))}
            </View>
          </ScrollView>
        </ControlCard>

        {/* Content Control */}
        <ControlCard 
          title="Content Control" 
          subtitle="Toggle what content appears on YouTube"
          icon="📺"
        >
          <ToggleRow
            label="Home Recommendations"
            description="Show video recommendations on YouTube home page"
            value={settings.showRecommendations}
            onToggle={(value) => handleSettingToggle('showRecommendations', value)}
          />
          <ToggleRow
            label="Related Videos"
            description="Show related videos when watching"
            value={settings.showRelatedVideos}
            onToggle={(value) => handleSettingToggle('showRelatedVideos', value)}
          />
          <ToggleRow
            label="Comments"
            description="Show comments section"
            value={settings.showComments}
            onToggle={(value) => handleSettingToggle('showComments', value)}
          />
          <ToggleRow
            label="YouTube Shorts"
            description="Show Shorts content and tab"
            value={settings.showShorts}
            onToggle={(value) => handleSettingToggle('showShorts', value)}
          />
        </ControlCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Signed in as {user?.email}
          </Text>
          {lastSaved && (
            <Text style={styles.footerSubtext}>
              Settings last updated: {lastSaved.toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  controlCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardContent: {
    padding: 16,
  },
  currentModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentModeInfo: {
    flex: 1,
  },
  currentModeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  customModeNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  launchButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  launchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  presetsContainer: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  presetButton: {
    width: 140,
    marginRight: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  presetButtonActive: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
  presetIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  presetNameActive: {
    color: 'white',
  },
  presetDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  presetDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
    alignSelf: 'center',
  },
  activeIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleRowDisabled: {
    opacity: 0.5,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  toggleLabelDisabled: {
    color: '#999',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  toggleDescriptionDisabled: {
    color: '#ccc',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 24,
  },
  statusTextDisabled: {
    color: '#ccc',
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default HomeScreen;