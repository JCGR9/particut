// Layout Manager Module
// Handles A4 layout generation, crop marks, and final PDF composition

import { jsPDF } from 'jspdf';

export class LayoutManager {
  constructor() {
    // A4 dimensions in mm
    this.A4_WIDTH = 210;
    this.A4_HEIGHT = 297;
    
    // A4 dimensions in pixels at 96 DPI
    this.A4_WIDTH_PX = 794;
    this.A4_HEIGHT_PX = 1123;
    
    // Default margins in mm
    this.DEFAULT_MARGIN = 10;
  }

  calculateLayouts(processedPages, config) {
    const { columns = 2, rows = 3, targetWidth = 120, targetHeight = 80 } = config;
    
    const itemsPerPage = columns * rows;
    const layouts = [];
    
    for (let i = 0; i < processedPages.length; i += itemsPerPage) {
      const pageItems = processedPages.slice(i, i + itemsPerPage);
      layouts.push({
        pageNumber: Math.floor(i / itemsPerPage) + 1,
        items: pageItems,
        columns,
        rows,
        targetWidth,
        targetHeight
      });
    }
    
    return layouts;
  }

  async generateLayoutPreview(processedPages, config, pageIndex = 0) {
    try {
      const layouts = this.calculateLayouts(processedPages, config);
      
      if (pageIndex >= layouts.length) return;
      
      const layout = layouts[pageIndex];
      const canvas = document.getElementById('layoutCanvas');
      
      if (!canvas) return;
      
      await this.renderLayoutToCanvas(canvas, layout, config);
    } catch (error) {
      console.error('Error generating layout preview:', error);
    }
  }

  async renderLayoutToCanvas(canvas, layout, config) {
    try {
      // Set canvas size to A4 proportions
      const scale = 0.6; // Scale down for preview
      canvas.width = this.A4_WIDTH_PX * scale;
      canvas.height = this.A4_HEIGHT_PX * scale;
      
      const ctx = canvas.getContext('2d');
      
      // Clear and set background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw page border
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      const { columns, rows, targetWidth, targetHeight } = layout;
      
      // Calculate item dimensions in pixels
      const itemWidthMm = targetWidth;
      const itemHeightMm = targetHeight;
      const itemWidthPx = (itemWidthMm / this.A4_WIDTH) * canvas.width;
      const itemHeightPx = (itemHeightMm / this.A4_HEIGHT) * canvas.height;
      
      // Calculate spacing
      const totalContentWidth = columns * itemWidthPx;
      const totalContentHeight = rows * itemHeightPx;
      const spacingX = (canvas.width - totalContentWidth) / (columns + 1);
      const spacingY = (canvas.height - totalContentHeight) / (rows + 1);
      
      // Render each item
      for (let i = 0; i < layout.items.length; i++) {
        const row = Math.floor(i / columns);
        const col = i % columns;
        
        const x = spacingX + col * (itemWidthPx + spacingX);
        const y = spacingY + row * (itemHeightPx + spacingY);
        
        await this.renderItemToCanvas(ctx, layout.items[i], x, y, itemWidthPx, itemHeightPx, config);
      }
    } catch (error) {
      console.error('Error rendering layout to canvas:', error);
    }
  }

  async renderItemToCanvas(ctx, item, x, y, width, height, config) {
    try {
      // Draw item background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(x, y, width, height);
      
      // Draw item border
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
      
      // Scale and draw the actual content
      const sourceCanvas = item.canvas;
      if (sourceCanvas) {
        // Calculate scale to fit the item
        const scaleX = width / sourceCanvas.width;
        const scaleY = height / sourceCanvas.height;
        const scale = Math.min(scaleX, scaleY);
        
        const scaledWidth = sourceCanvas.width * scale;
        const scaledHeight = sourceCanvas.height * scale;
        
        // Center the content
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;
        
        ctx.drawImage(
          sourceCanvas,
          x + offsetX, y + offsetY,
          scaledWidth, scaledHeight
        );
      }
      
      // Draw crop marks if enabled
      if (config.cropMarks) {
        this.drawCropMarks(ctx, x, y, width, height);
      }
    } catch (error) {
      console.error('Error rendering item to canvas:', error);
    }
  }

