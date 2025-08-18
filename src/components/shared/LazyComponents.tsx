
import { Suspense, lazy } from "react";
import MessageSendingLoader from "./MessageSendingLoader";

// Lazy load heavy components for better performance
// Public Pages
export const LazyLanding = lazy(() => import("@/pages/Landing"));
export const LazyLogin = lazy(() => import("@/pages/Login"));
export const LazyRegister = lazy(() => import("@/pages/Register"));
export const LazyForgotPassword = lazy(() => import("@/pages/ForgotPassword"));

// Auth Components
export const LazyOTPLoginModal = lazy(() => import("@/components/auth/OTPLoginModal"));

// User Pages
export const LazyDashboard = lazy(() => import("@/pages/Dashboard"));
export const LazyCampaigns = lazy(() => import("@/pages/Campaigns"));
export const LazyNewCampaign = lazy(() => import("@/pages/NewCampaign"));
export const LazyQuickSend = lazy(() => import("@/pages/QuickSend"));
export const LazyContacts = lazy(() => import("@/pages/Contacts"));
export const LazyReports = lazy(() => import("@/pages/Reports"));
export const LazyUserSettings = lazy(() => import("@/pages/UserSettings"));
export const LazyCredits = lazy(() => import("@/pages/Credits"));
export const LazyCheckout = lazy(() => import("@/pages/Checkout"));
export const LazyCheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
export const LazyTransactions = lazy(() => import("@/pages/Transactions"));
export const LazySenderIDs = lazy(() => import("@/pages/SenderIDs"));

// Admin Components
export const LazyAdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
export const LazyAdminUsers = lazy(() => import("@/pages/AdminUsers"));
export const LazyAdminPackages = lazy(() => import("@/pages/AdminPackages"));
export const LazyAdminSettings = lazy(() => import("@/pages/AdminSettings"));
export const LazyAdminTransactions = lazy(() => import("@/pages/AdminTransactions"));
export const LazyAdminReports = lazy(() => import("@/pages/AdminReports"));
export const LazyAdminSenderIDs = lazy(() => import("@/pages/AdminSenderIDs"));
export const LazyAdminCreditRequests = lazy(() => import("@/pages/AdminCreditRequests"));
export const LazyAdminBrand = lazy(() => import("@/pages/AdminBrand"));
export const LazyAdminSMSGateways = lazy(() => import("@/pages/AdminSMSGateways"));
export const LazyAdminSMSMonitoring = lazy(() => import("@/pages/AdminSMSMonitoring"));
export const LazyAdminSMSConfiguration = lazy(() => import("@/pages/AdminSMSConfiguration"));

// Legal Pages
export const LazyTerms = lazy(() => import("@/pages/legal/Terms"));
export const LazyPrivacy = lazy(() => import("@/pages/legal/Privacy"));

// 404 Page
export const LazyNotFound = lazy(() => import("@/pages/NotFound"));

// Enhanced loading component with SMS theme
export const PageLoader = () => <MessageSendingLoader />;

// Wrapper for lazy components with suspense
export const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);
