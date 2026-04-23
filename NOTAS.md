# Felicitaciones · Notas de proyecto

Generador de posts para redes sociales (1080×1920). Firma: Lic. Yair Pérez.

---

## Cómo correr el proyecto localmente

Abrir **dos** terminales en la carpeta del proyecto:

```bash
# Terminal 1 — servidor de archivos
npx serve .
# → http://localhost:3000

# Terminal 2 — servidor de render (Puppeteer)
node server.js
# → http://localhost:3001
```

Abrir `http://localhost:3000` en el navegador.
Los cambios en archivos se ven con **F5** — no hay hot-reload.

---

## Arquitectura

```
index.html        entrada, carga React + Babel desde CDN
styles.css        todo el CSS (variables, plantillas, mobile)
templates.jsx     4 componentes React: Constelación, Atelier, Editorial, Retrato
app.jsx           UI principal: panel editor + stage de preview + lógica de descarga
server.js         Express + Puppeteer — render a PNG de alta fidelidad
```

**Sin build step.** React y Babel corren directo en el navegador vía CDN (`unpkg`).
Esto permite editar y recargar sin compilar, ideal para prototipado rápido.

---

## Flujo de trabajo

```
Editar archivos locales
      ↓
Ver cambios en localhost:3000  (F5)
      ↓
git add + git commit + git push
      ↓
Sitio público actualizado en ~1 min
→ https://edulira22.github.io/felicitaciones/
```

---

## Descarga PNG — problema y solución

### El problema
Capturar un elemento DOM como imagen PNG es más difícil de lo que parece.
Se probaron tres librerías antes de llegar a la solución final:

| Librería | Resultado | Razón del fallo |
|---|---|---|
| `html2canvas` | Colores incorrectos | No soporta `oklch()` |
| `html2canvas` (2° intento) | Foto desacomodada, brillo cambiado | No renderiza `box-shadow` múltiple sobre `border-radius: 50%` |
| `dom-to-image-more` | Tipografías incorrectas | No puede acceder a Google Fonts por CORS |
| **Puppeteer (local)** | ✅ Perfecto | Usa Chrome real |

### La solución: servidor Puppeteer local (`server.js`)
Cuando el usuario descarga:
1. `app.jsx` hace POST a `http://localhost:3001/render` con todos los datos de la tarjeta (template, nombre, foto en base64, mensaje, etc.)
2. `server.js` genera un HTML autocontenido con el CSS y la plantilla correspondiente
3. Puppeteer lanza Chrome headless, renderiza ese HTML a 1080×1920 y toma un screenshot
4. Devuelve el PNG al browser, que lo descarga automáticamente

Si el servidor no está corriendo, el app cae back a `html2canvas` (calidad menor).

### Fix relacionado: colores `oklch`
El CSS original usaba `oklch()` para el dorado. `html2canvas` no lo entiende.
Se reemplazaron por equivalentes hex:
```css
--gold: #cfa847;
--gold-soft: #b08f3a;
--gold-deep: #7f6425;
--accent-dim: #3a2e12;
```

### Fix relacionado: anillo dorado de la foto (template Constelación)
`box-shadow` con múltiples capas sobre un círculo no se renderiza correctamente en html2canvas.
Se reemplazó por **divs anidados reales**:
```
.photo-ring   → fondo dorado, border-radius 50%
  .photo-gap  → fondo oscuro (separador), border-radius 50%
    .photo-frame → clip circular con overflow:hidden
```

---

## Autenticación GitHub

`gh` CLI está instalado en `C:\Program Files\GitHub CLI\`.
Si no responde desde una terminal nueva:
```
"C:\Program Files\GitHub CLI\gh.exe" auth login
```
Seguir el flujo: GitHub.com → HTTPS → Y → Login with a web browser → ingresar código en `github.com/login/device`.

Para operaciones git normales (push/pull), las credenciales se guardan en Windows Credential Manager automáticamente la primera vez que se hace push con éxito.

---

## Sitio público (GitHub Pages)

Activado desde: **Settings → Pages → Branch: main → / (root)**

URL: `https://edulira22.github.io/felicitaciones/`

> El servidor Puppeteer **no funciona** en GitHub Pages (es un sitio estático).
> La descarga desde el sitio público usa el fallback de `html2canvas`.
> Para descarga perfecta, siempre usar el entorno local.
