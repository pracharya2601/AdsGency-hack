from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import uuid


class AdVariant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    headline: str
    body: str
    cta: str
    emotional_tone: str
    hook_type: str
    fitness_score: float = 0.0
    dimension_scores: Dict[str, float] = {}
    generation: int = 1
    survived: bool = False


class GenerationLog(BaseModel):
    generation: int
    variants: List[AdVariant]
    survivors: List[str]
    hypothesis: str
    avg_fitness: float


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
