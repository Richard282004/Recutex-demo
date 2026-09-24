# Demo comercial — RECUTEX 2.0

Objetivo: mostrar a Recutex el nuevo theme funcionando **con su catálogo real**, sin tocar su tienda.

La demo corre en una **tienda de desarrollo propia** (gratis, protegida con contraseña). El catálogo se copia desde el storefront público de Recutex (solo lectura). Al cerrar el proyecto, el theme se entrega con `shopify theme push` a la tienda real de Recutex, que ya tiene los mismos handles de colección.

```text
recutex.myshopify.com (solo lectura: /products.json)
        │  npm run demo:catalog
        ▼
demo/products.csv ──► Admin demo → Productos → Importar
                                   │
npm run demo:seed ────────────────►│ colecciones automáticas, páginas, menús
                                   │
shopify theme dev / push ─────────►│ theme RECUTEX 2.0
                                   ▼
                     https://<tu-demo>.myshopify.com  (contraseña)
```

## 1. Crear la tienda de desarrollo (≈5 min)

1. Entrar a [partners.shopify.com](https://partners.shopify.com) (crear cuenta Partner si no existe; es gratis).
2. **Tiendas → Agregar tienda → Tienda de desarrollo** → "Crear tienda para probar y construir".
3. Nombre: `Recutex` (el nombre aparece en el header si no hay logo). País: Chile. Moneda: **CLP**.
4. En la tienda: **Configuración → Idiomas** → español como idioma predeterminado.

## 2. Importar el catálogo

```bash
make demo-catalog          # genera demo/products.csv (79 productos, imágenes incluidas por URL)
```

Admin demo → **Productos → Importar** → subir `demo/products.csv`. Shopify descarga las imágenes desde las URLs; tarda unos minutos.

El CSV agrega tags `col-<handle>` (pertenencia a colección original) y `oferta` (productos con precio de comparación real). No se inventa ningún precio ni descuento.

## 3. Colecciones, páginas y menús

### Opción A — automático (recomendado)

1. Admin demo → **Configuración → Apps y canales de venta → Desarrollar apps** → Crear app `demo-seed`.
   - Si el admin indica que las apps personalizadas se crean desde el **Dev Dashboard**, crear la app allí e instalarla en la tienda demo.
2. Scopes de Admin API: `write_products`, `read_products`, `write_online_store_navigation`, `read_online_store_navigation`, `write_online_store_pages`, `read_online_store_pages`, `write_publications`, `read_publications`.
3. Instalar la app y copiar el **Admin API access token** (`shpat_…`).
4. En `.env`:
   ```env
   SHOPIFY_DEMO_STORE=<tu-demo>.myshopify.com
   SHOPIFY_ADMIN_TOKEN=shpat_...
   ```
5. `make demo-seed`

El script crea 12 colecciones automáticas con los handles originales, 3 páginas con textos del sitio actual y los menús `main-menu` y `footer`. Si alguna colección o página ya existe, la deja como está. **Se niega a correr contra `recutex.myshopify.com`.**

### Opción B — manual

Crear colecciones **automatizadas** con la condición "Etiqueta del producto es igual a …" y ajustar el handle en "Edición del SEO del sitio web":

| Handle        | Título            | Condición                                                                 |
| ------------- | ----------------- | ------------------------------------------------------------------------- |
| colchones     | Colchones         | tag `col-colchones`                                                       |
| dormitorio    | Camas             | tag `col-dormitorio`                                                      |
| dormitorio-1  | Dormitorio        | tag `col-dormitorio-1`                                                    |
| camarotes     | Camarotes         | tag `col-camarotes`                                                       |
| comedores     | Comedores         | tag `col-comedores`                                                       |
| sofas         | Sofás             | tag `col-sofas`                                                           |
| sillon-futon  | Sillón futón      | tag `col-sillon-futon`                                                    |
| futones       | Futones           | tag `col-futones`                                                         |
| espuma        | Láminas de espuma | tag `col-espuma`                                                          |
| home          | Destacados        | tag `col-home`                                                            |
| ofertas       | Ofertas           | tag `oferta`                                                              |
| sala-de-estar | Living            | cualquier condición: tag `col-sofas` / `col-sillon-futon` / `col-futones` |

Páginas (contenido en `demo/pages/*.html`): `nosotros`, `devolucion-y-garantia`, `consultas-frecuentes`.

Menú `main-menu`: Dormitorio (Colchones [Resortes, Espuma], Camas, Camarotes) · Living (Sofás, Sillón futón, Futones) · Comedores · Espumas · Ofertas · Nosotros. Ver la estructura exacta en `scripts/demo/seed-store.mjs`.

## 4. Filtros de colección

Instalar la app gratuita **Shopify Search & Discovery** en la tienda demo → Filtros → agregar _Disponibilidad_, _Precio_ y _Tipo de producto_. El theme muestra automáticamente los filtros configurados.

## 5. Subir el theme

```bash
# .env: SHOPIFY_FLAG_STORE=<tu-demo>.myshopify.com
make dev            # desarrollo con hot reload + link de preview compartible
```

Para la presentación, el theme debe quedar **publicado en la tienda demo** (no en la de Recutex):

```bash
make shell
shopify theme push --path theme --unpublished --theme "Recutex 2.0"
```

Luego en el admin **de la tienda demo**: Tienda online → Temas → Recutex 2.0 → Publicar.

## 6. Ajustes finales en el Theme Editor

- **Logo**: subir el logo en alta resolución (el actual del sitio es de 126 px de ancho; pedir el original a Recutex). Sin logo, el header muestra el nombre de la tienda con la tipografía de marca.
- **Hero**: usa por defecto la foto de la "Cama Base Europea 2 plazas". Con fotografía de ambiente profesional, cambiar el diseño a "Imagen a pantalla completa".
- WhatsApp, teléfono y email ya vienen configurados con los datos públicos de Recutex (Configuración del tema → Contacto).

## 7. Compartir la demo

Tienda online → Preferencias → **Contraseña**: la tienda de desarrollo siempre está protegida. Compartir URL + contraseña con Recutex. El checkout funciona en modo prueba (Shopify Payments en modo test o "Bogus Gateway"), así que se puede mostrar el flujo completo carrito → checkout sin cobrar.

## Qué mostrar en la reunión

1. Home en móvil y desktop: hero, categorías, ofertas reales, storytelling de marca.
2. Mega menú y búsqueda predictiva ("colchón", "camarote").
3. Colección con filtros sin recargar la página.
4. Ficha de producto: galería con zoom y swipe, selector de variantes, WhatsApp con el nombre del producto.
5. Agregar al carrito → carrito lateral → checkout de Shopify.
6. Theme Editor: cambiar un banner sin programar.

## Datos a validar con Recutex antes de producción

| Dato usado en la demo                         | Fuente                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| "Más de 30 años"                              | Página "Historia de la empresa" dice 34 años (fecha de redacción desconocida) |
| 3 meses de garantía en muebles                | /pages/devolucion-y-garantia                                                  |
| Plazos de despacho 20 / 25 días hábiles       | /pages/consultas-frecuentes                                                   |
| Horario, dirección, teléfono, email, WhatsApp | /pages/consultas-frecuentes y header del sitio                                |

## Limitaciones conocidas de la demo

- La calidad de las fotos es la del catálogo actual (varias con marca de agua o texto incrustado). Es el mayor salto visual pendiente.
- Opciones de variante inconsistentes en el catálogo (`Color`/`COLOR`, `Talla`/`Size`), heredadas del origen.
- Sin reviews, cuotas ni favoritos: no existen datos reales para ellos y el theme no los inventa.
