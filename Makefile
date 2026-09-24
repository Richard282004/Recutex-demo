# Thin wrappers around docker compose. Run `make help`.
COMPOSE = docker compose
RUN = $(COMPOSE) run --rm --service-ports dev
EXEC = $(COMPOSE) run --rm dev

.PHONY: help build dev stop shell login check lint format backup themes push-staging clean

help: ## List commands
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-14s %s\n", $$1, $$2}'

build: ## Build the dev image
	$(COMPOSE) build

dev: ## Start theme dev (hot reload preview on a development theme)
	$(RUN) npm run dev

stop: ## Stop and remove containers
	$(COMPOSE) down

shell: ## Open a shell inside the container
	$(EXEC) bash

login: ## Interactive Shopify login (device code)
	$(EXEC) npm run login

check: ## Shopify Theme Check
	$(EXEC) npm run check

lint: ## Theme Check + ESLint + Stylelint + Prettier check
	$(EXEC) npm run lint

format: ## Format code with Prettier
	$(EXEC) npm run format

backup: ## Pull a read-only copy of the LIVE theme into backups/
	$(EXEC) npm run backup:live

themes: ## List themes in the store
	$(EXEC) npm run theme:list

push-staging: ## Push to the unpublished staging theme (guarded, never live)
	$(EXEC) npm run push:staging

clean: ## Remove containers and volumes (logs you out of the CLI)
	$(COMPOSE) down -v
