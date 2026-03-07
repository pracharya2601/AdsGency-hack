import json
from typing import List
from openai import AsyncOpenAI
from models.schemas import AdVariant, GenerationLog
from agent.state import EvolutionState
from agent.scoring import compute_fitness

client = AsyncOpenAI()
MODEL = "gpt-4o"


def _ensure_variant(v) -> AdVariant:
    """Convert dict to AdVariant if needed (LangGraph deserializes between nodes)."""
    if isinstance(v, AdVariant):
        return v
    return AdVariant(**v)


def _ensure_log(log) -> GenerationLog:
    """Convert dict to GenerationLog if needed."""
    if isinstance(log, GenerationLog):
        return log
    return GenerationLog(**log)


async def generate_node(state: EvolutionState) -> dict:
    """Generate 5 ad copy variants from the brief + mutation instructions."""
    generation = state.get("generation", 1)
    mutation_instructions = state.get("mutation_instructions", "")

    system_prompt = """You are an expert ad copywriter. Generate exactly 5 ad copy variants as a JSON array.
Each variant must have: headline, body, cta, emotional_tone, hook_type.
Return ONLY valid JSON array, no markdown fences."""

    user_prompt = f"""Brief: {state["brief"]}
Platform: {state["platform"]}
Target Audience: {state["audience"]}
Generation: {generation}
"""
    if mutation_instructions:
        user_prompt += f"\nMutation Instructions (apply these): {mutation_instructions}"
    else:
        user_prompt += "\nThis is Generation 1. Create diverse variants — vary tone, hook style, length, and emotional angle."

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.9,
        response_format={"type": "json_object"},
    )

    raw = json.loads(response.choices[0].message.content)
    # Extract the list of variants from various possible response shapes
    items = None
    if isinstance(raw, list):
        items = raw
    else:
        for key in ("variants", "ads", "ad_variants", "copies"):
            if key in raw and isinstance(raw[key], list):
                items = raw[key]
                break
        if items is None:
            # Find the first list value in the response
            for v in raw.values():
                if isinstance(v, list):
                    items = v
                    break
        if items is None:
            items = []

    variants = []
    for item in items[:5]:
        if isinstance(item, str):
            continue
        variant = AdVariant(
            headline=item.get("headline", "Untitled"),
            body=item.get("body", ""),
            cta=item.get("cta", "Learn More"),
            emotional_tone=item.get("emotional_tone", "neutral"),
            hook_type=item.get("hook_type", "statement"),
            generation=generation,
        )
        variants.append(variant)

    return {"variants": variants}


async def score_node(state: EvolutionState) -> dict:
    """Score each variant using rule-based fitness function."""
    variants = [_ensure_variant(v) for v in state["variants"]]
    scored = [compute_fitness(v) for v in variants]
    return {"variants": scored}


async def select_node(state: EvolutionState) -> dict:
    """Select top 2 survivors, log the generation."""
    variants = [_ensure_variant(v) for v in state["variants"]]
    variants = sorted(variants, key=lambda v: v.fitness_score, reverse=True)

    survivors = variants[:2]
    for v in survivors:
        v.survived = True

    avg_fitness = sum(v.fitness_score for v in variants) / len(variants) if variants else 0

    log = GenerationLog(
        generation=state["generation"],
        variants=variants,
        survivors=[s.id for s in survivors],
        hypothesis=state.get("hypothesis", ""),
        avg_fitness=round(avg_fitness, 2),
    )

    history = [_ensure_log(h) for h in state.get("history", [])]
    history.append(log)

    return {"variants": variants, "survivors": survivors, "history": history}


async def reflect_node(state: EvolutionState) -> dict:
    """Analyze winners vs losers and produce a hypothesis."""
    survivors = [_ensure_variant(v) for v in state["survivors"]]
    variants = [_ensure_variant(v) for v in state["variants"]]
    losers = [v for v in variants if not v.survived]

    system_prompt = """You are an advertising strategist analyzing A/B test results.
Compare the winning ads vs losing ads. Identify the specific creative pattern that made winners perform better.
Output a single concise hypothesis (1-2 sentences) that explains WHY the winners won.
Return JSON: {"hypothesis": "your hypothesis here"}"""

    winners_text = "\n".join(
        f"WINNER: [{s.headline}] | {s.body} | CTA: {s.cta} | Scores: {s.dimension_scores}"
        for s in survivors
    )
    losers_text = "\n".join(
        f"LOSER: [{l.headline}] | {l.body} | CTA: {l.cta} | Scores: {l.dimension_scores}"
        for l in losers
    )

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"{winners_text}\n\n{losers_text}"},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    hypothesis = data.get("hypothesis", "No clear pattern found.")

    return {"hypothesis": hypothesis}


async def mutate_node(state: EvolutionState) -> dict:
    """Prepare mutation instructions for the next generation."""
    survivors = [_ensure_variant(v) for v in state["survivors"]]
    hypothesis = state["hypothesis"]

    survivor_traits = "\n".join(
        f"- [{s.headline}] tone={s.emotional_tone}, hook={s.hook_type}, scores={s.dimension_scores}"
        for s in survivors
    )

    mutation_instructions = f"""Based on survivors from Generation {state["generation"]}:
{survivor_traits}

Hypothesis: {hypothesis}

For the next generation:
1. Inherit the strongest traits from the survivors above
2. Apply the hypothesis to improve weak dimensions
3. For at least 1 variant, introduce a deliberate wildcard mutation — try a completely different angle to test if the hypothesis holds"""

    next_gen = state["generation"] + 1
    return {"mutation_instructions": mutation_instructions, "generation": next_gen}


async def report_node(state: EvolutionState) -> dict:
    """Generate a final strategy report after all generations complete."""
    history = [_ensure_log(h) for h in state.get("history", [])]

    history_text = ""
    for log in history:
        log_variants = [_ensure_variant(v) for v in log.variants]
        history_text += f"\nGeneration {log.generation} (avg fitness: {log.avg_fitness}):\n"
        history_text += f"  Hypothesis: {log.hypothesis}\n"
        for v in log_variants:
            marker = " [SURVIVOR]" if v.id in log.survivors else ""
            history_text += f"  - {v.headline} (fitness: {v.fitness_score}){marker}\n"

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": """You are an advertising strategist. Analyze the evolutionary history of ad copy generations.
Produce a concise strategy report covering:
1. The creative strategy that emerged (what pattern won)
2. Key fitness improvements across generations
3. Recommended creative direction going forward
Return JSON: {"strategy_report": "your report here"}""",
            },
            {"role": "user", "content": history_text},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    return {"strategy_report": data.get("strategy_report", "No report generated.")}
