// Particut Pro - Sistema Inteligente de Procesamiento de Partituras (Versión Restaurada)
// Versión funcional simplificada con detección automática básica

import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

class ParticutPro {
    constructor() {
        this.files = [];
        this.currentFileIndex = 0;
        this.currentPageIndex = 0;
        this.pages = []; // Todas las páginas de todos los archivos
        this.zoom = 1;
        this.rotation = 0;
        this.cropData = null;
        this.isManualCropMode = false;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.canvas = null;
        this.ctx = null;
        this.originalImageData = null;
        
        this.init();
    }

    async init() {
        console.log('🎵 Inicializando Particut Pro...');
        
        try {
            // Configurar PDF.js
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
            
            // Obtener elementos del DOM
            this.canvas = document.getElementById('preview-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            // Setup event listeners
            this.setupEventListeners();
            this.updateStatus('Listo para cargar archivos');
            
            console.log('✅ Particut Pro inicializado');
        } catch (error) {
            console.error('❌ Error al inicializar:', error);
            this.updateStatus('Error al inicializar la aplicación');
        }
    }

    setupEventListeners() {
        // File upload
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const selectFilesBtn = document.getElementById('select-files');
        const loadExamplesBtn = document.getElementById('load-examples');

        // Drop zone
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('active');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');
            this.handleFileSelection(Array.from(e.dataTransfer.files));
        });

