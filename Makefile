.PHONY: dev backend frontend install docker clean

# Run full stack with Docker
docker:
	docker-compose up --build

# Install all dependencies
install: install-backend install-frontend

install-backend:
	cd backend && pip install -r requirements.txt

install-frontend:
	cd frontend && npm install

# Run backend dev server
backend:
	cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run frontend dev server
frontend:
	cd frontend && npm run dev

# Run both (requires two terminals, or use docker)
dev:
	@echo "Run 'make backend' and 'make frontend' in separate terminals, or use 'make docker'"

# Clean build artifacts
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	rm -rf frontend/dist frontend/node_modules/.vite
