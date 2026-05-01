import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Storefront from "./pages/Storefront";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import DashboardProducts from "./pages/DashboardProducts";
import DashboardBundles from "./pages/DashboardBundles";
import DashboardOrders from "./pages/DashboardOrders";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardAdTracking from "./pages/DashboardAdTracking";
import DashboardLinks from "./pages/DashboardLinks";
import DashboardReferrals from "./pages/DashboardReferrals";
import DashboardDelivery from "./pages/DashboardDelivery";
import DashboardCourier from "./pages/DashboardCourier";
import DashboardReviews from "./pages/DashboardReviews";
import DashboardChatbot from "./pages/DashboardChatbot";
import DashboardChatbotFAQs from "./pages/DashboardChatbotFAQs";
import DashboardInbox from "./pages/DashboardInbox";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import AuthGuard from "./components/AuthGuard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/store/:slug" element={<Storefront />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardLayout />
              </AuthGuard>
            }
          >
            <Route index element={<DashboardOrders />} />
            <Route path="overview" element={<DashboardOverview />} />
            <Route path="products" element={<DashboardProducts />} />
            <Route path="bundles" element={<DashboardBundles />} />
            <Route path="links" element={<DashboardLinks />} />
            <Route path="referrals" element={<DashboardReferrals />} />
            <Route path="orders" element={<Navigate to="/dashboard" replace />} />
            <Route path="delivery" element={<DashboardDelivery />} />
            <Route path="courier" element={<DashboardCourier />} />
            <Route path="reviews" element={<DashboardReviews />} />
            <Route path="inbox" element={<DashboardInbox />} />
            <Route path="chatbot" element={<DashboardChatbot />} />
            <Route path="chatbot/faqs" element={<DashboardChatbotFAQs />} />
            <Route path="settings" element={<DashboardSettings />} />
            <Route path="settings/ad-tracking" element={<DashboardAdTracking />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
