import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Space, message, Input, Select } from 'antd';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  Edge,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const nodeTypes = [
  { type: 'input', label: 'Input', color: '#52c41a' },
  { type: 'agent', label: 'Agent', color: '#1890ff' },
  { type: 'tool', label: 'Tool', color: '#722ed1' },
  { type: 'condition', label: 'Condition', color: '#fa8c16' },
  { type: 'output', label: 'Output', color: '#eb2f96' },
];

const initialNodes: Node[] = [
  { id: '1', type: 'input', position: { x: 250, y: 0 }, data: { label: 'Input' } },
];

export default function WorkflowEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem('auth-storage');
  const authData = token ? JSON.parse(token) : null;
  const accessToken = authData?.state?.token;

  useEffect(() => {
    if (id && id !== 'new') {
      fetchWorkflow();
    }
  }, [id]);

  const fetchWorkflow = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/workflows/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const workflow = response.data;
      setWorkflowName(workflow.name);
      if (workflow.definition) {
        setNodes(workflow.definition.nodes || []);
        setEdges(workflow.definition.edges || []);
      }
    } catch {
      message.error('Failed to fetch workflow');
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: nodeTypes.find((n) => n.type === type)?.label || type,
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      const definition = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: n.data,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        })),
      };

      if (id && id !== 'new') {
        await axios.put(
          `${API_URL}/api/v1/workflows/${id}`,
          { name: workflowName, definition },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } else {
        const response = await axios.post(
          `${API_URL}/api/v1/workflows/`,
          { name: workflowName, definition },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        navigate(`/workflows/${response.data.id}`);
      }
      message.success('Workflow saved');
    } catch {
      message.error('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  const runWorkflow = async () => {
    try {
      await axios.post(
        `${API_URL}/api/v1/executions/`,
        { workflow_id: parseInt(id || '0'), input_data: {} },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      message.success('Workflow execution started');
      navigate('/executions');
    } catch {
      message.error('Failed to start workflow');
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 150px)' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          style={{ width: 300 }}
          size="large"
        />
        <Space>
          <Button onClick={() => navigate('/workflows')}>Back</Button>
          <Button type="primary" loading={saving} onClick={saveWorkflow}>
            Save
          </Button>
          {id && id !== 'new' && (
            <Button type="primary" onClick={runWorkflow}>
              Run
            </Button>
          )}
        </Space>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
        <Panel position="top-left">
          <Space direction="vertical">
            <Select
              style={{ width: 150 }}
              placeholder="Add Node"
              onSelect={addNode}
              options={nodeTypes.map((n) => ({ value: n.type, label: n.label }))}
            />
          </Space>
        </Panel>
      </ReactFlow>
    </div>
  );
}