        // File input
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(Array.from(e.target.files));
        });

        selectFilesBtn.addEventListener('click', () => fileInput.click());
        loadExamplesBtn.addEventListener('click', () => this.loadExamples());

        // Navigation
        document.getElementById('prev-page').addEventListener('click', () => this.previousPage());
        document.getElementById('next-page').addEventListener('click', () => this.nextPage());

        // Zoom
        const zoomSlider = document.getElementById('zoom-slider');
        zoomSlider.addEventListener('input', (e) => {
            this.zoom = parseFloat(e.target.value);
            document.getElementById('zoom-value').textContent = Math.round(this.zoom * 100) + '%';
            this.redrawCanvas();
        });

        document.getElementById('fit-width').addEventListener('click', () => this.fitToWidth());
        document.getElementById('fit-height').addEventListener('click', () => this.fitToHeight());

        // Rotation
        document.getElementById('rotate-left').addEventListener('click', () => this.rotate(-90));
        document.getElementById('rotate-right').addEventListener('click', () => this.rotate(90));

        // Crop tools
        document.getElementById('auto-detect-btn').addEventListener('click', () => this.autoDetect());
        document.getElementById('manual-crop-btn').addEventListener('click', () => this.toggleManualCrop());
        document.getElementById('apply-crop-btn').addEventListener('click', () => this.applyCrop());
        document.getElementById('reset-crop-btn').addEventListener('click', () => this.resetCrop());

        // Detection threshold
        const thresholdSlider = document.getElementById('detection-threshold');
        thresholdSlider.addEventListener('input', (e) => {
            document.getElementById('threshold-value').textContent = e.target.value;
        });

        // Final generation
        document.getElementById('generate-pdf-btn').addEventListener('click', () => this.generateFinalPDF());

        // Size preview
        document.getElementById('final-width').addEventListener('input', () => this.updateSizePreview());
        document.getElementById('final-height').addEventListener('input', () => this.updateSizePreview());

        // Canvas mouse events for manual cropping
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Other controls
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'flex';
        });

        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }

    async handleFileSelection(files) {
        const pdfFiles = files.filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            this.showNotification('Por favor selecciona archivos PDF válidos', 'warning');
            return;
        }

        this.updateStatus('Cargando archivos...');
        this.setProgress(0);

        try {
            for (let i = 0; i < pdfFiles.length; i++) {
                const file = pdfFiles[i];
                this.setProgress((i / pdfFiles.length) * 50); // 50% para cargar archivos
                
                await this.processFile(file);
            }

            this.files = pdfFiles;
            this.updateFileList();
            this.showCropSection();
            
            if (this.pages.length > 0) {
                this.currentPageIndex = 0;
                await this.displayCurrentPage();
            }

            this.updateStatus(`${pdfFiles.length} archivo(s) cargado(s) - ${this.pages.length} página(s) total`);
            this.setProgress(100);
            
            setTimeout(() => this.setProgress(0), 1000);
            
        } catch (error) {
            console.error('Error procesando archivos:', error);
            this.updateStatus('Error al procesar archivos');
            this.showNotification('Error al procesar algunos archivos', 'error');
        }
    }

    async processFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                
                // Crear canvas para renderizar la página
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                const imageData = canvas.toDataURL();
                
                this.pages.push({
                    fileName: file.name,
                    pageNumber: pageNum,
                    totalPages: pdf.numPages,
                    imageData: imageData,
                    canvas: canvas,
                    viewport: viewport,
                    originalData: imageData,
                    cropData: null,
                    processed: false
                });
            }
        } catch (error) {
            console.error(`Error procesando ${file.name}:`, error);
            throw error;
        }
    }

    async loadExamples() {
        this.updateStatus('Cargando archivos de ejemplo...');
        
        // Crear archivos mock más realistas
        const mockFiles = [
            { name: 'Consuelo Gitano (Alto).pdf', pages: 3 },
            { name: 'Cristo de la Salud y buen Viaje.pdf', pages: 2 },
            { name: 'Cristo que vuelve (Alto).pdf', pages: 4 }
        ];

        try {
            this.pages = [];
            
            for (const mockFile of mockFiles) {
                for (let pageNum = 1; pageNum <= mockFile.pages; pageNum++) {
                    const mockPageData = this.createMockPage(mockFile.name, pageNum, mockFile.pages);
                    this.pages.push(mockPageData);
                }
            }

            this.files = mockFiles.map(f => ({ name: f.name, type: 'application/pdf' }));
            this.updateFileList();
            this.showCropSection();
            
            if (this.pages.length > 0) {
                this.currentPageIndex = 0;
                await this.displayCurrentPage();
            }

            this.updateStatus(`Ejemplos cargados - ${this.pages.length} páginas`);
            this.showNotification('Archivos de ejemplo cargados', 'success');
            
        } catch (error) {
            console.error('Error cargando ejemplos:', error);
            this.updateStatus('Error cargando ejemplos');
        }
    }

    createMockPage(fileName, pageNumber, totalPages) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 800;

        // Fondo blanco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simular contenido de partitura
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px serif';
        ctx.textAlign = 'center';
        ctx.fillText(fileName.replace('.pdf', ''), canvas.width / 2, 50);

        ctx.font = '16px serif';
        ctx.fillText(`Página ${pageNumber} de ${totalPages}`, canvas.width / 2, 80);

        // Simular pentagramas
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        for (let staff = 0; staff < 10; staff++) {
            const startY = 120 + (staff * 60);
            
            // 5 líneas por pentagrama
            for (let line = 0; line < 5; line++) {
                const y = startY + (line * 8);
                ctx.beginPath();
                ctx.moveTo(50, y);
                ctx.lineTo(canvas.width - 50, y);
                ctx.stroke();
            }

            // Simular notas
            ctx.fillStyle = '#000000';
            for (let note = 0; note < 8; note++) {
                const x = 80 + (note * 60);
                const y = startY + Math.random() * 32;
                ctx.beginPath();
                ctx.ellipse(x, y, 4, 3, -0.3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        const imageData = canvas.toDataURL();
        
        return {
            fileName: fileName,
            pageNumber: pageNumber,
            totalPages: totalPages,
            imageData: imageData,
            canvas: canvas,
            originalData: imageData,
            cropData: null,
            processed: false,
            isMock: true
        };
    }

    updateFileList() {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';

        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <div>
                        <div style="font-weight: 500;">${file.name}</div>
                        <div style="font-size: 0.75rem; color: #666;">
                            ${this.pages.filter(p => p.fileName === file.name).length} páginas
                        </div>
                    </div>
                </div>
                <button onclick="window.particut.removeFile(${index})" class="btn btn-secondary" style="padding: 0.5rem;">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            fileList.appendChild(fileItem);
        });
    }

    showCropSection() {
        document.getElementById('crop-section').style.display = 'block';
        document.getElementById('config-section').style.display = 'block';
    }

    async displayCurrentPage() {
        if (this.pages.length === 0) return;

        const currentPage = this.pages[this.currentPageIndex];
        document.getElementById('welcome-message').classList.add('hidden');
        this.canvas.classList.remove('hidden');

        // Cargar imagen
        const img = new Image();
        img.onload = () => {
            this.originalImageData = img;
            this.redrawCanvas();
            this.updatePageInfo();
            this.updateNavigation();
        };
        img.src = currentPage.imageData;
    }

    redrawCanvas() {
        if (!this.originalImageData) return;

        const container = document.getElementById('canvas-container');
        const containerRect = container.getBoundingClientRect();
        
        // Calcular tamaño del canvas basado en zoom y rotación
        let displayWidth = this.originalImageData.width * this.zoom;
        let displayHeight = this.originalImageData.height * this.zoom;

        if (Math.abs(this.rotation) === 90 || Math.abs(this.rotation) === 270) {
            [displayWidth, displayHeight] = [displayHeight, displayWidth];
        }

        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';

        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Aplicar transformaciones
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.rotate((this.rotation * Math.PI) / 180);
        this.ctx.scale(this.zoom, this.zoom);

        // Dibujar imagen
        this.ctx.drawImage(
            this.originalImageData,
            -this.originalImageData.width / 2,
            -this.originalImageData.height / 2
        );

        this.ctx.restore();

        // Redibujar crop overlay si existe
        setTimeout(() => this.drawCropOverlay(), 50); // Pequeño delay para que el DOM se actualice
    }

    drawCropOverlay() {
        if (!this.cropData) return;

        const overlay = document.getElementById('crop-overlay');
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = document.getElementById('canvas-container').getBoundingClientRect();
        
        // Calcular posición absoluta del overlay
        const canvasLeft = canvasRect.left - containerRect.left;
        const canvasTop = canvasRect.top - containerRect.top;
        
        // Considerar transformaciones aplicadas al canvas
        let x, y, width, height;
        
        if (Math.abs(this.rotation) === 90 || Math.abs(this.rotation) === 270) {
            // Canvas rotado 90° o 270°
            x = canvasLeft + (this.cropData.y * this.zoom);
            y = canvasTop + (this.cropData.x * this.zoom);
            width = this.cropData.height * this.zoom;
            height = this.cropData.width * this.zoom;
        } else {
            // Canvas normal o rotado 180°
            x = canvasLeft + (this.cropData.x * this.zoom);
            y = canvasTop + (this.cropData.y * this.zoom);
            width = this.cropData.width * this.zoom;
            height = this.cropData.height * this.zoom;
        }

        overlay.style.left = x + 'px';
        overlay.style.top = y + 'px';
        overlay.style.width = width + 'px';
        overlay.style.height = height + 'px';
        overlay.style.display = 'block';
        
        // Actualizar información del recorte
        this.updateCropInfo();
    }

    updateCropInfo() {
        if (!this.cropData) return;
        
        const info = document.createElement('div');
        info.id = 'crop-info';
        info.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            z-index: 1001;
        `;
        
        const widthMm = (this.cropData.width / 3.78).toFixed(1);
        const heightMm = (this.cropData.height / 3.78).toFixed(1);
        
        info.innerHTML = `
            Área seleccionada:<br>
            ${Math.round(this.cropData.width)} × ${Math.round(this.cropData.height)} px<br>
            ${widthMm} × ${heightMm} mm
        `;
        
        // Remover info anterior
        const existingInfo = document.getElementById('crop-info');
        if (existingInfo) existingInfo.remove();
        
        document.getElementById('canvas-container').appendChild(info);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            const infoElement = document.getElementById('crop-info');
            if (infoElement) infoElement.remove();
        }, 3000);
    }

    async autoDetect() {
        if (this.pages.length === 0) return;

        this.updateStatus('Detectando contenido automáticamente...');
        document.getElementById('crop-controls').style.display = 'block';

        try {
            const threshold = parseFloat(document.getElementById('detection-threshold').value);
            const currentPage = this.pages[this.currentPageIndex];
            
            // Simular detección inteligente usando análisis de imagen
            const detectedArea = await this.detectContentArea(currentPage.canvas, threshold);
            
            if (detectedArea) {
                this.cropData = detectedArea;
                this.drawCropOverlay();
                this.updateStatus('Contenido detectado automáticamente');
                this.showNotification('Área de contenido detectada', 'success');
            } else {
                this.updateStatus('No se pudo detectar contenido automáticamente');
                this.showNotification('Prueba ajustando la sensibilidad', 'warning');
            }
        } catch (error) {
            console.error('Error en detección automática:', error);
            this.updateStatus('Error en detección automática');
        }
    }

    async detectContentArea(canvas, threshold) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Detección simple y efectiva que funcionaba bien
        const width = canvas.width;
        const height = canvas.height;
        
        console.log('🎵 Detección automática iniciada:', { width, height, threshold });
        
        // Convertir a escala de grises
        const grayData = new Uint8Array(width * height);
        for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
            grayData[i / 4] = gray;
        }

        // Buscar contenido (píxeles no blancos)
        const thresholdValue = 255 * (1 - threshold);
        let minX = width, maxX = 0, minY = height, maxY = 0;
        let hasContent = false;

        // Buscar en toda la imagen pero excluyendo bordes extremos
        for (let y = Math.floor(height * 0.05); y < Math.floor(height * 0.95); y++) {
            for (let x = Math.floor(width * 0.05); x < Math.floor(width * 0.95); x++) {
                const pixel = grayData[y * width + x];
                if (pixel < thresholdValue) {
                    hasContent = true;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (!hasContent) {
            console.log('⚠️ No se detectó contenido');
            return null;
        }

        // Añadir márgenes pequeños
        const marginX = Math.max(10, (maxX - minX) * 0.02);
        const marginY = Math.max(10, (maxY - minY) * 0.02);
        
        const bounds = {
            x: Math.max(0, minX - marginX),
            y: Math.max(0, minY - marginY),
            width: Math.min(width - Math.max(0, minX - marginX), (maxX - minX) + 2 * marginX),
            height: Math.min(height - Math.max(0, minY - marginY), (maxY - minY) + 2 * marginY)
        };

        console.log('✅ Contenido detectado:', bounds);
        return this.applyMargins(bounds, width, height);
    }

    detectStaffLines(grayData, width, height, threshold) {
        const staffLines = [];
        const thresholdValue = 255 * (1 - threshold);
        const minLineLength = width * 0.3; // Línea debe cubrir al menos 30% del ancho
        
        // Buscar líneas horizontales (pentagramas)
        for (let y = 20; y < height - 20; y += 2) {
            let linePixels = 0;
            let lineStart = -1;
            
            for (let x = 0; x < width; x++) {
                const pixel = grayData[y * width + x];
                
                if (pixel < thresholdValue) {
                    if (lineStart === -1) lineStart = x;
                    linePixels++;
                } else {
                    if (linePixels > minLineLength && lineStart !== -1) {
                        // Verificar que es realmente una línea horizontal (no más de 3px de alto)
                        if (this.isHorizontalLine(grayData, width, height, lineStart, x, y, thresholdValue)) {
                            staffLines.push({
                                y: y,
                                startX: lineStart,
                                endX: x,
                                length: linePixels
                            });
                        }
                    }
                    linePixels = 0;
                    lineStart = -1;
                }
            }
        }

        // Filtrar y agrupar líneas que forman pentagramas
        return this.groupStaffLines(staffLines);
    }

    isHorizontalLine(grayData, width, height, startX, endX, y, threshold) {
        // Verificar que la línea es consistentemente horizontal
        for (let x = startX; x < endX; x++) {
            let darkPixels = 0;
            for (let dy = -1; dy <= 1; dy++) {
                const checkY = y + dy;
                if (checkY >= 0 && checkY < height) {
                    if (grayData[checkY * width + x] < threshold) {
                        darkPixels++;
                    }
                }
            }
            if (darkPixels < 2) return false; // Debe tener al menos 2 píxeles oscuros verticalmente
        }
        return true;
    }

    detectMusicContentBounds(grayData, width, height, staffLines, threshold) {
        const thresholdValue = 255 * (1 - threshold);
        let minY = height, maxY = 0;
        
        // Obtener rango vertical de todos los pentagramas
        const staffMinY = Math.min(...staffLines.map(s => s.y));
        const staffMaxY = Math.max(...staffLines.map(s => s.y));
        const staffRange = staffMaxY - staffMinY;
        
        // Buscar contenido musical por sistemas/secciones
        const musicSystems = this.detectMusicSystems(grayData, width, height, staffLines, thresholdValue);
        
        if (musicSystems.length > 0) {
            // Usar los límites reales de los sistemas musicales
            minY = Math.min(...musicSystems.map(s => s.minY));
            maxY = Math.max(...musicSystems.map(s => s.maxY));
        } else {
            // Fallback: expandir la búsqueda un poco más allá de los pentagramas
            const searchMinY = Math.max(0, staffMinY - staffRange * 0.3);
            const searchMaxY = Math.min(height, staffMaxY + staffRange * 0.2); // Menos expansión hacia abajo
            
            // Buscar contenido musical real en la región controlada
            for (let y = searchMinY; y < searchMaxY; y++) {
                let hasContentInRow = false;
                for (let x = 0; x < width; x++) {
                    const pixel = grayData[y * width + x];
                    if (pixel < thresholdValue) {
                        if (this.isMusicContent(grayData, width, height, x, y, thresholdValue)) {
                            minY = Math.min(minY, y);
                            maxY = Math.max(maxY, y);
                            hasContentInRow = true;
                        }
                    }
                }
                
                // Si encontramos contenido, verificar que no sea pie de página
                if (hasContentInRow && y > height * 0.85) {
                    // Verificar si es texto de pie de página (típicamente pequeño y centrado)
                    if (this.isFooterContent(grayData, width, height, y, thresholdValue)) {
                        break; // Parar aquí, no incluir pie de página
                    }
                }
            }
        }
        
        return { minY, maxY };
    }

    detectMusicSystems(grayData, width, height, staffLines, thresholdValue) {
        const systems = [];
        const staffGroups = this.groupStaffLinesIntoSystems(staffLines);
        
        staffGroups.forEach(staffGroup => {
            const systemMinY = Math.min(...staffGroup.map(s => s.y));
            const systemMaxY = Math.max(...staffGroup.map(s => s.y));
            
            // Buscar contenido musical real alrededor de este sistema
            let contentMinY = systemMinY;
            let contentMaxY = systemMaxY;
            
            // Buscar hacia arriba para dinámicas, texto, etc.
            for (let y = systemMinY - 1; y >= Math.max(0, systemMinY - 40); y--) {
                if (this.hasSignificantContent(grayData, width, y, thresholdValue)) {
                    contentMinY = y;
                } else if (systemMinY - y > 15) {
                    break; // Si hay más de 15px sin contenido, parar
                }
            }
            
            // Buscar hacia abajo para dinámicas, texto, etc.
            for (let y = systemMaxY + 1; y < Math.min(height, systemMaxY + 40); y++) {
                if (this.hasSignificantContent(grayData, width, y, thresholdValue)) {
                    contentMaxY = y;
                } else if (y - systemMaxY > 15) {
                    break; // Si hay más de 15px sin contenido, parar
                }
            }
            
            systems.push({
                minY: contentMinY,
                maxY: contentMaxY,
                staffLines: staffGroup
            });
        });
        
        return systems;
    }

    groupStaffLinesIntoSystems(staffLines) {
        if (staffLines.length === 0) return [];
        
        const systems = [];
        let currentSystem = [staffLines[0]];
        
        for (let i = 1; i < staffLines.length; i++) {
            const currentLine = staffLines[i];
            const previousLine = staffLines[i - 1];
            const gap = currentLine.y - previousLine.y;
            
            // Si el espacio es mayor a 30px, es probablemente un nuevo sistema
            if (gap > 30) {
                systems.push(currentSystem);
                currentSystem = [currentLine];
            } else {
                currentSystem.push(currentLine);
            }
        }
        
        systems.push(currentSystem);
        return systems.filter(system => system.length >= 2); // Solo sistemas con al menos 2 líneas
    }

    hasSignificantContent(grayData, width, y, thresholdValue) {
        let darkPixels = 0;
        const minContentPixels = width * 0.02; // Al menos 2% del ancho debe tener contenido
        
        for (let x = 0; x < width; x++) {
            if (grayData[y * width + x] < thresholdValue) {
                darkPixels++;
                if (darkPixels >= minContentPixels) {
                    return true;
                }
            }
        }
        
        return false;
    }

    isFooterContent(grayData, width, height, y, thresholdValue) {
        // Verificar si el contenido en esta fila parece ser pie de página
        let contentPixels = 0;
        let contentStart = -1;
        let contentEnd = -1;
        
        // Contar píxeles de contenido y encontrar límites
        for (let x = 0; x < width; x++) {
            if (grayData[y * width + x] < thresholdValue) {
                if (contentStart === -1) contentStart = x;
                contentEnd = x;
                contentPixels++;
            }
        }
        
        if (contentPixels === 0) return false;
        
        const contentWidth = contentEnd - contentStart;
        const contentCenter = (contentStart + contentEnd) / 2;
        const pageCenter = width / 2;
        
        // Es pie de página si:
        // 1. Está en el 15% inferior de la página
        // 2. El contenido es relativamente pequeño (menos del 40% del ancho)
        // 3. Está centrado o casi centrado
        const isInFooterArea = y > height * 0.85;
        const isSmallContent = contentWidth < width * 0.4;
        const isCentered = Math.abs(contentCenter - pageCenter) < width * 0.15;
        
        return isInFooterArea && isSmallContent && isCentered;
    }

    isMusicContent(grayData, width, height, x, y, threshold) {
        // Verificar si el píxel forma parte de contenido musical significativo
        // (no ruido o artefactos)
        let darkNeighbors = 0;
        const radius = 2;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const checkX = x + dx;
                const checkY = y + dy;
                if (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
                    if (grayData[checkY * width + checkX] < threshold) {
                        darkNeighbors++;
                    }
                }
            }
        }
        
        // Si tiene suficientes píxeles oscuros cerca, probablemente es contenido musical
        return darkNeighbors >= 3;
    }

    calculateAverageStaffSpacing(staffLines) {
        if (staffLines.length < 2) return 10; // Valor por defecto
        
        const spacings = [];
        staffLines.sort((a, b) => a.y - b.y);
        
        for (let i = 1; i < staffLines.length; i++) {
            spacings.push(staffLines[i].y - staffLines[i-1].y);
        }
        
        // Calcular promedio, excluyendo espacios muy grandes (entre sistemas)
        const validSpacings = spacings.filter(s => s < 50); // Espacios mayores a 50px son entre sistemas
        const average = validSpacings.reduce((a, b) => a + b, 0) / validSpacings.length;
        
        return average || 10;
    }

    groupStaffLines(staffLines) {
        // Agrupar líneas que están cerca entre sí (pentagramas típicos tienen 5 líneas)
        const groups = [];
        staffLines.sort((a, b) => a.y - b.y);
        
        for (const line of staffLines) {
            let addedToGroup = false;
            for (const group of groups) {
                const lastLine = group[group.length - 1];
                if (line.y - lastLine.y < 25) { // Líneas de pentagrama típicamente están separadas por ~8-12px
                    group.push(line);
                    addedToGroup = true;
                    break;
                }
            }
            if (!addedToGroup) {
                groups.push([line]);
            }
        }

        // Retornar todas las líneas de grupos con al menos 3 líneas (pentagramas parciales)
        return groups.filter(group => group.length >= 3).flat();
    }

    detectHorizontalBounds(grayData, width, height, minY, maxY, threshold) {
        const thresholdValue = 255 * (1 - threshold);
        let minX = width, maxX = 0;

        // Analizar solo la región vertical donde está la música
        for (let y = Math.floor(minY); y < Math.ceil(maxY); y++) {
            for (let x = 0; x < width; x++) {
                if (grayData[y * width + x] < thresholdValue) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                }
            }
        }

        // Expandir horizontalmente pero de forma más conservadora
        const contentWidth = maxX - minX;
        const expansionH = Math.min(contentWidth * 0.03, 15); // Máximo 15px de expansión horizontal
        minX = Math.max(0, minX - expansionH);
        maxX = Math.min(width, maxX + expansionH);

        // VALIDACIÓN: Si el área horizontal es más del 85% del ancho, reducir
        const widthPercentage = ((maxX - minX) / width) * 100;
        
        console.log('↔️ Análisis horizontal:', {
            originalBounds: { minX, maxX, width: maxX - minX },
            widthPercentage: widthPercentage.toFixed(1) + '%'
        });
        
        if (widthPercentage > 85) {
            console.log('⚠️ Ancho detectado demasiado grande, centrando...');
            const centerX = width / 2;
            const optimalWidth = width * 0.75; // Máximo 75% del ancho
            minX = Math.max(0, centerX - optimalWidth / 2);
            maxX = Math.min(width, centerX + optimalWidth / 2);
            
            console.log('✂️ Ancho reducido a:', { newMinX: minX, newMaxX: maxX, newWidth: maxX - minX });
        }

        return { minX, maxX };
    }

    detectGeneralContent(grayData, width, height, threshold) {
        const thresholdValue = 255 * (1 - threshold);
        let minX = width, maxX = 0, minY = height, maxY = 0;
        let contentPixels = 0;

        console.log('🔍 Fallback: Detección general de contenido');

        // Detectar cualquier contenido no blanco, pero excluir áreas problemáticas
        for (let y = 0; y < height; y++) {
            // Saltar áreas que típicamente contienen pie de página o encabezados
            if (y < height * 0.05 || y > height * 0.9) continue;
            
            for (let x = 0; x < width; x++) {
                // Saltar márgenes extremos
                if (x < width * 0.05 || x > width * 0.95) continue;
                
                const pixel = grayData[y * width + x];
                if (pixel < thresholdValue) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                    contentPixels++;
                }
            }
        }

        // Si hay muy poco contenido, probablemente es ruido
        if (contentPixels < (width * height) * 0.01) {
            console.log('⚠️ Muy poco contenido detectado');
            return null;
        }

        // Reducir el área detectada si es demasiado grande
        const detectedArea = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
        
        const areaPercentage = ((detectedArea.width * detectedArea.height) / (width * height)) * 100;
        
        console.log('📊 Área general detectada:', {
            bounds: detectedArea,
            areaPercentage: areaPercentage.toFixed(1) + '%'
        });
        
        // Si el área es más del 60% de la página, centrar y reducir
        if (areaPercentage > 60) {
            console.log('✂️ Reduciendo área detectada...');
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const targetWidth = width * 0.6;
            const targetHeight = height * 0.5;
            
            detectedArea.x = Math.max(0, centerX - targetWidth / 2);
            detectedArea.y = Math.max(0, centerY - targetHeight / 2);
            detectedArea.width = Math.min(width - detectedArea.x, targetWidth);
            detectedArea.height = Math.min(height - detectedArea.y, targetHeight);
        }

        return this.applyMargins(detectedArea, width, height);
    }

    applyMargins(bounds, canvasWidth, canvasHeight) {
        const marginTop = parseInt(document.getElementById('margin-top').value) || 5;
        const marginBottom = parseInt(document.getElementById('margin-bottom').value) || 5;
        const marginLeft = parseInt(document.getElementById('margin-left').value) || 5;
        const marginRight = parseInt(document.getElementById('margin-right').value) || 5;

        // Convertir mm a pixels (aproximado: 1mm ≈ 3.78 pixels a 96 DPI)
        const mmToPx = 3.78;
        
        // Aplicar márgenes pero asegurar que no excedemos los límites del canvas
        const finalBounds = {
            x: Math.max(0, bounds.x - marginLeft * mmToPx),
            y: Math.max(0, bounds.y - marginTop * mmToPx),
            width: Math.min(canvasWidth - Math.max(0, bounds.x - marginLeft * mmToPx), 
                          bounds.width + (marginLeft + marginRight) * mmToPx),
            height: Math.min(canvasHeight - Math.max(0, bounds.y - marginTop * mmToPx), 
                           bounds.height + (marginTop + marginBottom) * mmToPx)
        };
        
        // ELIMINADO: Las validaciones de dimensiones mínimas que forzaban áreas grandes
        // Ahora respetamos exactamente lo que detectó el algoritmo de contenido musical
        
        console.log('🎯 Aplicando márgenes:', {
            original: bounds,
            margins: { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight },
            final: finalBounds,
            reductionPercent: {
                width: ((finalBounds.width / canvasWidth) * 100).toFixed(1) + '%',
                height: ((finalBounds.height / canvasHeight) * 100).toFixed(1) + '%'
            }
        });
        
        return finalBounds;
    }

    toggleManualCrop() {
        this.isManualCropMode = !this.isManualCropMode;
        const btn = document.getElementById('manual-crop-btn');
        const canvasContainer = document.getElementById('canvas-container');
        
        if (this.isManualCropMode) {
            btn.textContent = 'Cancelar Recorte Manual';
            btn.classList.add('btn-secondary');
            btn.classList.remove('btn-primary');
            btn.innerHTML = '<i class="fas fa-times"></i> Cancelar Recorte Manual';
            
            this.canvas.style.cursor = 'crosshair';
            canvasContainer.style.border = '2px dashed var(--primary)';
            
            document.getElementById('crop-controls').style.display = 'block';
            this.updateStatus('Haz clic y arrastra para seleccionar área de recorte');
            this.showNotification('Modo recorte manual activado. Haz clic y arrastra sobre la imagen', 'info');
        } else {
            btn.textContent = 'Recorte Manual';
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-secondary');
            btn.innerHTML = '<i class="fas fa-crop-alt"></i> Recorte Manual';
            
            this.canvas.style.cursor = 'default';
            canvasContainer.style.border = 'none';
            
            this.updateStatus('Modo recorte manual desactivado');
            
            // Limpiar cualquier selección en progreso
            if (this.isDragging) {
                this.isDragging = false;
                document.body.style.cursor = 'default';
            }
        }
    }

    onMouseDown(e) {
        if (!this.isManualCropMode) return;

        const rect = this.canvas.getBoundingClientRect();
        const containerRect = document.getElementById('canvas-container').getBoundingClientRect();
        
        // Calcular posición relativa al canvas considerando scroll
        const scrollLeft = document.getElementById('canvas-container').scrollLeft || 0;
        const scrollTop = document.getElementById('canvas-container').scrollTop || 0;
        
        this.isDragging = true;
        this.dragStart = {
            x: (e.clientX - rect.left + scrollLeft) / this.zoom,
            y: (e.clientY - rect.top + scrollTop) / this.zoom
        };
        
        // Ocultar overlay existente
        document.getElementById('crop-overlay').style.display = 'none';
        
        // Agregar clase para cambiar cursor durante el arrastre
        document.body.style.cursor = 'crosshair';
    }

    onMouseMove(e) {
        if (!this.isManualCropMode || !this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const scrollLeft = document.getElementById('canvas-container').scrollLeft || 0;
        const scrollTop = document.getElementById('canvas-container').scrollTop || 0;
        
        const currentPos = {
            x: (e.clientX - rect.left + scrollLeft) / this.zoom,
            y: (e.clientY - rect.top + scrollTop) / this.zoom
        };

        // Calcular dimensiones del rectángulo
        const x = Math.min(this.dragStart.x, currentPos.x);
        const y = Math.min(this.dragStart.y, currentPos.y);
        const width = Math.abs(currentPos.x - this.dragStart.x);
        const height = Math.abs(currentPos.y - this.dragStart.y);

        // Limitar a los bordes del canvas
        const maxX = this.originalImageData.width / this.zoom;
        const maxY = this.originalImageData.height / this.zoom;
        
        this.cropData = { 
            x: Math.max(0, Math.min(x, maxX)), 
            y: Math.max(0, Math.min(y, maxY)), 
            width: Math.min(width, maxX - x), 
            height: Math.min(height, maxY - y) 
        };
        
        this.drawCropOverlay();
    }

    onMouseUp(e) {
        if (!this.isManualCropMode) return;
        
        this.isDragging = false;
        document.body.style.cursor = 'default';
        
        if (this.cropData && this.cropData.width > 10 && this.cropData.height > 10) {
            this.updateStatus('Área de recorte seleccionada');
            this.showNotification('Área seleccionada. Haz clic en "Aplicar Recorte"', 'info');
        } else {
            this.showNotification('Área muy pequeña. Intenta seleccionar un área más grande', 'warning');
        }
    }

    drawCropOverlay() {
        if (!this.cropData) return;

        const overlay = document.getElementById('crop-overlay');
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = document.getElementById('canvas-container').getBoundingClientRect();
        
        // Calcular posición absoluta del overlay
        const canvasLeft = canvasRect.left - containerRect.left;
        const canvasTop = canvasRect.top - containerRect.top;
        
        // Considerar transformaciones aplicadas al canvas
        let x, y, width, height;
        
        if (Math.abs(this.rotation) === 90 || Math.abs(this.rotation) === 270) {
            // Canvas rotado 90° o 270°
            x = canvasLeft + (this.cropData.y * this.zoom);
            y = canvasTop + (this.cropData.x * this.zoom);
            width = this.cropData.height * this.zoom;
            height = this.cropData.width * this.zoom;
        } else {
            // Canvas normal o rotado 180°
            x = canvasLeft + (this.cropData.x * this.zoom);
            y = canvasTop + (this.cropData.y * this.zoom);
            width = this.cropData.width * this.zoom;
            height = this.cropData.height * this.zoom;
        }

        overlay.style.left = x + 'px';
        overlay.style.top = y + 'px';
        overlay.style.width = width + 'px';
        overlay.style.height = height + 'px';
        overlay.style.display = 'block';
        
        // Actualizar información del recorte
        this.updateCropInfo();
    }

    updateCropInfo() {
        if (!this.cropData) return;
        
        const info = document.createElement('div');
        info.id = 'crop-info';
        info.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            z-index: 1001;
        `;
        
        const widthMm = (this.cropData.width / 3.78).toFixed(1);
        const heightMm = (this.cropData.height / 3.78).toFixed(1);
        
        info.innerHTML = `
            Área seleccionada:<br>
            ${Math.round(this.cropData.width)} × ${Math.round(this.cropData.height)} px<br>
            ${widthMm} × ${heightMm} mm
        `;
        
        // Remover info anterior
        const existingInfo = document.getElementById('crop-info');
        if (existingInfo) existingInfo.remove();
        
        document.getElementById('canvas-container').appendChild(info);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            const infoElement = document.getElementById('crop-info');
            if (infoElement) infoElement.remove();
        }, 3000);
    }

    applyCrop() {
        if (!this.cropData || this.pages.length === 0) {
            this.showNotification('Primero selecciona un área de recorte', 'warning');
            return;
        }

        const currentPage = this.pages[this.currentPageIndex];
        currentPage.cropData = { ...this.cropData };
        currentPage.processed = true;

        this.updateStatus('Recorte aplicado a la página actual');
        this.showNotification('Recorte aplicado', 'success');
        this.updatePagesPreview();
        
        // Avanzar a la siguiente página automáticamente
        if (this.currentPageIndex < this.pages.length - 1) {
            this.nextPage();
        }
    }

    resetCrop() {
        this.cropData = null;
        document.getElementById('crop-overlay').style.display = 'none';
        
        // Limpiar información de recorte
        const cropInfo = document.getElementById('crop-info');
        if (cropInfo) cropInfo.remove();
        
        // Resetear modo manual si está activo
        if (this.isManualCropMode) {
            this.toggleManualCrop();
        }
        
        if (this.pages.length > 0) {
            const currentPage = this.pages[this.currentPageIndex];
            currentPage.cropData = null;
            currentPage.processed = false;
        }

        this.updateStatus('Recorte eliminado');
        this.updatePagesPreview();
        this.showNotification('Recorte eliminado', 'info');
    }

    updatePagesPreview() {
        const container = document.getElementById('pages-preview');
        container.innerHTML = '';

        this.pages.forEach((page, index) => {
            const preview = document.createElement('div');
            preview.className = 'page-preview' + (page.processed ? ' selected' : '');
            preview.onclick = () => {
                this.currentPageIndex = index;
                this.displayCurrentPage();
            };

            // Crear miniatura
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 150;
            canvas.height = 200;

            const img = new Image();
            img.onload = () => {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                // Mostrar área de recorte si existe
                if (page.cropData) {
                    ctx.strokeStyle = '#2563eb';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        x + page.cropData.x * scale,
                        y + page.cropData.y * scale,
                        page.cropData.width * scale,
                        page.cropData.height * scale
                    );
                }
            };
            img.src = page.imageData;

            preview.innerHTML = `
                <img src="${canvas.toDataURL()}" alt="Página ${page.pageNumber}">
                <div class="page-info">
                    ${page.fileName}<br>
                    Página ${page.pageNumber}${page.processed ? ' ✓' : ''}
                </div>
            `;

            container.appendChild(preview);
        });
    }

    async generateFinalPDF() {
        if (this.pages.length === 0) {
            this.showNotification('No hay páginas para procesar', 'warning');
            return;
        }

        const processedPages = this.pages.filter(p => p.processed);
        
        if (processedPages.length === 0) {
            this.showNotification('Debes procesar al menos una página', 'warning');
            return;
        }

        this.updateStatus('Generando PDF final...');
        this.setProgress(0);

        try {
            const pageSize = document.getElementById('page-size').value;
            const orientation = document.getElementById('orientation').value;
            const addGuillotineMarks = document.getElementById('add-guillotine-marks').checked;
            const maintainAspect = document.getElementById('maintain-aspect').checked;
            
            // Obtener tamaños finales en mm
            const finalWidth = parseFloat(document.getElementById('final-width').value) || 180;
            const finalHeight = parseFloat(document.getElementById('final-height').value) || 250;

            // Configuración de PDF
            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: pageSize
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Calcular cuántas partituras caben por página
            const layout = this.calculateOptimalLayout(pageWidth, pageHeight, finalWidth, finalHeight, addGuillotineMarks);
            
            let currentPageIndex = 0;
            let itemsOnCurrentPage = 0;

            // Procesar cada página
            for (let i = 0; i < processedPages.length; i++) {
                const page = processedPages[i];
                this.setProgress((i / processedPages.length) * 90);

                // Añadir nueva página si es necesario
                if (itemsOnCurrentPage >= layout.itemsPerPage) {
                    pdf.addPage();
                    currentPageIndex++;
                    itemsOnCurrentPage = 0;
                }

                // Calcular posición en la página
                const position = this.calculateItemPosition(itemsOnCurrentPage, layout, finalWidth, finalHeight, addGuillotineMarks);

                // Crear canvas para la página recortada
                const croppedCanvas = await this.createCroppedPage(page);
                const imgData = croppedCanvas.toDataURL('image/jpeg', 0.95);

                // Añadir imagen con tamaño exacto
                await this.addImageWithExactSize(pdf, imgData, position.x, position.y, finalWidth, finalHeight, maintainAspect);

                // Añadir marcas guillotinables alrededor de cada partitura
                if (addGuillotineMarks) {
                    this.addIndividualGuillotineMarks(pdf, position.x, position.y, finalWidth, finalHeight);
                }

                // ELIMINADO: Información de la página que causaba problemas de tamaño
                // No añadimos texto adicional que pueda alterar las dimensiones exactas

                itemsOnCurrentPage++;
            }

            this.setProgress(100);

            // Guardar PDF
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
            pdf.save(`particut-pro-${finalWidth}x${finalHeight}mm-${timestamp}.pdf`);

            this.updateStatus(`PDF generado con ${processedPages.length} partitura(s) de ${finalWidth}×${finalHeight}mm`);
            this.showNotification(`PDF generado: ${processedPages.length} partituras de ${finalWidth}×${finalHeight}mm`, 'success');

            setTimeout(() => this.setProgress(0), 2000);

        } catch (error) {
            console.error('Error generando PDF:', error);
            this.updateStatus('Error al generar PDF');
            this.showNotification('Error al generar PDF', 'error');
            this.setProgress(0);
        }
    }

    async createCroppedPage(page) {
        const sourceCanvas = page.canvas;
        const crop = page.cropData;

        if (!crop) {
            console.warn('No hay datos de recorte para la página:', page.fileName);
            return sourceCanvas;
        }

        console.log('Creando página recortada:', {
            original: { width: sourceCanvas.width, height: sourceCanvas.height },
            crop: crop,
            file: page.fileName
        });

        const croppedCanvas = document.createElement('canvas');
        const ctx = croppedCanvas.getContext('2d');

        // Establecer el tamaño del canvas recortado
        croppedCanvas.width = Math.round(crop.width);
        croppedCanvas.height = Math.round(crop.height);

        // Fondo blanco para asegurar que no hay transparencias
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, croppedCanvas.width, croppedCanvas.height);

        // Copiar SOLO la región recortada del canvas original
        ctx.drawImage(
            sourceCanvas,
            Math.round(crop.x), Math.round(crop.y), Math.round(crop.width), Math.round(crop.height), // Área origen (recortada)
            0, 0, croppedCanvas.width, croppedCanvas.height // Destino (canvas completo recortado)
        );

        console.log('Página recortada creada:', {
            newSize: { width: croppedCanvas.width, height: croppedCanvas.height }
        });

        return croppedCanvas;
    }

    calculateOptimalLayout(pageWidth, pageHeight, itemWidth, itemHeight, addMarks) {
        // Márgen para marcas guillotinables
        const margin = addMarks ? 5 : 2;
        
        // Calcular cuántas partituras caben horizontal y verticalmente
        const itemsHorizontal = Math.floor((pageWidth - margin) / (itemWidth + margin));
        const itemsVertical = Math.floor((pageHeight - margin) / (itemHeight + margin));
        
        const itemsPerPage = itemsHorizontal * itemsVertical;
        
        return {
            itemsPerPage,
            itemsHorizontal,
            itemsVertical,
            margin
        };
    }

    calculateItemPosition(itemIndex, layout, itemWidth, itemHeight, addMarks) {
        const row = Math.floor(itemIndex / layout.itemsHorizontal);
        const col = itemIndex % layout.itemsHorizontal;
        
        const x = layout.margin + col * (itemWidth + layout.margin);
        const y = layout.margin + row * (itemHeight + layout.margin);
        
        return { x, y };
    }

    addImageWithExactSize(pdf, imgData, x, y, targetWidth, targetHeight, maintainAspect) {
        if (maintainAspect) {
            // Crear imagen temporal para obtener dimensiones reales
            return new Promise((resolve) => {
                const tempImg = new Image();
                tempImg.onload = () => {
                    const imgAspect = tempImg.width / tempImg.height;
                    const targetAspect = targetWidth / targetHeight;
                    
                    let finalWidth, finalHeight, offsetX, offsetY;
                    
                    if (imgAspect > targetAspect) {
                        // Imagen más ancha, ajustar por ancho
                        finalWidth = targetWidth;
                        finalHeight = targetWidth / imgAspect;
                        offsetX = 0;
                        offsetY = (targetHeight - finalHeight) / 2;
                    } else {
                        // Imagen más alta, ajustar por alto
                        finalHeight = targetHeight;
                        finalWidth = targetHeight * imgAspect;
                        offsetX = (targetWidth - finalWidth) / 2;
                        offsetY = 0;
                    }
                    
                    // Fondo blanco para centrar la imagen
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(x, y, targetWidth, targetHeight, 'F');
                    
                    // Añadir imagen centrada
                    pdf.addImage(imgData, 'JPEG', x + offsetX, y + offsetY, finalWidth, finalHeight);
                    resolve();
                };
                tempImg.src = imgData;
            });
        } else {
            // Estirar para llenar exactamente el tamaño objetivo
            pdf.addImage(imgData, 'JPEG', x, y, targetWidth, targetHeight);
            return Promise.resolve();
        }
    }

    addIndividualGuillotineMarks(pdf, x, y, width, height) {
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.1);
        
        const markLength = 3;
        
        // Esquinas de cada partitura individual
        const corners = [
            [x, y],                           // Superior izquierda
            [x + width, y],                   // Superior derecha
            [x, y + height],                  // Inferior izquierda
            [x + width, y + height]           // Inferior derecha
        ];
        
        corners.forEach(([cornerX, cornerY]) => {
            // Marcas en L en cada esquina
            // Línea horizontal
            if (cornerX === x) {
                // Esquina izquierda - marca hacia la derecha
                pdf.line(cornerX - markLength, cornerY, cornerX, cornerY);
            } else {
                // Esquina derecha - marca hacia la izquierda
                pdf.line(cornerX, cornerY, cornerX + markLength, cornerY);
            }
            
            // Línea vertical
            if (cornerY === y) {
                // Esquina superior - marca hacia abajo
                pdf.line(cornerX, cornerY - markLength, cornerX, cornerY);
            } else {
                // Esquina inferior - marca hacia arriba
                pdf.line(cornerX, cornerY, cornerX, cornerY + markLength);
            }
        });
    }

    addGuillotineMarks(pdf, pageWidth, pageHeight) {
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.1);

        const markLength = 5;

        // Esquinas
        const corners = [
            [0, 0], [pageWidth, 0], [0, pageHeight], [pageWidth, pageHeight]
        ];

        corners.forEach(([x, y]) => {
            // Marcas horizontales
            if (x === 0) {
                pdf.line(x, y - markLength, x, y + markLength);
            } else {
                pdf.line(x - markLength, y, x, y);
            }

            // Marcas verticales
            if (y === 0) {
                pdf.line(x - markLength, y, x + markLength, y);
            } else {
                pdf.line(x, y - markLength, x, y);
            }
        });

        // Marcas centrales (opcional)
        const centerX = pageWidth / 2;
        const centerY = pageHeight / 2;

        pdf.line(centerX - markLength/2, 0, centerX + markLength/2, 0);
        pdf.line(centerX - markLength/2, pageHeight, centerX + markLength/2, pageHeight);
        pdf.line(0, centerY - markLength/2, 0, centerY + markLength/2);
        pdf.line(pageWidth, centerY - markLength/2, pageWidth, centerY + markLength/2);
    }

    updateSizePreview() {
        const width = parseFloat(document.getElementById('final-width').value) || 180;
        const height = parseFloat(document.getElementById('final-height').value) || 250;
        
        // Validar rangos
        if (width < 50 || width > 400 || height < 50 || height > 600) {
            this.updateStatus('⚠️ Tamaño fuera de rango recomendado');
            return;
        }
        
        // Calcular qué formato es más similar
        const ratio = width / height;
        let formatInfo = '';
        
        if (ratio > 0.7 && ratio < 0.8) {
            formatInfo = ' (similar a A4)';
        } else if (ratio > 0.6 && ratio < 0.7) {
            formatInfo = ' (formato alargado)';
        } else if (ratio > 0.8 && ratio < 1.2) {
            formatInfo = ' (formato cuadrado)';
        } else if (ratio >= 1.2) {
            formatInfo = ' (formato horizontal)';
        }
        
        this.updateStatus(`Tamaño final: ${width}×${height}mm${formatInfo}`);
    }

    setPresetSize(width, height) {
        document.getElementById('final-width').value = width;
        document.getElementById('final-height').value = height;
        this.showNotification(`Tamaño establecido: ${width}×${height}mm`, 'info');
    }

    // Navigation and utility methods
    previousPage() {
        if (this.currentPageIndex > 0) {
            this.currentPageIndex--;
            this.displayCurrentPage();
        }
    }

    nextPage() {
        if (this.currentPageIndex < this.pages.length - 1) {
            this.currentPageIndex++;
            this.displayCurrentPage();
        }
    }

    updatePageInfo() {
        const info = document.getElementById('page-info');
        if (this.pages.length > 0) {
            const current = this.pages[this.currentPageIndex];
            info.textContent = `${current.fileName} - Página ${this.currentPageIndex + 1} de ${this.pages.length}`;
        } else {
            info.textContent = '-';
        }
    }

    updateNavigation() {
        document.getElementById('prev-page').disabled = this.currentPageIndex === 0;
        document.getElementById('next-page').disabled = this.currentPageIndex >= this.pages.length - 1;
    }

    fitToWidth() {
        if (!this.originalImageData) return;
        const container = document.getElementById('canvas-container');
        const containerWidth = container.clientWidth - 40; // margin
        this.zoom = containerWidth / this.originalImageData.width;
        document.getElementById('zoom-slider').value = this.zoom;
        document.getElementById('zoom-value').textContent = Math.round(this.zoom * 100) + '%';
        this.redrawCanvas();
    }

    fitToHeight() {
        if (!this.originalImageData) return;
        const container = document.getElementById('canvas-container');
        const containerHeight = container.clientHeight - 40; // margin
        this.zoom = containerHeight / this.originalImageData.height;
        document.getElementById('zoom-slider').value = this.zoom;
        document.getElementById('zoom-value').textContent = Math.round(this.zoom * 100) + '%';
        this.redrawCanvas();
    }

    rotate(degrees) {
        this.rotation = (this.rotation + degrees) % 360;
        this.redrawCanvas();
    }

    removeFile(index) {
        if (confirm('¿Eliminar este archivo y todas sus páginas?')) {
            const fileName = this.files[index].name;
            this.files.splice(index, 1);
            this.pages = this.pages.filter(p => p.fileName !== fileName);
            
            this.updateFileList();
            
            if (this.pages.length === 0) {
                this.reset();
            } else {
                this.currentPageIndex = Math.min(this.currentPageIndex, this.pages.length - 1);
                this.displayCurrentPage();
            }
            
            this.updatePagesPreview();
        }
    }

    reset() {
        this.files = [];
        this.pages = [];
        this.currentPageIndex = 0;
        this.currentFileIndex = 0;
        this.zoom = 1;
        this.rotation = 0;
        this.cropData = null;
        this.isManualCropMode = false;

        document.getElementById('file-list').innerHTML = '';
        document.getElementById('pages-preview').innerHTML = '';
        document.getElementById('crop-section').style.display = 'none';
        document.getElementById('config-section').style.display = 'none';
        document.getElementById('crop-controls').style.display = 'none';
        document.getElementById('crop-overlay').style.display = 'none';
        
        this.canvas.classList.add('hidden');
        document.getElementById('welcome-message').classList.remove('hidden');
        
        this.updateStatus('Aplicación reiniciada');
        this.setProgress(0);
    }

    updateStatus(message) {
        document.getElementById('status-text').textContent = message;
    }

    setProgress(percent) {
        document.getElementById('progress-fill').style.width = percent + '%';
    }

    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        const colors = {
            info: '#2563eb',
            success: '#059669',
            warning: '#d97706',
            error: '#dc2626'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.particut = new ParticutPro();
});

export default ParticutPro;
