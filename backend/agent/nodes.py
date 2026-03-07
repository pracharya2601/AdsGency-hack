import json
from typing import List
from openai import AsyncOpenAI
from models.schemas import AdVariant, GenerationLog, Strategy
from agent.state import EvolutionState
from agent.scoring import evaluate_performance

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


def _ensure_strategy(s) -> Strategy:
    """Convert dict to Strategy if needed."""
    if isinstance(s, Strategy):
        return s
    return Strategy(**s)


async def generate_node(state: EvolutionState) -> dict:
    """Generate 5 ad copy variants from the brief + mutation instructions."""
    generation = state.get("generation", 1)
    mutation_instructions = state.get("mutation_instructions", "")
    platform = state["platform"]

    # Build context about what strategies have been discovered
    strategies = state.get("strategies", {})
    strategy_context = ""
    if strategies:
        strategy_context = "\n\nPreviously discovered strategies and their performance:\n"
        for name, s in strategies.items():
            if isinstance(s, dict):
                s = Strategy(**s)
            trend = " → ".join(str(f) for f in s.fitness_trend)
            strategy_context += f"- {name}: {s.description} (fitness trend: {trend})\n"

    system_prompt = f"""You are an expert ad copywriter specializing in {platform} ads.
Generate exactly 5 ad copy variants as a JSON array.
Each variant must have: headline, body, cta, emotional_tone, hook_type.

Platform guidelines for {platform}:
- Meta/Facebook: Short punchy copy, emoji-friendly, strong visual hooks
- Google: Keyword-rich headlines, benefit-focused, clear value proposition
- TikTok: Casual/conversational, trend-aware, authentic voice, short
- LinkedIn: Professional tone, data/results-driven, thought leadership
- Twitter/X: Ultra-concise, witty, hashtag-aware, conversation-starting

Return JSON: {{"variants": [...]}}"""

    user_prompt = f"""Brief: {state["brief"]}
Platform: {platform}
Target Audience: {state["audience"]}
Generation: {generation}
{strategy_context}"""

    if mutation_instructions:
        user_prompt += f"\nMutation Instructions (apply these): {mutation_instructions}"
    else:
        user_prompt += "\nThis is Generation 1. Create maximally diverse variants — different tones, hooks, lengths, emotional angles, and creative strategies."

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
    items = None
    if isinstance(raw, list):
        items = raw
    else:
        for key in ("variants", "ads", "ad_variants", "copies"):
            if key in raw and isinstance(raw[key], list):
                items = raw[key]
                break
        if items is None:
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
    """Evaluate each variant using LLM-simulated performance signals."""
    variants = [_ensure_variant(v) for v in state["variants"]]
    scored = await evaluate_performance(
        variants,
        platform=state["platform"],
        audience=state["audience"],
    )
    return {"variants": scored}


async def select_node(state: EvolutionState) -> dict:
    """Select top 2 survivors, track strategies, log the generation."""
    variants = [_ensure_variant(v) for v in state["variants"]]
    variants = sorted(variants, key=lambda v: v.fitness_score, reverse=True)

    survivors = variants[:2]
    for v in survivors:
        v.survived = True

    avg_fitness = sum(v.fitness_score for v in variants) / len(variants) if variants else 0

    # Track discovered strategies
    strategies = {}
    for name, s in state.get("strategies", {}).items():
        strategies[name] = _ensure_strategy(s) if not isinstance(s, Strategy) else s

    strategies_this_gen = []
    for v in variants:
        strat_name = v.creative_strategy or v.hook_type
        strategies_this_gen.append(strat_name)
        if strat_name in strategies:
            strategies[strat_name].fitness_trend.append(v.fitness_score)
        else:
            strategies[strat_name] = Strategy(
                name=strat_name,
                description=f"{v.emotional_tone} tone with {v.hook_type} hook",
                first_seen=state["generation"],
                fitness_trend=[v.fitness_score],
            )

    log = GenerationLog(
        generation=state["generation"],
        variants=variants,
        survivors=[s.id for s in survivors],
        hypothesis=state.get("hypothesis", ""),
        avg_fitness=round(avg_fitness, 2),
        strategies_discovered=list(set(strategies_this_gen)),
    )

    history = [_ensure_log(h) for h in state.get("history", [])]
    history.append(log)

    return {
        "variants": variants,
        "survivors": survivors,
        "history": history,
        "strategies": strategies,
    }


