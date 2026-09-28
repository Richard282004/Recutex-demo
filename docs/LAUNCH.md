# Salida a producción sin perder ventas ni SEO

Plan para reemplazar la tienda Shopify actual por este sitio. Complementa `docs/ARCHITECTURE.md` (fases 9–12 deben estar listas antes de empezar).

## Estado actual del dominio

- `recutex.cl` y `www.recutex.cl` redirigen (301) a `recutex.myshopify.com`, que es la URL que hoy indexa Google.
- El sitemap de la tienda actual tiene 103 URLs: 79 productos, 15 colecciones, 6 páginas, 1 blog, home y `agents.md` (propio de Shopify).

## URLs heredadas

Toda URL antigua responde 200 en el sitio nuevo, directo o con **una** redirección permanente (308, que Google trata igual que 301). La lista está en `data/legacy-urls.txt` y se verifica con:

```bash
npm run check:legacy-urls -- https://<preview-o-produccion>
```

Resultado al 2026-09-25 (build local): **107/107 OK**.

| URL antigua                                                                        | Destino                         | Motivo                        |
| ---------------------------------------------------------------------------------- | ------------------------------- | ----------------------------- |
| `/products/*`, `/collections/*` existentes                                         | misma URL                       | Se conservan los handles      |
| `/collections/:c/products/:p`                                                      | `/products/:p`                  | URL canónica de producto      |
| `/collections/all`                                                                 | `/collections`                  |                               |
| `/collections/box`                                                                 | `/collections/dormitorio`       | Colección vacía en Shopify    |
| `/collections/living`, `living-pack`, `muebles-living`                             | `/collections/sala-de-estar`    | Colecciones vacías            |
| `/collections/almohadas`                                                           | `/collections`                  | Colección vacía               |
| `/pages/recuperadoradetextiles`                                                    | `/pages/nosotros`               |                               |
| `/pages/formas-de-pago`                                                            | `/pages/terminos-y-condiciones` | Página sin contenido          |
| `/pages/gerdarmeria-sename`                                                        | `/`                             | Catálogo PDF de 2018: validar |
| `/blogs/*`                                                                         | `/`                             | Blog sin artículos            |
| `/policies/terms-of-service`, `privacy-policy`, `refund-policy`, `shipping-policy` | páginas legales equivalentes    |                               |
| `/account/*`                                                                       | `/` (temporal)                  | Aún no hay cuentas de cliente |

Antes del lanzamiento, volver a descargar el sitemap por si Recutex creó productos nuevos y actualizar `data/legacy-urls.txt`.

## QA previo (resultado actual)

| Control                            | Resultado                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Desborde horizontal en 360–1920 px | 13 páginas × 10 anchos (360, 375, 390, 393, 430, 768, 1024, 1366, 1440, 1920): **0 desbordes** |
| Lighthouse móvil: performance      | Home 90, colección 93, producto 93, términos 82                                                |
| Lighthouse: accesibilidad          | 98–100                                                                                         |
| Lighthouse: SEO                    | 66–69 **solo** por `robots.txt` bloqueando la demo; se resuelve con `ALLOW_INDEXING=true`      |
| CLS                                | 0 en todas                                                                                     |
| LCP móvil (4G simulado)            | 2,9–3,3 s. Mejora principal: fotos propias optimizadas (fase 12)                               |
| Checkout sin aceptar términos      | Bloquea el pago en servidor y enfoca la casilla                                                |
| Checkout aceptando términos        | Redirige a Webpay (integración)                                                                |

Pendiente de hacer por una persona: pago aprobado con tarjeta de prueba, navegación completa solo con teclado y lector de pantalla (VoiceOver), y prueba en iPhone y Android reales.

## Secuencia de lanzamiento

1. **Preview privado** con datos y fotos definitivos. Recutex revisa y aprueba textos legales (quitar `draft` en `src/content/site.ts`).
2. **Compras reales de monto bajo** en producción (Webpay producción) y anulación desde el portal de Transbank.
3. **Congelar el catálogo** en Shopify el día del cambio (sin productos nuevos) y actualizar `data/legacy-urls.txt`.
4. **Variables de producción**: `NEXT_PUBLIC_SITE_URL=https://recutex.cl`, `ALLOW_INDEXING=true`, credenciales Webpay.
5. **DNS**: bajar el TTL a 300 s un día antes; apuntar `recutex.cl` y `www` al nuevo hosting; `www` → `recutex.cl` con 301.
6. **Verificar en producción**: `npm run check:legacy-urls -- https://recutex.cl`, `robots.txt`, `sitemap.xml` y una compra real.
7. **Google Search Console**: verificar `recutex.cl`, enviar `sitemap.xml` y revisar cobertura e errores 404 durante 4 semanas.
8. **Shopify en paralelo** 2–4 semanas en plan mínimo, sin dominio, como respaldo y para atender pedidos anteriores.

## Riesgo: URLs indexadas en `recutex.myshopify.com`

Hoy Google indexa el subdominio de Shopify. Al cerrar la tienda esas URLs dejan de responder y no controlamos ese dominio para redirigirlo. Mitigación (validar en el admin de Shopify antes de ejecutar):

- Mientras Shopify siga activo, publicar en Shopify un theme mínimo que, para cada ruta, declare `<link rel="canonical">` a la misma ruta en `https://recutex.cl` y redirija al visitante allí. Mantenerlo hasta que Search Console muestre las URLs nuevas indexadas.
- Solo entonces cerrar la tienda Shopify.

## Plan de vuelta atrás

Si algo falla en las primeras horas (pagos rechazados, errores 5xx, caída del hosting):

1. Revertir el DNS de `recutex.cl` a la configuración anterior (redirección a `recutex.myshopify.com`). Con TTL de 300 s el cambio se propaga en minutos.
2. Shopify sigue operativo porque no se cerró.
3. Conciliar los pedidos recibidos en el sitio nuevo durante la ventana del incidente con el portal de Transbank.

Criterio para declarar estable: 7 días sin errores 5xx relevantes, pagos conciliados con Transbank y sin aumento de 404 en Search Console.
