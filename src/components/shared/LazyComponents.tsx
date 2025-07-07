import { Suspense, lazy } from "react";

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

// Loading fallback component
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// Wrapper for lazy components with suspense
export const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    {children}
  </Suspense>
);