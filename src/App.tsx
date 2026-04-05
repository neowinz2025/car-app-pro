import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminPlatesPage from "./pages/admin/AdminPlatesPage";
import AdminDamagedPage from "./pages/admin/AdminDamagedPage";
import AdminBateFiscoPage from "./pages/admin/AdminBateFiscoPage";
import AdminShiftsPage from "./pages/admin/AdminShiftsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminReservationsPage from "./pages/admin/AdminReservationsPage";
import AdminFileUploadsPage from "./pages/admin/AdminFileUploadsPage";
import AdminAdminsPage from "./pages/admin/AdminAdminsPage";
import AdminApiKeysPage from "./pages/admin/AdminApiKeysPage";
import AdminStoresPage from "./pages/admin/AdminStoresPage";
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
            <Route path="plates" element={<AdminPlatesPage />} />
            <Route path="damaged" element={<AdminDamagedPage />} />
            <Route path="bate-fisco" element={<AdminBateFiscoPage />} />
            <Route path="shifts" element={<AdminShiftsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="reservations" element={<AdminReservationsPage />} />
            <Route path="file-uploads" element={<AdminFileUploadsPage />} />
            <Route path="admins" element={<AdminAdminsPage />} />
            <Route path="api-keys" element={<AdminApiKeysPage />} />
            <Route path="stores" element={<AdminStoresPage />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
