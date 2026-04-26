import { Spin } from 'antd';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResourcePage } from './pages/ResourcePage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ReportPage } from './pages/ReportPage';
import { BackupPage } from './pages/BackupPage';
import { resourceConfigs } from './pages/resourceConfigs';
function Protected() { const { user, loading } = useAuth(); if (loading) return <Spin fullscreen />; return user ? <AppLayout /> : <Navigate to="/login" replace />; }
export function App() { return <AuthProvider><BrowserRouter><Routes><Route path="/setup" element={<SetupPage />} /><Route path="/login" element={<LoginPage />} /><Route element={<Protected />}><Route path="/dashboard" element={<DashboardPage />} />{resourceConfigs.map((cfg) => <Route key={cfg.path} path={cfg.path} element={<ResourcePage config={cfg} />} />)}<Route path="/settings/change-password" element={<ChangePasswordPage />} /><Route path="/reports/:module" element={<ReportPage />} /><Route path="/backup" element={<BackupPage />} /></Route><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></BrowserRouter></AuthProvider>; }
