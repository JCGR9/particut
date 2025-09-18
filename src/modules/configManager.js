// Configuration Manager Module
// Handles application configuration, settings persistence, and validation

export class ConfigManager {
  constructor() {
    this.defaultConfig = {
      // Target dimensions in mm
      targetWidth: 120,
      targetHeight: 80,
      
      // Layout configuration
      columns: 2,
      rows: 3,
      
      // Margin settings in mm
      topMargin: 20,
      bottomMargin: 15,
      
      // Processing options
      autoRotate: true,
      cropMarks: true,
      autoDetect: true,
      
      // Advanced settings
      quality: 'high', // 'low', 'medium', 'high'
      dpi: 300,
      colorMode: 'rgb', // 'rgb', 'grayscale'
      compressionLevel: 0.9,
      
      // Layout spacing
      itemSpacing: 5, // mm between items
      pageMargin: 10, // mm from page edges
      
      // File processing
      maxFileSize: 50 * 1024 * 1024, // 50MB
      batchSize: 5,
      
      // UI preferences
      theme: 'light',
      language: 'es',
      showTooltips: true,
      autoSave: true
    };
    
    this.config = { ...this.defaultConfig };
    this.loadConfig();
  }

  getConfig() {
    return { ...this.config };
  }

  updateConfig(key, value) {
    if (key in this.defaultConfig) {
      const validatedValue = this.validateConfigValue(key, value);
      if (validatedValue !== null) {
        this.config[key] = validatedValue;
        this.saveConfig();
        this.notifyConfigChange(key, validatedValue);
        return true;
      }
    }
    return false;
  }

