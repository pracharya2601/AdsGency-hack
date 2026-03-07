# Pydantic

## Key Patterns
- Use `BaseModel` for request/response schemas and data objects
- Use `Field()` for validation constraints and defaults
- Use `model_validate()` / `model_dump()` for serialization

## Core Models for This Project
```python
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class AdVariant(BaseModel):
    id: str
    headline: str
    body: str
    cta: str
    emotional_tone: str
    hook_type: str
    fitness_score: float = 0.0
    dimension_scores: Dict[str, float] = {}  # hook, cta, emotion, brevity
    generation: int
    survived: bool = False

class EvolveRequest(BaseModel):
    brief: str
    platform: str = "Meta"
    audience: str
    generations: int = Field(default=4, ge=1, le=10)

class GenerationLog(BaseModel):
    generation: int
    variants: List[AdVariant]
    survivors: List[str]  # variant IDs
    hypothesis: str
    avg_fitness: float
```

## Tips
- Use `model_config = ConfigDict(extra="forbid")` to catch typos in API requests
- Use `Optional[str] = None` for fields that may not be present in early generations
- Pydantic v2 syntax: `model_dump()` not `.dict()`, `model_validate()` not `.parse_obj()`
