// Utility Functions
// Common helper functions used across the application

export class Utils {
  // Convert millimeters to pixels (assumes 96 DPI)
  static mmToPx(mm, dpi = 96) {
    return (mm / 25.4) * dpi;
  }

  // Convert pixels to millimeters (assumes 96 DPI)
  static pxToMm(px, dpi = 96) {
    return (px * 25.4) / dpi;
  }

  // Format file size in human readable format
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Debounce function
  static debounce(func, wait) {
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

  // Throttle function
  static throttle(func, limit) {
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

  // Generate unique ID
  static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Calculate aspect ratio
  static getAspectRatio(width, height) {
    return width / height;
  }

  // Clamp value between min and max
  static clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  // Calculate scale to fit dimensions
  static calculateScaleToFit(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    const scaleX = targetWidth / sourceWidth;
    const scaleY = targetHeight / sourceHeight;
    return Math.min(scaleX, scaleY);
  }

  // Calculate scale to fill dimensions
  static calculateScaleToFill(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    const scaleX = targetWidth / sourceWidth;
    const scaleY = targetHeight / sourceHeight;
    return Math.max(scaleX, scaleY);
  }

  // Get center coordinates for positioning
  static getCenterPosition(containerWidth, containerHeight, itemWidth, itemHeight) {
    return {
      x: (containerWidth - itemWidth) / 2,
      y: (containerHeight - itemHeight) / 2
    };
  }

  // Deep clone object
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Format date
  static formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  // Get file extension
  static getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  // Check if device is mobile
  static isMobile() {
    return window.innerWidth <= 768;
  }

  // Check if device is tablet
  static isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  }

  // Check if device is desktop
  static isDesktop() {
    return window.innerWidth > 1024;
  }

  // Get device type
  static getDeviceType() {
    if (this.isMobile()) return 'mobile';
    if (this.isTablet()) return 'tablet';
    return 'desktop';
  }

  // Download file
  static downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Convert canvas to blob
  static canvasToBlob(canvas, type = 'image/png', quality = 0.92) {
    return new Promise(resolve => {
      canvas.toBlob(resolve, type, quality);
    });
  }

  // Load image from URL
  static loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  // Create canvas from image
  static createCanvasFromImage(image, width = null, height = null) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width || image.width;
    canvas.height = height || image.height;
    
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  // Resize canvas
  static resizeCanvas(canvas, newWidth, newHeight, smooth = true) {
    const newCanvas = document.createElement('canvas');
    const ctx = newCanvas.getContext('2d');
    
    newCanvas.width = newWidth;
    newCanvas.height = newHeight;
    
    if (smooth) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    
    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
    return newCanvas;
  }

  // Get canvas pixel data
  static getCanvasPixelData(canvas) {
    const ctx = canvas.getContext('2d');
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  // Check if color is light
  static isLightColor(r, g, b) {
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  }

  // Convert RGB to hex
  static rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Convert hex to RGB
  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Calculate luminance
  static getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Calculate contrast ratio
  static getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1.r, color1.g, color1.b);
    const lum2 = this.getLuminance(color2.r, color2.g, color2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  // Format time duration
  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Parse duration to seconds
  static parseDuration(duration) {
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
  }

  // Get random number between min and max
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }

  // Get random integer between min and max
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Shuffle array
  static shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Get unique values from array
  static unique(array) {
    return [...new Set(array)];
  }

  // Group array by key
  static groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  // Sort array of objects by property
  static sortBy(array, property, direction = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[property];
      const bVal = b[property];
      
      if (direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  // Check if object is empty
  static isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  // Merge objects deeply
  static mergeDeep(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this.mergeDeep(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  // Get nested property value
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }

  // Set nested property value
  static setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      current[key] = current[key] || {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
