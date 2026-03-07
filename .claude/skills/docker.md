# Docker & Docker Compose

## docker-compose.yml Pattern
```yaml
version: "3.8"
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

## Dockerfile.backend
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Dockerfile.frontend
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY frontend/package*.json .
RUN npm install
COPY frontend/ .
RUN npm run build
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
```

## Common Commands
```bash
docker-compose up --build        # Build and start all services
docker-compose down              # Stop and remove containers
docker-compose logs -f backend   # Tail backend logs
docker-compose exec backend bash # Shell into backend container
```

## Tips
- Put `OPENAI_API_KEY` in `.env` file (add `.env` to `.gitignore`)
- Use `volumes` mount for hot-reload in dev
- For production, use multi-stage frontend build and serve with nginx
