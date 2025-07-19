
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Toaster } from "@/components/ui/toaster";
import './App.css';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

// User Pages
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import NewCampaign from './pages/NewCampaign';
import Contacts from './pages/Contacts';
import SenderIDs from './pages/SenderIDs';
import Reports from './pages/Reports';
import Transactions from './pages/Transactions';
import Credits from './pages/Credits';
import UserSettings from './pages/UserSettings';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminReports from './pages/AdminReports';
import AdminTransactions from './pages/AdminTransactions';
import AdminPackages from './pages/AdminPackages';
import AdminCreditRequests from './pages/AdminCreditRequests';
import AdminSettings from './pages/AdminSettings';
import AdminBrand from './pages/AdminBrand';
import AdminSMSGateways from './pages/AdminSMSGateways';
import AdminSMSGatewaySettings from './pages/AdminSMSGatewaySettings';
import AdminSenderIDsMultiGateway from './pages/AdminSenderIDsMultiGateway';
import AdminSMSMonitoring from "./pages/AdminSMSMonitoring";

// Layout Components
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected User Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/campaigns" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Campaigns />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/campaigns/new" element={
            <ProtectedRoute>
              <DashboardLayout>
                <NewCampaign />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/contacts" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Contacts />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/sender-ids" element={
            <ProtectedRoute>
              <DashboardLayout>
                <SenderIDs />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Transactions />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/credits" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Credits />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserSettings />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Protected Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/transactions" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminTransactions />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/packages" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminPackages />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/credit-requests" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminCreditRequests />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/brand" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminBrand />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/sms-gateways" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminSMSGateways />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/sms-gateway-settings" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminSMSGatewaySettings />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/sender-ids-multi" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminSenderIDsMultiGateway />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/sms-monitoring" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminSMSMonitoring />
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Admin redirect */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <Navigate to="/admin/dashboard" replace />
            </ProtectedRoute>
          } />

          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
