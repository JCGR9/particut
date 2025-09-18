import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const updatePreviewBtn = document.getElementById('updatePreviewBtn');
const topMarginInput = document.getElementById('topMargin');
const bottomMarginInput = document.getElementById('bottomMargin');
const preview = document.getElementById('preview');
const layoutBtn = document.getElementById('layoutBtn');
const layoutPreview = document.getElementById('layoutPreview');
const layoutCanvas = document.getElementById('layoutCanvas');

let files = [];

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#000';
});
dropZone.addEventListener('dragleave', () => {
  dropZone.style.borderColor = '#ccc';
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '#ccc';
  files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));
  displayFiles();
});

fileInput.addEventListener('change', () => {
  files = Array.from(fileInput.files).filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));
  displayFiles();
});

updatePreviewBtn.addEventListener('click', () => {
  displayFiles();
});

layoutBtn.addEventListener('click', () => {
  showLayoutPreview();
});

async function displayFiles() {
  fileList.innerHTML = '';
  preview.innerHTML = '';
  for (const file of files) {
    const item = document.createElement('div');
    item.className = 'fileItem';
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      item.appendChild(img);
    } else {
      const icon = document.createElement('div');
      icon.textContent = '📄';
      icon.style.fontSize = '50px';
      item.appendChild(icon);
    }
    item.appendChild(document.createTextNode(file.name));
    fileList.appendChild(item);

    // Preview
    const topMarginPx = (parseFloat(topMarginInput.value) / 25.4) * 96;
    const bottomMarginPx = (parseFloat(bottomMarginInput.value) / 25.4) * 96;
    if (file.type === 'application/pdf') {
      const pages = await getPDFPages(file, 400, topMarginPx, bottomMarginPx);
      pages.forEach(canvas => {
        const item = document.createElement('div');
        item.className = 'previewItem';
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoomControls';
        const zoomIn = document.createElement('button');
        zoomIn.textContent = '+';
        zoomIn.addEventListener('click', () => zoomCanvas(canvas, 1.2));
        const zoomOut = document.createElement('button');
        zoomOut.textContent = '-';
        zoomOut.addEventListener('click', () => zoomCanvas(canvas, 0.8));
        zoomControls.appendChild(zoomIn);
        zoomControls.appendChild(zoomOut);
        item.appendChild(zoomControls);
        item.appendChild(canvas);
        preview.appendChild(item);
      });
    } else if (file.type.startsWith('image/')) {
      const canvas = await getImageCanvas(file, 400, topMarginPx, bottomMarginPx);
      const item = document.createElement('div');
      item.className = 'previewItem';
      const zoomControls = document.createElement('div');
      zoomControls.className = 'zoomControls';
      const zoomIn = document.createElement('button');
      zoomIn.textContent = '+';
      zoomIn.addEventListener('click', () => zoomCanvas(canvas, 1.2));
      const zoomOut = document.createElement('button');
      zoomOut.textContent = '-';
      zoomOut.addEventListener('click', () => zoomCanvas(canvas, 0.8));
      zoomControls.appendChild(zoomIn);
      zoomControls.appendChild(zoomOut);
      item.appendChild(zoomControls);
      item.appendChild(canvas);
      preview.appendChild(item);
    }
  }
}

async function getPDFPages(file, maxHeight, topMarginPx, bottomMarginPx) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const canvases = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) { // Preview first 5 pages
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const scale = maxHeight / viewport.height;
    const scaledViewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;
    await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

    // Draw crop lines
    context.strokeStyle = 'red';
    context.lineWidth = 3;
    context.setLineDash([10, 5]);
    context.strokeRect(0, topMarginPx * scale, canvas.width, canvas.height - (topMarginPx + bottomMarginPx) * scale);

    canvases.push(canvas);
  }
  return canvases;
}

async function getImageCanvas(file, maxHeight, topMarginPx, bottomMarginPx) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const scale = maxHeight / img.height;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw crop lines
      context.strokeStyle = 'red';
      context.lineWidth = 3;
      context.setLineDash([10, 5]);
      context.strokeRect(0, topMarginPx * scale, canvas.width, canvas.height - (topMarginPx + bottomMarginPx) * scale);

      resolve(canvas);
    };
    img.src = URL.createObjectURL(file);
  });
}

