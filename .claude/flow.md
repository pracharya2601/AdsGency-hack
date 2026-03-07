# Creative Evolution Engine — Detailed Flow

## End-to-End Request Lifecycle

### Phase 1: User Submits Brief (Frontend)

```
BriefInput.jsx → App.jsx handleSubmit() → api/client.js startEvolution()
```

1. User fills the form: product brief, platform (Meta/Google/TikTok/LinkedIn/Twitter), target audience, number of generations (1-10, default 4)
2. `App.jsx` calls `startEvolution()` which sends `POST /api/evolve` with the payload
3. App receives `run_id` back and immediately opens an SSE connection via `streamEvents()` to `GET /api/stream/{run_id}`
4. UI enters "running" state — form disables, status indicator starts pulsing

---

### Phase 2: Backend Kicks Off Evolution (FastAPI)

**File:** `backend/main.py`

```
POST /api/evolve
  → Create run_id (8-char UUID)
  → Store run in memory: { status: "running", events: [], result: None }
  → Spawn background task: _run_evolution(run_id, request)
  → Return { run_id } immediately (non-blocking)
```

**`_run_evolution` builds the initial LangGraph state:**
```python
{
    "brief": "user's product description",
    "platform": "Meta",
    "audience": "target audience text",
    "max_generations": 4,
    "generation": 1,
    "variants": [],
    "survivors": [],
    "hypothesis": "",
    "mutation_instructions": "",
    "history": [],
    "strategy_report": ""
}
```

Then calls `evolution_app.astream(initial_state, stream_mode="updates")` which streams node-by-node output. Each node's output is serialized and appended to `runs[run_id]["events"]`.

---

### Phase 3: LangGraph Evolution Loop

**File:** `backend/agent/graph.py`

The compiled graph executes nodes in this order per generation:

```
                    ┌─────────────────────────────────────┐
                    │                                     │
                    ▼                                     │
   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ generate │→ │  score   │→ │  select  │→ │ reflect  │→ │  mutate  │
   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────┬─────┘
                                                                 │
                                                         should_continue?
                                                           /          \
                                                    "generate"     "report"
                                                    (loop back)        │
                                                                 ┌─────▼─────┐
                                                                 │  report   │
                                                                 └─────┬─────┘
                                                                       │
                                                                      END
```

---

### Phase 4: Node-by-Node Breakdown

**File:** `backend/agent/nodes.py`

#### Node 1: `generate_node` (LLM Call)

**Input from state:** `brief`, `platform`, `audience`, `generation`, `mutation_instructions`
**Output:** `{ variants: [5 AdVariant objects] }`

- **Gen 1:** No mutation instructions exist. Prompt tells GPT-4o to create 5 diverse variants with varied tone, hook style, length, and emotional angle.
- **Gen 2+:** Mutation instructions from previous generation guide the LLM. Instructions include survivor traits and the hypothesis to apply.
- **LLM config:** `temperature=0.9` (high creativity), `response_format=json_object`
- **Response parsing:** Handles multiple JSON shapes — `{"variants": [...]}`, `{"ads": [...]}`, bare arrays, or any key containing a list. Skips string items. Defaults missing fields gracefully.
- Each variant gets: `id` (auto 8-char UUID), `headline`, `body`, `cta`, `emotional_tone`, `hook_type`, `generation` number

#### Node 2: `score_node` (No LLM — Deterministic)

**Input from state:** `variants` (5 AdVariant objects from generate)
**Output:** `{ variants: [5 scored AdVariant objects] }`

**File:** `backend/agent/scoring.py`

Scores each variant on 4 dimensions (0-10 scale each):

| Dimension | Weight | What It Measures | Scoring Rules |
|-----------|--------|------------------|---------------|
| **Hook** | 30% | Headline attention-grab | +1.5 for question marks, +1.5 for <=5 words, +1.0 for power words (free, secret, now, etc.), -1.0 for >8 words |
| **CTA** | 25% | Call-to-action clarity | +2.0 for <=3 words, +1.5 for starting with action verb (get, start, try, buy...), +1.0 for urgency words (now, today, limited...) |
| **Emotion** | 25% | Emotional resonance | +1.5 for strong tones (urgency, fomo, excitement...), +0.75 per emotion marker in body (imagine, feel, love...), capped at +2.0 |
| **Brevity** | 20% | Tightness of copy | +2.5 for <=15 words, +1.5 for <=25, -1.5 for >40 words, -1.0 per filler phrase detected |

