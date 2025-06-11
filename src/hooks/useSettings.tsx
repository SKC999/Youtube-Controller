import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  showRecommendations: boolean;
  showSidebar: boolean;
  showComments: boolean;
  showRelatedVideos: boolean;
  showShorts: boolean; // New setting for Shorts blocking
  customCSS: string;
  debugMode: boolean;
  autoInject: boolean;
  injectionDelay: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface SettingsPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: Partial<AppSettings>;
}

interface SettingsError {
  field: string;
  message: string;
}

interface SettingsValidationResult {
  isValid: boolean;
  errors: SettingsError[];
  warnings: string[];
}

const defaultSettings: AppSettings = {
  showRecommendations: false,
  showSidebar: false,
  showComments: false,
  showRelatedVideos: false,
  showShorts: true, // Shorts enabled by default
  customCSS: '',
  debugMode: false,
  autoInject: true,
  injectionDelay: 1000,
  theme: 'auto',
};

const STORAGE_KEY = 'youtube-controller-settings';
const PRESETS_STORAGE_KEY = 'youtube-controller-presets';

// Enhanced built-in presets with Shorts control (Family Safe removed)
const builtInPresets: SettingsPreset[] = [
  {
    id: 'focus',
    name: 'Focus Mode',
    description: 'Hide all distractions - just search and watch',
    icon: '🎯',
    settings: {
      showRecommendations: false,
      showSidebar: false,
      showComments: false,
      showRelatedVideos: false,
      showShorts: false, // Block Shorts in focus mode
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Mode',
    description: 'Hide recommendations but keep basic features',
    icon: '✨',
    settings: {
      showRecommendations: false,
      showSidebar: true,
      showComments: true,
      showRelatedVideos: false,
      showShorts: true, // Allow Shorts in minimal mode
    },
  },
  {
    id: 'normal',
    name: 'Normal Mode',
    description: 'Show all YouTube features',
    icon: '📺',
    settings: {
      showRecommendations: true,
      showSidebar: true,
      showComments: true,
      showRelatedVideos: true,
      showShorts: true,
    },
  },
  {
    id: 'comments-only',
    name: 'Comments Only',
    description: 'Hide everything except comments',
    icon: '💬',
    settings: {
      showRecommendations: false,
      showSidebar: false,
      showComments: true,
      showRelatedVideos: false,
      showShorts: false,
    },
  },
  {
    id: 'discovery',
    name: 'Discovery Mode',
    description: 'Show recommendations and related videos only',
    icon: '🔍',
    settings: {
      showRecommendations: true,
      showSidebar: false,
      showComments: false,
      showRelatedVideos: true,
      showShorts: true, // Include Shorts in discovery
    },
  },
  {
    id: 'no-shorts',
    name: 'No Shorts Mode',
    description: 'Hide all Shorts content while keeping other features',
    icon: '🚫',
    settings: {
      showRecommendations: true,
      showSidebar: true,
      showComments: true,
      showRelatedVideos: true,
      showShorts: false, // Specifically block Shorts
    },
  },
];

// CSS validation patterns (unchanged)
const dangerousCSS = [
  /javascript:/gi,
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  /@import/gi,
  /url\s*\(\s*["']?\s*javascript:/gi,
  /eval\s*\(/gi,
  /document\./gi,
  /window\./gi,
];

const validateSettings = (settings: Partial<AppSettings>): SettingsValidationResult => {
  const errors: SettingsError[] = [];
  const warnings: string[] = [];

  // Validate injectionDelay
  if (settings.injectionDelay !== undefined) {
    if (typeof settings.injectionDelay !== 'number') {
      errors.push({
        field: 'injectionDelay',
        message: 'Injection delay must be a number'
      });
    } else if (settings.injectionDelay < 0) {
      errors.push({
        field: 'injectionDelay',
        message: 'Injection delay cannot be negative'
      });
    } else if (settings.injectionDelay > 10000) {
      warnings.push('Injection delay over 10 seconds may cause poor user experience');
    }
  }

  // Validate customCSS
  if (settings.customCSS !== undefined) {
    if (typeof settings.customCSS !== 'string') {
      errors.push({
        field: 'customCSS',
        message: 'Custom CSS must be a string'
      });
    } else {
      // Check for dangerous patterns
      const css = settings.customCSS.toLowerCase();
      dangerousCSS.forEach(pattern => {
        if (pattern.test(css)) {
          errors.push({
            field: 'customCSS',
            message: `Potentially dangerous CSS detected: ${pattern.source}`
          });
        }
      });

      // Check CSS length
      if (settings.customCSS.length > 50000) {
        warnings.push('Custom CSS is very large and may impact performance');
      }

      // Basic CSS syntax validation
      const braceCount = (settings.customCSS.match(/\{/g) || []).length - 
                        (settings.customCSS.match(/\}/g) || []).length;
      if (braceCount !== 0) {
        warnings.push('Custom CSS may have unmatched braces');
      }
    }
  }

  // Validate theme
  if (settings.theme !== undefined) {
    const validThemes = ['light', 'dark', 'auto'];
    if (!validThemes.includes(settings.theme)) {
      errors.push({
        field: 'theme',
        message: `Theme must be one of: ${validThemes.join(', ')}`
      });
    }
  }

  // Validate boolean fields - Updated to include showShorts
  const booleanFields: (keyof AppSettings)[] = [
    'showRecommendations', 'showSidebar', 'showComments', 
    'showRelatedVideos', 'showShorts', 'debugMode', 'autoInject'
  ];

  booleanFields.forEach(field => {
    if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
      errors.push({
        field,
        message: `${field} must be a boolean value`
      });
    }
  });

  // Add specific warnings for Shorts blocking
  if (settings.showShorts === false) {
    warnings.push('Shorts blocking will redirect Shorts URLs to regular video format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const sanitizeCustomCSS = (css: string): string => {
  let sanitized = css;
  
  // Remove dangerous patterns
  dangerousCSS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '/* BLOCKED: potentially dangerous content */');
  });

  // Limit length
  if (sanitized.length > 50000) {
    sanitized = sanitized.substring(0, 50000) + '\n/* TRUNCATED: CSS too long */';
  }

  return sanitized;
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [customPresets, setCustomPresets] = useState<SettingsPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastValidation, setLastValidation] = useState<SettingsValidationResult | null>(null);

  useEffect(() => {
    loadSettings();
    loadCustomPresets();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        
        // Validate loaded settings
        const validation = validateSettings(parsedSettings);
        setLastValidation(validation);
        
        if (validation.isValid) {
          // Merge with defaults to handle new settings added in updates
          const mergedSettings = { ...defaultSettings, ...parsedSettings };
          setSettings(mergedSettings);
        } else {
          console.warn('Loaded settings failed validation:', validation.errors);
          setError('Loaded settings are invalid, using defaults');
          setSettings(defaultSettings);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError('Failed to load settings');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomPresets = async () => {
    try {
      const stored = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        const parsedPresets = JSON.parse(stored);
        setCustomPresets(parsedPresets);
      }
    } catch (error) {
      console.error('Failed to load custom presets:', error);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    try {
      setError(null);
      
      // Validate new settings
      const validation = validateSettings(newSettings);
      setLastValidation(validation);
      
      if (!validation.isValid) {
        setError(`Invalid settings: ${validation.errors.map(e => e.message).join(', ')}`);
        return false;
      }

      // Sanitize custom CSS if present
      const sanitizedSettings = { ...newSettings };
      if (sanitizedSettings.customCSS) {
        sanitizedSettings.customCSS = sanitizeCustomCSS(sanitizedSettings.customCSS);
      }

      const updated = { ...settings, ...sanitizedSettings };
      setSettings(updated);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Settings warnings:', validation.warnings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
      
      // Revert to previous settings if save fails
      await loadSettings();
      return false;
    }
  }, [settings]);

  const resetSettings = useCallback(async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setSettings(defaultSettings);
      setError(null);
      setLastValidation(null);
      return true;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setError('Failed to reset settings');
      return false;
    }
  }, []);

  const exportSettings = useCallback((): string => {
    return JSON.stringify({
      settings,
      customPresets,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }, [settings, customPresets]);

  const importSettings = useCallback(async (settingsJson: string): Promise<boolean> => {
    try {
      setError(null);
      
      const importedData = JSON.parse(settingsJson);
      
      // Validate structure
      if (!importedData.settings) {
        setError('Invalid import file: missing settings');
        return false;
      }
      
      // Validate settings
      const validation = validateSettings(importedData.settings);
      setLastValidation(validation);
      
      if (!validation.isValid) {
        setError(`Invalid imported settings: ${validation.errors.map(e => e.message).join(', ')}`);
        return false;
      }
      
      // Import settings
      const success = await updateSettings(importedData.settings);
      if (!success) return false;
      
      // Import custom presets if available
      if (importedData.customPresets && Array.isArray(importedData.customPresets)) {
        await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(importedData.customPresets));
        setCustomPresets(importedData.customPresets);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      setError('Failed to import settings: invalid format');
      return false;
    }
  }, [updateSettings]);

  const applyPreset = useCallback(async (presetId: string): Promise<boolean> => {
    const preset = [...builtInPresets, ...customPresets].find(p => p.id === presetId);
    if (!preset) {
      setError(`Preset not found: ${presetId}`);
      return false;
    }
    
    return await updateSettings(preset.settings);
  }, [customPresets, updateSettings]);

  const saveAsPreset = useCallback(async (
    name: string, 
    description: string, 
    icon: string = '⚙️'
  ): Promise<boolean> => {
    try {
      const newPreset: SettingsPreset = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        icon,
        settings: { ...settings }
      };
      
      if (!newPreset.name) {
        setError('Preset name is required');
        return false;
      }
      
      const updatedPresets = [...customPresets, newPreset];
      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
      setCustomPresets(updatedPresets);
      
      return true;
    } catch (error) {
      console.error('Failed to save preset:', error);
      setError('Failed to save preset');
      return false;
    }
  }, [settings, customPresets]);

  const deleteCustomPreset = useCallback(async (presetId: string): Promise<boolean> => {
    try {
      const updatedPresets = customPresets.filter(p => p.id !== presetId);
      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
      setCustomPresets(updatedPresets);
      return true;
    } catch (error) {
      console.error('Failed to delete preset:', error);
      setError('Failed to delete preset');
      return false;
    }
  }, [customPresets]);

  const validateCurrentSettings = useCallback((): SettingsValidationResult => {
    const validation = validateSettings(settings);
    setLastValidation(validation);
    return validation;
  }, [settings]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAllPresets = useCallback((): SettingsPreset[] => {
    return [...builtInPresets, ...customPresets];
  }, [customPresets]);

  // Get current mode based on settings
  const getCurrentMode = useCallback((): string => {
    const preset = builtInPresets.find(p => {
      const presetSettings = p.settings;
      return Object.keys(presetSettings).every(key => {
        const settingKey = key as keyof AppSettings;
        return settings[settingKey] === presetSettings[settingKey];
      });
    });
    
    return preset?.name || 'Custom';
  }, [settings]);

  return {
    // State
    settings,
    loading,
    error,
    lastValidation,
    
    // Actions
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    clearError,
    
    // Presets
    builtInPresets,
    customPresets,
    getAllPresets,
    applyPreset,
    saveAsPreset,
    deleteCustomPreset,
    
    // Utilities
    validateCurrentSettings,
    getCurrentMode,
    
    // Validation helpers
    validateSettings,
    sanitizeCustomCSS,
  };
};