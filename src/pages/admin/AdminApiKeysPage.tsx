import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeysManagement } from '@/components/admin/ApiKeysManagement';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Navigate } from 'react-router-dom';

export default function AdminApiKeysPage() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
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
