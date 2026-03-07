from langgraph.graph import StateGraph, END
from agent.state import EvolutionState
from agent.nodes import generate_node, score_node, select_node, reflect_node, mutate_node, report_node


def should_continue(state: EvolutionState) -> str:
    """Decide whether to loop again or finish."""
    if state["generation"] > state["max_generations"]:
        return "report"

    # Check fitness plateau: if last 2 generations have delta < 0.5, stop
    history = state.get("history", [])
    if len(history) >= 2:
        delta = abs(history[-1].avg_fitness - history[-2].avg_fitness)
        if delta < 0.5:
            return "report"

    return "generate"


def build_graph() -> StateGraph:
    graph = StateGraph(EvolutionState)

    graph.add_node("generate", generate_node)
    graph.add_node("score", score_node)
    graph.add_node("select", select_node)
    graph.add_node("reflect", reflect_node)
    graph.add_node("mutate", mutate_node)
    graph.add_node("report", report_node)

    graph.set_entry_point("generate")

    graph.add_edge("generate", "score")
    graph.add_edge("score", "select")
    graph.add_edge("select", "reflect")
    graph.add_edge("reflect", "mutate")

    graph.add_conditional_edges("mutate", should_continue, {
        "generate": "generate",
        "report": "report",
    })

    graph.add_edge("report", END)

    return graph.compile()


app = build_graph()
