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

              {/* Protected user routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <LazyDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quick-send"
                element={
                  <ProtectedRoute>
                    <LazyQuickSend />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <ProtectedRoute>
                    <LazyContacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/credits"
                element={
                  <ProtectedRoute>
                    <LazyCredits />
                  </ProtectedRoute>
                }
              />
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
                path="/campaigns"
                element={
                  <ProtectedRoute>
                    <LazyComingSoon />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <LazyReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <ProtectedRoute>
                    <LazyTransactions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sender-ids"
                element={
                  <ProtectedRoute>
                    <LazySenderIDs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <LazyUserSettings />
                  </ProtectedRoute>
                 }
               />
               <Route
                 path="/support"
                 element={
                   <ProtectedRoute>
                     <Support />
                   </ProtectedRoute>
                 }
               />";
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<LazyAdminDashboard />} />
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