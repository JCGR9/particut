// Particut Pro - Versión Simplificada para Debugging
// Enfoque en hacer funcionar los botones de carga de archivos

import './style.css';
import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

class ParticutAppSimple {
  constructor() {
    this.files = [];
    this.currentZoom = 1;
    this.init();
  }

  async init() {
    console.log('Initializing Particut Simple...');
    
    try {
      // Configure PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.setupFileUploadEvents();
        });
      } else {
        this.setupFileUploadEvents();
      }
      
      console.log('Particut Simple initialized successfully');
    } catch (error) {
      console.error('Error initializing Particut Simple:', error);
    }
  }

  setupFileUploadEvents() {
    console.log('Setting up file upload events...');
    
    // File input elements
    const fileInput = document.getElementById('file-input');
    const folderInput = document.getElementById('folder-input');
    const selectFilesBtn = document.getElementById('select-files-btn');
    const selectFolderBtn = document.getElementById('select-folder-btn');
    const dropZone = document.getElementById('drop-zone');

    // Verify elements exist and log status
    console.log('DOM Elements found:');
    console.log('- file-input:', !!fileInput);
    console.log('- folder-input:', !!folderInput);
    console.log('- select-files-btn:', !!selectFilesBtn);
    console.log('- select-folder-btn:', !!selectFolderBtn);
    console.log('- drop-zone:', !!dropZone);

    // Select files button
    if (selectFilesBtn && fileInput) {
      selectFilesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Select files button clicked - triggering file input');
        fileInput.click();
      });
      console.log('✓ Select files button event listener added');
    } else {
      console.error('✗ Could not setup select files button');
    }

    // Select folder button
    if (selectFolderBtn && folderInput) {
      selectFolderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Select folder button clicked - triggering folder input');
        folderInput.click();
      });
      console.log('✓ Select folder button event listener added');
    } else {
      console.error('✗ Could not setup select folder button');
    }

    // File input change
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        console.log('File input changed, files:', e.target.files.length);
        this.handleFileSelection(e.target.files);
      });
      console.log('✓ File input change event listener added');
    } else {
      console.error('✗ Could not setup file input change listener');
    }

    // Folder input change
    if (folderInput) {
      folderInput.addEventListener('change', (e) => {
        console.log('Folder input changed, files:', e.target.files.length);
        this.handleFileSelection(e.target.files);
      });
      console.log('✓ Folder input change event listener added');
    } else {
      console.error('✗ Could not setup folder input change listener');
    }

    // Drag and drop
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });

      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        console.log('Files dropped, count:', e.dataTransfer.files.length);
        this.handleFileSelection(e.dataTransfer.files);
      });
      console.log('✓ Drag and drop event listeners added');
    } else {
      console.error('✗ Could not setup drag and drop');
    }

    // Load examples button
    const loadExamplesBtn = document.getElementById('load-examples-btn');
    if (loadExamplesBtn) {
      loadExamplesBtn.addEventListener('click', () => {
        console.log('Load examples button clicked');
        this.loadExampleFiles();
      });
      console.log('✓ Load examples button event listener added');
    } else {
      console.error('✗ Could not setup load examples button');
    }

    // Clear all button
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        console.log('Clear all button clicked');
        this.clearAllFiles();
      });
      console.log('✓ Clear all button event listener added');
    } else {
      console.error('✗ Could not setup clear all button');
    }
  }

  async handleFileSelection(files) {
    console.log('Processing selected files:', files.length);
    
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    // Convert FileList to Array
    const fileArray = Array.from(files);
    
    // Filter valid file types
    const validFiles = fileArray.filter(file => {
      const isValid = file.type === 'application/pdf' || 
                     file.type.startsWith('image/');
      
      if (!isValid) {
        console.warn('Invalid file type:', file.name, file.type);
      }
      
      return isValid;
    });

    console.log('Valid files:', validFiles.length);

    if (validFiles.length === 0) {
      this.showMessage('No se encontraron archivos válidos. Por favor selecciona archivos PDF o imágenes.', 'warning');
      return;
    }

    // Add files to our collection
    this.files = this.files.concat(validFiles);
    
    // Update file stats
    this.updateFileStats();
    
    // Update file list display
    this.updateFileList();
    
    // Show success message
    this.showMessage(`${validFiles.length} archivo(s) cargado(s) exitosamente.`, 'success');
  }

  updateFileStats() {
    const fileCountEl = document.getElementById('file-count');
    const totalSizeEl = document.getElementById('total-size');
    
    if (fileCountEl) {
      fileCountEl.textContent = `${this.files.length} archivo${this.files.length !== 1 ? 's' : ''}`;
    }
    
    if (totalSizeEl) {
      const totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
      totalSizeEl.textContent = this.formatFileSize(totalSize);
    }
  }

  updateFileList() {
    const fileListEl = document.getElementById('file-list');
    
    if (!fileListEl) {
      console.error('file-list element not found');
      return;
    }

    fileListEl.innerHTML = '';

    this.files.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      // Create remove button with proper event binding
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn-small btn-outline';
      removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
      removeBtn.addEventListener('click', () => this.removeFile(index));
      
      fileItem.innerHTML = `
        <div class="file-info">
          <i class="fas ${file.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image'}"></i>
          <div class="file-details">
            <div class="file-name">${file.name}</div>
            <div class="file-meta">${this.formatFileSize(file.size)} • ${file.type}</div>
          </div>
        </div>
        <div class="file-actions">
        </div>
      `;
      
      // Append the remove button properly
      fileItem.querySelector('.file-actions').appendChild(removeBtn);
      fileListEl.appendChild(fileItem);
    });
  }

  removeFile(index) {
    console.log('Removing file at index:', index);
    if (index >= 0 && index < this.files.length) {
      this.files.splice(index, 1);
      this.updateFileStats();
      this.updateFileList();
      this.showMessage('Archivo eliminado.', 'info');
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async loadExampleFiles() {
    console.log('Loading example files...');
    
    // List of example files in the ejemplos folder
    const examplePaths = [
      '/ejemplos/Consuelo Gitano (Alto).pdf',
      '/ejemplos/Cristo de la Salud y buen Viaje.pdf',
      '/ejemplos/Cristo que vuelve (Alto).pdf',
      '/ejemplos/De San Agustín al Cielo (alto).pdf'
    ];

    try {
      const loadPromises = examplePaths.map(async (path) => {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const blob = await response.blob();
            const fileName = path.split('/').pop();
            
            // Create a File object from the blob
            const file = new File([blob], fileName, { type: 'application/pdf' });
            return file;
          } else {
            console.warn(`Could not load example file: ${path}`);
            return null;
          }
        } catch (error) {
          console.error(`Error loading example file ${path}:`, error);
          return null;
        }
      });

      const loadedFiles = await Promise.all(loadPromises);
      const validFiles = loadedFiles.filter(file => file !== null);
      
      if (validFiles.length > 0) {
        this.files = this.files.concat(validFiles);
        this.updateFileStats();
        this.updateFileList();
        this.showMessage(`${validFiles.length} archivo(s) de ejemplo cargados.`, 'success');
      } else {
        // Fallback to mock files if real files can't be loaded
        this.loadMockExampleFiles();
      }
    } catch (error) {
      console.error('Error loading example files:', error);
      this.loadMockExampleFiles();
    }
  }

  loadMockExampleFiles() {
    console.log('Loading mock example files...');
    
    // Create mock file objects for examples
    const mockFiles = [
      this.createMockFile('Consuelo Gitano (Alto).pdf', 1024000),
      this.createMockFile('Cristo de la Salud y buen Viaje.pdf', 892000),
      this.createMockFile('Cristo que vuelve (Alto).pdf', 1156000),
      this.createMockFile('De San Agustín al Cielo (alto).pdf', 967000)
    ];

    this.files = this.files.concat(mockFiles);
    this.updateFileStats();
    this.updateFileList();
    this.showMessage('Archivos de ejemplo simulados cargados.', 'success');
  }

  createMockFile(name, size) {
    // Create a mock file object
    const mockBlob = new Blob(['Mock PDF content'], { type: 'application/pdf' });
    return new File([mockBlob], name, { type: 'application/pdf' });
  }

  clearAllFiles() {
    console.log('Clearing all files...');
    this.files = [];
    this.updateFileStats();
    this.updateFileList();
    this.showMessage('Todos los archivos han sido eliminados.', 'info');
  }

  showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Try to show in UI if message container exists
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
      messageContainer.innerHTML = `
        <div class="message message-${type}">
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
          ${message}
        </div>
      `;
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        messageContainer.innerHTML = '';
      }, 3000);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Creating Particut app instance...');
  const app = new ParticutAppSimple();
  
  // Make app globally available for debugging
  window.app = app;
  console.log('App instance created and available as window.app');
});

export default ParticutAppSimple;
