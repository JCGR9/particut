/**
 * Advanced Config Manager - Gestor de configuraciones avanzadas
 * Maneja configuraciones complejas con presets, validación y persistencia
 */

export class AdvancedConfigManager {
  constructor() {
    this.config = this.getDefaultConfig();
    this.presets = this.getDefaultPresets();
    this.eventListeners = new Map();
    this.validationRules = this.getValidationRules();
    
    this.initializeEventHandlers();
    this.loadConfigFromStorage();
  }

  getDefaultConfig() {
    return {
      // Paper Configuration
      paper: {
        size: 'a4',
        customWidth: 210,
        customHeight: 297,
        orientation: 'portrait'
      },
      
      // Layout Configuration
      layout: {
        pagesPerSheet: 4,
        customRows: 2,
        customCols: 2,
        scalingMode: 'fit',
        scaleValue: 100,
        spacing: {
          horizontal: 5,
          vertical: 5
        }
      },
      
      // Margins Configuration
      margins: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      },
      
      // Cutting Marks Configuration
      cutMarks: {
        show: true,
        style: 'lines',
        length: 5,
        width: 0.5,
        color: '#000000'
      },
      
      // Binding Configuration
      binding: {
        type: 'none',
        addPageNumbers: false,
        addIndex: false,
        margin: 15
      },
      
      // Quality Configuration
      quality: {
        outputDPI: 300,
        optimizeForPrint: true,
        compressOutput: false,
        imageQuality: 0.9
      },
      
      // Processing Configuration
      processing: {
        autoDetectOrientation: true,
        autoDetectContent: true,
        removeMarginsAutomatically: true,
        enhanceContrast: false,
        sharpenText: false
      }
    };
  }

  getDefaultPresets() {
    return {
      'compact-book': {
        name: 'Cuaderno Compacto',
        description: 'Máximo aprovechamiento del papel para cuadernos de estudio',
        config: {
          layout: { pagesPerSheet: 8, scalingMode: 'fit', scaleValue: 85 },
          margins: { top: 5, right: 5, bottom: 5, left: 5 },
          cutMarks: { show: true, style: 'lines', length: 3 },
          quality: { outputDPI: 300, compressOutput: true }
        }
      },
      
      'professional-score': {
        name: 'Partitura Profesional',
        description: 'Calidad óptima para presentaciones y conciertos',
        config: {
          layout: { pagesPerSheet: 1, scalingMode: 'fit', scaleValue: 100 },
          margins: { top: 15, right: 15, bottom: 15, left: 15 },
          cutMarks: { show: true, style: 'corners', length: 8 },
          quality: { outputDPI: 600, optimizeForPrint: true }
        }
      },
      
      'practice-book': {
        name: 'Libro de Ensayo',
        description: 'Balance entre calidad y economía para ensayos',
        config: {
          layout: { pagesPerSheet: 4, scalingMode: 'fit', scaleValue: 95 },
          margins: { top: 8, right: 8, bottom: 8, left: 8 },
          cutMarks: { show: true, style: 'lines', length: 5 },
          binding: { addPageNumbers: true },
          quality: { outputDPI: 300, compressOutput: false }
        }
      },
      
      'choir-folder': {
        name: 'Carpeta de Coro',
        description: 'Optimizado para carpetas de coro con múltiples voces',
        config: {
          layout: { pagesPerSheet: 2, scalingMode: 'fit', scaleValue: 100 },
          margins: { top: 12, right: 12, bottom: 12, left: 20 },
          cutMarks: { show: true, style: 'corners', length: 6 },
          binding: { type: 'spiral', addPageNumbers: true, addIndex: true },
          quality: { outputDPI: 300, optimizeForPrint: true }
        }
      },
      
      'mobile-reading': {
        name: 'Lectura Móvil',
        description: 'Tamaño compacto para lectura en dispositivos móviles',
        config: {
          paper: { size: 'a5' },
          layout: { pagesPerSheet: 1, scalingMode: 'fill', scaleValue: 100 },
          margins: { top: 10, right: 10, bottom: 10, left: 10 },
          cutMarks: { show: false },
          quality: { outputDPI: 150, compressOutput: true }
        }
      }
    };
  }

  getValidationRules() {
    return {
      'paper.customWidth': { min: 50, max: 500, type: 'number' },
      'paper.customHeight': { min: 50, max: 500, type: 'number' },
      'layout.customRows': { min: 1, max: 5, type: 'integer' },
      'layout.customCols': { min: 1, max: 5, type: 'integer' },
      'layout.scaleValue': { min: 10, max: 200, type: 'number' },
      'layout.spacing.horizontal': { min: 0, max: 20, type: 'number' },
      'layout.spacing.vertical': { min: 0, max: 20, type: 'number' },
      'margins.top': { min: 0, max: 50, type: 'number' },
      'margins.right': { min: 0, max: 50, type: 'number' },
      'margins.bottom': { min: 0, max: 50, type: 'number' },
      'margins.left': { min: 0, max: 50, type: 'number' },
      'cutMarks.length': { min: 2, max: 10, type: 'number' },
      'cutMarks.width': { min: 0.1, max: 2, type: 'number' },
      'quality.outputDPI': { min: 72, max: 1200, type: 'integer' },
      'quality.imageQuality': { min: 0.1, max: 1.0, type: 'number' }
    };
  }

  initializeEventHandlers() {
    // Paper size and orientation
    this.setupControl('paper-size', 'change', (value) => {
      this.updateConfig('paper.size', value);
      this.toggleCustomSizeControls(value === 'custom');
    });

    this.setupControl('custom-width', 'input', (value) => {
      this.updateConfig('paper.customWidth', parseFloat(value));
    });

    this.setupControl('custom-height', 'input', (value) => {
      this.updateConfig('paper.customHeight', parseFloat(value));
    });

    this.setupControl('paper-orientation', 'change', (value) => {
      this.updateConfig('paper.orientation', value);
    });

    // Layout configuration
    this.setupControl('pages-per-sheet', 'change', (value) => {
      this.updateConfig('layout.pagesPerSheet', value === 'custom' ? 'custom' : parseInt(value));
      this.toggleCustomLayoutControls(value === 'custom');
    });

    this.setupControl('layout-rows', 'input', (value) => {
      this.updateConfig('layout.customRows', parseInt(value));
      this.updateLayoutPreview();
    });

    this.setupControl('layout-cols', 'input', (value) => {
      this.updateConfig('layout.customCols', parseInt(value));
      this.updateLayoutPreview();
    });

    this.setupControl('scaling-mode', 'change', (value) => {
      this.updateConfig('layout.scalingMode', value);
      this.toggleScalingValue(['percentage', 'fixed'].includes(value));
    });

    this.setupControl('scale-value', 'input', (value) => {
      const numValue = parseInt(value);
      this.updateConfig('layout.scaleValue', numValue);
      this.updateScaleDisplay(numValue);
    });

    // Margins configuration
    ['top', 'right', 'bottom', 'left'].forEach(side => {
      this.setupControl(`margin-${side}`, 'input', (value) => {
        this.updateConfig(`margins.${side}`, parseFloat(value));
      });
    });

    // Spacing configuration
    this.setupControl('spacing-h', 'input', (value) => {
      this.updateConfig('layout.spacing.horizontal', parseFloat(value));
    });

    this.setupControl('spacing-v', 'input', (value) => {
      this.updateConfig('layout.spacing.vertical', parseFloat(value));
    });

    // Cut marks configuration
    this.setupControl('show-cut-marks', 'change', (value, element) => {
      this.updateConfig('cutMarks.show', element.checked);
    });

    this.setupControl('cut-mark-style', 'change', (value) => {
      this.updateConfig('cutMarks.style', value);
    });

    this.setupControl('cut-mark-length', 'input', (value) => {
      this.updateConfig('cutMarks.length', parseFloat(value));
    });

    this.setupControl('cut-mark-width', 'input', (value) => {
      this.updateConfig('cutMarks.width', parseFloat(value));
    });

    // Binding configuration
    this.setupControl('binding-type', 'change', (value) => {
      this.updateConfig('binding.type', value);
    });

    this.setupControl('add-page-numbers', 'change', (value, element) => {
      this.updateConfig('binding.addPageNumbers', element.checked);
    });

    this.setupControl('add-index', 'change', (value, element) => {
      this.updateConfig('binding.addIndex', element.checked);
    });

    // Quality configuration
    this.setupControl('output-quality', 'change', (value) => {
      const dpiMap = {
        'draft': 72,
        'normal': 150,
        'high': 300,
        'print': 600
      };
      this.updateConfig('quality.outputDPI', dpiMap[value] || 300);
    });

    this.setupControl('optimize-for-print', 'change', (value, element) => {
      this.updateConfig('quality.optimizeForPrint', element.checked);
    });

    this.setupControl('compress-output', 'change', (value, element) => {
      this.updateConfig('quality.compressOutput', element.checked);
    });

    // Action buttons
    this.setupButton('save-config-btn', () => this.saveConfigDialog());
    this.setupButton('load-config-btn', () => this.loadConfigDialog());
    this.setupButton('preview-config-btn', () => this.previewConfiguration());
  }

  setupControl(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, (e) => {
        try {
          handler(e.target.value, e.target);
        } catch (error) {
          console.error(`Error in control ${id}:`, error);
        }
      });
    }
  }

  setupButton(id, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', handler);
    }
  }

  updateConfig(path, value) {
    // Validate the value
    if (!this.validateConfigValue(path, value)) {
      return false;
    }

    // Update the config object
    this.setNestedValue(this.config, path, value);
    
    // Save to localStorage
    this.saveConfigToStorage();
    
    // Emit change event
    this.emit('configChanged', { path, value, config: this.config });
    
    return true;
  }

  validateConfigValue(path, value) {
    const rule = this.validationRules[path];
    if (!rule) return true;

    // Type validation
    if (rule.type === 'integer' && !Number.isInteger(value)) {
      this.showValidationError(path, 'Debe ser un número entero');
      return false;
    }

    if (rule.type === 'number' && typeof value !== 'number') {
      this.showValidationError(path, 'Debe ser un número válido');
      return false;
    }

    // Range validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        this.showValidationError(path, `Valor mínimo: ${rule.min}`);
        return false;
      }
      
      if (rule.max !== undefined && value > rule.max) {
        this.showValidationError(path, `Valor máximo: ${rule.max}`);
        return false;
      }
    }

    return true;
  }

  showValidationError(path, message) {
    // Show validation error (implement notification system)
    console.warn(`Validation error for ${path}: ${message}`);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : undefined, obj);
  }

  // UI Update Methods
  toggleCustomSizeControls(show) {
    const group = document.getElementById('custom-size-group');
    if (group) {
      group.style.display = show ? 'block' : 'none';
    }
  }

  toggleCustomLayoutControls(show) {
    const group = document.getElementById('custom-layout-group');
    if (group) {
      group.style.display = show ? 'block' : 'none';
    }
  }

  toggleScalingValue(show) {
    const group = document.getElementById('scaling-value-group');
    if (group) {
      group.style.display = show ? 'block' : 'none';
    }
  }

  updateScaleDisplay(value) {
    const display = document.getElementById('scale-display');
    if (display) {
      display.textContent = `${value}%`;
    }
  }

  updateLayoutPreview() {
    const rows = this.config.layout.customRows;
    const cols = this.config.layout.customCols;
    
    this.emit('layoutChanged', { 
      rows, 
      cols, 
      total: rows * cols,
      config: this.config 
    });
  }

  // Preset Management
  applyPreset(presetId) {
    const preset = this.presets[presetId];
    if (!preset) {
      console.error(`Preset ${presetId} not found`);
      return false;
    }

    // Merge preset config with current config
    this.config = this.deepMerge(this.config, preset.config);
    
    // Update UI controls
    this.updateUIFromConfig();
    
    // Save to storage
    this.saveConfigToStorage();
    
    // Emit event
    this.emit('presetApplied', { presetId, preset, config: this.config });
    
    return true;
  }

  savePreset(name, description = '') {
    const presetId = this.generatePresetId(name);
    
    this.presets[presetId] = {
      name,
      description,
      config: this.deepClone(this.config),
      created: new Date().toISOString()
    };
    
    this.savePresetsToStorage();
    this.emit('presetSaved', { presetId, name, description });
    
    return presetId;
  }

  deletePreset(presetId) {
    if (this.presets[presetId]) {
      delete this.presets[presetId];
      this.savePresetsToStorage();
      this.emit('presetDeleted', { presetId });
      return true;
    }
    return false;
  }

  getPresets() {
    return { ...this.presets };
  }

  generatePresetId(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  // Configuration Persistence
  saveConfigToStorage() {
    try {
      localStorage.setItem('particut-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving config to storage:', error);
    }
  }

  loadConfigFromStorage() {
    try {
      const stored = localStorage.getItem('particut-config');
      if (stored) {
        const loadedConfig = JSON.parse(stored);
        this.config = this.deepMerge(this.getDefaultConfig(), loadedConfig);
        this.updateUIFromConfig();
      }
    } catch (error) {
      console.error('Error loading config from storage:', error);
    }
  }

  savePresetsToStorage() {
    try {
      localStorage.setItem('particut-presets', JSON.stringify(this.presets));
    } catch (error) {
      console.error('Error saving presets to storage:', error);
    }
  }

  loadPresetsFromStorage() {
    try {
      const stored = localStorage.getItem('particut-presets');
      if (stored) {
        const loadedPresets = JSON.parse(stored);
        this.presets = this.deepMerge(this.getDefaultPresets(), loadedPresets);
      }
    } catch (error) {
      console.error('Error loading presets from storage:', error);
    }
  }

  // Configuration Import/Export
  exportConfig() {
    const exportData = {
      config: this.config,
      presets: this.presets,
      version: '1.0.0',
      exported: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `particut-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importConfig(file) {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (importData.config) {
        this.config = this.deepMerge(this.getDefaultConfig(), importData.config);
        this.updateUIFromConfig();
        this.saveConfigToStorage();
      }
      
      if (importData.presets) {
        this.presets = this.deepMerge(this.getDefaultPresets(), importData.presets);
        this.savePresetsToStorage();
      }
      
      this.emit('configImported', { importData });
      return true;
      
    } catch (error) {
      console.error('Error importing config:', error);
      this.emit('configImportError', { error });
      return false;
    }
  }

  // UI Dialog Methods
  async saveConfigDialog() {
    const name = prompt('Nombre del preset:');
    if (name) {
      const description = prompt('Descripción (opcional):') || '';
      const presetId = this.savePreset(name, description);
      alert(`Preset "${name}" guardado exitosamente`);
      return presetId;
    }
  }

  async loadConfigDialog() {
    // Create a simple dialog for preset selection
    const presets = Object.entries(this.presets);
    if (presets.length === 0) {
      alert('No hay presets guardados');
      return;
    }
    
    const presetList = presets.map(([id, preset], index) => 
      `${index + 1}. ${preset.name} - ${preset.description}`
    ).join('\n');
    
    const selection = prompt(`Selecciona un preset:\n${presetList}\n\nIngresa el número:`);
    const index = parseInt(selection) - 1;
    
    if (index >= 0 && index < presets.length) {
      const [presetId] = presets[index];
      this.applyPreset(presetId);
      alert(`Preset "${this.presets[presetId].name}" aplicado`);
    }
  }

  previewConfiguration() {
    const summary = this.generateConfigSummary();
    alert(`Vista previa de configuración:\n\n${summary}`);
  }

  generateConfigSummary() {
    const { paper, layout, quality, cutMarks } = this.config;
    
    return `
Papel: ${paper.size.toUpperCase()} ${paper.orientation}
Layout: ${layout.pagesPerSheet} partituras por hoja
Escala: ${layout.scaleValue}% (${layout.scalingMode})
Márgenes: ${this.config.margins.top}mm superior
Marcas de corte: ${cutMarks.show ? 'Sí' : 'No'}
Calidad: ${quality.outputDPI} DPI
    `.trim();
  }

  updateUIFromConfig() {
    // Update all UI controls from current config
    const controls = [
      ['paper-size', 'paper.size'],
      ['custom-width', 'paper.customWidth'],
      ['custom-height', 'paper.customHeight'],
      ['paper-orientation', 'paper.orientation'],
      ['pages-per-sheet', 'layout.pagesPerSheet'],
      ['layout-rows', 'layout.customRows'],
      ['layout-cols', 'layout.customCols'],
      ['scaling-mode', 'layout.scalingMode'],
      ['scale-value', 'layout.scaleValue'],
      ['margin-top', 'margins.top'],
      ['margin-right', 'margins.right'],
      ['margin-bottom', 'margins.bottom'],
      ['margin-left', 'margins.left'],
      ['spacing-h', 'layout.spacing.horizontal'],
      ['spacing-v', 'layout.spacing.vertical'],
      ['cut-mark-style', 'cutMarks.style'],
      ['cut-mark-length', 'cutMarks.length'],
      ['cut-mark-width', 'cutMarks.width'],
      ['binding-type', 'binding.type']
    ];
    
    controls.forEach(([elementId, configPath]) => {
      const element = document.getElementById(elementId);
      const value = this.getNestedValue(this.config, configPath);
      
      if (element && value !== undefined) {
        element.value = value;
      }
    });
    
    // Update checkboxes
    const checkboxes = [
      ['show-cut-marks', 'cutMarks.show'],
      ['add-page-numbers', 'binding.addPageNumbers'],
      ['add-index', 'binding.addIndex'],
      ['optimize-for-print', 'quality.optimizeForPrint'],
      ['compress-output', 'quality.compressOutput']
    ];
    
    checkboxes.forEach(([elementId, configPath]) => {
      const element = document.getElementById(elementId);
      const value = this.getNestedValue(this.config, configPath);
      
      if (element && value !== undefined) {
        element.checked = value;
      }
    });
    
    // Update conditional displays
    this.toggleCustomSizeControls(this.config.paper.size === 'custom');
    this.toggleCustomLayoutControls(this.config.layout.pagesPerSheet === 'custom');
    this.toggleScalingValue(['percentage', 'fixed'].includes(this.config.layout.scalingMode));
    this.updateScaleDisplay(this.config.layout.scaleValue);
  }

  // Utility Methods
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Event System
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Public API
  getConfig() {
    return this.deepClone(this.config);
  }

  setConfig(newConfig) {
    this.config = this.deepMerge(this.getDefaultConfig(), newConfig);
    this.updateUIFromConfig();
    this.saveConfigToStorage();
    this.emit('configChanged', { config: this.config });
  }

  resetToDefaults() {
    this.config = this.getDefaultConfig();
    this.updateUIFromConfig();
    this.saveConfigToStorage();
    this.emit('configReset', { config: this.config });
  }

  getPaperDimensions() {
    const { paper } = this.config;
    const dimensions = {
      a4: { width: 210, height: 297 },
      letter: { width: 216, height: 279 },
      legal: { width: 216, height: 356 },
      a3: { width: 297, height: 420 },
      a5: { width: 148, height: 210 },
      custom: { width: paper.customWidth, height: paper.customHeight }
    };
    
    const { width, height } = dimensions[paper.size] || dimensions.a4;
    
    return paper.orientation === 'landscape' ? 
      { width: height, height: width } : 
      { width, height };
  }

  getLayoutDimensions() {
    const { layout } = this.config;
    const rows = layout.pagesPerSheet === 'custom' ? layout.customRows : 
                 layout.pagesPerSheet === 1 ? 1 :
                 layout.pagesPerSheet === 2 ? 1 :
                 layout.pagesPerSheet === 4 ? 2 :
                 layout.pagesPerSheet === 6 ? 2 :
                 layout.pagesPerSheet === 8 ? 2 : 2;
                 
    const cols = layout.pagesPerSheet === 'custom' ? layout.customCols :
                 layout.pagesPerSheet === 1 ? 1 :
                 layout.pagesPerSheet === 2 ? 2 :
                 layout.pagesPerSheet === 4 ? 2 :
                 layout.pagesPerSheet === 6 ? 3 :
                 layout.pagesPerSheet === 8 ? 4 : 2;
    
    return { rows, cols, total: rows * cols };
  }
}
