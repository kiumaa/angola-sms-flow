
import { Suspense, lazy } from "react";
import MessageSendingLoader from "./MessageSendingLoader";

// Lazy load heavy components for better performance
export const LazyAdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
export const LazyAdminUsers = lazy(() => import("@/pages/AdminUsers"));
export const LazyAdminPackages = lazy(() => import("@/pages/AdminPackages"));
export const LazyAdminSettings = lazy(() => import("@/pages/AdminSettings"));
export const LazyAdminTransactions = lazy(() => import("@/pages/AdminTransactions"));
export const LazyAdminReports = lazy(() => import("@/pages/AdminReports"));
export const LazyAdminSenderIDs = lazy(() => import("@/pages/AdminSenderIDs"));
export const LazyAdminCreditRequests = lazy(() => import("@/pages/AdminCreditRequests"));
export const LazyAdminBrand = lazy(() => import("@/pages/AdminBrand"));

export const LazyDashboard = lazy(() => import("@/pages/Dashboard"));
export const LazyCampaigns = lazy(() => import("@/pages/Campaigns"));
export const LazyNewCampaign = lazy(() => import("@/pages/NewCampaign"));
export const LazyContacts = lazy(() => import("@/pages/Contacts"));
export const LazyReports = lazy(() => import("@/pages/Reports"));
export const LazyUserSettings = lazy(() => import("@/pages/UserSettings"));
export const LazyCredits = lazy(() => import("@/pages/Credits"));
export const LazyCheckout = lazy(() => import("@/pages/Checkout"));
export const LazyTransactions = lazy(() => import("@/pages/Transactions"));
export const LazySenderIDs = lazy(() => import("@/pages/SenderIDs"));

// Enhanced loading component with SMS theme
export const PageLoader = () => <MessageSendingLoader />;

// Wrapper for lazy components with suspense
export const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);
