"""Agent templates API."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


# Schemas
class AgentTemplateConfig(BaseModel):
    system_prompt: str
    tools: List[str] = []
    max_iterations: int = 10
    temperature: float = 0.7
    memory_enabled: bool = True


class AgentTemplateCreate(BaseModel):
    name: str
    description: Optional[str] = None
    template_type: str  # react, plan_execute, multi_agent
    config: AgentTemplateConfig


class AgentTemplateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    template_type: str
    config: dict
    is_builtin: bool

    class Config:
        from_attributes = True


# Built-in agent templates
BUILTIN_TEMPLATES = [
    {
        "id": 1,
        "name": "ReAct Agent",
        "description": "Reasoning and Acting agent that alternates between thinking and taking actions",
        "template_type": "react",
        "config": {
            "system_prompt": "You are a helpful assistant that thinks step by step. Use the available tools to accomplish tasks. Always explain your reasoning before taking action.",
            "tools": ["search", "calculator", "web_browser"],
            "max_iterations": 10,
            "temperature": 0.7,
            "memory_enabled": True
        },
        "is_builtin": True
    },
    {
        "id": 2,
        "name": "Plan-and-Execute Agent",
        "description": "Agent that first creates a plan and then executes each step",
        "template_type": "plan_execute",
        "config": {
            "system_prompt": "You are a planning agent. First, break down the task into steps. Then execute each step systematically. Revise the plan if needed.",
            "tools": ["search", "code_executor", "file_manager"],
            "max_iterations": 15,
            "temperature": 0.5,
            "memory_enabled": True
        },
        "is_builtin": True
    },
    {
        "id": 3,
        "name": "Multi-Agent Collaboration",
        "description": "Multiple specialized agents working together",
        "template_type": "multi_agent",
        "config": {
            "system_prompt": "You coordinate multiple specialized agents. Delegate tasks based on expertise. Synthesize results from different agents.",
            "tools": ["delegate", "synthesize", "review"],
            "max_iterations": 20,
            "temperature": 0.6,
            "memory_enabled": True
        },
        "is_builtin": True
    },
    {
        "id": 4,
        "name": "Code Agent",
        "description": "Agent specialized for code generation and analysis",
        "template_type": "react",
        "config": {
            "system_prompt": "You are a coding expert. Write clean, efficient, and well-documented code. Follow best practices and design patterns.",
            "tools": ["code_generator", "code_analyzer", "test_runner", "linter"],
            "max_iterations": 15,
            "temperature": 0.3,
            "memory_enabled": True
        },
        "is_builtin": True
    },
    {
        "id": 5,
        "name": "Research Agent",
        "description": "Agent for conducting research and summarizing findings",
        "template_type": "plan_execute",
        "config": {
            "system_prompt": "You are a research assistant. Gather information from multiple sources, analyze findings, and provide comprehensive summaries with citations.",
            "tools": ["web_search", "document_reader", "summarizer", "citation_manager"],
            "max_iterations": 12,
            "temperature": 0.4,
            "memory_enabled": True
        },
        "is_builtin": True
    }
]

# Custom templates store
custom_templates: dict = {}
template_counter = 100


@router.get("/", response_model=List[AgentTemplateResponse])
async def list_templates(template_type: Optional[str] = None):
    """List all agent templates."""
    templates = BUILTIN_TEMPLATES.copy()
    templates.extend(custom_templates.values())

    if template_type:
        templates = [t for t in templates if t["template_type"] == template_type]

    return [AgentTemplateResponse(**t) for t in templates]


@router.get("/{template_id}", response_model=AgentTemplateResponse)
async def get_template(template_id: int):
    """Get agent template by ID."""
    # Check built-in templates
    for template in BUILTIN_TEMPLATES:
        if template["id"] == template_id:
            return AgentTemplateResponse(**template)

    # Check custom templates
    if template_id in custom_templates:
        return AgentTemplateResponse(**custom_templates[template_id])

    raise HTTPException(status_code=404, detail="Template not found")


@router.post("/", response_model=AgentTemplateResponse)
async def create_template(template_data: AgentTemplateCreate):
    """Create a custom agent template."""
    global template_counter
    template_counter += 1

    template = {
        "id": template_counter,
        "name": template_data.name,
        "description": template_data.description,
        "template_type": template_data.template_type,
        "config": template_data.config.model_dump(),
        "is_builtin": False
    }
    custom_templates[template_counter] = template
    return AgentTemplateResponse(**template)


@router.delete("/{template_id}")
async def delete_template(template_id: int):
    """Delete a custom agent template."""
    if template_id in custom_templates:
        del custom_templates[template_id]
        return {"message": "Template deleted"}

    # Check if it's a built-in template
    for template in BUILTIN_TEMPLATES:
        if template["id"] == template_id:
            raise HTTPException(status_code=400, detail="Cannot delete built-in template")

    raise HTTPException(status_code=404, detail="Template not found")
