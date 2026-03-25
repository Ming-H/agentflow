"""Workflow execution engine using LangGraph."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from pydantic import BaseModel


class WorkflowState(BaseModel):
    """State for workflow execution."""
    messages: List[Dict] = []
    current_node: Optional[str] = None
    variables: Dict[str, Any] = {}
    log: List[Dict] = []
    output: Optional[Dict] = None


class WorkflowExecutor:
    """Execute workflows using LangGraph."""

    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0.7)

    async def execute(self, workflow: dict, input_data: dict) -> dict:
        """Execute a workflow definition."""
        definition = workflow.get("definition", {})
        nodes = definition.get("nodes", [])
        edges = definition.get("edges", [])

        # Initialize state
        state = WorkflowState(
            variables=workflow.get("variables", {}),
            log=[]
        )

        # Build execution graph
        if not nodes:
            # Simple workflow without nodes - just run LLM
            return await self._execute_simple(state, input_data)

        # Build LangGraph from workflow definition
        graph = self._build_graph(nodes, edges)

        # Execute
        result = await graph.ainvoke({
            "messages": [HumanMessage(content=str(input_data))],
            "variables": state.variables,
            "log": []
        })

        return {
            "output": {"result": result.get("messages", [])[-1].content if result.get("messages") else None},
            "log": result.get("log", [])
        }

    def _build_graph(self, nodes: list, edges: list) -> StateGraph:
        """Build a LangGraph from workflow definition."""
        # Create state graph
        graph = StateGraph(dict)

        # Add nodes
        for node in nodes:
            node_type = node.get("type", "agent")
            node_id = node.get("id")

            if node_type == "agent":
                graph.add_node(node_id, self._create_agent_node(node))
            elif node_type == "tool":
                graph.add_node(node_id, self._create_tool_node(node))
            elif node_type == "condition":
                graph.add_node(node_id, self._create_condition_node(node))
            elif node_type == "input":
                graph.add_node(node_id, self._create_input_node(node))
            elif node_type == "output":
                graph.add_node(node_id, self._create_output_node(node))

        # Find entry point (input node or first node)
        entry_node = None
        for node in nodes:
            if node.get("type") == "input":
                entry_node = node.get("id")
                break
        if not entry_node and nodes:
            entry_node = nodes[0].get("id")

        if entry_node:
            graph.set_entry_point(entry_node)

        # Add edges
        edge_map = {}
        for edge in edges:
            source = edge.get("source")
            target = edge.get("target")
            if source not in edge_map:
                edge_map[source] = []
            edge_map[source].append(target)

        for source, targets in edge_map.items():
            if len(targets) == 1:
                graph.add_edge(source, targets[0])
            else:
                # Multiple targets - add conditional routing
                graph.add_edge(source, END)  # Simplified for now

        # Connect nodes without outgoing edges to END
        for node in nodes:
            node_id = node.get("id")
            if node_id not in edge_map and node.get("type") != "output":
                graph.add_edge(node_id, END)

        return graph.compile()

    async def _create_agent_node(self, node: dict):
        """Create an agent node function."""
        node_data = node.get("data", {})
        system_prompt = node_data.get("systemPrompt", "You are a helpful assistant.")

        async def agent_func(state: dict) -> dict:
            messages = state.get("messages", [])
            log = state.get("log", [])

            # Add system message
            full_messages = [SystemMessage(content=system_prompt)]
            full_messages.extend(messages)

            # Call LLM
            response = await self.llm.ainvoke(full_messages)

            log.append({
                "step": len(log) + 1,
                "node_id": node.get("id"),
                "action": "agent_response",
                "output": {"content": response.content},
                "timestamp": datetime.utcnow().isoformat()
            })

            return {
                "messages": messages + [response],
                "log": log
            }

        return agent_func

    async def _create_tool_node(self, node: dict):
        """Create a tool node function."""
        async def tool_func(state: dict) -> dict:
            log = state.get("log", [])
            log.append({
                "step": len(log) + 1,
                "node_id": node.get("id"),
                "action": "tool_execution",
                "timestamp": datetime.utcnow().isoformat()
            })
            return {"log": log}

        return tool_func

    async def _create_condition_node(self, node: dict):
        """Create a condition node function."""
        async def condition_func(state: dict) -> dict:
            log = state.get("log", [])
            log.append({
                "step": len(log) + 1,
                "node_id": node.get("id"),
                "action": "condition_check",
                "timestamp": datetime.utcnow().isoformat()
            })
            return {"log": log}

        return condition_func

    async def _create_input_node(self, node: dict):
        """Create an input node function."""
        async def input_func(state: dict) -> dict:
            log = state.get("log", [])
            log.append({
                "step": len(log) + 1,
                "node_id": node.get("id"),
                "action": "input_received",
                "timestamp": datetime.utcnow().isoformat()
            })
            return {"log": log}

        return input_func

    async def _create_output_node(self, node: dict):
        """Create an output node function."""
        async def output_func(state: dict) -> dict:
            messages = state.get("messages", [])
            log = state.get("log", [])

            output_content = messages[-1].content if messages else None
            log.append({
                "step": len(log) + 1,
                "node_id": node.get("id"),
                "action": "output_generated",
                "output": {"content": output_content},
                "timestamp": datetime.utcnow().isoformat()
            })

            return {
                "output": {"result": output_content},
                "log": log
            }

        return output_func

    async def _execute_simple(self, state: WorkflowState, input_data: dict) -> dict:
        """Execute a simple workflow without nodes."""
        messages = [HumanMessage(content=str(input_data))]
        response = await self.llm.ainvoke(messages)

        return {
            "output": {"result": response.content},
            "log": [{
                "step": 1,
                "node_id": "default",
                "action": "llm_response",
                "output": {"content": response.content},
                "timestamp": datetime.utcnow().isoformat()
            }]
        }