  drawCropMarks(ctx, x, y, width, height) {
    try {
      ctx.save();
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([]);
      
      const markLength = 10;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(x - markLength, y);
      ctx.lineTo(x + markLength, y);
      ctx.moveTo(x, y - markLength);
      ctx.lineTo(x, y + markLength);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - markLength, y);
      ctx.lineTo(x + width + markLength, y);
      ctx.moveTo(x + width, y - markLength);
      ctx.lineTo(x + width, y + markLength);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(x - markLength, y + height);
      ctx.lineTo(x + markLength, y + height);
      ctx.moveTo(x, y + height - markLength);
      ctx.lineTo(x, y + height + markLength);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - markLength, y + height);
      ctx.lineTo(x + width + markLength, y + height);
      ctx.moveTo(x + width, y + height - markLength);
      ctx.lineTo(x + width, y + height + markLength);
      ctx.stroke();
      
      ctx.restore();
    } catch (error) {
      console.error('Error drawing crop marks:', error);
    }
  }

  async generateFinalPDF(processedPages, config) {
    try {
      const layouts = this.calculateLayouts(processedPages, config);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      for (let i = 0; i < layouts.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        await this.renderLayoutToPDF(pdf, layouts[i], config);
      }
      
      // Convert to blob for download
      const pdfBlob = pdf.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Error generating final PDF:', error);
      throw error;
    }
  }

  async renderLayoutToPDF(pdf, layout, config) {
    try {
      const { columns, rows, targetWidth, targetHeight } = layout;
      
      // Calculate item positions
      const totalContentWidth = columns * targetWidth;
      const totalContentHeight = rows * targetHeight;
      const spacingX = (this.A4_WIDTH - totalContentWidth) / (columns + 1);
      const spacingY = (this.A4_HEIGHT - totalContentHeight) / (rows + 1);
      
      // Render each item
      for (let i = 0; i < layout.items.length; i++) {
        const row = Math.floor(i / columns);
        const col = i % columns;
        
        const x = spacingX + col * (targetWidth + spacingX);
        const y = spacingY + row * (targetHeight + spacingY);
        
        await this.renderItemToPDF(pdf, layout.items[i], x, y, targetWidth, targetHeight, config);
      }
      
      // Draw page-level crop marks if enabled
      if (config.cropMarks) {
        this.drawPDFCropMarks(pdf, layout, spacingX, spacingY, targetWidth, targetHeight);
      }
    } catch (error) {
      console.error('Error rendering layout to PDF:', error);
    }
  }

  async renderItemToPDF(pdf, item, x, y, width, height, config) {
    try {
      const sourceCanvas = item.canvas;
      if (!sourceCanvas) return;
      
      // Convert canvas to image data
      const imgData = sourceCanvas.toDataURL('image/jpeg', 0.95);
      
      // Calculate scale to fit the target size while maintaining aspect ratio
      const sourceAspectRatio = sourceCanvas.width / sourceCanvas.height;
      const targetAspectRatio = width / height;
      
      let finalWidth = width;
      let finalHeight = height;
      let offsetX = 0;
      let offsetY = 0;
      
      if (sourceAspectRatio > targetAspectRatio) {
        // Source is wider, fit to width
        finalHeight = width / sourceAspectRatio;
        offsetY = (height - finalHeight) / 2;
      } else {
        // Source is taller, fit to height
        finalWidth = height * sourceAspectRatio;
        offsetX = (width - finalWidth) / 2;
      }
      
      // Add image to PDF
      pdf.addImage(
        imgData,
        'JPEG',
        x + offsetX,
        y + offsetY,
        finalWidth,
        finalHeight
      );
      
      // Draw individual item crop marks if enabled
      if (config.cropMarks) {
        this.drawItemCropMarks(pdf, x, y, width, height);
      }
    } catch (error) {
      console.error('Error rendering item to PDF:', error);
    }
  }

  drawItemCropMarks(pdf, x, y, width, height) {
    try {
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.1);
      
      const markLength = 3;
      
      // Top-left corner
      pdf.line(x - markLength, y, x + markLength, y);
      pdf.line(x, y - markLength, x, y + markLength);
      
      // Top-right corner
      pdf.line(x + width - markLength, y, x + width + markLength, y);
      pdf.line(x + width, y - markLength, x + width, y + markLength);
      
      // Bottom-left corner
      pdf.line(x - markLength, y + height, x + markLength, y + height);
      pdf.line(x, y + height - markLength, x, y + height + markLength);
      
      // Bottom-right corner
      pdf.line(x + width - markLength, y + height, x + width + markLength, y + height);
      pdf.line(x + width, y + height - markLength, x + width, y + height + markLength);
    } catch (error) {
      console.error('Error drawing item crop marks:', error);
    }
  }

  drawPDFCropMarks(pdf, layout, spacingX, spacingY, itemWidth, itemHeight) {
    try {
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.1);
      
      const { columns, rows } = layout;
      const markLength = 5;
      
      // Draw outer page crop marks
      const margin = 5;
      
      // Top edge marks
      for (let col = 0; col <= columns; col++) {
        const x = spacingX + col * (itemWidth + spacingX);
        pdf.line(x, margin, x, margin + markLength);
        pdf.line(x, this.A4_HEIGHT - margin - markLength, x, this.A4_HEIGHT - margin);
      }
      
      // Side edge marks
      for (let row = 0; row <= rows; row++) {
        const y = spacingY + row * (itemHeight + spacingY);
        pdf.line(margin, y, margin + markLength, y);
        pdf.line(this.A4_WIDTH - margin - markLength, y, this.A4_WIDTH - margin, y);
      }
    } catch (error) {
      console.error('Error drawing PDF crop marks:', error);
    }
  }

  // Utility method to calculate optimal layout based on content
  calculateOptimalLayout(processedPages, targetWidth, targetHeight) {
    const itemsPerA4 = this.calculateMaxItemsPerA4(targetWidth, targetHeight);
    const totalPages = Math.ceil(processedPages.length / itemsPerA4);
    
    return {
      itemsPerPage: itemsPerA4,
      totalPages,
      efficiency: (processedPages.length / (totalPages * itemsPerA4)) * 100
    };
  }

  calculateMaxItemsPerA4(itemWidth, itemHeight, minSpacing = 5) {
    const availableWidth = this.A4_WIDTH - (2 * minSpacing);
    const availableHeight = this.A4_HEIGHT - (2 * minSpacing);
    
    const maxColumns = Math.floor(availableWidth / (itemWidth + minSpacing));
    const maxRows = Math.floor(availableHeight / (itemHeight + minSpacing));
    
    return Math.max(1, maxColumns) * Math.max(1, maxRows);
  }

  // Method to suggest optimal dimensions based on content analysis
  suggestOptimalDimensions(processedPages) {
    if (processedPages.length === 0) {
      return { width: 120, height: 80 };
    }
    
    // Analyze average dimensions
    let totalWidth = 0;
    let totalHeight = 0;
    
    processedPages.forEach(page => {
      if (page.canvas) {
        totalWidth += page.canvas.width;
        totalHeight += page.canvas.height;
      }
    });
    
    const avgWidth = totalWidth / processedPages.length;
    const avgHeight = totalHeight / processedPages.length;
    const aspectRatio = avgWidth / avgHeight;
    
    // Convert to mm (assuming 96 DPI)
    const avgWidthMm = (avgWidth / 96) * 25.4;
    const avgHeightMm = (avgHeight / 96) * 25.4;
    
    // Suggest dimensions that maintain aspect ratio and fit well on A4
    let suggestedWidth = Math.min(avgWidthMm, 150);
    let suggestedHeight = suggestedWidth / aspectRatio;
    
    if (suggestedHeight > 100) {
      suggestedHeight = 100;
      suggestedWidth = suggestedHeight * aspectRatio;
    }
    
    return {
      width: Math.round(suggestedWidth),
      height: Math.round(suggestedHeight)
    };
  }
}
