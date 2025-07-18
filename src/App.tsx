import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useDynamicBranding } from "@/hooks/useDynamicBranding";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import NewCampaign from "./pages/NewCampaign";
import Contacts from "./pages/Contacts";
import Reports from "./pages/Reports";
import UserSettings from "./pages/UserSettings";
import Credits from "./pages/Credits";
import Checkout from "./pages/Checkout";
import Transactions from "./pages/Transactions";
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import AdminTransactions from "./pages/AdminTransactions";
import AdminUsers from "./pages/AdminUsers";
import AdminPackages from "./pages/AdminPackages";
import AdminLayout from "./components/layout/AdminLayout";
import AdminSettings from "./pages/AdminSettings";
import AdminSenderIDs from "./pages/AdminSenderIDs";
import AdminCreditRequests from "./pages/AdminCreditRequests";
import AdminBrand from "./pages/AdminBrand";
import AdminSMSGateways from "./pages/AdminSMSGateways";
import SenderIDs from "./pages/SenderIDs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  // Apply dynamic branding on app load
  useDynamicBranding();
  
  return (
    <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/new" element={<NewCampaign />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/sender-ids" element={<SenderIDs />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<UserSettings />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            } />
            <Route path="/admin/users" element={
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            } />
            <Route path="/admin/packages" element={
              <AdminLayout>
                <AdminPackages />
              </AdminLayout>
            } />
            <Route path="/admin/settings" element={
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            } />
            <Route path="/admin/transactions" element={
              <AdminLayout>
                <AdminTransactions />
              </AdminLayout>
            } />
            <Route path="/admin/reports" element={
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            } />
            <Route path="/admin/sender-ids" element={
              <AdminLayout>
                <AdminSenderIDs />
              </AdminLayout>
            } />
            <Route path="/admin/sms-gateways" element={
              <AdminLayout>
                <AdminSMSGateways />
              </AdminLayout>
            } />
            <Route path="/admin/credit-requests" element={
              <AdminLayout>
                <AdminCreditRequests />
              </AdminLayout>
            } />
            <Route path="/admin/brand" element={
              <AdminLayout>
                <AdminBrand />
              </AdminLayout>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
