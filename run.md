# Running the Creative Evolution Engine

## Prerequisites

- Python 3.11+
- Node.js 20+
- OpenAI API key

## Setup

```bash
# 1. Create your .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 2. Install dependencies
make install
```

## Run (two terminals)

**Terminal 1 — Backend:**
```bash
make backend
```
Backend runs at `http://localhost:8000`

**Terminal 2 — Frontend:**
```bash
make frontend
```
Frontend runs at `http://localhost:5173`

## Run with Docker (single command)

```bash
make docker
```

## Usage

1. Open `http://localhost:5173`
2. Enter a product brief, select platform, describe target audience
3. Click **Start Evolution**
4. Watch variants evolve across generations in real-time
5. Review the strategy report at the end

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/evolve` | Start an evolution run |
| GET | `/api/stream/{run_id}` | SSE stream of generation events |
| GET | `/api/results/{run_id}` | Final results after completion |
