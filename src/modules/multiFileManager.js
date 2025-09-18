/**
 * Multi-File Manager - Gestión avanzada de múltiples archivos
 * Maneja carga masiva, previsualización, selección y organización de archivos
 */

export class MultiFileManager {
  constructor() {
    this.files = new Map(); // Map<fileId, fileData>
    this.selectedFiles = new Set();
    this.currentFileId = null;
    this.sortOrder = 'name'; // 'name', 'date', 'size'
    this.sortDirection = 'asc';
    this.viewMode = 'grid'; // 'grid', 'list', 'single'
    this.thumbnailCache = new Map();
    this.eventListeners = new Map();
    
    this.initializeEventHandlers();
  }

  initializeEventHandlers() {
    // Drag and drop support
    this.setupDragAndDrop();
    
    // File input handlers
    this.setupFileInputs();
    
    // UI controls
    this.setupUIControls();
  }

  setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', this.handleDrop.bind(this), false);
  }

  setupFileInputs() {
    // Regular file input
    const fileInput = document.getElementById('file-input');
    const selectFilesBtn = document.getElementById('select-files-btn');
    
    if (fileInput && selectFilesBtn) {
      selectFilesBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
    }

    // Folder input
    const folderInput = document.getElementById('folder-input');
    const selectFolderBtn = document.getElementById('select-folder-btn');
    
    if (folderInput && selectFolderBtn) {
      selectFolderBtn.addEventListener('click', () => folderInput.click());
      folderInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
    }

    // Load examples button
    const loadExamplesBtn = document.getElementById('load-examples-btn');
    if (loadExamplesBtn) {
      loadExamplesBtn.addEventListener('click', () => this.loadExampleFiles());
    }

    // Clear all button
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => this.clearAllFiles());
    }
  }

  setupUIControls() {
    // Sorting controls
    document.getElementById('sort-name-btn')?.addEventListener('click', () => this.setSortOrder('name'));
    document.getElementById('sort-date-btn')?.addEventListener('click', () => this.setSortOrder('date'));
    document.getElementById('sort-size-btn')?.addEventListener('click', () => this.setSortOrder('size'));

    // View mode controls
    document.getElementById('grid-view-btn')?.addEventListener('click', () => this.setViewMode('grid'));
    document.getElementById('list-view-btn')?.addEventListener('click', () => this.setViewMode('list'));
    document.getElementById('single-view-btn')?.addEventListener('click', () => this.setViewMode('single'));

    // File navigation
    document.getElementById('prev-file-btn')?.addEventListener('click', () => this.navigateFile(-1));
    document.getElementById('next-file-btn')?.addEventListener('click', () => this.navigateFile(1));
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  async handleDrop(e) {
    const files = [...e.dataTransfer.files];
    await this.handleFileSelect(files);
  }

  async handleFileSelect(files) {
    if (!files || files.length === 0) return;

    const validFiles = this.filterValidFiles(files);
    if (validFiles.length === 0) {
      this.showNotification('No se encontraron archivos válidos', 'warning');
      return;
    }

    this.showNotification(`Cargando ${validFiles.length} archivo(s)...`, 'info');
    
    const loadedFiles = await this.loadFiles(validFiles);
    this.updateFileList();
    this.updateStats();
    
    this.showNotification(`${loadedFiles.length} archivo(s) cargado(s) exitosamente`, 'success');
  }

  filterValidFiles(files) {
    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    return [...files].filter(file => {
      const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      return validExtensions.includes(extension);
    });
  }

  async loadFiles(files) {
    const loadedFiles = [];
    const loadPromises = files.map(file => this.loadSingleFile(file));
    
    try {
      const results = await Promise.allSettled(loadPromises);
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          loadedFiles.push(result.value);
        } else {
          console.error(`Error loading file ${files[index].name}:`, result.reason);
        }
      });
    } catch (error) {
      console.error('Error loading files:', error);
    }

    return loadedFiles;
  }

  async loadSingleFile(file) {
    const fileId = this.generateFileId();
    const fileData = {
      id: fileId,
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      pages: [],
      thumbnail: null,
      isProcessed: false,
      metadata: {}
    };

    // Load file content based on type
    if (file.type === 'application/pdf') {
      await this.loadPDFFile(fileData);
    } else if (file.type.startsWith('image/')) {
      await this.loadImageFile(fileData);
    }

    this.files.set(fileId, fileData);
    
    // Set as current file if it's the first one
    if (this.files.size === 1) {
      this.currentFileId = fileId;
    }

    return fileData;
  }

  async loadPDFFile(fileData) {
    try {
      const arrayBuffer = await fileData.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      fileData.metadata.pageCount = pdf.numPages;
      fileData.metadata.pdfInfo = await pdf.getMetadata();

      // Load first page as thumbnail
      if (pdf.numPages > 0) {
        const page = await pdf.getPage(1);
        fileData.thumbnail = await this.renderPageToCanvas(page, 150, 200);
      }

      // Store PDF document for later processing
      fileData.pdfDocument = pdf;
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw error;
    }
  }

  async loadImageFile(fileData) {
    try {
      const img = new Image();
      const url = URL.createObjectURL(fileData.file);
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          fileData.metadata.width = img.naturalWidth;
          fileData.metadata.height = img.naturalHeight;
          fileData.metadata.pageCount = 1;
          
          // Create thumbnail
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const { width, height } = this.calculateThumbnailSize(img.naturalWidth, img.naturalHeight, 150, 200);
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          fileData.thumbnail = canvas;
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image'));
        };
        img.src = url;
      });
      
    } catch (error) {
      console.error('Error loading image:', error);
      throw error;
    }
  }

  async renderPageToCanvas(page, maxWidth, maxHeight) {
    const viewport = page.getViewport({ scale: 1 });
    const { width, height } = this.calculateThumbnailSize(viewport.width, viewport.height, maxWidth, maxHeight);
    const scale = width / viewport.width;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    const renderContext = {
      canvasContext: context,
      viewport: page.getViewport({ scale })
    };

    await page.render(renderContext).promise;
    return canvas;
  }

  calculateThumbnailSize(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  generateFileId() {
    return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // File Management Methods
  removeFile(fileId) {
    const fileData = this.files.get(fileId);
    if (fileData) {
      // Clean up resources
      if (fileData.file && fileData.preview) {
        URL.revokeObjectURL(fileData.preview);
      }
      
      this.files.delete(fileId);
      this.selectedFiles.delete(fileId);
      
      // Update current file if necessary
      if (this.currentFileId === fileId) {
        const remainingFiles = [...this.files.keys()];
        this.currentFileId = remainingFiles.length > 0 ? remainingFiles[0] : null;
      }
      
      this.updateFileList();
      this.updateStats();
      this.emit('fileRemoved', { fileId, fileData });
    }
  }

  clearAllFiles() {
    // Clean up resources
    this.files.forEach(fileData => {
      if (fileData.preview) {
        URL.revokeObjectURL(fileData.preview);
      }
    });
    
    this.files.clear();
    this.selectedFiles.clear();
    this.currentFileId = null;
    
    this.updateFileList();
    this.updateStats();
    this.emit('allFilesCleared');
  }

  selectFile(fileId, multiSelect = false) {
    if (!multiSelect) {
      this.selectedFiles.clear();
    }
    
    if (this.selectedFiles.has(fileId)) {
      this.selectedFiles.delete(fileId);
    } else {
      this.selectedFiles.add(fileId);
    }
    
    this.updateFileList();
    this.emit('selectionChanged', { selectedFiles: [...this.selectedFiles] });
  }

  selectAllFiles() {
    this.selectedFiles.clear();
    this.files.forEach((_, fileId) => this.selectedFiles.add(fileId));
    this.updateFileList();
    this.emit('selectionChanged', { selectedFiles: [...this.selectedFiles] });
  }

  deselectAllFiles() {
    this.selectedFiles.clear();
    this.updateFileList();
    this.emit('selectionChanged', { selectedFiles: [] });
  }

  invertSelection() {
    const newSelection = new Set();
    this.files.forEach((_, fileId) => {
      if (!this.selectedFiles.has(fileId)) {
        newSelection.add(fileId);
      }
    });
    this.selectedFiles = newSelection;
    this.updateFileList();
    this.emit('selectionChanged', { selectedFiles: [...this.selectedFiles] });
  }

  // Navigation Methods
  navigateFile(direction) {
    if (this.files.size === 0) return;
    
    const fileIds = this.getSortedFileIds();
    const currentIndex = fileIds.indexOf(this.currentFileId);
    
    if (currentIndex === -1) {
      this.currentFileId = fileIds[0];
    } else {
      const newIndex = Math.max(0, Math.min(fileIds.length - 1, currentIndex + direction));
      this.currentFileId = fileIds[newIndex];
    }
    
    this.updateFileNavigation();
    this.emit('currentFileChanged', { fileId: this.currentFileId });
  }

  setCurrentFile(fileId) {
    if (this.files.has(fileId)) {
      this.currentFileId = fileId;
      this.updateFileNavigation();
      this.emit('currentFileChanged', { fileId: this.currentFileId });
    }
  }

  // Sorting and View Methods
  setSortOrder(order) {
    if (this.sortOrder === order) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortOrder = order;
      this.sortDirection = 'asc';
    }
    
    this.updateSortButtons();
    this.updateFileList();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.updateViewButtons();
    this.updateFileList();
  }

  getSortedFileIds() {
    const files = [...this.files.entries()];
    
    files.sort(([, a], [, b]) => {
      let comparison = 0;
      
      switch (this.sortOrder) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.lastModified.getTime() - b.lastModified.getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return files.map(([fileId]) => fileId);
  }

  // UI Update Methods
  updateFileList() {
    const container = document.getElementById('file-list');
    if (!container) return;

    container.innerHTML = '';
    container.className = `file-list ${this.viewMode}-view`;

    const sortedFileIds = this.getSortedFileIds();
    
    sortedFileIds.forEach(fileId => {
      const fileData = this.files.get(fileId);
      const fileElement = this.createFileElement(fileData);
      container.appendChild(fileElement);
    });
  }

  createFileElement(fileData) {
    const div = document.createElement('div');
    div.className = `file-item ${this.selectedFiles.has(fileData.id) ? 'selected' : ''}`;
    div.dataset.fileId = fileData.id;

    const preview = document.createElement('div');
    preview.className = 'file-preview';
    
    if (fileData.thumbnail) {
      preview.appendChild(fileData.thumbnail.cloneNode());
    } else {
      preview.innerHTML = fileData.type.startsWith('image/') ? '<i class="fas fa-image"></i>' : '<i class="fas fa-file-pdf"></i>';
    }

    const info = document.createElement('div');
    info.className = 'file-info';
    
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = fileData.name;
    name.title = fileData.name;
    
    const meta = document.createElement('div');
    meta.className = 'file-meta';
    meta.innerHTML = `
      <span>${this.formatFileSize(fileData.size)}</span>
      <span>${fileData.metadata.pageCount || 1} página(s)</span>
      <span>${this.formatDate(fileData.lastModified)}</span>
    `;

    const actions = document.createElement('div');
    actions.className = 'file-actions-item';
    actions.innerHTML = `
      <button class="btn btn-small btn-secondary view-btn" title="Ver">
        <i class="fas fa-eye"></i>
      </button>
      <button class="btn btn-small btn-danger remove-btn" title="Eliminar">
        <i class="fas fa-trash"></i>
      </button>
    `;

    info.appendChild(name);
    info.appendChild(meta);
    
    div.appendChild(preview);
    div.appendChild(info);
    div.appendChild(actions);

    // Event listeners
    div.addEventListener('click', (e) => {
      if (!e.target.closest('.file-actions-item')) {
        this.selectFile(fileData.id, e.ctrlKey || e.metaKey);
      }
    });

    div.addEventListener('dblclick', () => {
      this.setCurrentFile(fileData.id);
    });

    actions.querySelector('.view-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.setCurrentFile(fileData.id);
    });

    actions.querySelector('.remove-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeFile(fileData.id);
    });

    return div;
  }

  updateStats() {
    const fileCount = document.getElementById('file-count');
    const totalPages = document.getElementById('total-pages');
    const totalSize = document.getElementById('total-size');

    if (fileCount) {
      fileCount.textContent = `${this.files.size} archivo${this.files.size !== 1 ? 's' : ''}`;
    }

    if (totalPages) {
      const pages = [...this.files.values()].reduce((sum, file) => sum + (file.metadata.pageCount || 1), 0);
      totalPages.textContent = `${pages} página${pages !== 1 ? 's' : ''}`;
    }

    if (totalSize) {
      const size = [...this.files.values()].reduce((sum, file) => sum + file.size, 0);
      totalSize.textContent = this.formatFileSize(size);
    }
  }

  updateFileNavigation() {
    const filePosition = document.getElementById('file-position');
    if (filePosition && this.files.size > 0) {
      const fileIds = this.getSortedFileIds();
      const currentIndex = fileIds.indexOf(this.currentFileId);
      filePosition.textContent = `${currentIndex + 1} / ${this.files.size}`;
    }

    // Update file tabs
    this.updateFileTabs();
  }

  updateFileTabs() {
    const tabsContainer = document.getElementById('file-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';
    
    const sortedFileIds = this.getSortedFileIds();
    sortedFileIds.forEach(fileId => {
      const fileData = this.files.get(fileId);
      const tab = document.createElement('div');
      tab.className = `file-tab ${fileId === this.currentFileId ? 'active' : ''}`;
      tab.dataset.fileId = fileId;
      
      const shortName = fileData.name.length > 20 ? 
        fileData.name.substring(0, 17) + '...' : fileData.name;
      
      tab.innerHTML = `
        <span>${shortName}</span>
        <button class="close-btn" title="Cerrar">×</button>
      `;

      tab.addEventListener('click', (e) => {
        if (!e.target.classList.contains('close-btn')) {
          this.setCurrentFile(fileId);
        }
      });

      tab.querySelector('.close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeFile(fileId);
      });

      tabsContainer.appendChild(tab);
    });
  }

  updateSortButtons() {
    ['name', 'date', 'size'].forEach(order => {
      const button = document.getElementById(`sort-${order}-btn`);
      if (button) {
        const icon = button.querySelector('i');
        button.classList.toggle('active', this.sortOrder === order);
        
        if (this.sortOrder === order) {
          icon.className = this.sortDirection === 'asc' ? 
            'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up';
          if (order === 'date') {
            icon.className = this.sortDirection === 'asc' ? 
              'fas fa-sort-numeric-down' : 'fas fa-sort-numeric-up';
          } else if (order === 'size') {
            icon.className = this.sortDirection === 'asc' ? 
              'fas fa-sort-amount-down' : 'fas fa-sort-amount-up';
          }
        }
      }
    });
  }

  updateViewButtons() {
    ['grid', 'list', 'single'].forEach(mode => {
      const button = document.getElementById(`${mode}-view-btn`);
      if (button) {
        button.classList.toggle('active', this.viewMode === mode);
      }
    });
  }

  // Utility Methods
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(date) {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  showNotification(message, type = 'info') {
    // Implementation depends on notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
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

  // Example Files Loading
  async loadExampleFiles() {
    const exampleFiles = [
      'ejemplos/Consuelo Gitano (Alto).pdf',
      'ejemplos/Cristo de la Salud y buen Viaje.pdf',
      'ejemplos/Cristo que vuelve (Alto).pdf',
      'ejemplos/De San Agustín al Cielo (alto).pdf'
    ];

    this.showNotification('Cargando archivos de ejemplo...', 'info');

    try {
      const loadPromises = exampleFiles.map(async (path) => {
        try {
          const response = await fetch(path);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const blob = await response.blob();
          const fileName = path.split('/').pop();
          const file = new File([blob], fileName, { type: 'application/pdf' });
          
          return file;
        } catch (error) {
          console.warn(`Could not load example file ${path}:`, error);
          return null;
        }
      });

      const files = (await Promise.all(loadPromises)).filter(Boolean);
      
      if (files.length > 0) {
        await this.handleFileSelect(files);
        this.showNotification(`${files.length} archivo(s) de ejemplo cargado(s)`, 'success');
      } else {
        this.showNotification('No se pudieron cargar los archivos de ejemplo', 'warning');
      }
    } catch (error) {
      console.error('Error loading example files:', error);
      this.showNotification('Error al cargar archivos de ejemplo', 'error');
    }
  }

  // Public API Methods
  getFiles() {
    return new Map(this.files);
  }

  getSelectedFiles() {
    return [...this.selectedFiles].map(id => this.files.get(id)).filter(Boolean);
  }

  getCurrentFile() {
    return this.currentFileId ? this.files.get(this.currentFileId) : null;
  }

  getFileCount() {
    return this.files.size;
  }

  getTotalPages() {
    return [...this.files.values()].reduce((sum, file) => sum + (file.metadata.pageCount || 1), 0);
  }

  getTotalSize() {
    return [...this.files.values()].reduce((sum, file) => sum + file.size, 0);
  }
}
