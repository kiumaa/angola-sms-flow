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

// Import lazy components from the centralized file
import {
  LazyLanding,
  LazyLogin, 
  LazyRegister,
  LazyForgotPassword,
  LazyDashboard,
  LazyCampaigns,
  LazyNewCampaign,
  LazyQuickSend,
  LazyContacts,
  LazyCredits,
  LazyCheckout,
  LazyCheckoutSuccess,
  LazyReports,
  LazyTransactions,
  LazySenderIDs,
  LazyUserSettings,
  LazyAdminDashboard,
  LazyAdminUsers,
  LazyAdminPackages,
  LazyAdminTransactions,
  LazyAdminCreditRequests,
  LazyAdminSenderIDs,
  LazyAdminSMSGateways,
  LazyAdminSMSMonitoring,
  LazyAdminReports,
  LazyAdminSettings,
  LazyAdminBrand,
  LazyAdminSMSConfiguration,
  LazyNotFound,
  LazyTerms,
  LazyPrivacy
} from "./components/shared/LazyComponents";

const queryClient = new QueryClient();

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
                path="/campaigns"
                element={
                  <ProtectedRoute>
                    <LazyCampaigns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns/new"
                element={
                  <ProtectedRoute>
                    <LazyNewCampaign />
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

              {/* Protected admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/packages"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminPackages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/transactions"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminTransactions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/credit-requests"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminCreditRequests />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/admin/sender-ids"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminSenderIDs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sms-gateway-settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminSMSGateways />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sms-monitoring"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminSMSMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/brand"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminBrand />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sms-configuration"
                element={
                  <ProtectedRoute requireAdmin>
                    <LazyAdminSMSConfiguration />
                  </ProtectedRoute>
                }
              />

              {/* Legal Pages */}
              <Route path="/legal/terms" element={<LazyTerms />} />
              <Route path="/legal/privacy" element={<LazyPrivacy />} />

              {/* 404 route */}
              <Route path="*" element={<LazyNotFound />} />
            </Routes>
                  </Suspense>
        </ConsentProvider>
      </BrandProvider>
            </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
</AuthProvider>
</QueryClientProvider>
  );
}

export default App;