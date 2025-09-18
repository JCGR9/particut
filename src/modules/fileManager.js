// File Manager Module
// Handles file validation, filtering, and management

export class FileManager {
  constructor() {
    this.supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.maxFiles = 100;
  }

  filterValidFiles(fileList) {
    const files = Array.from(fileList);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push({
          fileName: file.name,
          error: validation.error
        });
      }
    });

    // Report errors if any
    if (errors.length > 0) {
      this.reportValidationErrors(errors);
    }

    return validFiles;
  }

  validateFile(file) {
    // Check file type
    if (!this.isValidType(file.type)) {
      return {
        isValid: false,
        error: `Tipo de archivo no soportado: ${file.type}. Solo se admiten PDF, JPG, PNG, GIF y WebP.`
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `Archivo demasiado grande: ${this.formatFileSize(file.size)}. Máximo permitido: ${this.formatFileSize(this.maxFileSize)}.`
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'El archivo está vacío.'
      };
    }

    // Check file name length
    if (file.name.length > 255) {
      return {
        isValid: false,
        error: 'El nombre del archivo es demasiado largo.'
      };
    }

    return { isValid: true };
  }

  isValidType(mimeType) {
    return this.supportedTypes.includes(mimeType);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  reportValidationErrors(errors) {
    console.warn('File validation errors:', errors);
    
    // Create error summary
    const errorSummary = errors.map(error => 
      `${error.fileName}: ${error.error}`
    ).join('\n');

    // Show user-friendly error message
    if (errors.length === 1) {
      this.showError(`Error en archivo: ${errorSummary}`);
    } else {
      this.showError(`Errores en ${errors.length} archivos:\n${errorSummary}`);
    }
  }

  showError(message) {
    // This would typically be handled by the UI Manager
    console.error(message);
    
    // Create a simple alert for now
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      max-width: 400px;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 5000);
  }

  getFileExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
  }

  getFileType(file) {
    if (file.type === 'application/pdf') {
      return 'pdf';
    } else if (file.type.startsWith('image/')) {
      return 'image';
    }
    return 'unknown';
  }

  generateFileId(file) {
    // Generate a unique ID for the file based on name, size, and last modified
    const data = `${file.name}-${file.size}-${file.lastModified}`;
    return this.simpleHash(data);
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  sortFiles(files, criteria = 'name') {
    return [...files].sort((a, b) => {
      switch (criteria) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return a.size - b.size;
        case 'type':
          return a.type.localeCompare(b.type);
        case 'modified':
          return a.lastModified - b.lastModified;
        default:
          return 0;
      }
    });
  }

  groupFilesByType(files) {
    const groups = {
      pdf: [],
      image: [],
      other: []
    };

    files.forEach(file => {
      const type = this.getFileType(file);
      if (groups[type]) {
        groups[type].push(file);
      } else {
        groups.other.push(file);
      }
    });

    return groups;
  }

  async readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error reading file'));
      
      reader.readAsArrayBuffer(file);
    });
  }

  async readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error reading file'));
      
      reader.readAsDataURL(file);
    });
  }

  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Error reading file'));
      
      reader.readAsText(file);
    });
  }

  createFileInfo(file) {
    return {
      id: this.generateFileId(file),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension: this.getFileExtension(file.name),
      fileType: this.getFileType(file),
      formattedSize: this.formatFileSize(file.size),
      isValid: this.validateFile(file).isValid
    };
  }

  // Batch processing utilities
  async processBatch(files, processor, batchSize = 5) {
    const results = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(file => processor(file));
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error('Error processing batch:', error);
        // Continue with next batch
      }
    }
    
    return results;
  }

  // File deduplication
  findDuplicates(files) {
    const duplicates = [];
    const seen = new Map();

    files.forEach((file, index) => {
      const key = `${file.name}-${file.size}`;
      
      if (seen.has(key)) {
        duplicates.push({
          original: seen.get(key),
          duplicate: { file, index }
        });
      } else {
        seen.set(key, { file, index });
      }
    });

    return duplicates;
  }

  removeDuplicates(files) {
    const unique = [];
    const seen = new Set();

    files.forEach(file => {
      const key = `${file.name}-${file.size}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(file);
      }
    });

    return unique;
  }

  // Memory management
  createObjectURL(file) {
    return URL.createObjectURL(file);
  }

  revokeObjectURL(url) {
    URL.revokeObjectURL(url);
  }

  // File compression check
  async estimateProcessingTime(files) {
    let totalSize = 0;
    let pdfPages = 0;
    let imageCount = 0;

    files.forEach(file => {
      totalSize += file.size;
      
      if (file.type === 'application/pdf') {
        // Estimate pages (rough calculation)
        pdfPages += Math.ceil(file.size / (100 * 1024)); // Assume ~100KB per page
      } else if (file.type.startsWith('image/')) {
        imageCount++;
      }
    });

    // Rough time estimation in seconds
    const baseTime = 2; // Base processing time
    const sizeTime = totalSize / (1024 * 1024) * 0.5; // 0.5 sec per MB
    const pageTime = pdfPages * 0.3; // 0.3 sec per PDF page
    const imageTime = imageCount * 0.2; // 0.2 sec per image

    return Math.ceil(baseTime + sizeTime + pageTime + imageTime);
  }

  // Progress tracking
  createProgressTracker(totalItems) {
    let completed = 0;
    
    return {
      update: () => {
        completed++;
        return (completed / totalItems) * 100;
      },
      getProgress: () => (completed / totalItems) * 100,
      isComplete: () => completed >= totalItems,
      reset: () => { completed = 0; }
    };
  }
}
