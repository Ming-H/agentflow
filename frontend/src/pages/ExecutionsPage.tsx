import { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Descriptions, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Execution {
  id: number;
  workflow_id: number;
  status: string;
  input_data: any;
  output_data: any;
  error_message: string | null;
  execution_log: any[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchExecutions();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchExecutions = async () => {
    const token = localStorage.getItem('auth-storage');
    const authData = token ? JSON.parse(token) : null;
    const accessToken = authData?.state?.token;

    try {
      const response = await axios.get(`${API_URL}/api/v1/executions/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setExecutions(response.data);
    } catch {
      // Silent fail for polling
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'running': return 'blue';
      case 'pending': return 'orange';
      case 'failed': return 'red';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Workflow ID',
      dataIndex: 'workflow_id',
      key: 'workflow_id',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Started',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date: string) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: 'Completed',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date: string) => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Execution) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedExecution(record);
            setModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Executions</h1>

      <Table
        loading={loading}
        dataSource={executions}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={`Execution #${selectedExecution?.id}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedExecution && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedExecution.status)}>
                  {selectedExecution.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Workflow ID">
                {selectedExecution.workflow_id}
              </Descriptions.Item>
              <Descriptions.Item label="Started">
                {selectedExecution.started_at
                  ? new Date(selectedExecution.started_at).toLocaleString()
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Completed">
                {selectedExecution.completed_at
                  ? new Date(selectedExecution.completed_at).toLocaleString()
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedExecution.error_message && (
              <div style={{ marginTop: 16 }}>
                <h4>Error</h4>
                <pre style={{ background: '#fff2f0', padding: 12, borderRadius: 4 }}>
                  {selectedExecution.error_message}
                </pre>
              </div>
            )}

            {selectedExecution.output_data && (
              <div style={{ marginTop: 16 }}>
                <h4>Output</h4>
                <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>
                  {JSON.stringify(selectedExecution.output_data, null, 2)}
                </pre>
              </div>
            )}

            {selectedExecution.execution_log && selectedExecution.execution_log.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>Execution Log</h4>
                <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, maxHeight: 300, overflow: 'auto' }}>
                  {JSON.stringify(selectedExecution.execution_log, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
