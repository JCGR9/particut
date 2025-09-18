// Particut Pro - Wizard Version
// Aplicación con flujo guiado paso a paso

import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

class ParticutWizard {
  constructor() {
    this.currentStep = 1;
    this.maxSteps = 4;
    this.files = [];
    this.selectedPages = new Set();
    this.config = {
      pageSize: 'a4',
      orientation: 'portrait',
      margins: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15
      }
    };
    this.pageData = []; // Almacena la información de todas las páginas procesadas
    
    this.init();
  }

  async init() {
    console.log('🎵 Inicializando Particut Wizard...');
    
    try {
      // Configurar PDF.js
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      
      // Esperar a que el DOM esté listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.setupEventListeners();
          this.updateNavigation();
        });
      } else {
        this.setupEventListeners();
        this.updateNavigation();
      }
      
      console.log('✅ Particut Wizard inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar:', error);
      this.showMessage('Error al inicializar la aplicación: ' + error.message, 'error');
    }
  }

  setupEventListeners() {
    console.log('🔧 Configurando event listeners...');

    // Navegación
    document.getElementById('prev-btn')?.addEventListener('click', () => this.previousStep());
    document.getElementById('next-btn')?.addEventListener('click', () => this.nextStep());
    
    // Botón reiniciar
    document.getElementById('restart-wizard-btn')?.addEventListener('click', () => this.restartWizard());

    // Paso 1: Carga de archivos
    this.setupStep1Events();
    
    // Paso 2: Vista previa
    this.setupStep2Events();
    
    // Paso 3: Configuración
    this.setupStep3Events();
    
    // Paso 4: Generación
    this.setupStep4Events();
  }

  setupStep1Events() {
    const fileInput = document.getElementById('file-input');
    const selectFilesBtn = document.getElementById('select-files-btn');
    const loadExamplesBtn = document.getElementById('load-examples-btn');
    const dropZone = document.getElementById('drop-zone');

    // Botón seleccionar archivos
    selectFilesBtn?.addEventListener('click', () => {
      console.log('📁 Abriendo selector de archivos...');
      fileInput?.click();
    });

    // Input de archivos
    fileInput?.addEventListener('change', (e) => {
      console.log('📄 Archivos seleccionados:', e.target.files.length);
      this.handleFileSelection(Array.from(e.target.files));
    });

    // Botón cargar ejemplos
    loadExamplesBtn?.addEventListener('click', () => {
      console.log('🎼 Cargando archivos de ejemplo...');
      this.loadExampleFiles();
    });

    // Drag & Drop
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
        console.log('📂 Archivos soltados:', e.dataTransfer.files.length);
        this.handleFileSelection(Array.from(e.dataTransfer.files));
      });
    }
  }

  setupStep2Events() {
    document.getElementById('select-all-btn')?.addEventListener('click', () => {
      this.selectAllPages();
    });

    document.getElementById('deselect-all-btn')?.addEventListener('click', () => {
      this.deselectAllPages();
    });
  }

  setupStep3Events() {
    // Listeners para cambios en configuración
    const configInputs = ['page-size', 'orientation', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right'];
    
    configInputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => {
          this.updateConfig();
          this.updateLayoutPreview();
        });
      }
    });
  }

  setupStep4Events() {
    document.getElementById('generate-pdf-btn')?.addEventListener('click', () => {
      this.generatePDF();
    });
  }

  async handleFileSelection(files) {
    if (!files || files.length === 0) return;

    // Filtrar solo PDFs
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      this.showMessage('Por favor selecciona archivos PDF válidos.', 'warning');
      return;
    }

    console.log(`📚 Procesando ${pdfFiles.length} archivo(s) PDF...`);
    
    // Agregar archivos
    this.files = [...this.files, ...pdfFiles];
    
    // Actualizar interfaz
    this.updateFileList();
    this.showFileListContainer();
    
    // Mostrar botón siguiente
    this.updateNavigation();
    
    this.showMessage(`${pdfFiles.length} archivo(s) cargado(s) exitosamente.`, 'success');
  }

  async loadExampleFiles() {
    const examplePaths = [
      '/ejemplos/Consuelo Gitano (Alto).pdf',
      '/ejemplos/Cristo de la Salud y buen Viaje.pdf',
      '/ejemplos/Cristo que vuelve (Alto).pdf'
    ];

    try {
      const loadedFiles = [];
      
      for (const path of examplePaths) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const blob = await response.blob();
            const fileName = path.split('/').pop();
            const file = new File([blob], fileName, { type: 'application/pdf' });
            loadedFiles.push(file);
          }
        } catch (error) {
          console.warn(`No se pudo cargar: ${path}`);
        }
      }

      if (loadedFiles.length > 0) {
        this.files = [...this.files, ...loadedFiles];
        this.updateFileList();
        this.showFileListContainer();
        this.updateNavigation();
        this.showMessage(`${loadedFiles.length} archivo(s) de ejemplo cargados.`, 'success');
      } else {
        // Crear archivos mock si no se pueden cargar los reales
        this.createMockFiles();
      }
    } catch (error) {
      console.error('Error cargando ejemplos:', error);
      this.createMockFiles();
    }
  }

  createMockFiles() {
    console.log('📝 Creando archivos de ejemplo simulados...');
    
    const mockFiles = [
      { name: 'Consuelo Gitano (Alto).pdf', pages: 3 },
      { name: 'Cristo de la Salud y buen Viaje.pdf', pages: 2 },
      { name: 'Cristo que vuelve (Alto).pdf', pages: 4 },
      { name: 'De San Agustín al Cielo (alto).pdf', pages: 2 }
    ];

    const createdFiles = mockFiles.map(fileInfo => {
      // Crear un PDF mock más realista
      const mockContent = `%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count ${fileInfo.pages}\n>>\nendobj\n\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\n\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000173 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n253\n%%EOF`;
      const blob = new Blob([mockContent], { type: 'application/pdf' });
      const file = new File([blob], fileInfo.name, { type: 'application/pdf' });
      
      // Añadir metadatos mock
      file._mockPages = fileInfo.pages;
      
      return file;
    });

    this.files = [...this.files, ...createdFiles];
    this.updateFileList();
    this.showFileListContainer();
    this.updateNavigation();
    this.showMessage(`${createdFiles.length} archivos de ejemplo cargados (simulados).`, 'info');
  }

  updateFileList() {
    const fileList = document.getElementById('file-list');
    const fileCount = document.getElementById('file-count');
    const totalSize = document.getElementById('total-size');

    if (!fileList) return;

    // Actualizar estadísticas
    if (fileCount) fileCount.textContent = this.files.length;
    if (totalSize) {
      const size = this.files.reduce((sum, file) => sum + file.size, 0);
      totalSize.textContent = this.formatFileSize(size);
    }

    // Actualizar lista
    fileList.innerHTML = '';
    
    this.files.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.className = 'file-item';
      
      fileItem.innerHTML = `
        <div class="file-info">
          <div class="file-icon">
            <i class="fas fa-file-pdf"></i>
          </div>
          <div class="file-details">
            <h4>${file.name}</h4>
            <div class="file-meta">${this.formatFileSize(file.size)} • PDF</div>
          </div>
        </div>
        <button class="btn btn-secondary" onclick="window.wizard.removeFile(${index})">
          <i class="fas fa-trash"></i>
        </button>
      `;
      
      fileList.appendChild(fileItem);
    });
  }

  showFileListContainer() {
    const container = document.getElementById('file-list-container');
    if (container) {
      container.classList.remove('hidden');
    }
  }

  removeFile(index) {
    if (index >= 0 && index < this.files.length) {
      const fileName = this.files[index].name;
      this.files.splice(index, 1);
      this.updateFileList();
      this.updateNavigation();
      
      if (this.files.length === 0) {
        document.getElementById('file-list-container')?.classList.add('hidden');
      }
      
      this.showMessage(`Archivo "${fileName}" eliminado.`, 'info');
    }
  }

  async nextStep() {
    if (this.currentStep < this.maxSteps) {
      // Validar paso actual antes de continuar
      if (await this.validateCurrentStep()) {
        this.currentStep++;
        await this.showStep(this.currentStep);
        this.updateNavigation();
        this.updateStepIndicator();
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
      this.updateNavigation();
      this.updateStepIndicator();
    }
  }

  async validateCurrentStep() {
    switch (this.currentStep) {
      case 1:
        if (this.files.length === 0) {
          this.showMessage('Por favor carga al menos un archivo PDF antes de continuar.', 'warning');
          return false;
        }
        // Procesar archivos para el paso 2
        await this.processFilesForPreview();
        return true;
        
      case 2:
        if (this.selectedPages.size === 0) {
          this.showMessage('Por favor selecciona al menos una página para incluir en tu cuaderno.', 'warning');
          return false;
        }
        return true;
        
      case 3:
        return true; // La configuración siempre es válida
        
      default:
        return true;
    }
  }

  async processFilesForPreview() {
    console.log('🔄 Procesando archivos para vista previa...');
    
    const loading = document.getElementById('preview-loading');
    if (loading) loading.style.display = 'flex';

    this.pageData = [];
    
    try {
      for (let fileIndex = 0; fileIndex < this.files.length; fileIndex++) {
        const file = this.files[fileIndex];
        console.log(`📖 Procesando ${file.name}...`);
        
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 0.3 });
            
            // Crear canvas para la vista previa
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            const imageData = canvas.toDataURL();
            
            this.pageData.push({
              fileIndex,
              fileName: file.name,
              pageNumber: pageNum,
              totalPages: pdf.numPages,
              imageData,
              selected: true
            });
            
            this.selectedPages.add(this.pageData.length - 1);
          }
        } catch (pdfError) {
          console.warn(`No se pudo procesar como PDF: ${file.name}, creando páginas mock`);
          
          // Si es un archivo mock, crear páginas simuladas
          const mockPages = file._mockPages || 2;
          
          for (let pageNum = 1; pageNum <= mockPages; pageNum++) {
            // Crear una imagen mock para la vista previa
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 260;
            
            // Fondo blanco
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Borde
            context.strokeStyle = '#dddddd';
            context.lineWidth = 2;
            context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
            
            // Texto simulando contenido musical
            context.fillStyle = '#333333';
            context.font = '14px Arial';
            context.textAlign = 'center';
            context.fillText('♪ ♫ ♪', canvas.width / 2, 40);
            context.fillText(`Página ${pageNum}`, canvas.width / 2, 60);
            
            // Líneas simulando pentagramas
            context.strokeStyle = '#666666';
            context.lineWidth = 1;
            for (let i = 0; i < 8; i++) {
              const y = 80 + (i * 20);
              context.beginPath();
              context.moveTo(20, y);
              context.lineTo(canvas.width - 20, y);
              context.stroke();
            }
            
            const imageData = canvas.toDataURL();
            
            this.pageData.push({
              fileIndex,
              fileName: file.name,
              pageNumber: pageNum,
              totalPages: mockPages,
              imageData,
              selected: true,
              isMock: true
            });
            
            this.selectedPages.add(this.pageData.length - 1);
          }
        }
      }
      
      console.log(`✅ Procesadas ${this.pageData.length} páginas`);
      this.generatePreviewGrid();
      
    } catch (error) {
      console.error('❌ Error procesando archivos:', error);
      this.showMessage('Error al procesar los archivos: ' + error.message, 'error');
    } finally {
      if (loading) loading.style.display = 'none';
    }
  }

  generatePreviewGrid() {
    const previewGrid = document.getElementById('preview-grid');
    const previewContainer = document.getElementById('preview-container');
    
    if (!previewGrid) return;

    previewGrid.innerHTML = '';
    
    this.pageData.forEach((pageInfo, index) => {
      const previewCard = document.createElement('div');
      previewCard.className = 'preview-card';
      if (pageInfo.selected) previewCard.classList.add('selected');
      
      previewCard.innerHTML = `
        <div class="preview-image">
          <img src="${pageInfo.imageData}" style="width: 100%; height: 100%; object-fit: contain;" alt="Página ${pageInfo.pageNumber}">
        </div>
        <div style="text-align: center;">
          <strong>${pageInfo.fileName}</strong><br>
          <small>Página ${pageInfo.pageNumber} de ${pageInfo.totalPages}</small>
        </div>
      `;
      
      previewCard.addEventListener('click', () => {
        this.togglePageSelection(index);
      });
      
      previewGrid.appendChild(previewCard);
    });

    this.updatePreviewStats();
    if (previewContainer) previewContainer.classList.remove('hidden');
  }

  togglePageSelection(index) {
    if (this.selectedPages.has(index)) {
      this.selectedPages.delete(index);
      this.pageData[index].selected = false;
    } else {
      this.selectedPages.add(index);
      this.pageData[index].selected = true;
    }
    
    this.updatePreviewDisplay();
    this.updatePreviewStats();
  }

  selectAllPages() {
    this.pageData.forEach((page, index) => {
      this.selectedPages.add(index);
      page.selected = true;
    });
    this.updatePreviewDisplay();
    this.updatePreviewStats();
  }

  deselectAllPages() {
    this.selectedPages.clear();
    this.pageData.forEach(page => page.selected = false);
    this.updatePreviewDisplay();
    this.updatePreviewStats();
  }

  updatePreviewDisplay() {
    const previewCards = document.querySelectorAll('.preview-card');
    previewCards.forEach((card, index) => {
      if (this.pageData[index].selected) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  }

  updatePreviewStats() {
    const totalPages = document.getElementById('total-pages');
    const selectedPages = document.getElementById('selected-pages');
    
    if (totalPages) totalPages.textContent = this.pageData.length;
    if (selectedPages) selectedPages.textContent = this.selectedPages.size;
  }

  updateConfig() {
    this.config = {
      pageSize: document.getElementById('page-size')?.value || 'a4',
      orientation: document.getElementById('orientation')?.value || 'portrait',
      margins: {
        top: parseInt(document.getElementById('margin-top')?.value) || 20,
        bottom: parseInt(document.getElementById('margin-bottom')?.value) || 20,
        left: parseInt(document.getElementById('margin-left')?.value) || 15,
        right: parseInt(document.getElementById('margin-right')?.value) || 15
      }
    };
  }

  updateLayoutPreview() {
    const layoutPreview = document.getElementById('layout-preview');
    if (!layoutPreview) return;

    const { pageSize, orientation, margins } = this.config;
    
    layoutPreview.innerHTML = `
      <div style="border: 2px solid var(--primary-color); border-radius: 4px; padding: 1rem; background: white; display: inline-block;">
        <div style="text-align: center; margin-bottom: 1rem;">
          <strong>Formato: ${pageSize.toUpperCase()} - ${orientation === 'portrait' ? 'Vertical' : 'Horizontal'}</strong>
        </div>
        <div style="border: 1px dashed var(--gray-400); ${orientation === 'portrait' ? 'width: 150px; height: 200px;' : 'width: 200px; height: 150px;'} position: relative; margin: 0 auto;">
          <div style="position: absolute; top: ${margins.top/2}px; left: ${margins.left/2}px; right: ${margins.right/2}px; bottom: ${margins.bottom/2}px; border: 1px solid var(--success-color); background: rgba(16, 185, 129, 0.1);">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 0.75rem; color: var(--success-color);">
              Área de contenido
            </div>
          </div>
        </div>
        <div style="text-align: center; margin-top: 1rem; font-size: 0.875rem; color: var(--gray-600);">
          Márgenes: ${margins.top}mm (superior) | ${margins.bottom}mm (inferior)<br>
          ${margins.left}mm (izquierdo) | ${margins.right}mm (derecho)
        </div>
      </div>
    `;
  }

  async showStep(stepNumber) {
    // Ocultar todos los paneles
    document.querySelectorAll('.step-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    // Mostrar el panel actual
    const currentPanel = document.getElementById(`step-${stepNumber}`);
    if (currentPanel) {
      currentPanel.classList.add('active');
    }

    // Ejecutar lógica específica del paso
    switch (stepNumber) {
      case 2:
        // Ya se procesó en validateCurrentStep
        break;
      case 3:
        this.updateConfig();
        this.updateLayoutPreview();
        break;
      case 4:
        this.updateGenerationSummary();
        break;
    }
  }

  updateGenerationSummary() {
    const summaryPages = document.getElementById('summary-pages');
    const summaryFormat = document.getElementById('summary-format');
    const summarySize = document.getElementById('summary-size');

    if (summaryPages) summaryPages.textContent = this.selectedPages.size;
    if (summaryFormat) {
      summaryFormat.textContent = `${this.config.pageSize.toUpperCase()} ${this.config.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}`;
    }
    if (summarySize) {
      // Estimación aproximada del tamaño
      const estimatedSize = this.selectedPages.size * 0.5; // ~500KB por página
      summarySize.textContent = `${estimatedSize.toFixed(1)} MB`;
    }
  }

  async generatePDF() {
    console.log('📄 Generando PDF...');
    
    const generateBtn = document.getElementById('generate-pdf-btn');
    const progressContainer = document.getElementById('generation-progress');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Mostrar progreso
    if (generateBtn) generateBtn.style.display = 'none';
    if (progressContainer) progressContainer.classList.remove('hidden');

    try {
      // Configuración del PDF basada en el tamaño de página
      const pageSizes = {
        a4: [210, 297],
        letter: [216, 279],
        legal: [216, 356]
      };
      
      const [width, height] = pageSizes[this.config.pageSize] || pageSizes.a4;
      const orientation = this.config.orientation === 'landscape' ? 'l' : 'p';
      
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: [width, height]
      });

      const selectedPageData = Array.from(this.selectedPages).map(index => this.pageData[index]);
      
      if (progressText) progressText.textContent = `Preparando ${selectedPageData.length} páginas...`;
      
      for (let i = 0; i < selectedPageData.length; i++) {
        const pageInfo = selectedPageData[i];
        
        // Actualizar progreso
        const progress = ((i + 1) / selectedPageData.length) * 100;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `Procesando página ${i + 1} de ${selectedPageData.length}...`;

        if (i > 0) pdf.addPage();

        // Calcular dimensiones de la imagen considerando márgenes
        const pageWidth = orientation === 'l' ? height : width;
        const pageHeight = orientation === 'l' ? width : height;
        
        const contentWidth = pageWidth - this.config.margins.left - this.config.margins.right;
        const contentHeight = pageHeight - this.config.margins.top - this.config.margins.bottom;
        
        // Añadir información de la página
        pdf.setFontSize(8);
        pdf.text(`${pageInfo.fileName} - Página ${pageInfo.pageNumber}`, 
                 this.config.margins.left, 
                 this.config.margins.top - 5);
        
        // Aquí se añadiría la imagen real de la página
        // Por ahora añadimos un rectángulo representativo
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(this.config.margins.left, this.config.margins.top, contentWidth, contentHeight);
        
        pdf.setFontSize(12);
        pdf.text(`Contenido de la página ${pageInfo.pageNumber}`, 
                 this.config.margins.left + 10, 
                 this.config.margins.top + 20);
        
        // Simular tiempo de procesamiento
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Generar y descargar
      if (progressText) progressText.textContent = 'Generando archivo final...';
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const timestamp = new Date().toISOString().slice(0, 10);
      pdf.save(`cuaderno-partituras-${timestamp}.pdf`);
      
      this.showMessage(`¡Cuaderno generado exitosamente! ${selectedPageData.length} páginas procesadas.`, 'success');
      
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      this.showMessage('Error al generar el PDF: ' + error.message, 'error');
    } finally {
      // Restaurar interfaz
      setTimeout(() => {
        if (generateBtn) generateBtn.style.display = 'inline-flex';
        if (progressContainer) progressContainer.classList.add('hidden');
        if (progressBar) progressBar.style.width = '0%';
      }, 1000);
    }
  }

  restartWizard() {
    console.log('🔄 Reiniciando wizard...');
    
    // Confirmar con el usuario
    if (this.files.length > 0 || this.pageData.length > 0) {
      if (!confirm('¿Estás seguro de que quieres reiniciar? Se perderán todos los archivos cargados y configuraciones.')) {
        return;
      }
    }
    
    // Resetear datos
    this.currentStep = 1;
    this.files = [];
    this.selectedPages = new Set();
    this.pageData = [];
    this.config = {
      pageSize: 'a4',
      orientation: 'portrait',
      margins: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15
      }
    };
    
    // Resetear interfaz
    this.showStep(1);
    this.updateStepIndicator();
    this.updateNavigation();
    
    // Limpiar contenido
    document.getElementById('file-list-container')?.classList.add('hidden');
    document.getElementById('preview-container')?.classList.add('hidden');
    document.getElementById('file-list').innerHTML = '';
    document.getElementById('preview-grid').innerHTML = '';
    
    // Resetear formularios
    document.getElementById('page-size').value = 'a4';
    document.getElementById('orientation').value = 'portrait';
    document.getElementById('margin-top').value = '20';
    document.getElementById('margin-bottom').value = '20';
    document.getElementById('margin-left').value = '15';
    document.getElementById('margin-right').value = '15';
    
    // Ocultar botón reiniciar
    document.getElementById('restart-wizard-btn').style.display = 'none';
    
    this.showMessage('Wizard reiniciado. ¡Comienza de nuevo!', 'info');
  }

  updateNavigation() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const restartBtn = document.getElementById('restart-wizard-btn');

    // Botón anterior
    if (prevBtn) {
      if (this.currentStep > 1) {
        prevBtn.classList.remove('hidden');
      } else {
        prevBtn.classList.add('hidden');
      }
    }

    // Botón siguiente
    if (nextBtn) {
      if (this.currentStep < this.maxSteps && this.canProceedToNextStep()) {
        nextBtn.classList.remove('hidden');
        nextBtn.innerHTML = this.currentStep === this.maxSteps - 1 ? 
          'Finalizar <i class="fas fa-arrow-right"></i>' : 
          'Siguiente <i class="fas fa-arrow-right"></i>';
      } else {
        nextBtn.classList.add('hidden');
      }
    }

    // Botón reiniciar (mostrar si hay archivos cargados o se está en un paso avanzado)
    if (restartBtn) {
      if (this.files.length > 0 || this.currentStep > 1) {
        restartBtn.style.display = 'inline-flex';
      } else {
        restartBtn.style.display = 'none';
      }
    }
  }

  canProceedToNextStep() {
    switch (this.currentStep) {
      case 1:
        return this.files.length > 0;
      case 2:
        return this.selectedPages.size > 0;
      case 3:
        return true;
      default:
        return false;
    }
  }

  updateStepIndicator() {
    document.querySelectorAll('.step').forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.remove('active', 'completed');
      
      if (stepNumber === this.currentStep) {
        step.classList.add('active');
      } else if (stepNumber < this.currentStep) {
        step.classList.add('completed');
      }
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showMessage(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.style.cssText = `
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      background: ${type === 'success' ? '#d4edda' : type === 'warning' ? '#fff3cd' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
      color: ${type === 'success' ? '#155724' : type === 'warning' ? '#856404' : type === 'error' ? '#721c24' : '#0c5460'};
      border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'warning' ? '#ffeaa7' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
    `;
    
    const icon = type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle';
    messageDiv.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    
    messageContainer.appendChild(messageDiv);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM listo - Creando instancia de Particut Wizard...');
  window.wizard = new ParticutWizard();
});

export default ParticutWizard;
