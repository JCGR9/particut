// Image Processor Module
// Handles image file processing, orientation detection, and content extraction

export class ImageProcessor {
  constructor() {
    this.supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  }

  async generatePreview(file, maxHeight = 200) {
    try {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate scale to fit maxHeight
            const scale = maxHeight / img.height;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            URL.revokeObjectURL(img.src);
            resolve(canvas);
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          reject(new Error('Error loading image'));
        };
        
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error generating image preview:', error);
      throw error;
    }
  }

  async renderToCanvas(file, canvas, maxWidth = 400, config = {}) {
    try {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            // Detect and correct orientation if needed
            const { width, height, rotation } = this.correctOrientation(img, config.autoRotate);
            
            // Calculate scale
            const scale = maxWidth / width;
            canvas.width = width * scale;
            canvas.height = height * scale;
            
            const ctx = canvas.getContext('2d');
            
            // Apply rotation if needed
            if (rotation) {
              ctx.save();
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.drawImage(img, -width * scale / 2, -height * scale / 2, width * scale, height * scale);
              ctx.restore();
            } else {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            
            // Draw margin indicators if configured
            if (config.topMargin || config.bottomMargin) {
              this.drawMarginIndicators(ctx, canvas, config, scale);
            }
            
            URL.revokeObjectURL(img.src);
            resolve(canvas);
          } catch (error) {
            URL.revokeObjectURL(img.src);
            reject(error);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          reject(new Error('Error loading image'));
        };
        
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error rendering image to canvas:', error);
      throw error;
    }
  }

  async processFile(file, config) {
    try {
      const processedPage = await this.processImage(file, config);
      return [processedPage]; // Return array for consistency with PDF processing
    } catch (error) {
      console.error('Error processing image file:', error);
      throw error;
    }
  }

  async processImage(file, config) {
    try {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            // Detect and correct orientation
            const { width, height, rotation } = this.correctOrientation(img, config.autoRotate);
            
            // Render at high resolution for processing
            const scale = 2; // High DPI for better quality
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = width * scale;
            canvas.height = height * scale;
            
            // Apply rotation if needed
            if (rotation) {
              ctx.save();
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.drawImage(img, -width * scale / 2, -height * scale / 2, width * scale, height * scale);
              ctx.restore();
            } else {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
            
            // Process the rendered canvas
            const processedCanvas = this.processCanvas(canvas, config);
            
            URL.revokeObjectURL(img.src);
            resolve({
              canvas: processedCanvas,
              originalWidth: width,
              originalHeight: height,
              rotation: rotation,
              sourceType: 'image'
            });
          } catch (error) {
            URL.revokeObjectURL(img.src);
            reject(error);
          }
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          reject(new Error('Error loading image'));
        };
        
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  processCanvas(canvas, config) {
    try {
      // Create a new canvas for processing
      const processedCanvas = document.createElement('canvas');
      const ctx = processedCanvas.getContext('2d');
      
      // Apply margin cropping if configured
      let sourceCanvas = canvas;
      if (config.topMargin > 0 || config.bottomMargin > 0) {
        sourceCanvas = this.cropMargins(canvas, config);
      }
      
      // Auto-detect content area if enabled
      if (config.autoDetect) {
        sourceCanvas = this.detectAndCropContent(sourceCanvas);
      }
      
      // Set final canvas size
      processedCanvas.width = sourceCanvas.width;
      processedCanvas.height = sourceCanvas.height;
      
      // Draw processed content
      ctx.drawImage(sourceCanvas, 0, 0);
      
      return processedCanvas;
    } catch (error) {
      console.error('Error processing canvas:', error);
      return canvas; // Return original if processing fails
    }
  }

  correctOrientation(img, autoRotate = true) {
    if (!autoRotate) {
      return {
        width: img.width,
        height: img.height,
        rotation: 0
      };
    }
    
    // Check if image is landscape and should be rotated to portrait
    const isLandscape = img.width > img.height;
    
    if (isLandscape) {
      return {
        width: img.height,
        height: img.width,
        rotation: 90
      };
    }
    
    return {
      width: img.width,
      height: img.height,
      rotation: 0
    };
  }

  cropMargins(canvas, config) {
    try {
      const { topMargin = 0, bottomMargin = 0 } = config;
      
      // Convert mm to pixels (assuming 96 DPI)
      const topMarginPx = (topMargin / 25.4) * 96 * 2; // *2 for the scale factor
      const bottomMarginPx = (bottomMargin / 25.4) * 96 * 2;
      
      const croppedCanvas = document.createElement('canvas');
      const ctx = croppedCanvas.getContext('2d');
      
      const newHeight = Math.max(1, canvas.height - topMarginPx - bottomMarginPx);
      croppedCanvas.width = canvas.width;
      croppedCanvas.height = newHeight;
      
      ctx.drawImage(
        canvas,
        0, topMarginPx, canvas.width, newHeight,
        0, 0, canvas.width, newHeight
      );
      
      return croppedCanvas;
    } catch (error) {
      console.error('Error cropping margins:', error);
      return canvas;
    }
  }

  detectAndCropContent(canvas) {
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Find content bounds by analyzing pixel data
      const bounds = this.findContentBounds(data, canvas.width, canvas.height);
      
      if (!bounds) return canvas; // Return original if no content detected
      
      // Create cropped canvas
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      
      const width = bounds.right - bounds.left;
      const height = bounds.bottom - bounds.top;
      
      croppedCanvas.width = width;
      croppedCanvas.height = height;
      
      croppedCtx.drawImage(
        canvas,
        bounds.left, bounds.top, width, height,
        0, 0, width, height
      );
      
      return croppedCanvas;
    } catch (error) {
      console.error('Error detecting content:', error);
      return canvas;
    }
  }

  findContentBounds(data, width, height) {
    try {
      const threshold = 240; // White threshold (adjust as needed)
      let top = height, bottom = 0, left = width, right = 0;
      let hasContent = false;
      
      // Scan for non-white pixels
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          
          // Check if pixel is not white/very light
          if (r < threshold || g < threshold || b < threshold) {
            hasContent = true;
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
            left = Math.min(left, x);
            right = Math.max(right, x);
          }
        }
      }
      
      if (!hasContent) return null;
      
      // Add some padding
      const padding = 10;
      return {
        top: Math.max(0, top - padding),
        bottom: Math.min(height, bottom + padding),
        left: Math.max(0, left - padding),
        right: Math.min(width, right + padding)
      };
    } catch (error) {
      console.error('Error finding content bounds:', error);
      return null;
    }
  }

  drawMarginIndicators(context, canvas, config, scale) {
    try {
      const { topMargin = 0, bottomMargin = 0 } = config;
      
      // Convert mm to pixels
      const topMarginPx = (topMargin / 25.4) * 96 * scale;
      const bottomMarginPx = (bottomMargin / 25.4) * 96 * scale;
      
      context.save();
      context.strokeStyle = '#ff4444';
      context.lineWidth = 2;
      context.setLineDash([10, 5]);
      
      // Draw top margin line
      if (topMargin > 0) {
        context.beginPath();
        context.moveTo(0, topMarginPx);
        context.lineTo(canvas.width, topMarginPx);
        context.stroke();
      }
      
      // Draw bottom margin line
      if (bottomMargin > 0) {
        context.beginPath();
        context.moveTo(0, canvas.height - bottomMarginPx);
        context.lineTo(canvas.width, canvas.height - bottomMarginPx);
        context.stroke();
      }
      
      // Draw content area rectangle
      context.strokeRect(
        0, topMarginPx,
        canvas.width, canvas.height - topMarginPx - bottomMarginPx
      );
      
      context.restore();
    } catch (error) {
      console.error('Error drawing margin indicators:', error);
    }
  }

  // Utility method to check if file type is supported
  isSupported(fileType) {
    return this.supportedTypes.includes(fileType);
  }

  // Method to get optimal canvas size for processing
  getOptimalSize(originalWidth, originalHeight, maxSize = 2048) {
    const aspectRatio = originalWidth / originalHeight;
    
    if (originalWidth > originalHeight) {
      // Landscape
      const width = Math.min(originalWidth, maxSize);
      const height = width / aspectRatio;
      return { width, height };
    } else {
      // Portrait
      const height = Math.min(originalHeight, maxSize);
      const width = height * aspectRatio;
      return { width, height };
    }
  }

  // Method to enhance image quality
  enhanceImage(canvas) {
    try {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple contrast enhancement
      for (let i = 0; i < data.length; i += 4) {
        // Increase contrast
        const factor = 1.2; // Contrast factor
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128)); // Red
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // Green
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // Blue
      }
      
      ctx.putImageData(imageData, 0, 0);
      return canvas;
    } catch (error) {
      console.error('Error enhancing image:', error);
      return canvas;
    }
  }
}
