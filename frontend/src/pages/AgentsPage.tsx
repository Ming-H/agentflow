import { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Modal, Input, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface AgentTemplate {
  id: number;
  name: string;
  description: string | null;
  template_type: string;
  config: {
    system_prompt: string;
    tools: string[];
    max_iterations: number;
    temperature: number;
  };
  is_builtin: boolean;
}

export default function AgentsPage() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    template_type: 'react',
    system_prompt: '',
    tools: '',
    max_iterations: 10,
    temperature: 0.7,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/agents/`);
      setTemplates(response.data);
    } catch {
      message.error('Failed to fetch agent templates');
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    const token = localStorage.getItem('auth-storage');
    const authData = token ? JSON.parse(token) : null;
    const accessToken = authData?.state?.token;

    try {
      await axios.post(
        `${API_URL}/api/v1/agents/`,
        {
          name: newTemplate.name,
          description: newTemplate.description,
          template_type: newTemplate.template_type,
          config: {
            system_prompt: newTemplate.system_prompt,
            tools: newTemplate.tools.split(',').map((t) => t.trim()).filter(Boolean),
            max_iterations: newTemplate.max_iterations,
            temperature: newTemplate.temperature,
          },
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      message.success('Template created');
      setModalOpen(false);
      fetchTemplates();
    } catch {
      message.error('Failed to create template');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'react': return 'blue';
      case 'plan_execute': return 'green';
      case 'multi_agent': return 'purple';
      default: return 'default';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Agent Templates</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          New Template
        </Button>
      </div>

      <List
        loading={loading}
        grid={{ gutter: 16, column: 3 }}
        dataSource={templates}
        renderItem={(template) => (
          <List.Item>
            <Card
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {template.name}
                  <Tag color={getTypeColor(template.template_type)}>{template.template_type}</Tag>
                </div>
              }
            >
              <p style={{ color: '#666', minHeight: 60 }}>
                {template.description || 'No description'}
              </p>
              <div style={{ fontSize: 12, color: '#999' }}>
                <div>Tools: {template.config?.tools?.join(', ') || 'None'}</div>
                <div>Temperature: {template.config?.temperature}</div>
                <div>Max Iterations: {template.config?.max_iterations}</div>
              </div>
              {template.is_builtin && <Tag style={{ marginTop: 8 }}>Built-in</Tag>}
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Create Agent Template"
        open={modalOpen}
        onOk={createTemplate}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <label>Name</label>
          <Input
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            placeholder="Template name"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Description</label>
          <Input.TextArea
            value={newTemplate.description}
            onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
            placeholder="Description"
            rows={2}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Type</label>
          <Select
            value={newTemplate.template_type}
            onChange={(v) => setNewTemplate({ ...newTemplate, template_type: v })}
            options={[
              { value: 'react', label: 'ReAct Agent' },
              { value: 'plan_execute', label: 'Plan-and-Execute' },
              { value: 'multi_agent', label: 'Multi-Agent' },
            ]}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>System Prompt</label>
          <Input.TextArea
            value={newTemplate.system_prompt}
            onChange={(e) => setNewTemplate({ ...newTemplate, system_prompt: e.target.value })}
            placeholder="System prompt for the agent"
            rows={3}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Tools (comma-separated)</label>
          <Input
            value={newTemplate.tools}
            onChange={(e) => setNewTemplate({ ...newTemplate, tools: e.target.value })}
            placeholder="search, calculator, web_browser"
          />
        </div>
      </Modal>
    </div>
  );
}