processBtn.addEventListener('click', async () => {
  if (files.length === 0) {
    alert('Selecciona archivos primero.');
    return;
  }

  output.innerHTML = 'Procesando...';

  const topMarginPx = (parseFloat(topMarginInput.value) / 25.4) * 96;
  const bottomMarginPx = (parseFloat(bottomMarginInput.value) / 25.4) * 96;
  const allPages = [];
  let maxWidth = 0;
  let maxHeight = 0;

  for (const file of files) {
    if (file.type === 'application/pdf') {
      const pages = await processPDF(file, topMarginPx, bottomMarginPx);
      allPages.push(...pages);
      for (const page of pages) {
        maxWidth = Math.max(maxWidth, page.width);
        maxHeight = Math.max(maxHeight, page.height);
      }
    } else if (file.type.startsWith('image/')) {
      const page = await processImage(file, topMarginPx, bottomMarginPx);
      allPages.push(page);
      maxWidth = Math.max(maxWidth, page.width);
      maxHeight = Math.max(maxHeight, page.height);
    }
  }

  const targetWidth = parseFloat(prompt('Ancho objetivo en mm:', (maxWidth * 25.4 / 96).toFixed(2)));
  const targetHeight = parseFloat(prompt('Alto objetivo en mm:', (maxHeight * 25.4 / 96).toFixed(2)));

  if (!targetWidth || !targetHeight) return;

  const pdf = new jsPDF({
    orientation: targetWidth > targetHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  for (const page of allPages) {
    const canvas = page.canvas;
    const imgData = canvas.toDataURL('image/png');
    const scaleX = (targetWidth / 25.4 * 96) / canvas.width;
    const scaleY = (targetHeight / 25.4 * 96) / canvas.height;
    const scale = Math.min(scaleX, scaleY);
    const newWidth = canvas.width * scale;
    const newHeight = canvas.height * scale;
    pdf.addImage(imgData, 'PNG', 0, 0, newWidth / 96 * 25.4, newHeight / 96 * 25.4);
    
    // Draw crop lines on PDF
    pdf.setDrawColor(255, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.setLineDash([2, 2], 0);
    pdf.rect(0, 0, 210, 297); // A4 size
    pdf.setLineDash([], 0);
    
    if (page !== allPages[allPages.length - 1]) pdf.addPage();
  }

  pdf.save('partituras_estandarizadas.pdf');
  output.innerHTML = 'PDF generado y descargado.';
});

async function processPDF(file, topMarginPx, bottomMarginPx) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: context, viewport }).promise;
    
    // Crop top and bottom margins
    const croppedCanvas = cropMargins(canvas, topMarginPx, bottomMarginPx);
    const bounds = getContentBounds(croppedCanvas);
    pages.push({ canvas: croppedCanvas, width: bounds.width, height: bounds.height });
  }

  return pages;
}

async function processImage(file, topMarginPx, bottomMarginPx) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      
      const croppedCanvas = cropMargins(canvas, topMarginPx, bottomMarginPx);
      const bounds = getContentBounds(croppedCanvas);
      resolve({ canvas: croppedCanvas, width: bounds.width, height: bounds.height });
    };
    img.src = URL.createObjectURL(file);
  });
}

function cropMargins(canvas, topMarginPx, bottomMarginPx) {
  const croppedCanvas = document.createElement('canvas');
  const croppedContext = croppedCanvas.getContext('2d');
  croppedCanvas.width = canvas.width;
  croppedCanvas.height = Math.max(1, canvas.height - topMarginPx - bottomMarginPx);
  croppedContext.drawImage(canvas, 0, topMarginPx, canvas.width, croppedCanvas.height, 0, 0, canvas.width, croppedCanvas.height);
  return croppedCanvas;
}

function zoomCanvas(canvas, factor) {
  const currentWidth = canvas.width;
  const currentHeight = canvas.height;
  canvas.width = currentWidth * factor;
  canvas.height = currentHeight * factor;
  const context = canvas.getContext('2d');
  context.scale(factor, factor);
  // Note: This is a simple zoom, might need to redraw the content properly
}

async function showLayoutPreview() {
  if (files.length === 0) {
    alert('Selecciona archivos primero.');
    return;
  }

  layoutPreview.style.display = 'block';
  const ctx = layoutCanvas.getContext('2d');
  
  // A4 dimensions in pixels at 96 DPI
  const a4Width = 794;
  const a4Height = 1123;
  layoutCanvas.width = a4Width;
  layoutCanvas.height = a4Height;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, a4Width, a4Height);
  
  const topMarginPx = (parseFloat(topMarginInput.value) / 25.4) * 96;
  const bottomMarginPx = (parseFloat(bottomMarginInput.value) / 25.4) * 96;
  
  // Draw crop rectangle
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.strokeRect(0, topMarginPx, a4Width, a4Height - topMarginPx - bottomMarginPx);
  
  // Simulate placing partituras
  let y = topMarginPx;
  for (const file of files.slice(0, 3)) { // Show first 3
    if (file.type === 'application/pdf') {
      const pages = await getPDFPages(file, 100, topMarginPx, bottomMarginPx);
      if (pages.length > 0) {
        const img = new Image();
        img.src = pages[0].toDataURL();
        img.onload = () => {
          const scale = (a4Width - 20) / img.width;
          ctx.drawImage(img, 10, y, img.width * scale, img.height * scale);
          y += img.height * scale + 10;
        };
      }
    }
  }
}