  updateMultipleConfig(updates) {
    const changes = {};
    let hasChanges = false;

    Object.entries(updates).forEach(([key, value]) => {
      if (key in this.defaultConfig) {
        const validatedValue = this.validateConfigValue(key, value);
        if (validatedValue !== null && this.config[key] !== validatedValue) {
          this.config[key] = validatedValue;
          changes[key] = validatedValue;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      this.saveConfig();
      Object.entries(changes).forEach(([key, value]) => {
        this.notifyConfigChange(key, value);
      });
    }

    return hasChanges;
  }

  resetConfig() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
    this.notifyConfigReset();
  }

  resetToDefaults(keys = null) {
    if (keys) {
      // Reset specific keys
      const keysArray = Array.isArray(keys) ? keys : [keys];
      keysArray.forEach(key => {
        if (key in this.defaultConfig) {
          this.config[key] = this.defaultConfig[key];
        }
      });
    } else {
      // Reset all
      this.config = { ...this.defaultConfig };
    }
    
    this.saveConfig();
    this.notifyConfigReset();
  }

  validateConfigValue(key, value) {
    const validators = {
      targetWidth: (v) => this.validateNumber(v, 10, 300),
      targetHeight: (v) => this.validateNumber(v, 10, 200),
      columns: (v) => this.validateInteger(v, 1, 6),
      rows: (v) => this.validateInteger(v, 1, 8),
      topMargin: (v) => this.validateNumber(v, 0, 100),
      bottomMargin: (v) => this.validateNumber(v, 0, 100),
      autoRotate: (v) => this.validateBoolean(v),
      cropMarks: (v) => this.validateBoolean(v),
      autoDetect: (v) => this.validateBoolean(v),
      quality: (v) => this.validateEnum(v, ['low', 'medium', 'high']),
      dpi: (v) => this.validateEnum(v, [150, 200, 300, 600]),
      colorMode: (v) => this.validateEnum(v, ['rgb', 'grayscale']),
      compressionLevel: (v) => this.validateNumber(v, 0.1, 1.0),
      itemSpacing: (v) => this.validateNumber(v, 0, 50),
      pageMargin: (v) => this.validateNumber(v, 0, 50),
      maxFileSize: (v) => this.validateNumber(v, 1024 * 1024, 500 * 1024 * 1024),
      batchSize: (v) => this.validateInteger(v, 1, 20),
      theme: (v) => this.validateEnum(v, ['light', 'dark']),
      language: (v) => this.validateEnum(v, ['es', 'en']),
      showTooltips: (v) => this.validateBoolean(v),
      autoSave: (v) => this.validateBoolean(v)
    };

    const validator = validators[key];
    return validator ? validator(value) : null;
  }

  validateNumber(value, min, max) {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return Math.min(max, Math.max(min, num));
  }

  validateInteger(value, min, max) {
    const num = parseInt(value);
    if (isNaN(num)) return null;
    return Math.min(max, Math.max(min, num));
  }

  validateBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }

  validateEnum(value, allowedValues) {
    return allowedValues.includes(value) ? value : null;
  }

  saveConfig() {
    try {
      localStorage.setItem('particut-config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save configuration:', error);
    }
  }

  loadConfig() {
    try {
      const savedConfig = localStorage.getItem('particut-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Merge with defaults to ensure all keys exist
        this.config = { ...this.defaultConfig, ...parsed };
        
        // Validate loaded config
        this.validateAndCleanConfig();
      }
    } catch (error) {
      console.warn('Failed to load configuration, using defaults:', error);
      this.config = { ...this.defaultConfig };
    }
  }

  validateAndCleanConfig() {
    const cleanedConfig = {};
    
    Object.entries(this.config).forEach(([key, value]) => {
      if (key in this.defaultConfig) {
        const validatedValue = this.validateConfigValue(key, value);
        cleanedConfig[key] = validatedValue !== null ? validatedValue : this.defaultConfig[key];
      }
    });
    
    // Add any missing default keys
    Object.entries(this.defaultConfig).forEach(([key, value]) => {
      if (!(key in cleanedConfig)) {
        cleanedConfig[key] = value;
      }
    });
    
    this.config = cleanedConfig;
  }

  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configString) {
    try {
      const importedConfig = JSON.parse(configString);
      const validatedConfig = {};
      
      Object.entries(importedConfig).forEach(([key, value]) => {
        if (key in this.defaultConfig) {
          const validatedValue = this.validateConfigValue(key, value);
          if (validatedValue !== null) {
            validatedConfig[key] = validatedValue;
          }
        }
      });
      
      this.config = { ...this.defaultConfig, ...validatedConfig };
      this.saveConfig();
      this.notifyConfigReset();
      
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  // Event system for configuration changes
  notifyConfigChange(key, value) {
    const event = new CustomEvent('config-changed', {
      detail: { key, value, config: this.getConfig() }
    });
    document.dispatchEvent(event);
  }

  notifyConfigReset() {
    const event = new CustomEvent('config-reset', {
      detail: { config: this.getConfig() }
    });
    document.dispatchEvent(event);
  }

  // Preset configurations
  getPresets() {
    return {
      'business-card': {
        targetWidth: 85,
        targetHeight: 55,
        columns: 2,
        rows: 5,
        name: 'Tarjetas de Visita'
      },
      'bookmark': {
        targetWidth: 50,
        targetHeight: 150,
        columns: 4,
        rows: 1,
        name: 'Marcapáginas'
      },
      'postcard': {
        targetWidth: 100,
        targetHeight: 150,
        columns: 2,
        rows: 1,
        name: 'Postales'
      },
      'label-small': {
        targetWidth: 63.5,
        targetHeight: 38.1,
        columns: 3,
        rows: 7,
        name: 'Etiquetas Pequeñas'
      },
      'score-standard': {
        targetWidth: 120,
        targetHeight: 80,
        columns: 2,
        rows: 3,
        name: 'Partituras Estándar'
      },
      'score-large': {
        targetWidth: 150,
        targetHeight: 100,
        columns: 1,
        rows: 2,
        name: 'Partituras Grandes'
      }
    };
  }

  applyPreset(presetName) {
    const presets = this.getPresets();
    const preset = presets[presetName];
    
    if (preset) {
      const updates = {};
      Object.entries(preset).forEach(([key, value]) => {
        if (key !== 'name' && key in this.defaultConfig) {
          updates[key] = value;
        }
      });
      
      return this.updateMultipleConfig(updates);
    }
    
    return false;
  }

  // Calculate derived values
  getCalculatedValues() {
    const config = this.getConfig();
    
    return {
      // A4 dimensions in mm
      a4Width: 210,
      a4Height: 297,
      
      // Available space after margins
      availableWidth: 210 - (2 * config.pageMargin),
      availableHeight: 297 - (2 * config.pageMargin),
      
      // Space needed for items including spacing
      totalItemWidth: config.columns * config.targetWidth + (config.columns - 1) * config.itemSpacing,
      totalItemHeight: config.rows * config.targetHeight + (config.rows - 1) * config.itemSpacing,
      
      // Items per page
      itemsPerPage: config.columns * config.rows,
      
      // Check if layout fits
      layoutFits: function() {
        return this.totalItemWidth <= this.availableWidth && this.totalItemHeight <= this.availableHeight;
      },
      
      // Efficiency calculation
      efficiency: function() {
        const totalItemArea = config.columns * config.rows * config.targetWidth * config.targetHeight;
        const totalPageArea = 210 * 297;
        return (totalItemArea / totalPageArea) * 100;
      }
    };
  }

  // Validation helpers
  validateLayout() {
    const calculated = this.getCalculatedValues();
    const issues = [];
    
    if (!calculated.layoutFits()) {
      issues.push('El layout no cabe en una página A4 con los márgenes actuales');
    }
    
    if (calculated.efficiency() < 30) {
      issues.push('La eficiencia del layout es muy baja (menos del 30%)');
    }
    
    if (this.config.targetWidth < 10 || this.config.targetHeight < 10) {
      issues.push('Las dimensiones del elemento son demasiado pequeñas');
    }
    
    if (this.config.targetWidth > 200 || this.config.targetHeight > 280) {
      issues.push('Las dimensiones del elemento son demasiado grandes para A4');
    }
    
    return {
      isValid: issues.length === 0,
      issues: issues,
      calculated: calculated
    };
  }

  // Auto-suggest optimal values
  suggestOptimalLayout(contentAspectRatio = 1.5) {
    const maxWidth = 190; // Leave some margin
    const maxHeight = 270; // Leave some margin
    
    // Try different column/row combinations
    const suggestions = [];
    
    for (let cols = 1; cols <= 4; cols++) {
      for (let rows = 1; rows <= 6; rows++) {
        const itemWidth = Math.floor((maxWidth - (cols - 1) * 5) / cols);
        const itemHeight = Math.floor((maxHeight - (rows - 1) * 5) / rows);
        
        // Adjust for aspect ratio
        const adjustedHeight = Math.min(itemHeight, itemWidth / contentAspectRatio);
        const adjustedWidth = Math.min(itemWidth, adjustedHeight * contentAspectRatio);
        
        if (adjustedWidth >= 20 && adjustedHeight >= 20) {
          const efficiency = (cols * rows * adjustedWidth * adjustedHeight) / (210 * 297) * 100;
          
          suggestions.push({
            columns: cols,
            rows: rows,
            targetWidth: Math.round(adjustedWidth),
            targetHeight: Math.round(adjustedHeight),
            itemsPerPage: cols * rows,
            efficiency: Math.round(efficiency * 10) / 10
          });
        }
      }
    }
    
    // Sort by efficiency
    return suggestions.sort((a, b) => b.efficiency - a.efficiency).slice(0, 5);
  }
}
