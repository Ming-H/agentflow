"""Workflows API."""

from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.api.v1.auth import get_current_user

router = APIRouter()


# Schemas
class NodeDefinition(BaseModel):
    id: str
    type: str  # agent, tool, condition, input, output
    position: dict
    data: dict


class EdgeDefinition(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    label: Optional[str] = None


class WorkflowDefinition(BaseModel):
    nodes: List[NodeDefinition]
    edges: List[EdgeDefinition]


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: Optional[WorkflowDefinition] = None
    variables: Optional[dict] = None


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    definition: Optional[WorkflowDefinition] = None
    variables: Optional[dict] = None
    status: Optional[str] = None


class WorkflowResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: str
    definition: Optional[dict]
    variables: Optional[dict]
    owner_id: int

    class Config:
        from_attributes = True


# Mock store (replace with database)
workflows_db: dict = {}
workflow_counter = 0


@router.post("/", response_model=WorkflowResponse)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Create a new workflow."""
    global workflow_counter
    workflow_counter += 1

    workflow = {
        "id": workflow_counter,
        "name": workflow_data.name,
        "description": workflow_data.description,
        "status": "draft",
        "definition": workflow_data.definition.model_dump() if workflow_data.definition else None,
        "variables": workflow_data.variables,
        "owner_id": current_user["id"],
    }
    workflows_db[workflow_counter] = workflow
    return WorkflowResponse(**workflow)


@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(
    current_user: Annotated[dict, Depends(get_current_user)],
    status: Optional[str] = None
):
    """List all workflows for current user."""
    workflows = list(workflows_db.values())
    if status:
        workflows = [w for w in workflows if w["status"] == status]
    return [WorkflowResponse(**w) for w in workflows]


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: int,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Get workflow by ID."""
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WorkflowResponse(**workflows_db[workflow_id])


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: int,
    workflow_data: WorkflowUpdate,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Update workflow."""
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = workflows_db[workflow_id]
    update_data = workflow_data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        if value is not None:
            workflow[key] = value

    return WorkflowResponse(**workflow)


@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: int,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Delete workflow."""
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")

    del workflows_db[workflow_id]
    return {"message": "Workflow deleted"}
