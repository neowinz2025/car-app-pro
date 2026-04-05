import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeysManagement } from '@/components/admin/ApiKeysManagement';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Navigate } from 'react-router-dom';

export default function AdminApiKeysPage() {
  const { isSuperAdmin } = useAdminAuth();

  if (!isSuperAdmin()) {
    return <Navigate to="/admin/reports" replace />;
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Chaves API - Plate Recognizer</CardTitle>
        <CardDescription>
          Sistema de rotação automática de chaves API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApiKeysManagement />
      </CardContent>
    </Card>
  );
}
