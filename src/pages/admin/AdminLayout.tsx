import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminDrawer } from '@/components/layout/AdminDrawer';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Shield, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function AdminLayout() {
  const { isAuthenticated, isLoading, adminUsername, adminRole, isSuperAdmin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Temporary function while we migrate - maps URLs to Drawer tabs visually
  const handleTabChange = (tab: string) => {
    navigate(`/admin/${tab}`);
  };

  const getActiveTab = () => {
    const path = window.location.pathname.split('/').pop() || 'reports';
    return path as any;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-30">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDrawerOpen(true)}
                className="rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <p className="text-xs text-muted-foreground">
                  {adminUsername}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      <AdminDrawer
        activeTab={getActiveTab()}
        onTabChange={handleTabChange}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
        onLogout={() => {
          logout();
          navigate('/admin/login');
        }}
        adminUsername={adminUsername || 'admin'}
        adminRole={adminRole || 'admin'}
        isSuperAdmin={isSuperAdmin()}
      />
    </div>
  );
}
