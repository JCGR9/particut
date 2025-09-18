# Particut - Procesador de Partituras

Una aplicación web para procesar partituras en PDF e imágenes, estandarizando sus tamaños para impresión en A4 y encuadernación.

## Funcionalidades

- Carga de archivos PDF e imágenes (JPG, PNG).
- Detección automática del tamaño máximo de contenido entre todas las páginas.
- Solicitud de tamaño objetivo para estandarizar.
- Generación de un PDF imprimible en A4 con todas las partituras al mismo tamaño.

## Uso

1. Abre la aplicación en el navegador.
2. Selecciona los archivos de partituras (PDF o imágenes).
3. Haz clic en "Procesar Archivos".
4. Ingresa el ancho y alto objetivo en mm cuando se solicite.
5. Descarga el PDF generado.

## Instalación y Ejecución

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

## Tecnologías

- Vite
- PDF.js
- jsPDF