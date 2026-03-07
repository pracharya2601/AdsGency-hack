from models.schemas import AdVariant


WEIGHTS = {
    "hook": 0.30,
    "cta": 0.25,
    "emotion": 0.25,
    "brevity": 0.20,
}


def score_hook(variant: AdVariant) -> float:
    """Score hook strength 0-10 based on headline characteristics."""
    score = 5.0
    headline = variant.headline.lower()
    # Question hooks grab attention
    if headline.endswith("?"):
        score += 1.5
    # Short headlines are punchier
    word_count = len(headline.split())
    if word_count <= 5:
        score += 1.5
    elif word_count <= 8:
        score += 0.5
    else:
        score -= 1.0
    # Power words
    power_words = ["free", "secret", "now", "instant", "proven", "you", "new", "stop", "don't", "warning"]
    if any(w in headline for w in power_words):
        score += 1.0
    return min(max(score, 0), 10)


def score_cta(variant: AdVariant) -> float:
    """Score CTA clarity 0-10."""
    score = 5.0
    cta = variant.cta.lower()
    word_count = len(cta.split())
    # Shorter CTAs are clearer
    if word_count <= 3:
        score += 2.0
    elif word_count <= 5:
        score += 1.0
    else:
        score -= 1.0
    # Action verbs
    action_words = ["get", "start", "try", "buy", "join", "claim", "grab", "shop", "discover", "unlock"]
    if any(cta.startswith(w) for w in action_words):
        score += 1.5
    # Urgency
    urgency_words = ["now", "today", "limited", "last chance", "before"]
    if any(w in cta for w in urgency_words):
        score += 1.0
    return min(max(score, 0), 10)


def score_emotion(variant: AdVariant) -> float:
    """Score emotional resonance 0-10."""
    score = 5.0
    tone = variant.emotional_tone.lower()
    body = variant.body.lower()
    # Clear emotional tone is good
    strong_tones = ["urgency", "fomo", "excitement", "curiosity", "fear", "joy", "trust", "surprise"]
    if any(t in tone for t in strong_tones):
        score += 1.5
    # Emotional language in body
    emotion_markers = ["imagine", "feel", "love", "hate", "afraid", "dream", "wish", "finally", "never again"]
    matches = sum(1 for m in emotion_markers if m in body)
    score += min(matches * 0.75, 2.0)
    return min(max(score, 0), 10)


def score_brevity(variant: AdVariant) -> float:
    """Score brevity 0-10. Shorter and tighter = better."""
    score = 5.0
    body_words = len(variant.body.split())
    if body_words <= 15:
        score += 2.5
    elif body_words <= 25:
        score += 1.5
    elif body_words <= 40:
        score += 0.0
    else:
        score -= 1.5
    # Penalize filler phrases
    fillers = ["in order to", "as a matter of fact", "it is important to note", "at the end of the day"]
    body_lower = variant.body.lower()
    filler_count = sum(1 for f in fillers if f in body_lower)
    score -= filler_count * 1.0
    return min(max(score, 0), 10)


def compute_fitness(variant: AdVariant) -> AdVariant:
    """Compute all dimension scores and weighted fitness for a variant."""
    scores = {
        "hook": round(score_hook(variant), 2),
        "cta": round(score_cta(variant), 2),
        "emotion": round(score_emotion(variant), 2),
        "brevity": round(score_brevity(variant), 2),
    }
    fitness = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
    variant.dimension_scores = scores
    variant.fitness_score = round(fitness, 2)
    return variant
