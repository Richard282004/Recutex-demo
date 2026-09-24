# RECUTEX storefront — reproducible development environment.
# Contains tooling only. Credentials are passed at runtime via .env, never baked in.
FROM node:24-bookworm-slim

ARG SHOPIFY_CLI_VERSION=4.8.2

# git: required by Shopify CLI (theme init/pull) and useful inside the container.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates openssh-client \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g @shopify/cli@${SHOPIFY_CLI_VERSION} \
  && npm cache clean --force

# The container has no browser. Shopify CLI calls xdg-open for login/preview links and
# crashes with "spawn xdg-open ENOENT" if it is missing. The CLI already prints every URL,
# so a no-op shim is enough: open the printed link in the host browser.
RUN printf '#!/bin/sh\nexit 0\n' > /usr/local/bin/xdg-open && chmod +x /usr/local/bin/xdg-open

ENV SHOPIFY_CLI_NO_ANALYTICS=1 \
    NODE_ENV=development

WORKDIR /app

# Pre-create dirs that are mounted as named volumes so they are owned by `node`.
RUN mkdir -p /app/node_modules /home/node/.config /home/node/.cache \
  && chown -R node:node /app /home/node

USER node

# Project dev dependencies (linters/formatters). Source code is bind-mounted at runtime.
COPY --chown=node:node package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

EXPOSE 9292

CMD ["npm", "run", "dev"]
