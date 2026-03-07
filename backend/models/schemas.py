from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import uuid


class PerformanceSignals(BaseModel):
    predicted_ctr: float = 0.0          # Predicted click-through rate (0-10%)
    engagement_score: float = 0.0       # Predicted engagement (0-10)
    conversion_potential: float = 0.0   # Predicted conversion strength (0-10)
    audience_relevance: float = 0.0     # How well it matches target audience (0-10)
    platform_fit: float = 0.0           # How well it fits the platform norms (0-10)
    scroll_stop_power: float = 0.0      # Would this stop a user from scrolling? (0-10)


class AdVariant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    headline: str
    body: str
    cta: str
    emotional_tone: str
    hook_type: str
    creative_strategy: str = ""         # Named strategy (e.g. "FOMO + Question Hook")
    fitness_score: float = 0.0
    dimension_scores: Dict[str, float] = {}
    performance_signals: Optional[PerformanceSignals] = None
    generation: int = 1
    survived: bool = False


class Strategy(BaseModel):
    name: str                           # Short strategy name
    description: str                    # What makes this strategy work
    first_seen: int                     # Generation it was first discovered
    fitness_trend: List[float] = []     # Best fitness per generation using this strategy


class GenerationLog(BaseModel):
    generation: int
    variants: List[AdVariant]
    survivors: List[str]
    hypothesis: str
    avg_fitness: float
    strategies_discovered: List[str] = []  # Strategy names seen this generation


class EvolveRequest(BaseModel):
    brief: str
    platform: str = "Meta"
    audience: str
    generations: int = Field(default=4, ge=1, le=10)


class EvolveResponse(BaseModel):
    run_id: str


class ResultsResponse(BaseModel):
    brief: str
    platform: str
    audience: str
    generation: int
    history: List[GenerationLog]
    strategy_report: Optional[str] = None
