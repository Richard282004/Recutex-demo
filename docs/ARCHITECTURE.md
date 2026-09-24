# Arquitectura y plan — RECUTEX 2.0

> Contexto: la primera entrega es una **demo comercial** en una tienda de desarrollo propia con el catálogo real importado. Ver [`DEMO.md`](DEMO.md).

## Principio

Shopify sigue siendo el backend comercial (catálogo, precios, inventario, descuentos, clientes, pedidos, checkout, pagos). Este repositorio solo contiene **un theme Online Store 2.0 propio** y el **entorno de desarrollo** para construirlo.

```text
Developer ──► Docker (Node 24 + Shopify CLI + linters)
                 │  bind mount ./ → /app
                 ▼
               Git ──► GitHub (main / develop / feature/*)
                 │
                 ▼
   shopify theme dev ──► Development theme (oculto, por desarrollador)
                 │            └─ preview http://localhost:9292 (hot reload)
                 ▼
   npm run push:staging ──► Theme "Recutex 2.0 — Staging" (unpublished) ──► QA
                 │
                 ▼
   Publicación manual en el admin (aprobación humana) ──► Theme live
```

## Decisiones técnicas

| Decisión                                                                                                                  | Motivo                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Theme propio desde cero**, no fork de Dawn/Horizon                                                                      | Identidad visual propia, JS mínimo y sin código heredado que no usamos. Dawn/Horizon se consultan como referencia de APIs de Shopify, no se copian.                |
| **Sin bundler** (Vite/Webpack)                                                                                            | Shopify sirve assets por CDN; ES modules nativos + CSS nativo alcanzan. Menos piezas, deploy = subir archivos. Se reevalúa solo si aparece una necesidad concreta. |
| **Custom Elements** para componentes                                                                                      | Encapsulan comportamiento sin framework, se re-inicializan solos cuando el Theme Editor re-renderiza secciones.                                                    |
| **Design tokens en CSS custom properties**                                                                                | Colores y fuentes salen de `settings_schema.json` (editables sin programador); espaciados/radios/sombras estáticos en `base.css`.                                  |
| **Tipografía de marca Bricolage Grotesque** (OFL, auto-hosteada en `assets/`, 77 KB) + texto con `font_picker` de Shopify | Carácter propio en títulos sin depender de Google Fonts; todo servido por el CDN de Shopify con preload y `font-display: swap`. Desactivable en el editor.         |
| **Funciona sin JS** (formularios nativos `/cart/add`, `/cart`)                                                            | JS mejora progresivamente (drawer, búsqueda predictiva) y no rompe la compra si falla.                                                                             |
| **Theme Access password** opcional                                                                                        | Autenticación no interactiva en Docker/CI; alternativa: login por device code.                                                                                     |
| **Guardas contra producción**                                                                                             | `push:staging` exige ID explícito y aborta si el theme es live. No existe script para publicar.                                                                    |
| **Node 24 LTS**                                                                                                           | Shopify CLI 4.x requiere Node ≥ 22.12.                                                                                                                             |

## Estructura

```text
.
├── Dockerfile / docker-compose.yml / Makefile
├── package.json            scripts (dev, check, lint, backup, push:staging)
├── scripts/                backup-live.mjs, push-staging.mjs
├── docs/                   AUDIT.md, ARCHITECTURE.md
└── theme/                  raíz del theme Shopify
    ├── assets/             base.css, theme.js (+ un archivo por componente)
    ├── config/             settings_schema.json, settings_data.json
    ├── layout/             theme.liquid, password.liquid
    ├── locales/            es.default.json
    ├── sections/           secciones + header-group/footer-group
    ├── snippets/           price, product-card, meta-tags, css-variables, pagination
    └── templates/          JSON templates + gift_card.liquid
```

## Fases

| #   | Fase                                                                | Estado                                                  |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| 0   | Auditoría técnica                                                   | ✅ `docs/AUDIT.md`                                      |
| 1   | Docker + Shopify CLI + Git                                          | ✅ validado (build, lint, `theme dev` llega a login)    |
| 2   | Base theme                                                          | 🟡 implementado + lint OK; falta validar en tienda demo |
| 3   | Design System                                                       | 🟡 implementado + lint OK; falta validar en tienda demo |
| 4   | Header + navegación (sticky, mega menú, drawer móvil)               | 🟡 implementado + lint OK; falta validar en tienda demo |
| 5   | Home (hero, categorías, ofertas, editorial, beneficios, newsletter) | 🟡 implementado + lint OK; falta validar en tienda demo |
| 6   | Product cards (2ª imagen, quick add, badges)                        | 🟡 implementado + lint OK; falta validar en tienda demo |
| 7   | Colecciones (filtros Search & Discovery, bottom sheet)              | 🟡 implementado + lint OK; falta validar en tienda demo |
| 8   | Página de producto (galería, zoom, swipe, variant picker)           | 🟡 implementado + lint OK; falta validar en tienda demo |
| 9   | Búsqueda predictiva (`/search/suggest`)                             | 🟡 implementado + lint OK; falta validar en tienda demo |
| 10  | Cart drawer (Ajax Cart API + Section Rendering API)                 | 🟡 implementado + lint OK; falta validar en tienda demo |
| 11  | Motion system (IntersectionObserver, WAAPI, reduced motion)         | 🟡 implementado + lint OK; falta validar en tienda demo |
| 12  | Responsive (360 → 1920)                                             | ⏳                                                      |
| 13  | Performance (LCP/CLS/INP)                                           | ⏳                                                      |
| 14  | Accesibilidad + SEO (Breadcrumb JSON-LD, auditoría WCAG)            | ⏳                                                      |
| 15  | QA en theme staging                                                 | ⏳                                                      |

Cada fase se cierra solo cuando: `npm run lint` pasa, se revisa en el preview real (consola sin errores, móvil y desktop), se prueban las funciones Shopify afectadas y se hace commit en su `feature/*`.

## Riesgos

| Riesgo                                                                                            | Mitigación                                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Datos de catálogo inconsistentes (opciones `Color`/`COLOR`, `Talla`/`Size`, `product_type` vacío) | Filtros y variant picker dependen de ellos. Proponer normalización en el admin antes de Fase 7–8; el theme no inventa datos. |
| Apps que inyectan código en el theme viejo (`shopoe.net`, WhatsApp)                               | Inventariar en el backup del theme live; reintegrar vía app embeds o settings.                                               |
| Templates alternativos (`page.contact`, etc.) ausentes en el theme nuevo                          | Revisar el backup; Shopify cae al template por defecto, pero un formulario de contacto se perdería.                          |
| Cambios hechos en el Theme Editor de staging sobrescritos por `push:staging`                      | Documentado; editar contenido en staging solo después del último push, o hacer `theme pull` antes.                           |
| Development theme expira tras inactividad                                                         | Es desechable por diseño; la fuente de verdad es Git.                                                                        |
| Pérdida de SEO al cambiar de theme                                                                | Las URLs las define Shopify, no el theme. Se preservan títulos/descripciones del admin y se agrega JSON-LD.                  |
