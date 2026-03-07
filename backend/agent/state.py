from typing import TypedDict, List, Dict
from models.schemas import AdVariant, GenerationLog, Strategy


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
    strategies: Dict[str, Strategy]     # Named strategies discovered so far
    strategy_report: str
