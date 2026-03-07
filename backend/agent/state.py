from typing import TypedDict, List
from models.schemas import AdVariant, GenerationLog


class EvolutionState(TypedDict):
    brief: str
    platform: str
    audience: str
    max_generations: int
    generation: int
    variants: List[AdVariant]
    survivors: List[AdVariant]
    hypothesis: str
    mutation_instructions: str
    history: List[GenerationLog]
    strategy_report: str
