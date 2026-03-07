# LangGraph

## Key Patterns
- Define graph state as a `TypedDict` — all nodes read/write to this shared state
- Each node is a function: `def node_name(state: State) -> dict` returning partial state updates
- Use `StateGraph(State)` to build the graph, then `.compile()` to get a runnable
- Use conditional edges for loop termination logic

## Graph Construction Pattern
```python
from langgraph.graph import StateGraph, END

graph = StateGraph(EvolutionState)

graph.add_node("generate", generate_node)
graph.add_node("score", score_node)
graph.add_node("select", select_node)
graph.add_node("reflect", reflect_node)
graph.add_node("mutate", mutate_node)

graph.add_edge("generate", "score")
graph.add_edge("score", "select")
graph.add_edge("select", "reflect")
graph.add_edge("reflect", "mutate")

# Conditional: loop back or end
graph.add_conditional_edges("mutate", should_continue, {"continue": "generate", "end": END})

graph.set_entry_point("generate")
app = graph.compile()
```

## Loop Termination
```python
def should_continue(state: EvolutionState) -> str:
    if state["generation"] >= max_generations:
        return "end"
    # Check fitness plateau
    return "continue"
```

## Common Commands
```bash
pip install langgraph langchain-core
```

## Tips
- Keep node functions pure — read from state, return updates
- Use `state["history"]` to accumulate logs across generations
- For streaming, use `app.astream_events()` or callback handlers
