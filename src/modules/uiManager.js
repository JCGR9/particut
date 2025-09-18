// UI Manager Module
// Handles user interface interactions, animations, and feedback

export class UIManager {
  constructor() {
    this.activeSection = null;
    this.notifications = [];
  }

  init() {
    this.setupAnimations();
    this.setupResponsiveHandlers();
    console.log('UI Manager initialized');
  }

  setupAnimations() {
    // Add intersection observer for fade-in animations
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
      }, {
        threshold: 0.1
      });

      // Observe elements that should animate in
      document.querySelectorAll('.file-item, .preview-item, .config-group').forEach(el => {
        observer.observe(el);
      });
    }
  }

  setupResponsiveHandlers() {
    // Handle responsive layout changes
    window.addEventListener('resize', this.debounce(() => {
      this.updateResponsiveLayout();
    }, 250));
  }

  showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'block';
      section.classList.add('fade-in');
      this.activeSection = sectionId;
    }
  }

  hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'none';
      section.classList.remove('fade-in');
    }
  }

  toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      if (section.style.display === 'none') {
        this.showSection(sectionId);
      } else {
        this.hideSection(sectionId);
      }
    }
  }

  showNotification(message, type = 'info', duration = 5000) {
    const notification = this.createNotification(message, type);
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });

    // Auto remove
    setTimeout(() => {
      this.removeNotification(notification);
    }, duration);

    return notification;
  }

  createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = this.getNotificationIcon(type);
    
    notification.innerHTML = `
      <div class="notification-content">
        <i class="${icon}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      minWidth: '300px',
      maxWidth: '500px',
      padding: '1rem',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      zIndex: '9999',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease-in-out',
      backgroundColor: this.getNotificationColor(type),
      color: 'white'
    });

    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.removeNotification(notification);
    });

    return notification;
  }

  removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
    }, 300);
  }

  getNotificationIcon(type) {
    const icons = {
      'success': 'fas fa-check-circle',
      'error': 'fas fa-exclamation-circle',
      'warning': 'fas fa-exclamation-triangle',
      'info': 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  getNotificationColor(type) {
    const colors = {
      'success': '#10b981',
      'error': '#ef4444',
      'warning': '#f97316',
      'info': '#3b82f6'
    };
    return colors[type] || colors.info;
  }

  showError(message) {
    return this.showNotification(message, 'error');
  }

  showSuccess(message) {
    return this.showNotification(message, 'success');
  }

  showWarning(message) {
    return this.showNotification(message, 'warning');
  }

  showInfo(message) {
    return this.showNotification(message, 'info');
  }

  showLoading(message = 'Cargando...') {
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">${message}</div>
      </div>
    `;

    // Add styles
    Object.assign(loader.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10000'
    });

    const content = loader.querySelector('.loading-content');
    Object.assign(content.style, {
      background: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      textAlign: 'center',
      minWidth: '200px'
    });

    const spinner = loader.querySelector('.loading-spinner');
    Object.assign(spinner.style, {
      width: '40px',
      height: '40px',
      border: '4px solid #f3f4f6',
      borderTop: '4px solid #6366f1',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 1rem'
    });

    document.body.appendChild(loader);
    return loader;
  }

  hideLoading(loader) {
    if (loader && loader.parentElement) {
      loader.parentElement.removeChild(loader);
    }
  }

  updateProgress(percentage, text = '') {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }

    if (progressText && text) {
      progressText.textContent = text;
    }
  }

  resetProgress() {
    this.updateProgress(0, '');
  }

  setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
  }

  highlightElement(element, duration = 2000) {
    if (!element) return;

    element.style.transition = 'box-shadow 0.3s ease';
    element.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.5)';

    setTimeout(() => {
      element.style.boxShadow = '';
    }, duration);
  }

  scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  updateResponsiveLayout() {
    const container = document.querySelector('.container');
    if (!container) return;

    const width = window.innerWidth;
    
    // Update grid layouts based on screen size
    const fileGrid = document.getElementById('fileList');
    const previewGrid = document.getElementById('previewGrid');

    if (width < 768) {
      // Mobile layout
      if (fileGrid) fileGrid.style.gridTemplateColumns = '1fr';
      if (previewGrid) previewGrid.style.gridTemplateColumns = '1fr';
    } else if (width < 1024) {
      // Tablet layout
      if (fileGrid) fileGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
      if (previewGrid) previewGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
      // Desktop layout
      if (fileGrid) fileGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
      if (previewGrid) previewGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
    }
  }

  createTooltip(element, text) {
    if (!element) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;

    Object.assign(tooltip.style, {
      position: 'absolute',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.875rem',
      pointerEvents: 'none',
      zIndex: '1000',
      opacity: '0',
      transition: 'opacity 0.2s ease'
    });

    document.body.appendChild(tooltip);

    element.addEventListener('mouseenter', (e) => {
      const rect = element.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
      tooltip.style.transform = 'translateX(-50%)';
      tooltip.style.opacity = '1';
    });

    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });

    return tooltip;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + O: Open files
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        document.getElementById('fileInput')?.click();
      }

      // Ctrl/Cmd + Enter: Process files
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('processBtn')?.click();
      }

      // Escape: Close modals/overlays
      if (e.key === 'Escape') {
        const overlays = document.querySelectorAll('.loading-overlay, .modal');
        overlays.forEach(overlay => {
          if (overlay.parentElement) {
            overlay.parentElement.removeChild(overlay);
          }
        });
      }
    });
  }

  // Animation helpers
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';

    const start = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      element.style.opacity = progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  fadeOut(element, duration = 300) {
    const start = performance.now();
    const initialOpacity = parseFloat(getComputedStyle(element).opacity) || 1;

    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      element.style.opacity = initialOpacity * (1 - progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };

    requestAnimationFrame(animate);
  }

  slideDown(element, duration = 300) {
    element.style.height = '0px';
    element.style.overflow = 'hidden';
    element.style.display = 'block';

    const targetHeight = element.scrollHeight;
    const start = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      element.style.height = `${targetHeight * progress}px`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.height = '';
        element.style.overflow = '';
      }
    };

    requestAnimationFrame(animate);
  }
}
