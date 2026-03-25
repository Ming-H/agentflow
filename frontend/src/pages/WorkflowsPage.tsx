import { useEffect, useState } from 'react';
import { Button, Card, List, Tag, Space, Modal, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Workflow {
  id: number;
  name: string;
  description: string | null;
  status: string;
  owner_id: number;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('auth-storage');
  const authData = token ? JSON.parse(token) : null;
  const accessToken = authData?.state?.token;

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/workflows/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setWorkflows(response.data);
    } catch (error) {
      message.error('Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      message.error('Please enter a workflow name');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/v1/workflows/`,
        { name: newWorkflowName, description: newWorkflowDesc },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setWorkflows([...workflows, response.data]);
      setModalOpen(false);
      setNewWorkflowName('');
      setNewWorkflowDesc('');
      message.success('Workflow created');
      navigate(`/workflows/${response.data.id}`);
    } catch {
      message.error('Failed to create workflow');
    }
  };

  const deleteWorkflow = async (id: number) => {
    try {
      await axios.delete(`${API_URL}/api/v1/workflows/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setWorkflows(workflows.filter((w) => w.id !== id));
      message.success('Workflow deleted');
    } catch {
      message.error('Failed to delete workflow');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'green';
      case 'draft': return 'blue';
      default: return 'default';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Workflows</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Workflow
        </Button>
      </div>

      <List
        loading={loading}
        dataSource={workflows}
        renderItem={(workflow) => (
          <List.Item>
            <Card
              style={{ width: '100%' }}
              actions={[
                <EditOutlined key="edit" onClick={() => navigate(`/workflows/${workflow.id}`)} />,
                <PlayCircleOutlined key="run" />,
                <DeleteOutlined key="delete" onClick={() => deleteWorkflow(workflow.id)} />,
              ]}
            >
              <Card.Meta
                title={
                  <Space>
                    {workflow.name}
                    <Tag color={getStatusColor(workflow.status)}>{workflow.status}</Tag>
                  </Space>
                }
                description={workflow.description || 'No description'}
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Create New Workflow"
        open={modalOpen}
        onOk={createWorkflow}
        onCancel={() => setModalOpen(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <label>Workflow Name</label>
          <Input
            value={newWorkflowName}
            onChange={(e) => setNewWorkflowName(e.target.value)}
            placeholder="Enter workflow name"
          />
        </div>
        <div>
          <label>Description</label>
          <Input.TextArea
            value={newWorkflowDesc}
            onChange={(e) => setNewWorkflowDesc(e.target.value)}
            placeholder="Enter description (optional)"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}
