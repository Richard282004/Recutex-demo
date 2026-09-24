# RECUTEX 2.0 — Storefront

Theme Shopify (Online Store 2.0) propio para [recutex.myshopify.com](https://recutex.myshopify.com), con un entorno de desarrollo reproducible en Docker.

- **Shopify** sigue manejando catálogo, precios, inventario, descuentos, clientes, pedidos, checkout y pagos.
- **Este repo** contiene el theme (`theme/`) y las herramientas para desarrollarlo.
- Nada de este repo publica en producción. La publicación es manual y requiere aprobación.

Más detalle: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (arquitectura, decisiones, fases, riesgos) y [`docs/AUDIT.md`](docs/AUDIT.md) (auditoría de la tienda actual).

## Requisitos

- Docker Desktop (o Docker Engine + Compose v2.24+)
- Git
- Acceso a la tienda: cuenta de staff/colaborador con permiso de **Themes**, o una contraseña de la app **Theme Access**

No hace falta Node ni Shopify CLI en tu máquina: todo corre en el contenedor.

## Inicio rápido

```bash
git clone <repo> recutex-storefront && cd recutex-storefront
cp .env.example .env          # completar SHOPIFY_FLAG_STORE (y opcionalmente el token)
make build                    # construye la imagen (Node 24 + Shopify CLI + linters)
make dev                      # inicia shopify theme dev con hot reload
```

La primera vez sin token, la CLI muestra un **código de verificación** y un link `accounts.shopify.com/activate-with-code...`. Ábrelo en tu navegador, confirma el código y la sesión queda guardada en un volumen Docker.

Cuando arranca, la CLI imprime:

- `http://127.0.0.1:9292` → preview local con hot reload (ábrelo como `http://localhost:9292`)
- link de **preview compartible** (`?preview_theme_id=...`) → para mostrar a otras personas
- link al **Theme Editor** del development theme

Detener: `Ctrl+C` y luego `make stop`.

Sin `make`: `docker compose run --rm --service-ports dev npm run dev`.

## Variables de entorno

| Variable                   | Obligatoria         | Descripción                                                            |
| -------------------------- | ------------------- | ---------------------------------------------------------------------- |
| `SHOPIFY_FLAG_STORE`       | sí                  | `recutex.myshopify.com`                                                |
| `SHOPIFY_CLI_THEME_TOKEN`  | no                  | Contraseña de Theme Access (`shptka_...`). Evita el login interactivo. |
| `SHOPIFY_STAGING_THEME_ID` | para `push-staging` | ID del theme **no publicado** de QA. Nunca el live.                    |
| `THEME_DEV_PORT`           | no                  | Puerto del preview (default `9292`).                                   |

`.env` está en `.gitignore`. Nunca commitear tokens. Solo se versiona `.env.example`.

### Obtener una contraseña de Theme Access

1. Admin → Apps → instalar **Theme Access** (app oficial de Shopify).
2. Crear contraseña para el email del desarrollador.
3. Copiar el valor `shptka_...` del email recibido a `SHOPIFY_CLI_THEME_TOKEN` en `.env`.

## Comandos

| `make`                     | Qué hace                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `make dev`                 | `shopify theme dev`: sube el theme a un **development theme** oculto y sincroniza cada cambio guardado |
| `make check`               | Shopify Theme Check (errores de Liquid, schemas, performance)                                          |
| `make lint`                | Theme Check + ESLint + Stylelint + Prettier                                                            |
| `make format`              | Formatea con Prettier (incluye Liquid)                                                                 |
| `make backup`              | Descarga copia **solo lectura** del theme live a `backups/`                                            |
| `make themes`              | Lista los themes de la tienda con su rol                                                               |
| `make push-staging`        | Sube `theme/` al theme de staging (con guardas)                                                        |
| `make login`               | Login interactivo en Shopify                                                                           |
| `make shell`               | Shell dentro del contenedor                                                                            |
| `make stop` / `make clean` | Detiene / borra contenedores y volúmenes (cierra sesión)                                               |

## Cómo funciona el hot reload

```text
editar theme/**  →  guardar  →  bind mount al contenedor  →  shopify theme dev detecta el cambio
                 →  sube el archivo al development theme  →  el preview se recarga
```

La imagen Docker solo contiene herramientas; el código se monta como volumen, así que **nunca hay que reconstruir la imagen por cambios en el theme**. Reconstruir solo al cambiar `Dockerfile` o `package.json`.

## Flujo seguro hacia producción

1. **Nunca** se trabaja sobre el theme publicado.
2. Antes de empezar: `make backup` (copia local) y además **Admin → Temas → ⋯ → Duplicar** sobre el theme live.
3. Desarrollo diario: `make dev` (development theme propio, invisible para clientes).
4. QA: crear en el admin un theme vacío/duplicado **no publicado** llamado `Recutex 2.0 — Staging`, poner su ID en `SHOPIFY_STAGING_THEME_ID`, y `make push-staging`. El script aborta si el ID corresponde al theme live.
5. Producción: una persona responsable revisa staging y lo publica desde el admin (**Temas → Publicar**). No hay comando para esto a propósito.

> `push-staging` sobrescribe `config/settings_data.json` y los templates JSON del theme de staging. Si alguien configuró contenido en el editor de staging, hacer `shopify theme pull --theme <id>` antes de volver a subir.

## Estructura

```text
.
├── Dockerfile, docker-compose.yml, Makefile, .env.example
├── package.json           scripts y linters
├── scripts/               backup-live.mjs, push-staging.mjs
├── docs/                  auditoría y arquitectura
└── theme/                 raíz del theme Shopify
    ├── assets/  config/  layout/  locales/
    └── sections/  snippets/  templates/
```

## Git workflow

- `main`: estable, lo que está (o estará) en producción.
- `develop`: integración.
- `feature/<nombre>`: una por fase/componente (`feature/header`, `feature/home`, `feature/product-card`, `feature/product-page`, `feature/cart`, `feature/search`, `feature/animations`).

```bash
git switch develop
git switch -c feature/header
# ...trabajo + make lint...
git commit -m "feat: add premium sticky header"
# PR feature/header → develop; release: develop → main
```

Commits en formato Conventional Commits: `feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `chore:`.

## Reglas del theme

- No hardcodear productos, precios, descuentos, stock, garantías, cuotas ni reviews: todo viene de Shopify.
- Todo contenido comercial (banners, textos, links, colecciones) debe ser editable en el Theme Editor.
- JS en ES modules / Custom Elements, sin jQuery ni librerías pesadas.
- CSS mobile first con los tokens de `base.css` / `css-variables.liquid`; evitar `!important`.
- Respetar `prefers-reduced-motion`.

## Troubleshooting

| Síntoma                                                                  | Causa / solución                                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `spawn xdg-open ENOENT`                                                  | Imagen antigua. `make build` (la imagen actual incluye un shim).                                                               |
| La CLI pide login cada vez                                               | Se borró el volumen `shopify-config` (`make clean`). Volver a hacer login o usar Theme Access.                                 |
| El preview no refleja cambios                                            | Revisar que el archivo esté dentro de `theme/` y que `make dev` siga corriendo; ver errores de subida en la consola de la CLI. |
| Puerto 9292 ocupado                                                      | Cambiar `THEME_DEV_PORT` en `.env`.                                                                                            |
| `You are not authorized to use the CLI to develop in the provided store` | La cuenta no tiene permiso de Themes, o `SHOPIFY_FLAG_STORE` no es el dominio `.myshopify.com`.                                |
| Theme Check falla                                                        | `make check` muestra archivo y línea; corregir antes de commitear.                                                             |
| En Apple Silicon el build es lento la primera vez                        | Normal: descarga la imagen base arm64; las siguientes usan caché.                                                              |
