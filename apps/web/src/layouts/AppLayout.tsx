import { DashboardOutlined, DatabaseOutlined, FileExcelOutlined, HomeOutlined, LockOutlined, LogoutOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons';
import { Button, Dropdown, Input, Layout, Menu, Space, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
const { Header, Sider, Content } = Layout;
const menu = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/warehouses', icon: <HomeOutlined />, label: 'Nhà kho' },
  { key: '/camera-systems', icon: <DatabaseOutlined />, label: 'Camera' },
  { key: '/fire-protection-systems', icon: <ToolOutlined />, label: 'Cứu hỏa' },
  { key: '/construction-projects', icon: <ToolOutlined />, label: 'Công trình' },
  { key: 'settings', icon: <SettingOutlined />, label: 'Cấu hình', children: [
    { key: '/settings/units', label: 'Đơn vị' }, { key: '/settings/locations/provinces', label: 'Tỉnh/TP' }, { key: '/settings/locations/communes', label: 'Xã/Phường' },
    { key: '/settings/warehouse-types', label: 'Loại kho' }, { key: '/settings/goods-types', label: 'Loại hàng' }, { key: '/settings/warehouse-quality-levels', label: 'Chất lượng kho' },
    { key: '/settings/fire-protection-types', label: 'Loại PCCC' }, { key: '/settings/lightning-protection-types', label: 'Chống sét' }, { key: '/settings/change-password', label: 'Đổi mật khẩu' },
  ] },
  { key: 'reports', icon: <FileExcelOutlined />, label: 'Báo cáo', children: [
    { key: '/reports/warehouses', label: 'Báo cáo kho' }, { key: '/reports/camera-systems', label: 'Báo cáo camera' }, { key: '/reports/fire-protection-systems', label: 'Báo cáo PCCC' }, { key: '/reports/construction-projects', label: 'Báo cáo công trình' }, { key: '/backup', label: 'Backup/Restore' },
  ] },
];
export function AppLayout() {
  const navigate = useNavigate(); const location = useLocation(); const auth = useAuth();
  return <Layout style={{ minHeight: '100vh' }}><Sider breakpoint="lg" collapsedWidth={0}><div className="logo"><DatabaseOutlined /> Warehouse</div><Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menu} onClick={({ key }) => navigate(key)} /></Sider><Layout><Header style={{ background:'#fff', padding:'0 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}><Input.Search placeholder="Tìm nhanh..." style={{ maxWidth: 360 }} /><Dropdown menu={{ items:[{ key:'password', icon:<LockOutlined />, label:'Đổi mật khẩu', onClick:()=>navigate('/settings/change-password') }, { key:'logout', icon:<LogoutOutlined />, label:'Đăng xuất', onClick:()=>auth.logout().then(()=>navigate('/login')) }] }}><Button>admin</Button></Dropdown></Header><Content className="page"><Outlet /></Content></Layout></Layout>;
}
export function PageTitle({ title, subtitle, extra }: { title: string; subtitle?: string; extra?: React.ReactNode }) { return <div className="page-header"><div><Typography.Title level={3} style={{ margin:0 }}>{title}</Typography.Title>{subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}</div><Space wrap>{extra}</Space></div>; }
