SHELL := /bin/bash
.PHONY: help dev build start

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start Strapi in development mode
	source $$HOME/.nvm/nvm.sh && nvm use 20 && npm rebuild better-sqlite3 && npm run dev

build: ## Build Strapi for production
	source $$HOME/.nvm/nvm.sh && nvm use 20 && npm run build

start: ## Start Strapi in production mode
	source $$HOME/.nvm/nvm.sh && nvm use 20 && npm run start
