import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Table } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, download, toItems } from '../api/client';
import { PageTitle } from '../layouts/AppLayout';
const labels: Record<string, string> = { warehouses:'Nhà kho', 'camera-systems':'Camera', 'fire-protection-systems':'Cứu hỏa', 'construction-projects':'Công trình' };
export function ReportPage() { const { module = 'warehouses' } = useParams(); const [rows, setRows] = useState<any[]>([]); const [loading, setLoading] = useState(false); const { message } = App.useApp(); const load = async () => { setLoading(true); try { setRows(toItems(await api<any>(`/api/reports/${module}`))); } catch (error) { message.error((error as Error).message); } finally { setLoading(false); } }; useEffect(() => { load(); }, [module]); return <><PageTitle title={`Báo cáo ${labels[module] ?? module}`} extra={<><Button icon={<ReloadOutlined />} onClick={load}>Tải lại</Button><Button icon={<DownloadOutlined />} onClick={() => download(`/api/${module}/export`, `bao-cao-${module}.xlsx`)}>Export Excel</Button></>} /><Card><Table rowKey={(row) => row.id ?? JSON.stringify(row)} loading={loading} dataSource={rows} columns={[{ title:'Tên/Nội dung', render:(_, row) => row.name ?? row.code ?? row.module ?? '-' }, { title:'Đơn vị', dataIndex:'unit_name' }, { title:'Trạng thái', dataIndex:'status' }, { title:'Ghi chú', dataIndex:'note' }]} /></Card></>; }
