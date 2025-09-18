# Particut Pro - Procesador Profesional de Partituras 🎼

Una herramienta web profesional para automatizar la preparación y generación de partituras musicales listas para imprimir y guillotinar, partiendo de PDFs en formato A4 (vertical o cualquier orientación).

## ✨ Características Principales

### 📁 Carga Múltiple de Archivos
- **Arrastrar y soltar**: Interfaz intuitiva para cargar múltiples archivos simultáneamente
- **Formatos soportados**: PDF, JPG, PNG, GIF, WebP
- **Validación automática**: Verificación de tipos de archivo y tamaños
- **Vista previa inmediata**: Miniaturas de cada archivo cargado

### 🔄 Detección y Corrección Automática
- **Orientación inteligente**: Detecta y corrige automáticamente páginas horizontales a verticales
- **Detección de contenido**: Identifica automáticamente la zona útil de cada partitura
- **Eliminación de márgenes**: Descarta espacios vacíos y metadatos no deseados
- **Procesamiento por lotes**: Maneja múltiples archivos de forma eficiente

### ⚙️ Configuración Avanzada
- **Dimensiones personalizables**: Define el tamaño exacto de corte (ej: 120x80 mm)
- **Layout flexible**: Configura filas y columnas en página A4
- **Márgenes ajustables**: Control preciso de márgenes superior e inferior
- **Opciones de calidad**: Configuración de DPI y compresión

### 📐 Sistema de Layout Profesional
- **Distribución automática**: Agrupa partituras optimizando el espacio en A4
- **Marcas de corte**: Añade líneas guía para guillotinado perfecto
- **Vista previa en tiempo real**: Visualiza cómo quedarán las partituras antes de procesar
- **Navegación de páginas**: Explora múltiples páginas de layout

### 🎯 Salida Profesional
- **PDF multipágina**: Genera un archivo final listo para imprimir
- **Escalado inteligente**: Mantiene proporciones sin distorsión
- **Centrado automático**: Posiciona cada partitura de forma óptima
- **Marcas de guillotina**: Incluye guías de corte profesionales

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 16+ 
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd particut

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

### Uso Rápido
1. **Cargar archivos**: Arrastra PDFs o imágenes al área designada
2. **Configurar parámetros**: Ajusta dimensiones, layout y opciones
3. **Vista previa**: Revisa las partituras procesadas
4. **Generar PDF**: Procesa y descarga el archivo final

## 🛠️ Tecnologías

### Frontend
- **Vite**: Build tool moderno y rápido
- **Vanilla JavaScript**: ES6+ modular
- **CSS Grid/Flexbox**: Layout responsivo profesional
- **Font Awesome**: Iconografía profesional

### Librerías Especializadas
- **PDF.js**: Renderizado y manipulación de PDFs
- **jsPDF**: Generación de PDFs finales
- **Canvas API**: Procesamiento de imágenes y renderizado

### Arquitectura Modular
```
src/
├── main.js              # Aplicación principal
├── styles.css           # Estilos globales
└── modules/
    ├── pdfProcessor.js      # Procesamiento de PDFs
    ├── imageProcessor.js    # Procesamiento de imágenes
    ├── layoutManager.js     # Gestión de layouts
    ├── uiManager.js        # Interfaz de usuario
    ├── fileManager.js      # Gestión de archivos
    └── configManager.js    # Configuración y preferencias
```

## 📖 API y Configuración

### Configuración Principal
```javascript
{
  targetWidth: 120,      // Ancho objetivo en mm
  targetHeight: 80,      // Alto objetivo en mm
  columns: 2,            // Columnas por página A4
  rows: 3,               // Filas por página A4
  topMargin: 20,         // Margen superior en mm
  bottomMargin: 15,      // Margen inferior en mm
  autoRotate: true,      // Auto-rotación de páginas
  cropMarks: true,       // Marcas de corte
  autoDetect: true       // Detección automática de área
}
```

### Presets Incluidos
- **Partituras Estándar**: 120x80mm, 2x3 layout
- **Partituras Grandes**: 150x100mm, 1x2 layout
- **Tarjetas de Visita**: 85x55mm, 2x5 layout
- **Marcapáginas**: 50x150mm, 4x1 layout
- **Etiquetas**: 63.5x38.1mm, 3x7 layout

## 🎨 Características de UI/UX

### Diseño Moderno
- **Interfaz profesional**: Diseño limpio y minimalista
- **Responsive**: Adaptable a dispositivos móviles y desktop
- **Animaciones suaves**: Transiciones fluidas y feedback visual
- **Tema consistente**: Paleta de colores profesional

### Experiencia de Usuario
- **Drag & Drop intuitivo**: Carga de archivos natural
- **Feedback en tiempo real**: Progreso y estados visibles
- **Notificaciones contextuales**: Mensajes informativos
- **Atajos de teclado**: Navegación rápida (Ctrl+O, Ctrl+Enter)

## 🔧 Funcionalidades Avanzadas

### Detección Inteligente de Contenido
- Análisis de pixeles para identificar áreas con contenido musical
- Eliminación automática de espacios en blanco
- Detección de títulos y pentagramas
- Preservación de proporciones originales

### Optimización de Layout
- Cálculo automático del layout más eficiente
- Sugerencias de dimensiones óptimas
- Validación de que el layout cabe en A4
- Cálculo de eficiencia de uso del papel

### Procesamiento por Lotes
- Soporte para múltiples archivos PDF con varias páginas
- Procesamiento asíncrono para mantener la UI responsiva
- Manejo de errores individual por archivo
- Estimación de tiempo de procesamiento

## 🚀 Ejemplo de Flujo Completo

1. **Carga**: Usuario arrastra 5 PDFs de partituras diferentes
2. **Detección**: Sistema detecta orientación y corrige automáticamente
3. **Configuración**: Usuario ajusta a 120x80mm, layout 2x3
4. **Vista previa**: Se muestran miniaturas de 30 partituras procesadas
5. **Layout**: Sistema calcula 5 páginas A4 necesarias
6. **Procesamiento**: Genera PDF con marcas de corte profesionales
7. **Descarga**: Usuario obtiene archivo listo para imprimir y guillotinar

## 🎯 Casos de Uso

### Bandas de Música
- Estandarización de partituras de diferentes fuentes
- Preparación para archivo en carpetas uniformes
- Optimización de papel para impresión masiva

### Conservatorios y Escuelas
- Preparación de material didáctico
- Organización de repertorio por niveles
- Creación de cuadernillos de estudio

### Editoriales Musicales
- Preparación de maquetas para imprenta
- Estandarización de formatos
- Control de calidad en layouts

### Músicos Profesionales
- Organización de repertorio personal
- Preparación para atrilera portátil
- Archivo digital organizado

## 📱 Responsividad

- **Desktop**: Layout completo con todas las funcionalidades
- **Tablet**: Interface adaptada con controles optimizados
- **Mobile**: Versión simplificada pero funcional

## 🔒 Privacidad y Seguridad

- **Procesamiento local**: Todos los archivos se procesan en el navegador
- **Sin subida de datos**: No se envían archivos a servidores externos
- **Validación de archivos**: Verificación de tipos y tamaños
- **Gestión de memoria**: Liberación automática de recursos

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para la comunidad musical

---

**Particut Pro** - Transformando partituras en herramientas profesionales de trabajo 🎼✨