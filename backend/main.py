import asyncio
import uuid
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

from models.schemas import EvolveRequest, EvolveResponse, ResultsResponse
from agent.graph import app as evolution_app

load_dotenv()

api = FastAPI(title="Creative Evolution Engine")

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for runs
runs: dict = {}


@api.post("/api/evolve", response_model=EvolveResponse)
async def evolve(request: EvolveRequest):
    run_id = str(uuid.uuid4())[:8]
    runs[run_id] = {"status": "running", "events": [], "result": None}

    asyncio.create_task(_run_evolution(run_id, request))
    return EvolveResponse(run_id=run_id)


async def _run_evolution(run_id: str, request: EvolveRequest):
    initial_state = {
        "brief": request.brief,
        "platform": request.platform,
        "audience": request.audience,
        "max_generations": request.generations,
        "generation": 1,
        "variants": [],
        "survivors": [],
        "hypothesis": "",
        "mutation_instructions": "",
        "history": [],
        "strategy_report": "",
    }

    try:
        async for event in evolution_app.astream(initial_state, stream_mode="updates"):
            for node_name, node_output in event.items():
                sse_event = {"node": node_name, "data": _serialize(node_output)}
                runs[run_id]["events"].append(sse_event)

        # Get final state from last event
        runs[run_id]["status"] = "done"
        runs[run_id]["events"].append({"node": "done", "data": {}})
    except Exception as e:
        runs[run_id]["status"] = "error"
        runs[run_id]["events"].append({"node": "error", "data": {"message": str(e)}})


def _serialize(obj):
    """Convert pydantic models and other objects to JSON-safe dicts."""
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if isinstance(obj, list):
        return [_serialize(item) for item in obj]
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    return obj


@api.get("/api/stream/{run_id}")
async def stream(run_id: str):
    if run_id not in runs:
        raise HTTPException(status_code=404, detail="Run not found")

    async def event_generator():
        sent = 0
        while True:
            events = runs[run_id]["events"]
            while sent < len(events):
                event = events[sent]
                yield {"event": event["node"], "data": json.dumps(event["data"])}
                sent += 1
                if event["node"] in ("done", "error"):
                    return
            await asyncio.sleep(0.3)

    return EventSourceResponse(event_generator())


@api.get("/api/results/{run_id}")
async def results(run_id: str):
    if run_id not in runs:
        raise HTTPException(status_code=404, detail="Run not found")
    if runs[run_id]["status"] == "running":
        raise HTTPException(status_code=202, detail="Still running")

    # Reconstruct from events
    history = []
    strategy_report = ""
    for event in runs[run_id]["events"]:
        if event["node"] == "select":
            data = event["data"]
            if "history" in data:
                history = data["history"]
        if event["node"] == "report":
            data = event["data"]
            strategy_report = data.get("strategy_report", "")

    # Get brief info from initial state
    first_event = runs[run_id]["events"][0] if runs[run_id]["events"] else {}
    return {
        "history": history,
        "strategy_report": strategy_report,
    }
