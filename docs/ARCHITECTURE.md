# Arquitectura — RECUTEX 2.0 (storefront propio)

## Decisión

Recutex deja de depender de una plataforma SaaS con mensualidad. La tienda es una aplicación **Next.js** propia, con pagos directos por **Webpay Plus (Transbank)**.

|                                               | Shopify (actual)                                                                                                                                 | Storefront propio (propuesta)                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Mensualidad plataforma                        | Plan mensual en USD                                                                                                                              | Sin plataforma: solo hosting                                    |
| Comisión extra por venta                      | Shopify cobra una comisión adicional cuando no se usa Shopify Payments (no disponible en Chile) — **verificar el % vigente del plan de Recutex** | 0 % (solo la comisión de Transbank, que se paga en ambos casos) |
| Hosting                                       | Incluido                                                                                                                                         | Vercel Pro (~USD 20/mes) o VPS con Docker (~USD 5–15/mes)       |
| Diseño y experiencia                          | Limitado por el theme                                                                                                                            | Total                                                           |
| Admin (productos, pedidos, stock, descuentos) | Incluido                                                                                                                                         | **Hay que construirlo** (fase 2, ver abajo)                     |
| Mantención                                    | Shopify                                                                                                                                          | Desarrollador / agencia                                         |

**Riesgo honesto:** lo que Shopify resuelve "gratis" (admin, pedidos, inventario, descuentos, correos transaccionales, seguridad de checkout) pasa a ser responsabilidad del proyecto. El ahorro de mensualidad y comisiones debe compararse con ese costo de mantención.

## Arquitectura

```text
Navegador
   │
   ▼
Next.js 16 (App Router, React 19)            ← este repo
 ├── Páginas estáticas: home, 79 productos, páginas de contenido (SSG)
 ├── Páginas dinámicas: colecciones con filtros, búsqueda, resultado de pago
 ├── API /api/search (búsqueda predictiva)
 ├── Server Action startPayment → recalcula el total en servidor
 └── /checkout/return ← retorno de Webpay (commit de la transacción)
   │                              │
   ▼                              ▼
Catálogo (src/lib/catalog.ts)    Transbank Webpay Plus
 demo: PostgreSQL (db/schema.sql) demo: ambiente de integración (sin cobros)
 prod: base de datos + admin      prod: código de comercio de Recutex
```

### Decisiones técnicas

| Decisión                                                                          | Motivo                                                                                                                             |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js App Router, Server Components**                                         | HTML completo en el servidor (SEO, LCP), JS solo donde hay interacción.                                                            |
| **URLs iguales a la tienda actual** (`/products/…`, `/collections/…`, `/pages/…`) | Se conserva el SEO indexado. Redirecciones para las pocas que cambian (`next.config.ts`).                                          |
| **Capa de datos única** (`src/lib/catalog.ts`)                                    | Los componentes nunca leen el JSON directo; cambiar a base de datos no toca la UI.                                                 |
| **Carrito en el navegador + total recalculado en servidor**                       | Sin base de datos para la demo; los precios enviados por el navegador se ignoran al pagar.                                         |
| **Webpay Plus con SDK oficial** (`transbank-sdk`)                                 | Medio de pago estándar en Chile. Integración por defecto (tarjetas de prueba).                                                     |
| **Imágenes vía loader propio** (`src/lib/image-loader.ts`)                        | El CDN de origen redimensiona por URL: tamaño correcto sin costo de optimización. En producción se migran a almacenamiento propio. |
| **CSS propio con tokens** (sin Tailwind ni UI kit)                                | Identidad visual propia, sin dependencias; ~40 KB.                                                                                 |
| **Una tipografía: Bricolage Grotesque** (`next/font`, auto-hosteada)              | Su eje óptico sirve para titulares y texto; sin requests a Google en runtime.                                                      |
| **Filtros en la URL** (`?medida=&min=&max=&ofertas=&orden=`)                      | Resultados compartibles, render en servidor, botón atrás funciona.                                                                 |
| **Sin librerías de animación**                                                    | CSS + IntersectionObserver + `@starting-style`. Respeta `prefers-reduced-motion`.                                                  |
| **Docker multi-stage** (`dev` con hot reload, `runner` standalone)                | Mismo entorno para todos; imagen de producción autocontenida.                                                                      |

