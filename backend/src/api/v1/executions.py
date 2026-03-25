"""Workflow executions API."""

from datetime import datetime
from typing import Annotated, List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel

from src.api.v1.auth import get_current_user
from src.api.v1.workflows import workflows_db
from src.workflows.executor import WorkflowExecutor

router = APIRouter()


# Schemas
class ExecutionCreate(BaseModel):
    workflow_id: int
    input_data: Optional[Dict[str, Any]] = None


class ExecutionLog(BaseModel):
    step: int
    node_id: str
    action: str
    input: Optional[dict] = None
    output: Optional[dict] = None
    timestamp: str


class ExecutionResponse(BaseModel):
    id: int
    workflow_id: int
    status: str
    input_data: Optional[dict]
    output_data: Optional[dict]
    error_message: Optional[str]
    execution_log: Optional[List[dict]]
    started_at: Optional[str]
    completed_at: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


# Mock store
executions_db: dict = {}
execution_counter = 0


async def run_workflow_execution(execution_id: int, workflow_id: int, input_data: dict):
    """Background task to execute workflow."""
    executor = WorkflowExecutor()
    execution = executions_db[execution_id]

    try:
        execution["status"] = "running"
        execution["started_at"] = datetime.utcnow().isoformat()

        result = await executor.execute(workflows_db[workflow_id], input_data)

        execution["output_data"] = result["output"]
        execution["execution_log"] = result["log"]
        execution["status"] = "completed"
        execution["completed_at"] = datetime.utcnow().isoformat()

    except Exception as e:
        execution["status"] = "failed"
        execution["error_message"] = str(e)
        execution["completed_at"] = datetime.utcnow().isoformat()


@router.post("/", response_model=ExecutionResponse)
async def create_execution(
    execution_data: ExecutionCreate,
    background_tasks: BackgroundTasks,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Start a workflow execution."""
    global execution_counter

    if execution_data.workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")

    execution_counter += 1
    execution = {
        "id": execution_counter,
        "workflow_id": execution_data.workflow_id,
        "status": "pending",
        "input_data": execution_data.input_data,
        "output_data": None,
        "error_message": None,
        "execution_log": [],
        "started_at": None,
        "completed_at": None,
        "created_at": datetime.utcnow().isoformat()
    }
    executions_db[execution_counter] = execution

    # Start background execution
    background_tasks.add_task(
        run_workflow_execution,
        execution_counter,
        execution_data.workflow_id,
        execution_data.input_data or {}
    )

    return ExecutionResponse(**execution)


@router.get("/", response_model=List[ExecutionResponse])
async def list_executions(
    current_user: Annotated[dict, Depends(get_current_user)],
    workflow_id: Optional[int] = None,
    status: Optional[str] = None
):
    """List executions."""
    executions = list(executions_db.values())

    if workflow_id:
        executions = [e for e in executions if e["workflow_id"] == workflow_id]
    if status:
        executions = [e for e in executions if e["status"] == status]

    return [ExecutionResponse(**e) for e in executions]


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: int,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Get execution by ID."""
    if execution_id not in executions_db:
        raise HTTPException(status_code=404, detail="Execution not found")
    return ExecutionResponse(**executions_db[execution_id])


@router.post("/{execution_id}/cancel")
async def cancel_execution(
    execution_id: int,
    current_user: Annotated[dict, Depends(get_current_user)]
):
    """Cancel a running execution."""
    if execution_id not in executions_db:
        raise HTTPException(status_code=404, detail="Execution not found")

    execution = executions_db[execution_id]
    if execution["status"] not in ["pending", "running"]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed execution")

    execution["status"] = "cancelled"
    execution["completed_at"] = datetime.utcnow().isoformat()
    return {"message": "Execution cancelled"}
