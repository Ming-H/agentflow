# AgentFlow

> 企业级 AI Agent 可视化工作流编排平台

[English](./README.md)

## 概述

AgentFlow 是一个企业级 AI Agent 可视化编排平台，通过拖拽方式构建复杂 AI 工作流。基于 FastAPI 和 React 构建，提供直观的界面来设计、执行和监控 AI Agent 工作流。

## 功能特性

- **可视化工作流编辑器** - 基于 ReactFlow 的拖拽式界面
- **内置 Agent 模板** - ReAct、Plan-and-Execute、多 Agent 协作
- **LangGraph 集成** - 强大的工作流执行引擎
- **实时执行监控** - 追踪工作流进度和日志
- **用户认证** - 基于 JWT 的认证，支持工作空间隔离
- **Docker 支持** - 通过 Docker Compose 轻松部署

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### 后端设置

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# 配置环境变量
cp .env.example .env

# 启动服务
uvicorn src.main:app --reload
```

### 前端设置

```bash
cd frontend
npm install
npm run dev
```

### Docker 部署

```bash
docker-compose up -d
```

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端 (React)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  工作流     │  │   Agent     │  │    执行             │  │
│  │   编辑器    │  │   模板      │  │    仪表盘           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      后端 (FastAPI)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    认证     │  │  工作流     │  │    执行             │  │
│  │   模块      │  │   CRUD      │  │    引擎             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   执行引擎 (LangGraph)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    ReAct    │  │ 规划-执行   │  │   多 Agent          │  │
│  │   Agent     │  │   Agent     │  │   协作              │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## API 文档

服务启动后，访问以下地址查看 API 文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 项目结构

```
agentflow/
├── backend/
│   ├── src/
│   │   ├── api/           # API 路由
│   │   ├── core/          # 核心模块
│   │   ├── models/        # 数据库模型
│   │   ├── workflows/     # 工作流执行引擎
│   │   └── templates/     # Agent 模板
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   └── store/         # 状态管理
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 许可证

MIT License

## 贡献

欢迎贡献代码！提交 PR 前请阅读贡献指南。
