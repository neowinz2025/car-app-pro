import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminsManagement } from '@/components/admin/AdminsManagement';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Navigate } from 'react-router-dom';

export default function AdminAdminsPage() {
  const { adminUsername, isSuperAdmin } = useAdminAuth();

  if (!isSuperAdmin()) {
    return <Navigate to="/admin/reports" replace />;
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Gerenciamento de Administradores</CardTitle>
        <CardDescription>
          Cadastro e controle de administradores do painel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminsManagement
          currentAdminUsername={adminUsername || 'admin'}
          isSuperAdmin={isSuperAdmin()}
        />
      </CardContent>
    </Card>
  );
}
