// PDF Processor Module
// Handles PDF file processing, orientation detection, and content extraction

import * as pdfjsLib from 'pdfjs-dist';

export class PDFProcessor {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    this.isInitialized = true;
  }

  async generatePreview(file, maxHeight = 200) {
    if (!this.isInitialized) await this.init();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      if (pdf.numPages === 0) {
        throw new Error('PDF no contiene páginas válidas');
      }

      const page = await pdf.getPage(1); // First page for preview
      const viewport = page.getViewport({ scale: 1 });
      
      // Calculate scale to fit maxHeight
      const scale = maxHeight / viewport.height;
      const scaledViewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;
      
      await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
      
      return canvas;
    } catch (error) {
      console.error('Error generating PDF preview:', error);
      throw error;
    }
  }

  async getPages(file) {
    if (!this.isInitialized) await this.init();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        pages.push(page);
      }
      
      return pages;
    } catch (error) {
      console.error('Error getting PDF pages:', error);
      throw error;
    }
  }

  async renderPageToCanvas(page, canvas, maxWidth = 400, config = {}) {
    try {
      const viewport = page.getViewport({ scale: 1 });
      
      // Detect and correct orientation if needed
      const correctedViewport = this.correctOrientation(viewport, config.autoRotate);
      
      // Calculate scale
      const scale = maxWidth / correctedViewport.width;
      const scaledViewport = page.getViewport({ 
        scale, 
        rotation: correctedViewport.rotation || 0 
      });
      
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
      
      // Draw margin indicators if configured
      if (config.topMargin || config.bottomMargin) {
        this.drawMarginIndicators(context, canvas, config, scale);
      }
      
      return canvas;
    } catch (error) {
      console.error('Error rendering page to canvas:', error);
      throw error;
    }
  }

  async processFile(file, config) {
    if (!this.isInitialized) await this.init();
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const processedPages = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const processedPage = await this.processPage(page, config);
        processedPages.push(processedPage);
      }
      
      return processedPages;
    } catch (error) {
      console.error('Error processing PDF file:', error);
      throw error;
    }
  }

  async processPage(page, config) {
    try {
      const viewport = page.getViewport({ scale: 1 });
      
      // Detect and correct orientation
      const correctedViewport = this.correctOrientation(viewport, config.autoRotate);
      
      // Render at high resolution for processing
      const scale = 2; // High DPI for better quality
      const renderViewport = page.getViewport({ 
        scale, 
        rotation: correctedViewport.rotation || 0 
      });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      
      await page.render({ canvasContext: context, viewport: renderViewport }).promise;
      
      // Process the rendered canvas
      const processedCanvas = this.processCanvas(canvas, config);
      
      return {
        canvas: processedCanvas,
        originalWidth: viewport.width,
        originalHeight: viewport.height,
        rotation: correctedViewport.rotation || 0,
        sourceType: 'pdf'
      };
    } catch (error) {
      console.error('Error processing PDF page:', error);
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

  correctOrientation(viewport, autoRotate = true) {
    if (!autoRotate) return viewport;
    
    // Check if page is landscape and should be rotated to portrait
    const isLandscape = viewport.width > viewport.height;
    
    if (isLandscape) {
      return {
        ...viewport,
        rotation: 90,
        width: viewport.height,
        height: viewport.width
      };
    }
    
    return viewport;
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
}
