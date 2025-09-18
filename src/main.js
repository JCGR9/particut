// Particut Pro - Professional PDF Score Processing Tool
// Main Application Module

import './style.css';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { MultiFileManager } from './modules/multiFileManager.js';
import { InteractiveCropTool } from './modules/interactiveCropTool.js';
import { AdvancedConfigManager } from './modules/advancedConfigManager.js';
import { PDFProcessor } from './modules/pdfProcessor.js';
import { ImageProcessor } from './modules/imageProcessor.js';
import { LayoutManager } from './modules/layoutManager.js';
import { UIManager } from './modules/uiManager.js';
import { FileManager } from './modules/fileManager.js';
import { ConfigManager } from './modules/configManager.js';
import { globalErrorHandler } from './modules/errorHandler.js';
import { Utils } from './modules/utils.js';
import { PDFProcessor } from './modules/pdfProcessor.js';
import { ImageProcessor } from './modules/imageProcessor.js';
import { LayoutManager } from './modules/layoutManager.js';
import { UIManager } from './modules/uiManager.js';
import { FileManager } from './modules/fileManager.js';
import { ConfigManager } from './modules/configManager.js';
import { globalErrorHandler } from './modules/errorHandler.js';
import { Utils } from './modules/utils.js';

class ParticutApp {
  constructor() {
    // Enhanced file and page management
    this.files = [];
    this.processedPages = [];
    this.selectedPages = new Set();
    this.currentZoom = 1;
    this.currentLayoutPage = 0;
    this.totalLayoutPages = 0;
    this.viewMode = 'grid'; // 'grid', 'list', 'single'
    this.isProcessing = false;
    this.processingStats = {
      startTime: null,
      processedFiles: 0,
      totalFiles: 0,
      errors: []
    };

    // Initialize enhanced modules
    this.multiFileManager = new MultiFileManager();
    this.cropTool = new InteractiveCropTool();
    this.advancedConfig = new AdvancedConfigManager();
    
    // Initialize existing modules with enhanced config
    this.pdfProcessor = new PDFProcessor();
    this.imageProcessor = new ImageProcessor();
    this.layoutManager = new LayoutManager();
    this.uiManager = new UIManager();
    this.fileManager = new FileManager();
    this.configManager = new ConfigManager();
    
    this.init();
  }

  async init() {
    console.log('Initializing enhanced Particut application...');
    
    try {
      // Initialize PDF.js worker
      await this.pdfProcessor.init();
      
      // Initialize enhanced modules in sequence
      await this.multiFileManager.init();
      await this.cropTool.init();
      await this.advancedConfig.init();
      
      // Setup event listeners
      this.setupEventListeners();
      this.setupAdvancedEventListeners();
      
      // Initialize UI
      this.uiManager.init();
      
      console.log('Enhanced Particut initialized successfully');
    } catch (error) {
      console.error('Error initializing enhanced Particut:', error);
      this.showError('Error al inicializar la aplicación: ' + error.message);
    }
  }

  setupEventListeners() {
    // File upload events
    this.setupFileUploadEvents();
    
    // Configuration events
    this.setupConfigurationEvents();
    
    // Preview and processing events
    this.setupProcessingEvents();
    
    // Layout navigation events
    this.setupLayoutEvents();
  }

  setupAdvancedEventListeners() {
    // Multi-file manager events
    this.multiFileManager.on('filesLoaded', (files) => {
      this.handleMultipleFiles(files);
    });
    
    this.multiFileManager.on('fileSelected', (file) => {
      this.handleFileSelection(file);
    });
    
    this.multiFileManager.on('filesReordered', (files) => {
      this.handleFileReorder(files);
    });
    
    // Interactive crop tool events
    this.cropTool.on('cropChanged', (cropData) => {
      this.handleCropChange(cropData);
    });
    
    this.cropTool.on('presetSelected', (preset) => {
      this.handleCropPreset(preset);
    });
    
    // Advanced config events
    this.advancedConfig.on('configChanged', (config) => {
      this.handleAdvancedConfigChange(config);
    });
    
    this.advancedConfig.on('presetLoaded', (preset) => {
      this.handleConfigPreset(preset);
    });
    
    // Enhanced preview events
    this.setupEnhancedPreviewEvents();
  }

