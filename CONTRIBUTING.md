# Contribuyendo a Particut Pro

¡Gracias por tu interés en contribuir a Particut Pro! Este documento describe cómo puedes ayudar a mejorar el proyecto.

## 🚀 Configuración del Entorno de Desarrollo

1. **Clona el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd Particut
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Abre tu navegador en:**
   ```
   http://localhost:5173
   ```

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run clean` - Limpia los archivos de build
- `npm run audit` - Ejecuta un audit de seguridad

## 📝 Guías de Contribución

### Reportar Bugs

1. Verifica que el bug no haya sido reportado previamente
2. Crea un issue describiendo:
   - Pasos para reproducir el problema
   - Comportamiento esperado vs actual
   - Capturas de pantalla si es relevante
   - Información del entorno (navegador, OS, etc.)

### Proponer Nuevas Características

1. Abre un issue describiendo la característica propuesta
2. Explica el caso de uso y el beneficio
3. Considera la compatibilidad con las características existentes

### Desarrollo

1. **Fork el repositorio**

2. **Crea una rama para tu característica:**
   ```bash
   git checkout -b feature/nueva-caracteristica
   ```

3. **Sigue los estándares de código:**
   - Usa ES6+ modules
   - Documenta funciones complejas
   - Mantén funciones pequeñas y enfocadas
   - Usa nombres descriptivos para variables y funciones

4. **Estructura de archivos:**
   ```
   src/
   ├── modules/          # Módulos principales
   ├── styles.css        # Estilos globales
   ├── main.js          # Controlador principal
   └── ...
   ```

5. **Commit tus cambios:**
   ```bash
   git commit -m "feat: agrega nueva funcionalidad"
   ```

   Usa el formato de commits convencionales:
   - `feat:` para nuevas características
   - `fix:` para correcciones de bugs
   - `docs:` para cambios en documentación
   - `style:` para cambios de formato
   - `refactor:` para refactorización de código
   - `test:` para tests
   - `chore:` para tareas de mantenimiento

6. **Push a tu fork:**
   ```bash
   git push origin feature/nueva-caracteristica
   ```

7. **Abre un Pull Request**

## 🎨 Estándares de Código

### JavaScript

- Usa `const` y `let` en lugar de `var`
- Usa template literals para strings complejos
- Implementa manejo de errores adecuado
- Comenta código complejo
- Usa async/await en lugar de callbacks anidados

### CSS

- Usa CSS custom properties (variables CSS)
- Mantén especificidad baja
- Usa nombres de clases descriptivos
- Agrupa propiedades relacionadas

### HTML

- Usa elementos semánticos
- Incluye atributos `alt` en imágenes
- Mantén estructura accesible

## 🧪 Testing

Antes de enviar cambios:

1. Prueba la aplicación manualmente
2. Verifica que todos los casos de uso funcionen
3. Prueba en diferentes navegadores si es posible
4. Verifica la responsividad en dispositivos móviles

## 📚 Recursos Útiles

- [Documentación de Vite](https://vitejs.dev/)
- [Documentación de PDF.js](https://mozilla.github.io/pdf.js/)
- [Documentación de jsPDF](https://artskydj.github.io/jsPDF/docs/)
- [Guía de ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

## 🤝 Código de Conducta

- Sé respetuoso con otros contribuidores
- Construye sobre el trabajo de otros de manera constructiva
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros de la comunidad

## 📞 Contacto

Si tienes preguntas sobre la contribución, no dudes en:
- Abrir un issue en GitHub
- Iniciar una discusión en el repositorio

¡Gracias por contribuir a Particut Pro! 🎼
