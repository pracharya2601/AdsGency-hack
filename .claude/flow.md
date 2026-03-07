# Creative Evolution Engine — Detailed Flow

## What This System Does (The Four Pillars)

| Requirement | How We Solve It | Where |
|---|---|---|
| **Generate creative variants** | GPT-4o creates 5 platform-specific ad variants per generation with diverse strategies | `generate_node` |
| **Evaluate performance signals** | GPT-4o simulates 6 real ad metrics (CTR, engagement, conversion, relevance, platform fit, scroll-stop) | `score_node` → `scoring.py` |
| **Evolve creatives over time** | Top 2 survive, hypothesis guides mutation, strategy leaderboard informs next generation | `select_node` → `mutate_node` → loop |
| **Discover new creative strategies** | Each variant gets a named strategy; strategies are tracked, ranked, and reported across generations | `reflect_node` → `report_node` |

---

## End-to-End Request Lifecycle

### Phase 1: User Submits Brief

**Why:** The system needs a starting point — what product, who's the audience, which platform.

```
BriefInput.jsx → App.jsx handleSubmit() → POST /api/evolve → returns run_id
                                         → EventSource /api/stream/{run_id}
```

The frontend immediately opens an SSE connection so it can render results in real-time as each node completes. The form disables to prevent duplicate runs.

---

### Phase 2: Backend Spawns Evolution

**Why:** Evolution takes 30-60 seconds across multiple LLM calls. Running it as a background task lets us return a `run_id` instantly and stream progress via SSE rather than making the user wait for a single giant response.

**File:** `backend/main.py`

Initial LangGraph state:
```python
{
    "brief": "...",  "platform": "Meta",  "audience": "...",
    "max_generations": 4,  "generation": 1,
    "variants": [],  "survivors": [],
    "hypothesis": "",  "mutation_instructions": "",
    "history": [],  "strategies": {},  "strategy_report": ""
}
```

`strategies: {}` is a dict that accumulates named creative strategies discovered across all generations — this is the core of the "discover new strategies" requirement.

---

### Phase 3: The Evolution Loop

**Why:** Evolutionary algorithms work by repeated cycles of generation → evaluation → selection → learning → mutation. Each cycle produces better-adapted creatives because it builds on what worked before.

```
                    ┌─────────────────────────────────────┐
                    │           EVOLUTION LOOP             │
                    ▼                                     │
   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ generate │→ │  score   │→ │  select  │→ │ reflect  │→ │  mutate  │
   │ (LLM)   │  │ (LLM)   │  │ (logic)  │  │ (LLM)   │  │ (logic)  │
   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────┬─────┘
                                                                 │
                                                         should_continue?
                                                           /          \
                                                    "generate"     "report"
                                                    (loop back)        │
                                                                 ┌─────▼─────┐
                                                                 │  report   │
                                                                 │  (LLM)   │
                                                                 └─────┬─────┘
                                                                      END
```

---

### Phase 4: Node-by-Node Breakdown

#### Node 1: `generate_node` — Create the Gene Pool (LLM Call)

**Why it exists:** This is the "generate creative variants" requirement. Every generation needs fresh creative material. Gen 1 explores widely; Gen 2+ is guided by what survived and what the system learned.

**What it does:**
- Calls GPT-4o with `temperature=0.9` (high creativity) to produce 5 ad variants
- Platform-specific system prompt (Meta = punchy/emoji, Google = keyword-rich, TikTok = casual, LinkedIn = professional, Twitter = ultra-concise)
- Gen 1: "Create maximally diverse variants" — different tones, hooks, lengths, strategies
- Gen 2+: Receives `mutation_instructions` from previous generation containing survivor DNA + hypothesis + strategy leaderboard
- Also passes `strategies` context so the LLM knows what strategies have been tried and their performance history

**Output:** `{ variants: [5 AdVariant objects] }` — each with headline, body, CTA, tone, hook type

#### Node 2: `score_node` — Evaluate Performance Signals (LLM Call)

**Why it exists:** This is the "evaluate performance signals" requirement. Real ads are judged by metrics like CTR, engagement, conversion — not just whether the copy sounds good. Using an LLM to simulate these signals gives us realistic, differentiated evaluations that drive meaningful selection pressure.

**What it does:**
- Calls GPT-4o with `temperature=0.3` (analytical) to simulate 6 ad performance signals per variant
- Also assigns each variant a `creative_strategy` label (e.g. "FOMO Question Hook", "Social Proof Authority")

**The 6 Performance Signals:**

| Signal | Weight | What It Measures |
|--------|--------|-----------------|
| `predicted_ctr` | 20% | Would people click this ad? |
| `engagement_score` | 15% | Would people like, comment, share? |
| `conversion_potential` | 20% | Would clickers actually buy/sign up? |
| `audience_relevance` | 20% | Does this resonate with the specific target audience? |
| `platform_fit` | 10% | Does this feel native to the platform? |
| `scroll_stop_power` | 15% | Would this stop someone mid-scroll? |

