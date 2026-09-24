# Fase 0 — Auditoría técnica

Fecha: 2026-09-24. Fuente: storefront público `https://recutex.myshopify.com` (HTML, `/products.json`, `/collections.json`). Sin acceso al admin todavía.

## Tienda

| Dato                   | Valor                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Plataforma             | Shopify                                                                                                                              |
| Theme publicado        | **ShowTime 6.0** (Theme Store #687), id `33188184176`, role `main`                                                                   |
| Locale / país / moneda | `es` / `CL` / `CLP`                                                                                                                  |
| Cuentas de cliente     | **Nuevas cuentas de cliente** (`/account/login` redirige a `shopify.com/.../account`). El theme no necesita templates `customers/*`. |
| Checkout               | Shopify Checkout (se mantiene)                                                                                                       |

## Stack del theme actual

- jQuery + plugins: `jquery.js`, `api.jquery.js`, `ajaxify-shop.js`, `jquery.owl.min.js` (carrusel), `jquery.magnific-popup.min.js`, `lazysizes.js`, `scripts.js`.
- 4 hojas de estilo bloqueantes: `apps.css`, `style.css`, `flexslider.css`, `flexslider-product.css`.
- Scripts de terceros: `html5shiv` (googlecode, obsoleto), Vimeo player API, YouTube iframe API, `shopoe.net/app.js` (app externa).
- Assets con fecha 2018 → theme vintage (pre Online Store 2.0: sin secciones en todas las páginas ni JSON templates).

## Catálogo

- **79 productos**, todos disponibles; 44 con más de una imagen; 27 con variantes.
- 5 productos con `compare_at_price` real (descuentos existentes; el theme nuevo los mostrará, no se inventan otros).
- Opciones de variante **inconsistentes**: `Color`/`COLOR`, `Talla`/`TALLA`/`Size`/`Tamaño`, e incluso `1 PLAZA` y `PRECIO` como nombre de opción.
- `product_type` vacío en 41/79 productos; tags escasos (`camarote`, `CAMA`, `camas`, `colchones`, `SOFACAMA`).
- Títulos con mayúsculas mixtas (`CAMA ALTA LUNA 1 PLAZA Y 1.5 PLAZA` vs `Juego de Comedor Bar Style`).

### Colecciones (15)

| Handle                                              | Título                                         | Productos |
| --------------------------------------------------- | ---------------------------------------------- | --------- |
| colchones                                           | Colchones                                      | 26        |
| camarotes                                           | Camarotes                                      | 16        |
| dormitorio-1                                        | Dormitorio                                     | 15        |
| home                                                | Home                                           | 14        |
| comedores                                           | Comedores                                      | 13        |
| dormitorio                                          | Camas                                          | 7         |
| espuma                                              | LAMINAS DE ESPUMA                              | 5         |
| sillon-futon                                        | Sillón futón                                   | 3         |
| sofas                                               | Sofas                                          | 3         |
| futones                                             | Futones                                        | 1         |
| living, almohadas, box, muebles-living, living-pack | Aislantes, Almohadas, Box, Poufs, Ropa de Cama | **0**     |

Notas: el handle `living` se titula "Aislantes" y `living-pack` "Ropa de Cama"; `dormitorio` se titula "Camas". Los handles no deben cambiarse (URLs indexadas), pero conviene revisar títulos y vaciar/ocultar colecciones sin productos.

## SEO actual

- `<title>` home: "Recutex, Fabrica de Espumas, Colchones de resortes y muebles en Chile," (coma final, sin tilde).
- `meta description` = lista de keywords separadas por comas (keyword stuffing). Recomendación: reescribir en el admin (Preferencias → SEO). El theme nuevo lee estos valores desde Shopify, no los hardcodea.
- `og:image` de 225×225 (bajo el mínimo recomendado 1200×630).
- **0 bloques JSON-LD** en la home. El theme nuevo agrega `structured_data` en producto y artículo, y Breadcrumb en Fase 14.
- Páginas enlazadas: `/pages/terminos-y-condiciones`, `/pages/formas-de-pago`, `/pages/devolucion-y-garantia`, `/pages/consultas-frecuentes`, `/pages/recuperadoradetextiles`, `/pages/gerdarmeria-sename`.

## Performance (estimado por inspección)

- jQuery + 6 plugins + 4 CSS bloqueantes en el `<head>`.
- APIs de Vimeo y YouTube cargadas en todas las páginas.
- `html5shiv` desde googlecode (dominio muerto → request fallido).

## Contenido comercial detectado

- WhatsApp `+569 82933117` en el header/footer. Es dato real de la tienda; se debe exponer como configuración del theme, no hardcodeado.

## Qué existe / qué falta

| Existe                               | Falta                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Tienda operativa, catálogo, checkout | Repositorio, control de versiones                                      |
| Theme ShowTime publicado             | Entorno reproducible (Docker)                                          |
| Menús y páginas                      | Theme OS 2.0 editable por secciones                                    |
|                                      | Datos estructurados, imágenes responsivas, JS moderno                  |
|                                      | Normalización de opciones de variante (tarea de catálogo, no de theme) |

## Pendiente de verificar con acceso al admin

- Menús reales (`main-menu`, `footer`) y su profundidad (necesario para mega menú).
- Metafields existentes (medidas, materiales, garantía) para fichas de producto.
- Apps instaladas y cuáles inyectan código en el theme (`shopoe.net`, reviews, WhatsApp).
- Templates alternativos usados por páginas/productos (`page.contact`, etc.).
- Filtros de Search & Discovery configurados (Fase 7).
