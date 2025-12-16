import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { attachSeedToWindow } from "./lib/seedUsersConsole";
import PublicLayout from "./components/layout/PublicLayout";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/app/Dashboard";
import Marketplace from "./pages/app/Marketplace";
import CropDoctor from "./pages/app/CropDoctor";
import ClimateAdvisory from "./pages/app/ClimateAdvisory";
import Finances from "./pages/app/Finances";
import Profile from "./pages/app/Profile";
import Shop from "./pages/app/Shop";
import MyShop from "./pages/app/MyShop";
import ShopPayments from "./pages/app/ShopPayments";
import ChatInbox from "./pages/app/ChatInbox";
import ChatConversation from "./pages/app/ChatConversation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Landing />} />
    </Route>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />

    {/* Protected App Routes */}
    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="marketplace" element={<Marketplace />} />
      <Route path="crop-doctor" element={<CropDoctor />} />
      <Route path="climate-advisory" element={<ClimateAdvisory />} />
      <Route path="finances" element={<Finances />} />
      <Route path="profile" element={<Profile />} />
      <Route path="shop/:shopId" element={<Shop />} />
      <Route path="my-shop" element={<MyShop />} />
      <Route path="payments" element={<ShopPayments />} />
      <Route path="chat" element={<ChatInbox />} />
      <Route path="chat/:conversationId" element={<ChatConversation />} />
    </Route>

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => {
  // Attach seed function to window for console access (development only)
  if (import.meta.env.DEV) {
    attachSeedToWindow();
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
