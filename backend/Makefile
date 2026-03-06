.PHONY: help dev build start

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start Strapi in development mode
	npm run dev

build: ## Build Strapi for production
	npm run build

start: ## Start Strapi in production mode
	npm run start
