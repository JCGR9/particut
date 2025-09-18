/**
 * Interactive Crop Tool - Herramienta de recorte interactivo
 * Permite seleccionar y ajustar áreas de recorte con precisión
 */

export class InteractiveCropTool {
  constructor() {
    this.isActive = false;
    this.currentPage = null;
    this.cropArea = { x: 0, y: 0, width: 0, height: 0 };
    this.originalCanvas = null;
    this.previewCanvas = null;
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.resizeHandle = null;
    this.presets = {
      auto: 'Detección Automática',
      margins: 'Solo Márgenes',
      content: 'Solo Contenido',
      custom: 'Personalizado'
    };
    this.currentPreset = 'auto';
    
    this.initializeEventHandlers();
  }

  initializeEventHandlers() {
    // Crop tool buttons
    document.getElementById('crop-selected-btn')?.addEventListener('click', () => {
      this.openCropTool();
    });

    document.getElementById('close-crop-btn')?.addEventListener('click', () => {
      this.closeCropTool();
    });

    document.getElementById('apply-crop-btn')?.addEventListener('click', () => {
      this.applyCrop();
    });

    document.getElementById('reset-crop-btn')?.addEventListener('click', () => {
      this.resetCrop();
    });

    // Preset buttons
    document.querySelectorAll('.crop-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setPreset(e.target.dataset.preset);
      });
    });

    // Manual crop value inputs
    ['crop-top', 'crop-right', 'crop-bottom', 'crop-left'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', () => this.updateManualCrop());
      }
    });
  }

  async openCropTool() {
    // Get selected pages or current page
    const selectedPages = this.getSelectedPages();
    if (selectedPages.length === 0) {
      this.showNotification('Selecciona al menos una página para recortar', 'warning');
      return;
    }

    // Use first selected page for preview
    this.currentPage = selectedPages[0];
    
    // Show crop tool dialog
    const cropTool = document.getElementById('crop-tool');
    if (cropTool) {
      cropTool.style.display = 'block';
      this.isActive = true;
      
      await this.initializeCropCanvas();
      this.updatePresetButtons();
      this.setPreset('auto');
    }
  }

  closeCropTool() {
    const cropTool = document.getElementById('crop-tool');
    if (cropTool) {
      cropTool.style.display = 'none';
      this.isActive = false;
      this.currentPage = null;
      this.cleanup();
    }
  }

  async initializeCropCanvas() {
    if (!this.currentPage) return;

    // Create preview canvas in the crop tool
    const container = document.querySelector('.crop-controls');
    if (!container.querySelector('#crop-preview-canvas')) {
      const canvasContainer = document.createElement('div');
      canvasContainer.style.cssText = `
        margin: 20px 0;
        text-align: center;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 20px;
        background: #f9f9f9;
        position: relative;
      `;
      
      const canvas = document.createElement('canvas');
      canvas.id = 'crop-preview-canvas';
      canvas.style.cssText = `
        max-width: 100%;
        max-height: 400px;
        border: 1px solid #ccc;
        cursor: crosshair;
        background: white;
      `;
      
      canvasContainer.appendChild(canvas);
      container.appendChild(canvasContainer);
      
      this.previewCanvas = canvas;
      this.setupCanvasInteraction();
    }

    await this.renderPageToCanvas();
  }

  async renderPageToCanvas() {
    if (!this.currentPage || !this.previewCanvas) return;

    const ctx = this.previewCanvas.getContext('2d');
    
    // Render the page to the canvas
    if (this.currentPage.type === 'pdf') {
      await this.renderPDFPage();
    } else if (this.currentPage.type === 'image') {
      await this.renderImagePage();
    }

    // Draw crop overlay
    this.drawCropOverlay();
  }

  async renderPDFPage() {
    if (!this.currentPage.pdfPage) return;

    const viewport = this.currentPage.pdfPage.getViewport({ scale: 1 });
    const maxWidth = 500;
    const scale = maxWidth / viewport.width;
    const scaledViewport = this.currentPage.pdfPage.getViewport({ scale });

    this.previewCanvas.width = scaledViewport.width;
    this.previewCanvas.height = scaledViewport.height;

    const renderContext = {
      canvasContext: this.previewCanvas.getContext('2d'),
      viewport: scaledViewport
    };

    await this.currentPage.pdfPage.render(renderContext).promise;
  }

  async renderImagePage() {
    if (!this.currentPage.image) return;

    const img = this.currentPage.image;
    const maxWidth = 500;
    const scale = maxWidth / img.width;
    
    this.previewCanvas.width = img.width * scale;
    this.previewCanvas.height = img.height * scale;

    const ctx = this.previewCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, this.previewCanvas.width, this.previewCanvas.height);
  }

  setupCanvasInteraction() {
    const canvas = this.previewCanvas;
    
    canvas.addEventListener('mousedown', (e) => this.startDrag(e));
    canvas.addEventListener('mousemove', (e) => this.onDrag(e));
    canvas.addEventListener('mouseup', () => this.endDrag());
    canvas.addEventListener('mouseleave', () => this.endDrag());
  }

  startDrag(e) {
    const rect = this.previewCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.previewCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.previewCanvas.height / rect.height);

    this.isDragging = true;
    this.dragStart = { x, y };
    this.cropArea = { x, y, width: 0, height: 0 };
    this.setPreset('custom');
  }

  onDrag(e) {
    if (!this.isDragging) return;

    const rect = this.previewCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.previewCanvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.previewCanvas.height / rect.height);

    this.cropArea.width = x - this.dragStart.x;
    this.cropArea.height = y - this.dragStart.y;

    // Normalize negative dimensions
    if (this.cropArea.width < 0) {
      this.cropArea.x = this.dragStart.x + this.cropArea.width;
      this.cropArea.width = Math.abs(this.cropArea.width);
    } else {
      this.cropArea.x = this.dragStart.x;
    }

    if (this.cropArea.height < 0) {
      this.cropArea.y = this.dragStart.y + this.cropArea.height;
      this.cropArea.height = Math.abs(this.cropArea.height);
    } else {
      this.cropArea.y = this.dragStart.y;
    }

    this.drawCropOverlay();
    this.updateCropValues();
  }

  endDrag() {
    this.isDragging = false;
  }

  drawCropOverlay() {
    if (!this.previewCanvas) return;

    const ctx = this.previewCanvas.getContext('2d');
    
    // Redraw the page
    this.renderPageToCanvas().then(() => {
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

      // Clear the crop area
      if (this.cropArea.width > 0 && this.cropArea.height > 0) {
        ctx.clearRect(this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height);
        
        // Draw crop area border
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height);
        
        // Draw resize handles
        this.drawResizeHandles(ctx);
      }
    });
  }

  drawResizeHandles(ctx) {
    const handleSize = 8;
    const handles = [
      { x: this.cropArea.x - handleSize/2, y: this.cropArea.y - handleSize/2 }, // Top-left
      { x: this.cropArea.x + this.cropArea.width - handleSize/2, y: this.cropArea.y - handleSize/2 }, // Top-right
      { x: this.cropArea.x - handleSize/2, y: this.cropArea.y + this.cropArea.height - handleSize/2 }, // Bottom-left
      { x: this.cropArea.x + this.cropArea.width - handleSize/2, y: this.cropArea.y + this.cropArea.height - handleSize/2 } // Bottom-right
    ];

    ctx.fillStyle = '#007bff';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  }

  setPreset(preset) {
    this.currentPreset = preset;
    this.updatePresetButtons();

    switch (preset) {
      case 'auto':
        this.detectContentArea();
        break;
      case 'margins':
        this.detectMargins();
        break;
      case 'content':
        this.detectContentOnly();
        break;
      case 'custom':
        // Keep current crop area
        break;
    }

    this.drawCropOverlay();
    this.updateCropValues();
  }

  async detectContentArea() {
    if (!this.previewCanvas) return;

    // Simple content detection based on color analysis
    const ctx = this.previewCanvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    const data = imageData.data;

    let minX = this.previewCanvas.width;
    let maxX = 0;
    let minY = this.previewCanvas.height;
    let maxY = 0;

    // Scan for non-white pixels
    for (let y = 0; y < this.previewCanvas.height; y++) {
      for (let x = 0; x < this.previewCanvas.width; x++) {
        const i = (y * this.previewCanvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Consider pixel as content if it's not close to white
        const brightness = (r + g + b) / 3;
        if (brightness < 240) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // Add some padding
    const padding = 10;
    this.cropArea = {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(this.previewCanvas.width, maxX - minX + padding * 2),
      height: Math.min(this.previewCanvas.height, maxY - minY + padding * 2)
    };
  }

  detectMargins() {
    // Simple margin detection - remove outer 10% on each side
    const marginPercent = 0.1;
    const marginX = this.previewCanvas.width * marginPercent;
    const marginY = this.previewCanvas.height * marginPercent;

    this.cropArea = {
      x: marginX,
      y: marginY,
      width: this.previewCanvas.width - marginX * 2,
      height: this.previewCanvas.height - marginY * 2
    };
  }

  detectContentOnly() {
    // More aggressive content detection
    this.detectContentArea();
    
    // Reduce padding further
    const padding = 5;
    this.cropArea.x += padding;
    this.cropArea.y += padding;
    this.cropArea.width -= padding * 2;
    this.cropArea.height -= padding * 2;
  }

  updateCropValues() {
    if (!this.previewCanvas) return;

    // Convert canvas coordinates to millimeters (approximate)
    const mmPerPixel = 0.264583; // 96 DPI conversion
    
    const topMM = Math.round(this.cropArea.y * mmPerPixel);
    const rightMM = Math.round((this.previewCanvas.width - this.cropArea.x - this.cropArea.width) * mmPerPixel);
    const bottomMM = Math.round((this.previewCanvas.height - this.cropArea.y - this.cropArea.height) * mmPerPixel);
    const leftMM = Math.round(this.cropArea.x * mmPerPixel);

    document.getElementById('crop-top').value = topMM;
    document.getElementById('crop-right').value = rightMM;
    document.getElementById('crop-bottom').value = bottomMM;
    document.getElementById('crop-left').value = leftMM;
  }

  updateManualCrop() {
    if (!this.previewCanvas) return;

    const topMM = parseFloat(document.getElementById('crop-top').value) || 0;
    const rightMM = parseFloat(document.getElementById('crop-right').value) || 0;
    const bottomMM = parseFloat(document.getElementById('crop-bottom').value) || 0;
    const leftMM = parseFloat(document.getElementById('crop-left').value) || 0;

    // Convert millimeters to pixels
    const pixelsPerMM = 1 / 0.264583; // 96 DPI conversion
    
    this.cropArea = {
      x: leftMM * pixelsPerMM,
      y: topMM * pixelsPerMM,
      width: this.previewCanvas.width - (leftMM + rightMM) * pixelsPerMM,
      height: this.previewCanvas.height - (topMM + bottomMM) * pixelsPerMM
    };

    this.setPreset('custom');
    this.drawCropOverlay();
  }

  updatePresetButtons() {
    document.querySelectorAll('.crop-preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === this.currentPreset);
    });
  }

  async applyCrop() {
    const selectedPages = this.getSelectedPages();
    if (selectedPages.length === 0) return;

    this.showNotification(`Aplicando recorte a ${selectedPages.length} página(s)...`, 'info');

    try {
      for (const page of selectedPages) {
        await this.applyCropToPage(page);
      }
      
      this.showNotification('Recorte aplicado exitosamente', 'success');
      this.closeCropTool();
      
      // Emit event to update preview
      this.emit('cropApplied', { pages: selectedPages, cropArea: this.cropArea });
      
    } catch (error) {
      console.error('Error applying crop:', error);
      this.showNotification('Error al aplicar el recorte', 'error');
    }
  }

  async applyCropToPage(page) {
    // Calculate crop coordinates relative to original page
    const scaleX = page.originalWidth / this.previewCanvas.width;
    const scaleY = page.originalHeight / this.previewCanvas.height;

    const cropData = {
      x: this.cropArea.x * scaleX,
      y: this.cropArea.y * scaleY,
      width: this.cropArea.width * scaleX,
      height: this.cropArea.height * scaleY
    };

    // Store crop data on the page
    page.cropArea = cropData;
    page.isCropped = true;

    // Regenerate thumbnail with crop
    await this.generateCroppedThumbnail(page);
  }

  async generateCroppedThumbnail(page) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set thumbnail size
    const thumbnailSize = { width: 150, height: 200 };
    canvas.width = thumbnailSize.width;
    canvas.height = thumbnailSize.height;

    if (page.type === 'pdf' && page.pdfPage) {
      // Render PDF with crop
      const viewport = page.pdfPage.getViewport({ scale: 1 });
      const scale = thumbnailSize.width / page.cropArea.width;
      const renderViewport = page.pdfPage.getViewport({ scale });

      // Create temporary canvas for full page
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = renderViewport.width;
      tempCanvas.height = renderViewport.height;

      await page.pdfPage.render({
        canvasContext: tempCtx,
        viewport: renderViewport
      }).promise;

      // Draw cropped area to thumbnail
      const cropX = page.cropArea.x * scale;
      const cropY = page.cropArea.y * scale;
      const cropWidth = page.cropArea.width * scale;
      const cropHeight = page.cropArea.height * scale;

      ctx.drawImage(tempCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, thumbnailSize.width, thumbnailSize.height);

    } else if (page.type === 'image' && page.image) {
      // Draw cropped image
      ctx.drawImage(
        page.image,
        page.cropArea.x, page.cropArea.y, page.cropArea.width, page.cropArea.height,
        0, 0, thumbnailSize.width, thumbnailSize.height
      );
    }

    // Update page thumbnail
    page.thumbnail = canvas;
  }

  resetCrop() {
    this.cropArea = { x: 0, y: 0, width: 0, height: 0 };
    this.setPreset('auto');
  }

  getSelectedPages() {
    // This would be implemented to get selected pages from the main application
    // For now, return empty array
    return [];
  }

  showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  emit(event, data) {
    // Event emission would be handled by the main application
    console.log(`Event: ${event}`, data);
  }

  cleanup() {
    // Remove preview canvas
    const canvas = document.getElementById('crop-preview-canvas');
    if (canvas) {
      canvas.parentElement.remove();
    }
    
    this.previewCanvas = null;
    this.currentPage = null;
    this.cropArea = { x: 0, y: 0, width: 0, height: 0 };
  }

  // Public API methods
  getCropArea() {
    return { ...this.cropArea };
  }

  setCropArea(area) {
    this.cropArea = { ...area };
    this.drawCropOverlay();
    this.updateCropValues();
  }

  isToolActive() {
    return this.isActive;
  }

  getCurrentPreset() {
    return this.currentPreset;
  }

  getAvailablePresets() {
    return { ...this.presets };
  }
}