  setupFileUploadEvents() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    // Click to select files
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });

    // File input change
    fileInput.addEventListener('change', () => {
      this.handleFiles(fileInput.files);
    });
  }

  setupConfigurationEvents() {
    // Configuration inputs
    ['targetWidth', 'targetHeight', 'columns', 'rows', 'topMargin', 'bottomMargin'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('change', () => {
          this.configManager.updateConfig(id, input.value);
          this.updateLayoutPreview();
        });
      }
    });

    // Checkbox options
    ['autoRotate', 'cropMarks', 'autoDetect'].forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          this.configManager.updateConfig(id, checkbox.checked);
        });
      }
    });
  }

  setupProcessingEvents() {
    // Preview button
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.generatePreviews());
    }

    // Process button
    const processBtn = document.getElementById('processBtn');
    if (processBtn) {
      processBtn.addEventListener('click', () => this.processFiles());
    }

    // Zoom controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.adjustZoom(1.2));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.adjustZoom(0.8));
    if (resetZoomBtn) resetZoomBtn.addEventListener('click', () => this.resetZoom());
  }

  setupLayoutEvents() {
    // Layout navigation
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');

    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => this.navigateLayout(-1));
    }
    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => this.navigateLayout(1));
    }
  }

  async handleFiles(fileList) {
    try {
      const validFiles = this.fileManager.filterValidFiles(fileList);
      
      if (validFiles.length === 0) {
        this.uiManager.showError('No se encontraron archivos válidos. Solo se admiten PDF, JPG y PNG.');
        return;
      }

      this.files = validFiles;
      
      // Show files section
      this.uiManager.showSection('filesSection');
      this.uiManager.showSection('configSection');
      
      // Update file list display
      await this.displayFiles();
      
      // Update file counter
      document.getElementById('fileCount').textContent = this.files.length;
      
      this.uiManager.showSuccess(`Se cargaron ${this.files.length} archivos correctamente`);
      
      console.log(`Loaded ${this.files.length} files`);
    } catch (error) {
      globalErrorHandler.handleFileError('multiple files', error);
      this.uiManager.showError('Error al cargar los archivos: ' + error.message);
    }
  }

  async displayFiles() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    for (const [index, file] of this.files.entries()) {
      const fileItem = await this.createFileItem(file, index);
      fileList.appendChild(fileItem);
    }
  }

  async createFileItem(file, index) {
    const item = document.createElement('div');
    item.className = 'file-item fade-in';
    
    // File header
    const header = document.createElement('div');
    header.className = 'file-header';
    
    const icon = document.createElement('i');
    icon.className = file.type === 'application/pdf' ? 'fas fa-file-pdf file-icon' : 'fas fa-image file-icon';
    
    const info = document.createElement('div');
    info.className = 'file-info';
    
    const name = document.createElement('h4');
    name.textContent = file.name;
    
    const size = document.createElement('div');
    size.className = 'file-size';
    size.textContent = this.formatFileSize(file.size);
    
    info.appendChild(name);
    info.appendChild(size);
    header.appendChild(icon);
    header.appendChild(info);
    
    // File preview
    const preview = document.createElement('div');
    preview.className = 'file-preview';
    
    try {
      const previewElement = await this.generateFilePreview(file);
      preview.appendChild(previewElement);
    } catch (error) {
      preview.innerHTML = '<div style="height: 200px; display: flex; align-items: center; justify-content: center; color: #666;">Error al generar vista previa</div>';
    }
    
    // File actions
    const actions = document.createElement('div');
    actions.className = 'file-actions';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-secondary btn-sm';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    removeBtn.addEventListener('click', () => this.removeFile(index));
    
    actions.appendChild(removeBtn);
    
    item.appendChild(header);
    item.appendChild(preview);
    item.appendChild(actions);
    
    return item;
  }

  async generateFilePreview(file) {
    if (file.type === 'application/pdf') {
      return await this.pdfProcessor.generatePreview(file, 200);
    } else {
      return await this.imageProcessor.generatePreview(file, 200);
    }
  }

  removeFile(index) {
    this.files.splice(index, 1);
    this.displayFiles();
    document.getElementById('fileCount').textContent = this.files.length;
    
    if (this.files.length === 0) {
      this.uiManager.hideSection('filesSection');
      this.uiManager.hideSection('configSection');
      this.uiManager.hideSection('previewSection');
      this.uiManager.hideSection('layoutSection');
    }
  }

  async generatePreviews() {
    if (this.files.length === 0) {
      this.uiManager.showError('No hay archivos para procesar');
      return;
    }

    this.uiManager.showSection('previewSection');
    
    const previewGrid = document.getElementById('previewGrid');
    previewGrid.innerHTML = '';

    const config = this.configManager.getConfig();
    
    for (const file of this.files) {
      try {
        const previews = await this.generateDetailedPreviews(file, config);
        previews.forEach(preview => previewGrid.appendChild(preview));
      } catch (error) {
        console.error('Error generating preview for', file.name, error);
      }
    }
  }

  async generateDetailedPreviews(file, config) {
    const previews = [];
    
    if (file.type === 'application/pdf') {
      const pages = await this.pdfProcessor.getPages(file);
      for (let i = 0; i < Math.min(pages.length, 10); i++) { // Limit to first 10 pages
        const previewItem = await this.createPreviewItem(file, i, pages[i], config);
        previews.push(previewItem);
      }
    } else {
      const previewItem = await this.createPreviewItem(file, 0, null, config);
      previews.push(previewItem);
    }
    
    return previews;
  }

  async createPreviewItem(file, pageIndex, pageData, config) {
    const item = document.createElement('div');
    item.className = 'preview-item fade-in';
    
    // Title
    const title = document.createElement('h4');
    title.textContent = `${file.name}${file.type === 'application/pdf' ? ` - Página ${pageIndex + 1}` : ''}`;
    title.style.marginBottom = '1rem';
    
    // Canvas for preview
    const canvas = document.createElement('canvas');
    canvas.className = 'preview-canvas';
    
    try {
      if (file.type === 'application/pdf') {
        await this.pdfProcessor.renderPageToCanvas(pageData, canvas, 400, config);
      } else {
        await this.imageProcessor.renderToCanvas(file, canvas, 400, config);
      }
    } catch (error) {
      console.error('Error rendering preview:', error);
    }
    
    item.appendChild(title);
    item.appendChild(canvas);
    
    return item;
  }

  async processFiles() {
    if (this.files.length === 0) {
      this.uiManager.showError('No hay archivos para procesar');
      return;
    }

    // Show progress section
    this.uiManager.showSection('progressSection');
    this.uiManager.hideSection('resultsSection');
    
    const config = this.configManager.getConfig();
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    let processedCount = 0;
    const totalFiles = this.files.length;
    
    this.processedPages = [];
    
    try {
      for (const [index, file] of this.files.entries()) {
        progressText.textContent = `Procesando ${file.name}...`;
        
        try {
          let pages;
          if (file.type === 'application/pdf') {
            pages = await this.pdfProcessor.processFile(file, config);
          } else {
            pages = await this.imageProcessor.processFile(file, config);
          }
          
          this.processedPages.push(...pages);
          
          processedCount++;
          const progress = (processedCount / totalFiles) * 100;
          progressFill.style.width = `${progress}%`;
          
        } catch (fileError) {
          globalErrorHandler.handleFileError(file.name, fileError);
          this.uiManager.showWarning(`Error procesando ${file.name}: ${fileError.message}`);
          processedCount++; // Continue with other files
          const progress = (processedCount / totalFiles) * 100;
          progressFill.style.width = `${progress}%`;
        }
      }
      
      if (this.processedPages.length === 0) {
        throw new Error('No se pudieron procesar ninguno de los archivos');
      }
      
      progressText.textContent = 'Generando PDF final...';
      progressFill.style.width = '100%';
      
      // Generate final PDF
      const finalPDF = await this.layoutManager.generateFinalPDF(this.processedPages, config);
      
      // Show results
      this.showResults(finalPDF);
      
      this.uiManager.showSuccess(`Procesamiento completado: ${this.processedPages.length} partituras procesadas`);
      
    } catch (error) {
      globalErrorHandler.handleError({
        type: 'processing_error',
        message: 'Error durante el procesamiento: ' + error.message,
        originalError: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      this.uiManager.showError('Error durante el procesamiento: ' + error.message);
      this.uiManager.hideSection('progressSection');
    }
  }

  showResults(pdfBlob) {
    this.uiManager.hideSection('progressSection');
    this.uiManager.showSection('resultsSection');
    this.uiManager.showSection('layoutSection');
    
    // Update results stats
    document.getElementById('processedCount').textContent = this.processedPages.length;
    
    // Setup download
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = () => {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `partituras_procesadas_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    };
    
    // Generate layout preview
    this.updateLayoutPreview();
  }

  async updateLayoutPreview() {
    if (this.processedPages.length === 0) return;
    
    const config = this.configManager.getConfig();
    await this.layoutManager.generateLayoutPreview(this.processedPages, config, this.currentLayoutPage);
    
    // Update layout info
    const layouts = this.layoutManager.calculateLayouts(this.processedPages, config);
    this.totalLayoutPages = layouts.length;
    
    document.getElementById('layoutInfo').textContent = `Página ${this.currentLayoutPage + 1} de ${this.totalLayoutPages}`;
    
    // Update navigation buttons
    document.getElementById('prevPageBtn').disabled = this.currentLayoutPage === 0;
    document.getElementById('nextPageBtn').disabled = this.currentLayoutPage >= this.totalLayoutPages - 1;
  }

  navigateLayout(direction) {
    const newPage = this.currentLayoutPage + direction;
    if (newPage >= 0 && newPage < this.totalLayoutPages) {
      this.currentLayoutPage = newPage;
      this.updateLayoutPreview();
    }
  }

  adjustZoom(factor) {
    this.currentZoom *= factor;
    this.applyZoomToPreview();
  }

  resetZoom() {
    this.currentZoom = 1;
    this.applyZoomToPreview();
  }

  applyZoomToPreview() {
    const canvases = document.querySelectorAll('.preview-canvas');
    canvases.forEach(canvas => {
      canvas.style.transform = `scale(${this.currentZoom})`;
      canvas.style.transformOrigin = 'top left';
    });
  }

  formatFileSize(bytes) {
    return Utils.formatFileSize(bytes);
  }

  // Memory management
  clearCache() {
    // Clear processed pages
    this.processedPages = [];
    
    // Clear file previews
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    // Revoke object URLs
    this.files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  // Debug information
  getDebugInfo() {
    return {
      version: '1.0.0',
      files: this.files.length,
      processedPages: this.processedPages.length,
      config: this.configManager.getConfig(),
      errors: globalErrorHandler.getErrorStats(),
      memory: {
        usedJSHeapSize: performance.memory?.usedJSHeapSize,
        totalJSHeapSize: performance.memory?.totalJSHeapSize
      }
    };
  }

  // Enhanced event handlers for new functionality
  async handleMultipleFiles(files) {
    console.log('Processing multiple files:', files.length);
    this.files = files;
    this.isProcessing = true;
    this.processingStats = {
      startTime: Date.now(),
      processedFiles: 0,
      totalFiles: files.length,
      errors: []
    };
    
    // Process files in batch
    await this.processMultipleFiles(files);
  }

  async handleFileSelection(file) {
    // Update preview for selected file
    await this.updateFilePreview(file);
    
    // Update crop tool with file
    this.cropTool.setFile(file);
  }

  handleFileReorder(files) {
    this.files = files;
    this.updateLayoutPreview();
  }

  handleCropChange(cropData) {
    // Apply crop to current file
    if (this.currentFile) {
      this.currentFile.cropData = cropData;
      this.updateFilePreview(this.currentFile);
    }
  }

  handleCropPreset(preset) {
    console.log('Applying crop preset:', preset.name);
    // Apply preset to all selected files or current file
    this.applyCropPresetToFiles(preset);
  }

  handleAdvancedConfigChange(config) {
    // Update layout manager with new config
    this.layoutManager.updateConfig(config);
    this.updateLayoutPreview();
  }

  handleConfigPreset(preset) {
    console.log('Loading configuration preset:', preset.name);
    // Apply all preset settings
    this.applyConfigurationPreset(preset);
  }

  setupEnhancedPreviewEvents() {
    // Zoom controls
    const zoomSlider = document.getElementById('zoomSlider');
    const zoomValue = document.getElementById('zoomValue');
    
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        this.currentZoom = parseFloat(e.target.value);
        zoomValue.textContent = Math.round(this.currentZoom * 100) + '%';
        this.updatePreviewZoom();
      });
    }

    // View mode controls
    const viewModeButtons = document.querySelectorAll('.view-mode-btn');
    viewModeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.changeViewMode(e.target.dataset.mode);
      });
    });

    // Selection controls
    const selectAllBtn = document.getElementById('selectAllPages');
    const deselectAllBtn = document.getElementById('deselectAllPages');
    
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.selectAllPages());
    }
    
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => this.deselectAllPages());
    }
  }

  async processMultipleFiles(files) {
    const progressBar = document.getElementById('processingProgress');
    const progressText = document.getElementById('processingText');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        progressText.textContent = `Procesando ${file.name}...`;
        progressBar.style.width = `${(i / files.length) * 100}%`;
        
        await this.processFile(file);
        this.processingStats.processedFiles++;
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        this.processingStats.errors.push({
          file: file.name,
          error: error.message
        });
      }
    }
    
    this.isProcessing = false;
    progressBar.style.width = '100%';
    progressText.textContent = `Completado: ${this.processingStats.processedFiles}/${this.processingStats.totalFiles} archivos`;
    
    if (this.processingStats.errors.length > 0) {
      this.showProcessingErrors();
    }
    
    this.updateLayoutPreview();
  }

  async updateFilePreview(file) {
    const previewContainer = document.getElementById('multiFilePreview');
    const filePreviewElement = previewContainer.querySelector(`[data-file-id="${file.id}"]`);
    
    if (filePreviewElement) {
      // Update thumbnail if crop data changed
      if (file.cropData) {
        const thumbnail = await this.generateCroppedThumbnail(file);
        const img = filePreviewElement.querySelector('img');
        if (img) {
          img.src = thumbnail;
        }
      }
    }
  }

  async generateCroppedThumbnail(file) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Load original file data
    let imageData;
    if (file.type === 'application/pdf') {
      imageData = await this.pdfProcessor.getPageAsImage(file, 0);
    } else {
      imageData = await this.imageProcessor.loadImage(file);
    }
    
    // Apply crop if available
    if (file.cropData) {
      const { x, y, width, height } = file.cropData;
      canvas.width = 150;
      canvas.height = 200;
      
      ctx.drawImage(
        imageData,
        x, y, width, height,
        0, 0, canvas.width, canvas.height
      );
    } else {
      canvas.width = 150;
      canvas.height = 200;
      ctx.drawImage(imageData, 0, 0, canvas.width, canvas.height);
    }
    
    return canvas.toDataURL();
  }

  updatePreviewZoom() {
    const previewElements = document.querySelectorAll('.preview-item');
    previewElements.forEach(element => {
      element.style.transform = `scale(${this.currentZoom})`;
    });
  }

  changeViewMode(mode) {
    this.viewMode = mode;
    const previewContainer = document.getElementById('multiFilePreview');
    
    // Remove existing mode classes
    previewContainer.classList.remove('grid-view', 'list-view', 'single-view');
    
    // Add new mode class
    previewContainer.classList.add(`${mode}-view`);
    
    // Update active button
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  }

  selectAllPages() {
    this.processedPages.forEach((page, index) => {
      this.selectedPages.add(index);
    });
    this.updatePageSelection();
  }

  deselectAllPages() {
    this.selectedPages.clear();
    this.updatePageSelection();
  }

  updatePageSelection() {
    const pageElements = document.querySelectorAll('.page-item');
    pageElements.forEach((element, index) => {
      const checkbox = element.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = this.selectedPages.has(index);
        element.classList.toggle('selected', this.selectedPages.has(index));
      }
    });
    
    this.updateSelectionStats();
  }

  updateSelectionStats() {
    const selectedCount = this.selectedPages.size;
    const totalCount = this.processedPages.length;
    const statsElement = document.getElementById('selectionStats');
    
    if (statsElement) {
      statsElement.textContent = `${selectedCount} de ${totalCount} páginas seleccionadas`;
    }
  }

  showProcessingErrors() {
    const errorContainer = document.getElementById('processingErrors');
    if (errorContainer && this.processingStats.errors.length > 0) {
      errorContainer.innerHTML = '<h4>Errores durante el procesamiento:</h4>';
      
      const errorList = document.createElement('ul');
      this.processingStats.errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = `${error.file}: ${error.error}`;
        errorList.appendChild(li);
      });
      
      errorContainer.appendChild(errorList);
      errorContainer.style.display = 'block';
    }
  }

  applyCropPresetToFiles(preset) {
    const selectedFiles = this.getSelectedFiles();
    
    selectedFiles.forEach(file => {
      file.cropData = {
        ...preset.cropData,
        appliedPreset: preset.name
      };
    });
    
    // Update previews
    this.updateMultipleFilePreviews(selectedFiles);
  }

  getSelectedFiles() {
    return this.files.filter(file => file.selected);
  }

  async updateMultipleFilePreviews(files) {
    for (const file of files) {
      await this.updateFilePreview(file);
    }
  }

  applyConfigurationPreset(preset) {
    // Apply layout settings
    this.layoutManager.updateConfig(preset.layout);
    
    // Apply detection settings
    if (preset.detection) {
      this.pdfProcessor.updateDetectionConfig(preset.detection);
    }
    
    // Apply UI settings
    if (preset.ui) {
      this.updateUISettings(preset.ui);
    }
    
    // Update all previews
    this.updateLayoutPreview();
  }

  updateUISettings(uiSettings) {
    if (uiSettings.theme) {
      document.body.className = `theme-${uiSettings.theme}`;
    }
    
    if (uiSettings.compactMode !== undefined) {
      document.body.classList.toggle('compact-mode', uiSettings.compactMode);
    }
  }

  // ...existing code...
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ParticutApp();
});