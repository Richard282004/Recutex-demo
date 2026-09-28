# Demo para Recutex

## Qué mostrar (15 minutos)

1. **Home en celular y computador**: hero de marca con las franjas del logo, categorías con conteo real, ofertas reales (5 productos con precio rebajado en su catálogo), historia de la empresa.
2. **Mega menú** (Dormitorio, Living) y **búsqueda predictiva**: escribir "camarote" o "colchón".
3. **Colección con filtros**: Colchones → filtrar por medida (1 plaza … Super King) y precio, sin recargar. El link se puede compartir.
4. **Ficha de producto**: galería deslizable con zoom, variantes, "Comprar ahora", consulta por WhatsApp con el nombre del producto.
5. **Carrito lateral → Checkout → Webpay** (ambiente de prueba de Transbank) → comprobante con orden, monto y código de autorización.
6. **Argumento económico**: sin mensualidad de plataforma ni comisión extra por venta; solo hosting y la comisión de Transbank. Ver `docs/ARCHITECTURE.md` (incluye los costos que asume el proyecto).

## Cómo compartir la demo

- Local: `npm run dev` y abrir http://localhost:3000.
- Online: deploy en Vercel (preview privado) con `WEBPAY_ENV=integration`. `robots.txt` bloquea la indexación mientras `ALLOW_INDEXING` no sea `true`.

## Datos usados y su fuente

Todo texto comercial proviene de la tienda pública actual. Validar con Recutex antes de producción:

| Dato                                                       | Fuente                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------- |
| "Más de 30 años"                                           | Página "Historia de la empresa" dice 34 años (fecha de redacción desconocida) |
| 3 meses de garantía en muebles                             | /pages/devolucion-y-garantia                                                  |
| Plazos de despacho 20 / 25 días hábiles                    | /pages/consultas-frecuentes                                                   |
| Horario, dirección, teléfono, email, WhatsApp              | /pages/consultas-frecuentes y header del sitio                                |
| "Te contactaremos para coordinar el despacho" (tras pagar) | Supuesto de la demo: **definir proceso real**                                 |
| Costo de despacho                                          | **No publicado**: la demo lo muestra como "por confirmar"                     |
| RUT de Recutex Limitada                                    | **No publicado**: requerido en términos y política de privacidad              |
| Teléfono                                                   | Términos actuales dicen 02 772 3227; header y FAQ dicen 2 3278 1476           |
| Plazo de despacho                                          | Política de envíos de Shopify dice 10–20 días hábiles; FAQ dice 20/25         |

## Textos legales (borradores)

`/pages/terminos-y-condiciones`, `/pages/politica-de-privacidad` y `/pages/devolucion-y-garantia` son borradores basados en los textos actuales de Recutex, ajustados a la Ley 19.496, el Reglamento de Comercio Electrónico (DS 6/2021) y la Ley 21.719 de datos personales (vigente desde el 1 de diciembre de 2026). Muestran un aviso de borrador hasta que Recutex y un abogado los validen (`draft` en `src/content/site.ts`). El checkout exige aceptarlos (Ley 19.496, art. 12 A).

Cambios respecto de la tienda actual que Recutex debe decidir:

- **Garantía**: la tienda publica 3 meses; la garantía legal es de 6 meses desde la Ley 21.398. La demo muestra 6 meses.
- **Retracto en ofertas**: la tienda actual excluye productos en oferta de cambios y devoluciones. Una exclusión del retracto debe informarse expresamente antes de la compra; la demo no la aplica hasta que Recutex la defina.
- **Gastos de envío en garantía y retracto**: los términos actuales los cargan al cliente. Validar con el abogado; la demo no lo afirma.
- **Arbitraje**: los términos actuales imponen arbitraje; se eliminó por ser dudoso frente a consumidores.
- **Cookies**: no se agregó banner porque el sitio no usa cookies de analítica ni publicidad (el carrito usa almacenamiento local, necesario para comprar). Si se agrega analítica, primero consentimiento.

## Limitaciones conocidas

- **Sin admin todavía**: productos y textos se editan en archivos (fase 9: Payload CMS).
- **Pedidos no se guardan**: el pago se confirma con Transbank, pero no hay base de datos de pedidos ni emails (fase 10).
- **Newsletter**: valida el email pero no lo guarda (lo indica en pantalla).
- **Catálogo**: 79 productos vienen de la tienda Shopify de Recutex y 80 de las publicaciones que Recutex tiene como vendedor en Falabella. Las 111 publicaciones de Falabella están en la demo: 80 como productos nuevos y 31 dentro de un producto que ya existía (misma línea en otra medida o color) (`data/falabella-products.json`, `npm run falabella:snapshot`). Las publicaciones de Falabella que corresponden a un producto ya existente no se duplican (lista `EXISTING` del script).
  - **Precios** de los productos de Falabella: el precio vigente allí, que puede diferir del precio en la tienda propia (ej. Colchón Constellation 1.5: $179.000 en Falabella, $151.200 en Shopify). **Validar con Recutex.** El "precio normal" tachado de Falabella no se usa como descuento.
  - **Sin descripción**: las fichas de Falabella bloquean el acceso automatizado, así que solo se usan nombre, precio, fotos y colores del listado público.
  - **Stock**: se asume disponible si Falabella permite comprarlo.
- **Fotos**: 19 productos de Shopify usan las fotos más nuevas de Falabella (hasta 1.300 px, sin marca de agua), revisadas una a una. Todas las fotos se descargan a `storage/media` con `npm run db:seed` y la app las sirve en `/media` (optimizadas a AVIF/WebP por Next.js): la demo ya no depende de los CDN de Shopify ni Falabella. En producción conviene moverlas a almacenamiento de objetos (S3, R2 o Vercel Blob) y pedir a Recutex los originales.
- Opciones de variante inconsistentes en el origen (`Color`/`COLOR`, `Talla`/`Size`).
