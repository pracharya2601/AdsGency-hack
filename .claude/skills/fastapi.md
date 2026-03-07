# FastAPI

## Key Patterns
- Use `APIRouter` for route grouping, mount in `main.py`
- Define request/response models with Pydantic `BaseModel`
- Use `async def` for endpoints that make I/O calls (LLM, DB)
- SSE streaming via `StreamingResponse` with `text/event-stream` media type
- Use `BackgroundTasks` for fire-and-forget work after response
- Dependency injection via `Depends()` for shared resources (e.g., agent runner)

## SSE Streaming Pattern
```python
from fastapi.responses import StreamingResponse
import asyncio, json

async def event_generator(run_id: str):
    # yield SSE-formatted events
    yield f"data: {json.dumps({'event': 'generation_complete', 'data': payload})}\n\n"

@app.get("/api/stream/{run_id}")
async def stream(run_id: str):
    return StreamingResponse(event_generator(run_id), media_type="text/event-stream")
```

## Common Commands
```bash
pip install fastapi uvicorn python-dotenv
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Error Handling
- Use `HTTPException` for client errors
- Use `@app.exception_handler` for global error handling
- Return consistent error shapes: `{"detail": "message"}`
