# RECUTEX 2.0 — Storefront

Tienda online propia para Recutex en **Next.js**, sin plataforma SaaS. Pagos con **Webpay Plus (Transbank)**.

Esta versión es una **demo comercial**: usa el catálogo real publicado en la tienda actual (snapshot de solo lectura) y Webpay en ambiente de **integración** (sin cobros reales).

- Arquitectura, decisiones, fases y riesgos: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Auditoría de la tienda actual: [`docs/AUDIT.md`](docs/AUDIT.md)
- Guion y datos a validar para la presentación: [`docs/DEMO.md`](docs/DEMO.md)

## Requisitos

- Docker Desktop, **o** Node.js 22.12+ (recomendado 24 LTS)
- Git

## Inicio rápido

El catálogo vive en **PostgreSQL** (contenedor `recutex-db`) y las fotos se descargan a `storage/media` (fuera de Git).

Con Docker (hot reload):

```bash
cp .env.example .env        # y define POSTGRES_PASSWORD / DATABASE_URL con tu propia clave local
npm install                 # para ejecutar el seed desde tu equipo
docker compose up -d db     # PostgreSQL en localhost:5433
npm run db:seed             # carga el catálogo y descarga las fotos (~230 MB, solo la primera vez)
docker compose up dev
# http://localhost:3000
```

Sin Docker para la app (la base sigue en Docker):

```bash
cp .env.example .env        # y define POSTGRES_PASSWORD / DATABASE_URL con tu propia clave local
npm install
docker compose up -d db && npm run db:seed
npm run dev
```

Detener: `Ctrl+C` y `docker compose down` (los datos quedan en el volumen `pgdata`; `docker compose down -v` los borra).

## Variables de entorno

| Variable                                 | Descripción                                                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                   | URL pública (canonical, sitemap).                                                                                                              |
| `WEBPAY_ENV`                             | `integration` (demo, sin cobros) o `production`.                                                                                               |
| `WEBPAY_COMMERCE_CODE`, `WEBPAY_API_KEY` | Solo producción: credenciales que Transbank entrega a Recutex.                                                                                 |
| `ALLOW_INDEXING`                         | `true` en producción para permitir indexación (la demo no se indexa).                                                                          |
| `DATABASE_URL`                           | Conexión a PostgreSQL. En Docker la arma `docker-compose.yml` a partir de `POSTGRES_PASSWORD`.                                                 |
| `POSTGRES_PASSWORD`                      | Clave del contenedor `db`, obligatoria (usa letras y números para no tener que codificarla en la URL). Se aplica al crear el volumen `pgdata`. |
| `MEDIA_DIR`                              | Carpeta de fotos servidas en `/media` (por defecto `storage/media`).                                                                           |

`.env` y `.env.local` están en `.gitignore` y en `.dockerignore`. Nunca commitear credenciales: `.env.example` solo tiene valores de ejemplo.

## Comandos

| Comando                                           | Qué hace                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `npm run dev`                                     | Desarrollo con hot reload                                                               |
| `npm run build` / `npm start`                     | Build y servidor de producción                                                          |
| `npm run lint`                                    | ESLint + TypeScript                                                                     |
| `npm run format`                                  | Prettier                                                                                |
| `npm run check:legacy-urls`                       | Verifica que las URLs de la tienda actual respondan en el sitio nuevo                   |
| `npm run falabella:snapshot`                      | Importa productos y fotos que Recutex publica en Falabella (`data/falabella-*`)         |
| `npm run catalog:snapshot`                        | Actualiza `data/catalog.json` desde el catálogo público actual (solo lectura)           |
| `npm run db:seed`                                 | Crea las tablas, carga el catálogo en PostgreSQL y descarga las fotos a `storage/media` |
| `docker compose --profile prod up -d --build web` | Imagen de producción local en http://localhost:3100 (contenedor `recutex-web`)          |

## Probar un pago (ambiente de integración)

1. Agrega un producto y ve a **Finalizar compra**.
2. Completa los datos y presiona **Pagar con Webpay**: te lleva al formulario de prueba de Transbank.
3. Tarjeta de prueba: VISA `4051 8856 0044 6623`, CVV `123`, cualquier fecha futura. En la autenticación: RUT `11.111.111-1`, clave `123`.
4. Vuelves a `/checkout/resultado` con el detalle confirmado por Transbank. También puedes probar **Anular compra y volver**.

Datos de prueba oficiales: documentación de Transbank Developers.

## Deploy

- **Vercel**: importar el repo, definir las variables de entorno. `NEXT_PUBLIC_SITE_URL` debe ser el dominio final.
- **VPS / cualquier servidor con Docker**: `docker build --target runner -t recutex .` y `docker run -p 3000:3000 --env-file .env recutex`.

Plan completo de lanzamiento, redirecciones y vuelta atrás: `docs/LAUNCH.md`.

## Git workflow

- `main`: estable. `develop`: integración. `feature/<nombre>`: una por funcionalidad.
- Commits: Conventional Commits (`feat:`, `fix:`, `perf:`, `docs:`, `chore:`).
- El prototipo anterior como theme de Shopify queda en el tag `shopify-theme-v0`.

## Reglas del proyecto

- Ningún precio, descuento, stock, garantía o plazo inventado: todo viene del catálogo o de textos publicados por Recutex (`src/content/site.ts`).
- El monto a pagar siempre se calcula en el servidor.
- Accesibilidad: navegación por teclado, foco visible, `prefers-reduced-motion`, contraste AA.
- Performance: Server Components por defecto, imágenes con tamaño correcto, sin librerías pesadas.

## Troubleshooting

| Síntoma                          | Solución                                                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Cambios no se ven en Docker      | `WATCHPACK_POLLING` ya está activo; reinicia con `docker compose restart dev`.                             |
| "No pudimos conectar con Webpay" | Revisa conexión a internet y `WEBPAY_ENV`. En producción, que código de comercio y API key sean correctos. |
| Puerto ocupado                   | Cambia el puerto en `docker-compose.yml` o usa `npm run dev -- -p 3005`.                                   |
| Imágenes no cargan               | Vienen del CDN de la tienda actual; si esa URL cambia, correr `npm run catalog:snapshot`.                  |