## Estructura

```text
src/
├── app/                      rutas (App Router)
│   ├── page.tsx              home
│   ├── collections/          listado y colección con filtros
│   ├── products/[handle]/    ficha de producto (SSG)
│   ├── search/               resultados de búsqueda
│   ├── cart/, checkout/      carrito, checkout, retorno y resultado Webpay
│   ├── pages/[handle]/       nosotros, FAQ, garantía
│   ├── api/search/           búsqueda predictiva
│   ├── actions/              server actions (newsletter)
│   ├── styles/               design system (CSS)
│   └── sitemap.ts, robots.ts
├── components/               header, carrito, producto, colección, home
├── content/site.ts           textos, navegación, datos de contacto
└── lib/                      catálogo, formato CLP, Webpay, loader de imágenes
data/
├── catalog.json              snapshot del catálogo público (npm run catalog:snapshot); fuente del seed
└── pages/*.html              contenido de páginas
```

## Fases

| #   | Fase                                                        | Estado                                                                                                                            |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Auditoría de la tienda actual                               | ✅ `docs/AUDIT.md`                                                                                                                |
| 1   | Entorno (Docker, Git, lint, build)                          | ✅                                                                                                                                |
| 2   | Design system                                               | ✅                                                                                                                                |
| 3   | Header, mega menú, menú móvil                               | ✅ validado en Chrome (desktop y 390 px)                                                                                          |
| 4   | Home                                                        | ✅                                                                                                                                |
| 5   | Product cards, colecciones, filtros                         | ✅                                                                                                                                |
| 6   | Ficha de producto (galería, zoom, variantes)                | ✅                                                                                                                                |
| 7   | Búsqueda predictiva                                         | ✅                                                                                                                                |
| 8   | Carrito lateral + checkout Webpay (integración)             | ✅ redirección y anulación probadas; pago aprobado lo prueba una persona con la tarjeta de prueba                                 |
| 9   | **Admin**: productos, stock, pedidos, descuentos, contenido | ⏳ propuesta: Payload CMS dentro del mismo Next.js + PostgreSQL                                                                   |
| 10  | Pedidos persistentes + emails transaccionales               | ⏳                                                                                                                                |
| 11  | Webpay producción (código de comercio de Recutex)           | ⏳ requiere contrato con Transbank                                                                                                |
| 12  | Fotografía de producto y migración de imágenes              | ⏳                                                                                                                                |
| 13  | QA, performance (Lighthouse), accesibilidad                 | 🟡 responsive y Lighthouse automatizados (`docs/LAUNCH.md`); falta prueba manual con teclado, lector de pantalla y equipos reales |
| 14  | Legal y salida sin perder SEO                               | 🟡 borradores legales y redirecciones listos; falta validación de Recutex y abogado                                               |

### Fase 9 recomendada: Payload CMS

Payload es open source, se instala **dentro de la misma app Next.js** y agrega un panel `/admin` con colecciones editables (productos, variantes, stock, colecciones, banners de la home, páginas, pedidos). Usa PostgreSQL (Neon/Supabase free tier o el mismo VPS). No agrega mensualidad y mantiene un solo deploy.

## Riesgos

| Riesgo                                                                         | Mitigación                                                                                                      |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Pérdida de funciones de Shopify (admin, pedidos, descuentos, emails)           | Fase 9–10 antes de salir a producción.                                                                          |
| Seguridad del pago                                                             | El dato de tarjeta nunca pasa por este sitio: Webpay lo captura en su dominio. El monto se calcula en servidor. |
| SEO en la migración                                                            | Mismas URLs, sitemap, canonical, JSON-LD Product/Breadcrumb/Organization, redirecciones 301.                    |
| Imágenes alojadas en el CDN de Shopify                                         | Migrarlas antes de cerrar la cuenta de Shopify.                                                                 |
| Calidad de datos del catálogo (opciones inconsistentes, títulos en mayúsculas) | Se normaliza al cargar en el admin nuevo. La demo solo formatea títulos para mostrarlos.                        |
