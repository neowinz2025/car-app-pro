import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard"; // Legacy Dashboard
import AdminLayout from "./pages/admin/AdminLayout";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import UserLogin from "./pages/UserLogin";
import { SharedReportView } from "@/components/reports/SharedReportView";
import ProjectionDashboard from "./pages/ProjectionDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/relatorio/:token" element={<SharedReportView />} />
          <Route path="/projecao/:token" element={<ProjectionDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* New Nested Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/reports" replace />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
          
          {/* Legacy route kept for temporarily avoiding breakage while refactoring */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