**Fitness = weighted sum of all 6 signals (0-10 scale)**

**Why LLM-based instead of rule-based:** Rule-based scoring can only measure surface features (word count, keyword presence). LLM evaluation understands semantic meaning — it knows that "Your chaos, organized" is a stronger hook than "Organize your notes" even though both are short.

#### Node 3: `select_node` — Survival of the Fittest (No LLM)

**Why it exists:** This is the selection pressure that drives evolution. Without it, there's no improvement — just random generation. By keeping only the top 2 and eliminating the bottom 3, we create a strong signal for what works.

**What it does:**
1. Sorts all 5 variants by fitness score (descending)
2. Top 2 marked as `survived = True` — these are the "parents" for the next generation
3. Computes `avg_fitness` across all 5
4. **Tracks discovered strategies:** For each variant's `creative_strategy`, either updates an existing strategy's fitness trend or creates a new `Strategy` entry with `first_seen` generation and initial fitness
5. Creates `GenerationLog` with `strategies_discovered` list
6. Appends to `history` array

**Why track strategies here:** This is where we build the strategy leaderboard. Over multiple generations, we can see which named strategies consistently produce high-fitness variants and which ones fail. This is the data that enables "discover new creative strategies."

#### Node 4: `reflect_node` — Learn Why Winners Won (LLM Call)

**Why it exists:** This is the intelligence layer. Raw selection tells us WHAT won, but not WHY. The reflect node uses GPT-4o to analyze the performance signals of winners vs losers and extract a transferable insight — a hypothesis that can guide the next generation.

**What it does:**
- Receives winners (top 2) and losers (bottom 3) with their full performance signals
- Also receives the strategy performance tracker showing all strategies and their fitness trends
- GPT-4o analyzes the gap and produces:
  - `hypothesis`: Why winners outperformed losers (1-2 sentences)
  - `winning_strategy`: Named strategy that's working (e.g. "Urgency Question Hook")
  - `next_experiment`: What new angle to test next generation

**Example output:**
```
hypothesis: "Question-hook headlines with FOMO framing scored 2.5 points higher on scroll-stop and CTR because they create an open loop the audience needs to close."
winning_strategy: "FOMO Question Hook"
next_experiment: "Try social proof angle — testimonial-style hooks to test if authority beats curiosity"
```

**Why this matters for strategy discovery:** Each hypothesis chains with the previous one. By Gen 4, the system has accumulated a series of tested hypotheses that together form a discovered creative playbook — something never explicitly programmed.

#### Node 5: `mutate_node` — Breed the Next Generation (No LLM)

**Why it exists:** This bridges generations. It packages everything the system has learned — survivor DNA, the hypothesis, the strategy leaderboard — into clear instructions for the next `generate_node` call. It also ensures diversity by mandating wildcards.

**What it does:**
- Assembles mutation instructions containing:
  - Survivor traits (headline, strategy, tone, hook, performance signals)
  - The hypothesis from reflect_node
  - Strategy leaderboard (top 5 strategies ranked by avg fitness)
- Mandates diversity: "at least 1 variant testing the next experiment, at least 1 wildcard with a completely new strategy"
- Increments generation counter

**Why mandate wildcards:** Without them, the system converges too quickly on one strategy. The wildcard variant is a deliberate "mutation" — it might fail, but occasionally it discovers something better than the current best, preventing local optima.

---

### Phase 5: Loop Termination

**Why two conditions:** We don't want to waste LLM calls on generations that aren't improving. The plateau detection (delta < 0.5 for 2 consecutive generations) catches convergence early.

```
generation > max_generations  →  stop (user-defined limit hit)
last 2 gens avg_fitness delta < 0.5  →  stop (system has converged)
otherwise  →  loop back to generate_node
```

---

### Phase 6: Strategy Discovery Report (LLM Call)

**Why it exists:** This is the payoff — the system synthesizes everything it discovered into an actionable creative strategy report. This is what makes the system valuable beyond just generating ads: it tells you WHY certain strategies work and WHAT to do next.

**What it receives:**
- Complete evolutionary history (all generations, all variants, all scores)
- Strategy discovery summary (every named strategy, when it was first seen, fitness trend)

**What it produces (markdown-formatted):**
1. **Winning Strategy** — The #1 creative strategy that emerged and why it works
2. **Strategy Evolution** — How strategies competed and evolved across generations
3. **Performance Insights** — What drives CTR vs engagement vs conversion for this audience
4. **Discovered Playbook** — Top 3 strategies ranked, with when to use each
5. **Next Steps** — Creative directions to explore beyond what was tested

---

### Phase 7: SSE Streaming

