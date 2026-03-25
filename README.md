# AgentFlow

> Enterprise-grade AI Agent Visual Workflow Orchestration Platform

[中文文档](./README_CN.md)

## Overview

AgentFlow is an enterprise-level AI Agent visual orchestration platform that enables drag-and-drop construction of complex AI workflows. Built with FastAPI and React, it provides an intuitive interface for designing, executing, and monitoring AI agent workflows.

## Features

- **Visual Workflow Editor** - Drag-and-drop interface powered by ReactFlow
- **Built-in Agent Templates** - ReAct, Plan-and-Execute, Multi-Agent Collaboration
- **LangGraph Integration** - Powerful workflow execution engine
- **Real-time Execution Monitoring** - Track workflow progress and logs
- **User Authentication** - JWT-based authentication with workspace isolation
- **Docker Support** - Easy deployment with Docker Compose

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# Configure environment
cp .env.example .env

# Run server
uvicorn src.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Docker Deployment

```bash
docker-compose up -d
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Workflow   │  │   Agent     │  │    Execution        │  │
│  │   Editor    │  │  Templates  │  │    Dashboard        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Auth     │  │  Workflows  │  │    Executions       │  │
│  │   Module    │  │    CRUD     │  │     Engine          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Execution Engine (LangGraph)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    ReAct    │  │Plan-Execute │  │   Multi-Agent       │  │
│  │   Agent     │  │    Agent    │  │    Collaboration    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## API Documentation

Once the server is running, access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
agentflow/
├── backend/
│   ├── src/
│   │   ├── api/           # API routes
│   │   ├── core/          # Core modules
│   │   ├── models/        # Database models
│   │   ├── workflows/     # Workflow execution engine
│   │   └── templates/     # Agent templates
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── store/         # State management
│   └── package.json
├── docker-compose.yml
└── README.md
```

## License

MIT License

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a pull request.
