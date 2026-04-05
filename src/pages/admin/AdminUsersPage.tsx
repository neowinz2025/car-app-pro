import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersManagement } from '@/components/users/UsersManagement';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminUsersPage() {
  const { adminUsername } = useAdminAuth();

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Cadastro e controle de usuários do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UsersManagement adminUsername={adminUsername || 'admin'} />
      </CardContent>
    </Card>
  );
}