**Why SSE:** Evolution takes 30-60 seconds. Without streaming, the user stares at a spinner. SSE lets us show each node completing in real-time — the user watches variants appear, get scored, get selected, and sees hypotheses form live.

**Event sequence for a 4-generation run (27 events):**
```
Gen 1:  generate → score → select → reflect → mutate     (5 events)
Gen 2:  generate → score → select → reflect → mutate     (5 events)
Gen 3:  generate → score → select → reflect → mutate     (5 events)
Gen 4:  generate → score → select → reflect → mutate     (5 events)
Final:  report → done                                     (2 events)
```

Frontend updates on `select` events (shows variants + chart), `report` event (shows strategy report), and `done` event (re-enables form).

---

### Phase 8: Frontend Renders

**Why this layout:** Left column is controls + analytics (brief input, fitness chart, signal comparison). Right column is the feed — you scroll through generations watching creatives evolve. Strategy report appears at the bottom once done.

| Component | What It Shows | Why |
|---|---|---|
| `BriefInput` | Form for brief, platform, audience, generations | Starting point — the "DNA" that seeds generation 1 |
| `GenerationFeed` | Variant cards with performance signal bars, strategy badges, survivor highlighting | Shows evolution happening — users see which strategies survive and which die |
| `FitnessChart` | Line chart (best/avg/worst fitness per gen) + bar chart (winners vs losers signal comparison) | Proves the system is actually improving over time, shows WHAT signals differentiate winners |
| `StrategyReport` | Final markdown report with winning strategy, playbook, next steps | The deliverable — actionable creative intelligence the user can apply |

---

## Data Types

### EvolutionState

```
brief                 string              Product/service description
platform              string              Meta | Google | TikTok | LinkedIn | Twitter/X
audience              string              Target audience description
max_generations       int                 User-set limit (1-10)
generation            int                 Current generation counter
variants              AdVariant[]         This generation's 5 variants
survivors             AdVariant[]         Top 2 selected
hypothesis            string              What the system learned this round
mutation_instructions string              Instructions for next generate call
history               GenerationLog[]     All generation logs (accumulates)
strategies            Dict[str, Strategy] Named strategies discovered (accumulates)
strategy_report       string              Final report (set by report_node)
```

### AdVariant

```
id                    string              8-char UUID
headline              string              Ad headline
body                  string              Ad body copy
cta                   string              Call-to-action
emotional_tone        string              e.g. "urgency", "curiosity"
hook_type             string              e.g. "question", "social proof"
creative_strategy     string              Named strategy label (e.g. "FOMO Question Hook")
fitness_score         float               Weighted fitness 0-10
dimension_scores      dict                { ctr, engagement, conversion, relevance, platform_fit, scroll_stop }
performance_signals   PerformanceSignals  Full signal object
generation            int                 Which generation
survived              bool                Selected as top 2?
```

### Strategy

```
name                  string              Short strategy name (2-5 words)
description           string              What makes this strategy work
first_seen            int                 Generation it was first discovered
fitness_trend         float[]             Best fitness per generation using this strategy
```

### GenerationLog

```
generation            int                 Generation number
variants              AdVariant[]         All 5 variants (sorted by fitness)
survivors             string[]            IDs of top 2
hypothesis            string              The hypothesis from reflect
avg_fitness           float               Average fitness across all 5
strategies_discovered string[]            Strategy names seen this generation
```

---

## LLM Call Summary

| Node | Model | Temp | Purpose | Why This Temperature |
|------|-------|------|---------|---------------------|
| `generate_node` | gpt-4o | 0.9 | Create 5 ad variants | High creativity — we want diverse, surprising copy |
| `score_node` | gpt-4o | 0.3 | Simulate 6 performance signals + label strategy | Low temp — evaluation must be consistent and critical |
| `reflect_node` | gpt-4o | 0.4 | Analyze winners vs losers, produce hypothesis | Slightly creative — needs analytical insight but with some synthesis |
| `report_node` | gpt-4o | 0.3 | Final strategy discovery report | Low temp — report must be grounded in the data |
| `select_node` | — | — | Sort + select top 2 + track strategies | Pure logic, no LLM needed |
| `mutate_node` | — | — | Assemble mutation instructions | String assembly, no LLM needed |

**Total LLM calls per generation:** 3 (generate + score + reflect)
**Total LLM calls for a 4-gen run:** 3 * 4 + 1 (report) = **13 calls**

---

## Why Each Piece Matters

```
generate  →  Without variants, there's nothing to evaluate
score     →  Without performance signals, selection is random
select    →  Without selection pressure, there's no improvement
reflect   →  Without learning, each generation starts blind
mutate    →  Without directed mutation, evolution is just random search
report    →  Without synthesis, the discoveries stay implicit
```

The power is in the loop. Any single generation is just "GPT writes some ads." But 4 generations with selection, learning, and mutation turns it into a system that **discovers creative strategies it was never taught** — because it competed its way there.
