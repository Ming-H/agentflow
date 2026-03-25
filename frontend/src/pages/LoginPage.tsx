import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const formData = new FormData();
      formData.append('username', values.email);
      formData.append('password', values.password);

      const response = await axios.post(`${API_URL}/api/v1/auth/login`, formData);
      const { access_token } = response.data;

      // Get user info
      const userResponse = await axios.get(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      login(access_token, userResponse.data);
      message.success('Login successful!');
      navigate('/');
    } catch {
      message.error('Login failed. Please check your credentials.');
    }
  };

  const onRegister = async (values: { email: string; password: string; full_name: string }) => {
    try {
      await axios.post(`${API_URL}/api/v1/auth/register`, values);
      message.success('Registration successful! Please login.');
      form.resetFields();
    } catch {
      message.error('Registration failed. Email may already exist.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card title="AgentFlow" style={{ width: 400 }}>
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Login
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ color: '#999' }}>Or register a new account</span>
        </div>
        <Form onFinish={onRegister} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="full_name">
            <Input placeholder="Full Name" />
          </Form.Item>
          <Form.Item name="reg_email">
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="reg_password">
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" block>
              Register
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