**Final fitness = weighted sum:**
```
fitness = (hook * 0.30) + (cta * 0.25) + (emotion * 0.25) + (brevity * 0.20)
```

All scores clamped to [0, 10].

#### Node 3: `select_node` (No LLM — Selection)

**Input from state:** `variants` (scored), `generation`, `hypothesis`, `history`
**Output:** `{ variants: [sorted], survivors: [top 2], history: [updated] }`

1. Sorts all 5 variants by `fitness_score` descending
2. Marks top 2 as `survived = True`
3. Computes `avg_fitness` across all 5
4. Creates a `GenerationLog` entry:
   ```python
   GenerationLog(
       generation=current_gen,
       variants=all_5_sorted,
       survivors=[id_of_top_1, id_of_top_2],
       hypothesis=current_hypothesis,
       avg_fitness=average
   )
   ```
5. Appends log to `history` array (accumulates across all generations)

**This is the node whose SSE event triggers the frontend to update** — the `history` array contains all generations so far, which feeds both `GenerationFeed` and `FitnessChart`.

#### Node 4: `reflect_node` (LLM Call)

**Input from state:** `survivors` (top 2), `variants` (all 5)
**Output:** `{ hypothesis: "string" }`

- Separates winners (survived=True) from losers (survived=False)
- Sends both to GPT-4o with `temperature=0.4` (analytical, less creative)
- Prompt: "Compare winning vs losing ads. Identify the specific creative pattern. Output a single concise hypothesis (1-2 sentences) explaining WHY winners won."
- Example output: `"Short question-hook headlines with FOMO framing and single-word CTAs outperformed benefit-led copy with longer body text."`
- This hypothesis becomes the strategic direction for the next generation

#### Node 5: `mutate_node` (No LLM — Instruction Assembly)

**Input from state:** `survivors`, `hypothesis`, `generation`
**Output:** `{ mutation_instructions: "string", generation: current + 1 }`

- Does NOT call the LLM itself
- Assembles mutation instructions from survivor traits + hypothesis:
  ```
  Based on survivors from Generation N:
  - [Headline] tone=X, hook=Y, scores={...}
  - [Headline] tone=X, hook=Y, scores={...}

  Hypothesis: ...

  For the next generation:
  1. Inherit strongest traits from survivors
  2. Apply the hypothesis to improve weak dimensions
  3. Introduce at least 1 deliberate wildcard mutation
  ```
- Increments `generation` counter
- These instructions are consumed by `generate_node` in the next loop iteration

---

### Phase 5: Loop Termination Decision

**File:** `backend/agent/graph.py` → `should_continue()`

After `mutate_node`, the graph evaluates whether to loop or finish:

```
if generation > max_generations → "report" (go to report_node)
if last 2 generations' avg_fitness delta < 0.5 → "report" (plateau detected)
otherwise → "generate" (loop back for another generation)
```

---

### Phase 6: Strategy Report Generation

**File:** `backend/agent/nodes.py` → `report_node` (LLM Call)

- Only runs once, after the loop terminates
- Reads the full `history` array (all generation logs)
- Sends the complete evolutionary timeline to GPT-4o with `temperature=0.3` (most analytical)
- Prompt asks for: (1) the creative strategy that emerged, (2) key fitness improvements, (3) recommended direction going forward
- Output: `{ strategy_report: "multi-paragraph analysis" }`

---

### Phase 7: SSE Streaming to Frontend

**File:** `backend/main.py` → `GET /api/stream/{run_id}`

As each node completes, `_run_evolution` serializes the output and appends to `runs[run_id]["events"]`. The SSE endpoint polls this list every 300ms and yields new events.

