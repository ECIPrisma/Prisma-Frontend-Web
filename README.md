# PRISMA - Portal Web React (Frontend)

Frontend web para los roles corporativos y administrativos de **PRISMA**:
* **Administrador de Plataforma (`ROLE_PLATFORM_ADMIN`):** Monitor de métricas, mesa de resolución de disputas con override de PIN, parametrización en caliente y rastro forense inmutable.
* **Proveedor Mayorista (`ROLE_PROVEEDOR_ADMIN`):** Catálogo de productos, seguimiento de despachos y consulta/descarga de facturas quincenales del 2.5%.

---

## 🎨 Identidad de Marca y Tecnologías
* **React 19** + **Vite 8**
* **Tailwind CSS 3.4** con paleta oficial:
  - Amarillo / Naranja Primario: `#F59E0B`
  - Deep Teal Secundario: `#1E6F68`
  - Carbón Textos: `#2D2C2D`
* **Lucide React** (Iconografía limpia)
* **React Router DOM 7**

---

## 🚀 Cómo Ejecutar en Desarrollo

Desde la carpeta `web prisma/frontend`:

```bash
# Iniciar servidor local de desarrollo (Vite)
npm run dev
```

Por defecto se levantará en: `http://localhost:5173`

---

## 📦 Compilación para Producción (Deploy $0 en Vercel / Cloudflare Pages)

```bash
npm run build
```
Los archivos optimizados para producción se generan en `dist/`.
