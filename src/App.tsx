
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";

const queryClient = new QueryClient();

// Lazy load all pages
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const NewCampaign = lazy(() => import("./pages/NewCampaign"));
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
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminBrand = lazy(() => import("./pages/AdminBrand"));
const AdminSMSConfiguration = lazy(() => import("./pages/AdminSMSConfiguration"));

// 404 page
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
              <div className="text-center">
                <div className="p-6 rounded-3xl bg-gradient-primary shadow-glow w-fit mx-auto mb-6 animate-glow">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
                <p className="gradient-text text-lg">Carregando plataforma...</p>
              </div>
            </div>
          }>
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
                path="/admin/sms-configuration"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminSMSConfiguration />
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

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
