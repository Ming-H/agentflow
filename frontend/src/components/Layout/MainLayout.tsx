import { ReactNode } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ApartmentOutlined,
  RobotOutlined,
  HistoryOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';

const { Sider, Content, Header } = Layout;

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { key: '/workflows', icon: <ApartmentOutlined />, label: 'Workflows' },
    { key: '/agents', icon: <RobotOutlined />, label: 'Agent Templates' },
    { key: '/executions', icon: <HistoryOutlined />, label: 'Executions' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light">
        <div style={{ padding: '16px', fontSize: '18px', fontWeight: 'bold' }}>
          🤖 AgentFlow
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname.split('/').slice(0, 2).join('/') || '/workflows']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '16px' }}>{user?.email}</span>
          <a onClick={handleLogout} style={{ color: '#666' }}>
            <LogoutOutlined /> Logout
          </a>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: '24px', borderRadius: '8px' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
