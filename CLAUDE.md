# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Creative Evolution Engine for the AdsGency AI Hackathon 2026 (Track 2: Self-Evolving Creative Intelligence). An AI system that evolves ad copy using evolutionary algorithms — generating variants, scoring fitness, selecting survivors, reflecting on why winners won, and mutating the next generation.

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, LangGraph, OpenAI SDK, Pydantic, uvicorn
- **Frontend:** React + Vite, Tailwind CSS, Recharts, Axios
- **Deployment:** Docker + docker-compose

> Note: The approach doc references Anthropic/Claude but includes a note to "Change this to OpenAI." Use the OpenAI API unless told otherwise.

## Build & Run Commands

```bash
# Full stack (Docker)
make docker

# Install all dependencies
make install

# Backend only
make backend

# Frontend only
make frontend

# Clean build artifacts
make clean
```

## Environment Setup

Copy `.env.example` to `.env` and fill in your API key:
```bash
cp .env.example .env
```

## Architecture

### LangGraph Evolution Loop (5 nodes, cyclical)

```
generate_node -> score_node -> select_node -> reflect_node -> mutate_node -> (back to generate)
```

1. **generate_node** — Calls LLM to produce 5 ad variants from brief + mutation instructions
2. **score_node** — Rule-based fitness scoring on 4 dimensions (hook strength, CTA clarity, emotional resonance, brevity). No LLM call.
3. **select_node** — Ranks by fitness, keeps top 2 survivors, eliminates bottom 3
4. **reflect_node** — Calls LLM to analyze winners vs losers, produces a hypothesis for next generation
5. **mutate_node** — Takes survivors + hypothesis, generates 5 new variants with inherited traits + deliberate mutations

Loop runs for 4 generations by default, or stops when fitness delta < 0.5 for 2 consecutive generations.

### Key Files

- `backend/main.py` — FastAPI app, endpoints (`POST /api/evolve`, `GET /api/stream/{run_id}`, `GET /api/results/{run_id}`)
- `backend/agent/graph.py` — LangGraph graph definition
- `backend/agent/nodes.py` — All 5 node functions
- `backend/agent/state.py` — `EvolutionState` TypedDict (shared LangGraph state)
- `backend/agent/scoring.py` — Fitness scoring logic (deterministic, not LLM-based)
- `backend/models/schemas.py` — Pydantic models (`AdVariant`, `GenerationLog`, etc.)
- `frontend/src/components/` — BriefInput, GenerationFeed, FitnessChart, StrategyReport

### Data Flow

The `EvolutionState` TypedDict is the central state object flowing through LangGraph nodes. Key fields: `brief`, `platform`, `audience`, `generation`, `variants`, `survivors`, `hypothesis`, `mutation_instructions`, `history`, `strategy_report`.

### API Streaming

The backend uses SSE (Server-Sent Events) to stream generation progress to the frontend. Event types: `generation_complete`, `variant_scored`, `hypothesis_formed`, `done`.

## Subagent Strategy (Token Optimization)

Use the `Agent` tool to delegate tasks that would otherwise bloat the main context. The goal: main thread stays lean, subagents do the heavy reading.

**When to use subagents:**

| Task | Subagent Type | Why |
|------|--------------|-----|
| "What does this module do?" / broad exploration | `Explore` | Reads many files, returns a summary |
| Scaffold a new component or endpoint | `Code` | Generates boilerplate in isolation |
| Trace a bug across multiple files | `Code` | Greps logs, reads stack traces, reports root cause |
| Update CLAUDE.md after changes | `Code` | Reads diff + current CLAUDE.md, outputs the edit |
| Check if tests pass after a change | `Code` | Runs tests, only surfaces failures |

**When NOT to use subagents:**
- Single file edits — just do it inline
- Quick grep/glob for one thing — direct tool call is faster
- Anything that needs user confirmation — subagents can't ask the user

**Subagent prompting tips:**
- Be specific: "Read `backend/agent/nodes.py` and summarize what each node function does" not "explore the backend"
- Scope the output: "Return only the function signatures and a one-line description each"
- For CLAUDE.md updates: "Read the git diff of staged changes, then read CLAUDE.md, and output only the Edit tool calls needed to keep CLAUDE.md in sync"

## Skills Reference

Tech-specific patterns and snippets are in `.claude/skills/`:
- `fastapi.md`, `langgraph.md`, `openai.md`, `pydantic.md`
- `react-vite.md`, `tailwindcss.md`, `recharts.md`, `docker.md`

## Keeping This File Updated

**This file MUST be kept in sync with the codebase.** When making changes, update the relevant sections:

- **New dependency added** — Update "Tech Stack" and ensure `requirements.txt` / `package.json` are noted
- **New endpoint added** — Update "Key Files" and the API list under Architecture
- **New LangGraph node or state field** — Update "Architecture" and "Data Flow" sections
- **New component added** — Update "Key Files" frontend section
- **New env var required** — Update "Environment Setup" and `.env.example`
- **New make target added** — Update "Build & Run Commands"
- **New skill file created** — Update "Skills Reference"
- **File moved or renamed** — Update all path references in this file

If unsure whether a change warrants an update here, it probably does. Keep descriptions concise — one line per item.