async def reflect_node(state: EvolutionState) -> dict:
    """Analyze winners vs losers and produce a hypothesis for strategy discovery."""
    survivors = [_ensure_variant(v) for v in state["survivors"]]
    variants = [_ensure_variant(v) for v in state["variants"]]
    losers = [v for v in variants if not v.survived]

    # Build strategy performance context
    strategies = state.get("strategies", {})
    strategy_perf = ""
    if strategies:
        strategy_perf = "\n\nStrategy Performance Tracker:\n"
        for name, s in strategies.items():
            if isinstance(s, dict):
                s = Strategy(**s)
            avg = sum(s.fitness_trend) / len(s.fitness_trend) if s.fitness_trend else 0
            strategy_perf += f"- {name} (first seen gen {s.first_seen}): avg fitness {avg:.2f}, trend: {s.fitness_trend}\n"

    system_prompt = f"""You are an advertising strategist analyzing A/B test results to discover winning creative strategies.

Compare the winning ads vs losing ads. Look at their performance signals (CTR, engagement, conversion, audience relevance, platform fit, scroll-stop power).

Your job is to:
1. Identify the specific creative STRATEGY that made winners outperform losers
2. Name the strategy in 2-5 words (e.g. "Urgency Question Hook", "Social Proof Scarcity")
3. Explain WHY this strategy works for this audience and platform
4. Recommend what to double down on AND what new angle to test next

Return JSON: {{
  "hypothesis": "1-2 sentence explanation of why winners won",
  "winning_strategy": "Named Strategy",
  "next_experiment": "What new creative angle to test in the next generation"
}}"""

    winners_text = "\n".join(
        f"WINNER: [{s.headline}] | {s.body} | CTA: {s.cta} | Strategy: {s.creative_strategy} | Signals: {s.dimension_scores}"
        for s in survivors
    )
    losers_text = "\n".join(
        f"LOSER: [{l.headline}] | {l.body} | CTA: {l.cta} | Strategy: {l.creative_strategy} | Signals: {l.dimension_scores}"
        for l in losers
    )

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"{winners_text}\n\n{losers_text}{strategy_perf}"},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    hypothesis = data.get("hypothesis", "No clear pattern found.")
    winning_strategy = data.get("winning_strategy", "")
    next_experiment = data.get("next_experiment", "")

    # Enrich hypothesis with strategy discovery info
    full_hypothesis = hypothesis
    if winning_strategy:
        full_hypothesis += f" | Winning strategy: {winning_strategy}"
    if next_experiment:
        full_hypothesis += f" | Next experiment: {next_experiment}"

    return {"hypothesis": full_hypothesis}


async def mutate_node(state: EvolutionState) -> dict:
    """Prepare mutation instructions that evolve creative strategies."""
    survivors = [_ensure_variant(v) for v in state["survivors"]]
    hypothesis = state["hypothesis"]

    # Build strategy lineage
    strategies = state.get("strategies", {})
    top_strategies = []
    for name, s in strategies.items():
        if isinstance(s, dict):
            s = Strategy(**s)
        if s.fitness_trend:
            avg = sum(s.fitness_trend) / len(s.fitness_trend)
            top_strategies.append((name, avg, s))
    top_strategies.sort(key=lambda x: x[1], reverse=True)

    strategy_lineage = ""
    if top_strategies:
        strategy_lineage = "\n\nStrategy Leaderboard (best to worst):\n"
        for name, avg, s in top_strategies[:5]:
            strategy_lineage += f"- {name}: avg fitness {avg:.2f} (first seen gen {s.first_seen})\n"

    survivor_traits = "\n".join(
        f"- [{s.headline}] strategy={s.creative_strategy}, tone={s.emotional_tone}, "
        f"hook={s.hook_type}, signals={s.dimension_scores}"
        for s in survivors
    )

    mutation_instructions = f"""Based on survivors from Generation {state["generation"]}:
{survivor_traits}

Hypothesis: {hypothesis}
{strategy_lineage}

For the next generation:
1. Inherit the strongest traits from the survivors above
2. Apply the hypothesis — double down on what's working
3. Create at least 1 variant that tests the "next experiment" from the hypothesis
4. Create at least 1 wildcard variant using a completely NEW creative strategy not yet tried
5. Ensure each variant uses a distinct creative approach — no two should feel the same"""

    next_gen = state["generation"] + 1
    return {"mutation_instructions": mutation_instructions, "generation": next_gen}


async def report_node(state: EvolutionState) -> dict:
    """Generate a final strategy report with discovered creative strategies."""
    history = [_ensure_log(h) for h in state.get("history", [])]
    strategies = state.get("strategies", {})

    # Build comprehensive history
    history_text = ""
    for log in history:
        log_variants = [_ensure_variant(v) for v in log.variants]
        history_text += f"\nGeneration {log.generation} (avg fitness: {log.avg_fitness}):\n"
        history_text += f"  Hypothesis: {log.hypothesis}\n"
        history_text += f"  Strategies seen: {log.strategies_discovered}\n"
        for v in log_variants:
            marker = " [SURVIVOR]" if v.id in log.survivors else ""
            history_text += (
                f"  - {v.headline} | strategy={v.creative_strategy} | "
                f"fitness={v.fitness_score} | signals={v.dimension_scores}{marker}\n"
            )

    # Strategy leaderboard
    strategy_text = "\n\nStrategy Discovery Summary:\n"
    for name, s in strategies.items():
        if isinstance(s, dict):
            s = Strategy(**s)
        if s.fitness_trend:
            avg = sum(s.fitness_trend) / len(s.fitness_trend)
            best = max(s.fitness_trend)
            strategy_text += (
                f"- {name}: first seen gen {s.first_seen}, "
                f"avg fitness {avg:.2f}, best {best:.2f}, "
                f"trend: {' → '.join(f'{f:.1f}' for f in s.fitness_trend)}\n"
            )

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": """You are an advertising strategist producing a Creative Strategy Discovery Report.

Analyze the evolutionary history and strategy performance data. Your report should cover:

1. **Winning Strategy**: The #1 creative strategy that emerged and WHY it works
2. **Strategy Evolution**: How strategies competed and evolved across generations
3. **Performance Insights**: Key performance signal patterns (what drives CTR vs engagement vs conversion)
4. **Discovered Playbook**: A ranked list of the top 3 strategies with when to use each
5. **Next Steps**: What creative directions to explore beyond what was tested

Return JSON: {"strategy_report": "your full report here (use markdown formatting)"}""",
            },
            {"role": "user", "content": history_text + strategy_text},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    return {"strategy_report": data.get("strategy_report", "No report generated.")}