**Event flow for a 4-generation run:**
```
1.  event: generate    →  { variants: [...] }        ← Gen 1
2.  event: score       →  { variants: [...scored] }
3.  event: select      →  { variants, survivors, history }  ← Frontend updates UI
4.  event: reflect     →  { hypothesis: "..." }
5.  event: mutate      →  { mutation_instructions, generation: 2 }
6.  event: generate    →  { variants: [...] }        ← Gen 2
7.  event: score       →  ...
8.  event: select      →  ...                        ← Frontend updates UI
9.  event: reflect     →  ...
10. event: mutate      →  ...
... (repeat for Gen 3, 4)
21. event: report      →  { strategy_report: "..." } ← Frontend shows report
22. event: done        →  {}                          ← Frontend exits running state
```

---

### Phase 8: Frontend Renders Results

**File:** `frontend/src/App.jsx`

The `streamEvents` function in `api/client.js` listens for named SSE events:

| SSE Event | Frontend Action |
|-----------|----------------|
| `select` | `setHistory(data.history)` — updates `GenerationFeed` (variant cards) and `FitnessChart` (line graph) |
| `report` | `setStrategyReport(data.strategy_report)` — shows `StrategyReport` panel |
| `done` | `setRunning(false)` — re-enables form, stops pulse indicator |
| `error` | `setError(message)` — shows red error banner |
| `generate`, `score`, `reflect`, `mutate` | `setCurrentNode(nodeName)` — updates the pulsing "Running: X" status |

**Component rendering:**
- `GenerationFeed.jsx` — Renders generations in reverse order (newest first). Each variant is a card showing headline, body, CTA, tone, hook type, fitness score. Survivors get green border + "SURVIVOR" badge. Losers are dimmed.
- `FitnessChart.jsx` — Recharts `LineChart` with 3 lines: Best (green), Average (blue), Worst (red dashed). X-axis = generation, Y-axis = 0-10 fitness scale.
- `StrategyReport.jsx` — Indigo-themed panel with the LLM's final strategic analysis, rendered as pre-wrapped text.

---

## Data Type Reference

### EvolutionState (LangGraph shared state)

```
brief               string      Original user brief
platform            string      Ad platform target
audience            string      Target audience description
max_generations     int         How many generations to run
generation          int         Current generation counter (starts at 1)
variants            AdVariant[] Current generation's 5 variants
survivors           AdVariant[] Top 2 from current generation
hypothesis          string      Reflect node's output
mutation_instructions string    Instructions for next generate call
history             GenerationLog[]  Accumulated logs from all generations
strategy_report     string      Final report (populated by report_node)
```

### AdVariant

```
id                  string      8-char UUID
headline            string      Ad headline
body                string      Ad body copy
cta                 string      Call-to-action text
emotional_tone      string      e.g. "urgency", "curiosity", "fomo"
hook_type           string      e.g. "question", "statement", "command"
fitness_score       float       Weighted fitness 0-10
dimension_scores    dict        { hook, cta, emotion, brevity } each 0-10
generation          int         Which generation this was created in
survived            bool        Whether this variant was selected
```

### GenerationLog

```
generation          int         Generation number
variants            AdVariant[] All 5 variants (sorted by fitness)
survivors           string[]    IDs of the top 2
hypothesis          string      The hypothesis from that generation's reflect
avg_fitness         float       Average fitness across all 5
```

---

## LLM Call Summary

| Node | Model | Temperature | Purpose | Response Format |
|------|-------|-------------|---------|-----------------|
| `generate_node` | gpt-4o | 0.9 | Create 5 ad variants | JSON object |
| `reflect_node` | gpt-4o | 0.4 | Analyze winners vs losers | JSON object |
| `report_node` | gpt-4o | 0.3 | Final strategy analysis | JSON object |
| `score_node` | — | — | Rule-based, no LLM | — |
| `select_node` | — | — | Sorting + selection, no LLM | — |
| `mutate_node` | — | — | String assembly, no LLM | — |

**Total LLM calls per generation:** 2 (generate + reflect)
**Total LLM calls for a 4-gen run:** 2 * 4 + 1 (report) = **9 calls**

---

## Serialization Note

LangGraph serializes state between nodes, converting Pydantic models to plain dicts. Every node uses `_ensure_variant()` and `_ensure_log()` helpers to reconstitute `AdVariant` / `GenerationLog` objects from dicts before accessing attributes. This is critical — without it, attribute access like `v.headline` fails on dict objects.
