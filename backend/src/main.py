"""AgentFlow - Enterprise AI Agent Workflow Orchestration Platform."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.v1 import auth, workflows, agents, executions
from src.core.config import settings
from src.core.middleware import add_process_time_header

app = FastAPI(
    title="AgentFlow API",
    description="Enterprise AI Agent Workflow Orchestration Platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.middleware("http")(add_process_time_header)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["workflows"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(executions.router, prefix="/api/v1/executions", tags=["executions"])


@app.get("/")
async def root():
    return {"message": "AgentFlow API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
