import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StoresManagement } from '@/components/stores/StoresManagement';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Navigate } from 'react-router-dom';

export default function AdminStoresPage() {
  const { isSuperAdmin } = useAdminAuth();

  if (!isSuperAdmin()) {
    return <Navigate to="/admin/reports" replace />;
  }

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Gerenciamento de Lojas</CardTitle>
        <CardDescription>
          Cadastro e controle de lojas do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StoresManagement />
      </CardContent>
    </Card>
  );
}
