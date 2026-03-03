import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Admin {
  id: string;
  username: string;
  role: 'admin' | 'super_admin';
  active: boolean;
  created_at: string;
  created_by: string | null;
  last_login: string | null;
}

interface AdminsManagementProps {
  currentAdminUsername: string;
  isSuperAdmin: boolean;
}

const getApiHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
});

const getApiUrl = (fn: string) =>
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`;

export function AdminsManagement({ currentAdminUsername, isSuperAdmin }: AdminsManagementProps) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'admin' as 'admin' | 'super_admin',
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await fetch(getApiUrl('list-admins'), {
        method: 'POST',
        headers: getApiHeaders(),
      });

      if (!response.ok) throw new Error('Erro ao carregar administradores');

      const data = await response.json();
      setAdmins(data.admins || []);
    } catch (error) {
      console.error('Error loading admins:', error);
      toast.error('Erro ao carregar administradores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.username.trim()) {
      toast.error('Digite o nome de usuário');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      const response = await fetch(getApiUrl('create-admin'), {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          createdBy: currentAdminUsername,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao criar administrador' }));
        throw new Error(errorData.error);
      }

      toast.success('Administrador criado com sucesso');
      setIsDialogOpen(false);
      resetForm();
      loadAdmins();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast.error(error.message || 'Erro ao criar administrador');
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    if (admin.username === currentAdminUsername) {
      toast.error('Você não pode desativar seu próprio usuário');
      return;
    }

    try {
      const response = await fetch(getApiUrl('manage-admin'), {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'toggle_active',
          adminId: admin.id,
          callerUsername: currentAdminUsername,
          active: !admin.active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao alterar status' }));
        throw new Error(errorData.error);
      }

      toast.success(admin.active ? 'Administrador desativado' : 'Administrador ativado');
      loadAdmins();
    } catch (error: any) {
      console.error('Error toggling admin status:', error);
      toast.error(error.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (adminId: string, adminUsername: string) => {
    if (adminUsername === currentAdminUsername) {
      toast.error('Você não pode excluir seu próprio usuário');
      return;
    }

    try {
      const response = await fetch(getApiUrl('manage-admin'), {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          action: 'delete',
          adminId,
          callerUsername: currentAdminUsername,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao excluir administrador' }));
        throw new Error(errorData.error);
      }

      toast.success('Administrador excluído com sucesso');
      loadAdmins();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      toast.error(error.message || 'Erro ao excluir administrador');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
      role: 'admin',
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Administradores do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Total de {admins.length} administradores cadastrados
          </p>
        </div>
        {isSuperAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Administrador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Administrador</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo administrador com acesso ao painel.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    placeholder="Digite o nome de usuário"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Nível de Acesso</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'admin' | 'super_admin') => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Administrador
                        </div>
                      </SelectItem>
                      <SelectItem value="super_admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          Super Administrador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Super Admins têm acesso total ao sistema incluindo gestão de lojas e API keys
                  </p>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  Cadastrar Administrador
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : admins.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum administrador cadastrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <Card key={admin.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg ${admin.role === 'super_admin' ? 'bg-primary/10' : 'bg-blue-500/10'} flex items-center justify-center`}>
                        <Shield className={`w-4 h-4 ${admin.role === 'super_admin' ? 'text-primary' : 'text-blue-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{admin.username}</h4>
                          <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </Badge>
                          {admin.active ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              <UserX className="w-3 h-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Cadastrado em:</span>{' '}
                        {format(new Date(admin.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                      {admin.created_by && (
                        <div>
                          <span className="font-medium">Por:</span> {admin.created_by}
                        </div>
                      )}
                      {admin.last_login && (
                        <div className="col-span-2">
                          <span className="font-medium">Último acesso:</span>{' '}
                          {format(new Date(admin.last_login), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSuperAdmin && admin.username !== currentAdminUsername && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(admin)}
                      >
                        {admin.active ? (
                          <UserX className="w-4 h-4 text-orange-600" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-green-600" />
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o administrador {admin.username}?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(admin.id, admin.username)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
