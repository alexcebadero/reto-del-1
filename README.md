# El Reto del 1%

Juego web hipercasual tipo reflejos: intenta acertar el timing y superar niveles cada vez más difíciles.

## Cómo desplegar

1. Sube estos archivos a un hosting estático (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.):
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`
2. Sirve el sitio desde la raíz del dominio/proyecto para que las rutas relativas funcionen correctamente.
3. Abre la URL en navegador móvil o escritorio para instalar la PWA.

## Requisitos PWA / HTTPS

- **HTTPS obligatorio** en producción para que el Service Worker y la instalación PWA funcionen.
- En local, `http://localhost` también permite probar el Service Worker.
- Si actualizas `sw.js`, recuerda cambiar la versión de caché para forzar refresco controlado.
