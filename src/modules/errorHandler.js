// Error Handler Module
// Global error handling and logging system

export class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'unhandled_promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
      
      // Prevent the default behavior (console error)
      event.preventDefault();
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError({
          type: 'resource_error',
          message: `Failed to load ${event.target.tagName}: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          timestamp: new Date().toISOString()
        });
      }
    }, true);
  }

  handleError(error) {
    // Add to error log
    this.addError(error);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error handled:', error);
    }
    
    // Show user-friendly message for critical errors
    if (this.isCriticalError(error)) {
      this.showCriticalErrorMessage(error);
    }
    
    // Optionally send to logging service
    this.logToService(error);
  }

  addError(error) {
    this.errors.unshift({
      id: this.generateErrorId(),
      ...error,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
  }

  isCriticalError(error) {
    const criticalPatterns = [
      /out of memory/i,
      /script error/i,
      /network error/i,
      /security error/i,
      /permission denied/i
    ];
    
    return criticalPatterns.some(pattern => 
      pattern.test(error.message || '')
    );
  }

  showCriticalErrorMessage(error) {
    const message = this.getFriendlyErrorMessage(error);
    
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'error-notification critical';
    notification.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <div class="error-text">
          <h4>Error Crítico</h4>
          <p>${message}</p>
          <div class="error-actions">
            <button onclick="location.reload()" class="btn btn-primary btn-sm">
              Recargar Página
            </button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn btn-secondary btn-sm">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      minWidth: '400px',
      maxWidth: '600px',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      zIndex: '10000',
      backgroundColor: '#ef4444',
      color: 'white',
      border: '2px solid #dc2626'
    });
    
    document.body.appendChild(notification);
    
    // Auto remove after 30 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 30000);
  }

  getFriendlyErrorMessage(error) {
    const errorMessages = {
      'out of memory': 'La aplicación se quedó sin memoria. Intenta procesar menos archivos a la vez.',
      'network error': 'Error de conexión. Verifica tu conexión a internet.',
      'permission denied': 'Permisos insuficientes. Verifica los permisos del navegador.',
      'file too large': 'El archivo es demasiado grande. Intenta con un archivo más pequeño.',
      'invalid file': 'Formato de archivo no válido. Solo se admiten PDF, JPG y PNG.',
      'processing failed': 'Error al procesar el archivo. Intenta con otro archivo.'
    };
    
    const message = error.message?.toLowerCase() || '';
    
    for (const [key, friendlyMessage] of Object.entries(errorMessages)) {
      if (message.includes(key)) {
        return friendlyMessage;
      }
    }
    
    return 'Ha ocurrido un error inesperado. Intenta recargar la página.';
  }

  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  logToService(error) {
    // In a real application, you would send this to a logging service
    // like Sentry, LogRocket, or a custom endpoint
    if (import.meta.env.PROD) {
      // Example: Send to logging service
      // fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error)
      // }).catch(() => {
      //   // Silent fail for logging
      // });
    }
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      recent: this.errors.slice(0, 10)
    };
    
    this.errors.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });
    
    return stats;
  }

  clearErrors() {
    this.errors = [];
  }

  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }

  // Specific error types for the application
  handleFileError(filename, error) {
    this.handleError({
      type: 'file_error',
      message: `Error processing file: ${filename}`,
      filename,
      originalError: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  handlePDFError(filename, error) {
    this.handleError({
      type: 'pdf_error',
      message: `Error processing PDF: ${filename}`,
      filename,
      originalError: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  handleImageError(filename, error) {
    this.handleError({
      type: 'image_error',
      message: `Error processing image: ${filename}`,
      filename,
      originalError: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  handleLayoutError(error) {
    this.handleError({
      type: 'layout_error',
      message: `Error generating layout: ${error.message}`,
      originalError: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  handleConfigError(error) {
    this.handleError({
      type: 'config_error',
      message: `Configuration error: ${error.message}`,
      originalError: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  // Recovery functions
  recoverFromError(errorType) {
    switch (errorType) {
      case 'out_of_memory':
        this.freeMemory();
        break;
      case 'file_error':
        this.clearFileCache();
        break;
      case 'config_error':
        this.resetConfiguration();
        break;
      default:
        console.log('No specific recovery action for error type:', errorType);
    }
  }

  freeMemory() {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Clear large objects from memory
    if (window.particutApp) {
      window.particutApp.clearCache();
    }
  }

  clearFileCache() {
    // Clear file-related caches
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  resetConfiguration() {
    // Reset configuration to defaults
    if (window.particutApp && window.particutApp.configManager) {
      window.particutApp.configManager.resetConfig();
    }
  }
}

// Create global error handler instance
export const globalErrorHandler = new ErrorHandler();
