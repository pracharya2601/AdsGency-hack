import json
from typing import List
from openai import AsyncOpenAI
from models.schemas import AdVariant, PerformanceSignals

client = AsyncOpenAI()
MODEL = "gpt-4o"

SIGNAL_WEIGHTS = {
    "predicted_ctr": 0.20,
    "engagement_score": 0.15,
    "conversion_potential": 0.20,
    "audience_relevance": 0.20,
    "platform_fit": 0.10,
    "scroll_stop_power": 0.15,
}


async def evaluate_performance(variants: List[AdVariant], platform: str, audience: str) -> List[AdVariant]:
    """Use LLM to simulate ad performance signals for each variant."""

    variants_text = "\n\n".join(
        f"Variant {i+1} (id={v.id}):\n"
        f"  Headline: {v.headline}\n"
        f"  Body: {v.body}\n"
        f"  CTA: {v.cta}\n"
        f"  Tone: {v.emotional_tone}\n"
        f"  Hook: {v.hook_type}"
        for i, v in enumerate(variants)
    )

    response = await client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": f"""You are an expert ad performance analyst simulating how ads perform on {platform}.
Target audience: {audience}

For each ad variant, predict realistic performance signals on a 0-10 scale:
- predicted_ctr: Click-through rate potential (0=no one clicks, 10=viral clickability)
- engagement_score: Likelihood of likes, comments, shares (0=ignored, 10=highly engaging)
- conversion_potential: How likely viewers convert after clicking (0=bounces, 10=strong buyer intent)
- audience_relevance: How well the message resonates with the specific target audience (0=wrong audience, 10=perfectly targeted)
- platform_fit: How well the ad format/style matches {platform}'s norms and best practices (0=out of place, 10=native feel)
- scroll_stop_power: Would this stop someone mid-scroll? (0=invisible, 10=can't ignore)

Also assign each variant a creative_strategy label — a short 2-5 word name for the strategy it uses (e.g. "FOMO Question Hook", "Social Proof Authority", "Pain-Agitate-Solve", "Curiosity Gap").

Return JSON: {{"evaluations": [
  {{"id": "variant_id", "creative_strategy": "Strategy Name", "predicted_ctr": 7.5, "engagement_score": 6.0, "conversion_potential": 8.0, "audience_relevance": 7.0, "platform_fit": 6.5, "scroll_stop_power": 8.0}},
  ...
]}}

Be critical and realistic. Not every ad is good. Differentiate clearly between strong and weak variants.""",
            },
            {"role": "user", "content": variants_text},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    data = json.loads(response.choices[0].message.content)
    evals = data.get("evaluations", [])

    # Map evaluations back to variants by id
    eval_map = {e["id"]: e for e in evals}

    for variant in variants:
        ev = eval_map.get(variant.id, {})

        signals = PerformanceSignals(
            predicted_ctr=_clamp(ev.get("predicted_ctr", 5.0)),
            engagement_score=_clamp(ev.get("engagement_score", 5.0)),
            conversion_potential=_clamp(ev.get("conversion_potential", 5.0)),
            audience_relevance=_clamp(ev.get("audience_relevance", 5.0)),
            platform_fit=_clamp(ev.get("platform_fit", 5.0)),
            scroll_stop_power=_clamp(ev.get("scroll_stop_power", 5.0)),
        )
        variant.performance_signals = signals
        variant.creative_strategy = ev.get("creative_strategy", variant.hook_type)

        # Compute dimension scores from signals
        variant.dimension_scores = {
            "ctr": signals.predicted_ctr,
            "engagement": signals.engagement_score,
            "conversion": signals.conversion_potential,
            "relevance": signals.audience_relevance,
            "platform_fit": signals.platform_fit,
            "scroll_stop": signals.scroll_stop_power,
        }

        # Weighted fitness from performance signals
        fitness = sum(
            getattr(signals, k) * SIGNAL_WEIGHTS[k]
            for k in SIGNAL_WEIGHTS
        )
        variant.fitness_score = round(fitness, 2)

    return variants


def _clamp(val, lo=0.0, hi=10.0) -> float:
    try:
        return round(min(max(float(val), lo), hi), 2)
    except (TypeError, ValueError):
        return 5.0
