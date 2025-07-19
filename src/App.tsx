import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<NewCampaign />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/sender-ids" element={<SenderIDs />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/settings" element={<UserSettings />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/packages" element={<AdminPackages />} />
        <Route path="/admin/credit-requests" element={<AdminCreditRequests />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/brand" element={<AdminBrand />} />
        <Route path="/admin/sms-gateways" element={<AdminSMSGateways />} />
        <Route path="/admin/sms-gateway-settings" element={<AdminSMSGatewaySettings />} />
        <Route path="/admin/sender-ids-multi" element={<AdminSenderIDsMultiGateway />} />
        <Route path="/admin/sms-monitoring" element={<AdminSMSMonitoring />} />

        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
