import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import MessageSendingLoader from "./components/shared/MessageSendingLoader";
import { ThemeProvider } from "next-themes";
import { BrandProvider } from "@/providers/BrandProvider";
import { ConsentProvider } from "./components/shared/ConsentProvider";
import AdminLayout from "./components/layout/AdminLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { useThemeAwareFavicon } from "./hooks/useThemeAwareFavicon";
import { MetaTagsProvider } from "./components/shared/MetaTagsProvider";
import { SecurityHeaders } from "./components/security/SecurityHeaders";

// Import lazy components from the centralized file
import {
  LazyLanding,
  LazyLogin, 
  LazyRegister,
  LazyForgotPassword,
  LazyDashboard,
  LazyQuickSend,
  LazyContacts,
  LazyCredits,
  LazyCheckout,
  LazyCheckoutSuccess,
  LazyReports,
  LazyTransactions,
  LazySenderIDs,
  LazyUserSettings,
  LazyComingSoon,
  LazyAdminDashboard,
  LazyAdminFinanceiro,
  LazyAdminUsers,
  LazyAdminPackages,
  LazyAdminTransactions,
  LazyAdminCreditRequests,
  LazyAdminSenderIDs,
  LazyAdminReports,
  LazyAdminSettings,
  LazyAdminBrand,
  LazyAdminSMSConfiguration,
  LazyAdminSMSMonitoring,
  LazyAdminSMSTest,
  LazyAdminProductionMonitoring,
  LazyAdminGatewayControl,
  LazyAdminTemplates,
  LazyAdminSMTPSettings,
  LazyAdminSecurityCenter,
  LazyAdminSystemMonitoring,
  LazyNotFound,
  LazyTerms,
  LazyPrivacy
} from "./components/shared/LazyComponents";

// Import new admin pages
import AdminCampaigns from "./pages/AdminCampaigns";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminCompliance from "./pages/AdminCompliance";
import AdminAutomations from "./pages/AdminAutomations";
import AdminWorkflows from "./pages/AdminWorkflows";

// Import components for support system
import Support from "./pages/Support";
import AdminSupport from "./pages/AdminSupport";

const queryClient = new QueryClient();

function App() {
  // Initialize theme-aware favicon
  useThemeAwareFavicon();
  
  return (
    <ErrorBoundary>
      <SecurityHeaders />
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
                <MetaTagsProvider>
                  <BrandProvider>
                  <ConsentProvider>
                    <Suspense fallback={<MessageSendingLoader />}>
            <Routes>
              {/* Public routes */}
            <Route path="/" element={<LazyLanding />} />
            <Route path="/login" element={<LazyLogin />} />
            <Route path="/register" element={<LazyRegister />} />
            <Route path="/forgot-password" element={<LazyForgotPassword />} />

              {/* Protected user routes with DashboardLayout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <div />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<LazyDashboard />} />
                <Route path="quick-send" element={<LazyQuickSend />} />
                <Route path="contacts" element={<LazyContacts />} />
                <Route path="credits" element={<LazyCredits />} />
                <Route path="campaigns" element={<LazyComingSoon />} />
                <Route path="reports" element={<LazyReports />} />
                <Route path="transactions" element={<LazyTransactions />} />
                <Route path="sender-ids" element={<LazySenderIDs />} />
                <Route path="settings" element={<LazyUserSettings />} />
                <Route path="support" element={<Support />} />
              </Route>

              {/* Checkout routes (without dashboard layout) */}
              <Route
                path="/checkout/:packageId"
                element={
                  <ProtectedRoute>
                    <LazyCheckout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout/success/:transactionId"
                element={
                  <ProtectedRoute>
                    <LazyCheckoutSuccess />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<LazyAdminDashboard />} />
                <Route path="gateway-control" element={<LazyAdminGatewayControl />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="campaigns" element={<AdminCampaigns />} />
                <Route path="templates" element={<LazyAdminTemplates />} />
                <Route path="automations" element={<AdminAutomations />} />
                <Route path="workflows" element={<AdminWorkflows />} />
                <Route path="compliance" element={<AdminCompliance />} />
                <Route path="financeiro" element={<LazyAdminFinanceiro />} />
                <Route path="users" element={<LazyAdminUsers />} />
                <Route path="packages" element={<LazyAdminPackages />} />
                <Route path="transactions" element={<LazyAdminTransactions />} />
                <Route path="credit-requests" element={<LazyAdminCreditRequests />} />
                <Route path="sender-ids" element={<LazyAdminSenderIDs />} />
                <Route path="sms-configuration" element={<LazyAdminSMSConfiguration />} />
                <Route path="sms-monitoring" element={<LazyAdminSMSMonitoring />} />
                <Route path="sms-test" element={<LazyAdminSMSTest />} />
                <Route path="reports" element={<LazyAdminReports />} />
                <Route path="settings" element={<LazyAdminSettings />} />
                <Route path="smtp-settings" element={<LazyAdminSMTPSettings />} />
                <Route path="brand" element={<LazyAdminBrand />} />
                <Route path="security" element={<LazyAdminSecurityCenter />} />
                <Route path="system-monitoring" element={<LazyAdminSystemMonitoring />} />
                <Route path="production" element={<LazyAdminProductionMonitoring />} />
                <Route path="support" element={<AdminSupport />} />
              </Route>

              {/* Legal Pages */}
              <Route path="/legal/terms" element={<LazyTerms />} />
              <Route path="/legal/privacy" element={<LazyPrivacy />} />

              {/* 404 route */}
              <Route path="*" element={<LazyNotFound />} />
            </Routes>
                    </Suspense>
                  </ConsentProvider>
                  </BrandProvider>
                </MetaTagsProvider>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;