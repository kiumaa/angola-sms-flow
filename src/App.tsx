
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import AdminLayout from "./components/layout/AdminLayout";
import MessageSendingLoader from "./components/shared/MessageSendingLoader";
import { ThemeProvider } from "next-themes";
import { BrandProvider } from "@/providers/BrandProvider";

const queryClient = new QueryClient();

// Lazy load all pages
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const NewCampaign = lazy(() => import("./pages/NewCampaign"));
const QuickSend = lazy(() => import("./pages/QuickSend"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Credits = lazy(() => import("./pages/Credits"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Reports = lazy(() => import("./pages/Reports"));
const Transactions = lazy(() => import("./pages/Transactions"));
const SenderIDs = lazy(() => import("./pages/SenderIDs"));
const UserSettings = lazy(() => import("./pages/UserSettings"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminPackages = lazy(() => import("./pages/AdminPackages"));
const AdminTransactions = lazy(() => import("./pages/AdminTransactions"));
const AdminCreditRequests = lazy(() => import("./pages/AdminCreditRequests"));
const AdminSenderIDs = lazy(() => import("./pages/AdminSenderIDs"));
const AdminSenderIDsMultiGateway = lazy(() => import("./pages/AdminSenderIDsMultiGateway"));
const AdminSMSGateways = lazy(() => import("./pages/AdminSMSGateways"));
const AdminSMSMonitoring = lazy(() => import("./pages/AdminSMSMonitoring"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminBrand = lazy(() => import("./pages/AdminBrand"));
const AdminSMSConfiguration = lazy(() => import("./pages/AdminSMSConfiguration"));

// 404 page
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider 
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <BrandProvider>
                <Suspense fallback={<MessageSendingLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected user routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <ProtectedRoute>
                    <Campaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/new"
                element={
                  <ProtectedRoute>
                    <NewCampaign />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quick-send"
                element={
                  <ProtectedRoute>
                    <QuickSend />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute>
                    <Contacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/credits"
                element={
                  <ProtectedRoute>
                    <Credits />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout/:packageId"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sender-ids"
                element={
                  <ProtectedRoute>
                    <SenderIDs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <UserSettings />
                  </ProtectedRoute>
                }
              />

              {/* Protected admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/packages"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminPackages />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/transactions"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminTransactions />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/credit-requests"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminCreditRequests />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
               <Route
                path="/admin/sender-ids"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminSenderIDs />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sender-ids-multi"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminSenderIDsMultiGateway />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sms-gateway-settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminSMSGateways />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sms-monitoring"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminSMSMonitoring />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminReports />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminSettings />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/brand"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminBrand />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sms-configuration"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminSMSConfiguration />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrandProvider>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
</AuthProvider>
</QueryClientProvider>
  );
}

export default App;
