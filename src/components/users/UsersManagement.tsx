import { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard as Edit, User, Shield, UserCheck, UserX, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SystemUser {
  id: string;
  name: string;
  cpf: string;
  role: 'super_admin' | 'admin' | 'user';
  active: boolean;
  created_at: string;
  created_by: string | null;
  last_login: string | null;
  store_id: string | null;
}

interface StoreOption {
  id: string;
  name: string;
}

interface UsersManagementProps {
  adminUsername: string;
}

export function UsersManagement({ adminUsername }: UsersManagementProps) {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    password: '',
    role: 'OPERADOR' as 'SUPER_ADMIN' | 'ADMIN' | 'OPERADOR',
    storeId: '',
  });

  useEffect(() => {
    loadUsers();
    loadStores();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
      toast.error('Erro ao carregar lojas');
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleCPFChange = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    setFormData({ ...formData, cpf: numbers.slice(0, 11) });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Digite o nome do usuário');
      return;
    }

    if (formData.cpf.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (editingUser) {
        const apiUrl = `${supabaseUrl}/functions/v1/update-user`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            userId: editingUser.id,
            name: formData.name,
            role: formData.role,
            storeId: formData.storeId || null,
            adminUsername,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro ao atualizar usuário' }));
          throw new Error(errorData.error);
        }

        toast.success('Usuário atualizado com sucesso');
      } else {
        const apiUrl = `${supabaseUrl}/functions/v1/create-user`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            name: formData.name,
            cpf: formData.cpf,
            password: formData.password || undefined,
            role: formData.role,
            storeId: formData.storeId || null,
            createdBy: adminUsername,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro ao criar usuário' }));
          throw new Error(errorData.error);
        }

        toast.success('Usuário criado com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
      loadUsers();
    } catch (error: Error | unknown) {
      console.error('Error saving user:', error);
      toast.error((error as Error).message || 'Erro ao salvar usuário');
    }
  };

  const handleToggleActive = async (user: SystemUser) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/toggle-user-status`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          userId: user.id,
          active: !user.active,
          adminUsername,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao alterar status' }));
        throw new Error(errorData.error);
      }

      toast.success(user.active ? 'Usuário desativado' : 'Usuário ativado');
      loadUsers();
    } catch (error: Error | unknown) {
      console.error('Error toggling user status:', error);
      toast.error((error as Error).message || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/delete-user`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          userId,
          adminUsername,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao excluir usuário' }));
        throw new Error(errorData.error);
      }

      toast.success('Usuário excluído com sucesso');
      loadUsers();
    } catch (error: Error | unknown) {
      console.error('Error deleting user:', error);
      toast.error((error as Error).message || 'Erro ao excluir usuário');
    }
  };

  const openEditDialog = (user: SystemUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      cpf: user.cpf,
      role: user.role,
      storeId: user.store_id || '',
      password: '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cpf: '',
      password: '',
      role: 'user',
      storeId: '',
    });
    setEditingUser(null);
  };

  const getStoreName = (storeId: string | null) => {
    if (!storeId) return null;
    const store = stores.find(s => s.id === storeId);
    return store?.name || null;
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
          <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Total de {users.length} usuários cadastrados
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Atualize os dados do usuário'
                  : 'Preencha os dados para criar um novo usuário. O CPF será usado para login.'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Digite o nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF (usado para login)</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formatCPF(formData.cpf)}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  disabled={!!editingUser}
                  maxLength={14}
                />
                {editingUser && (
                  <p className="text-xs text-muted-foreground">
                    CPF não pode ser alterado
                  </p>
                )}
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha (opcional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Deixe vazio para usar os 4 últimos dígitos do CPF"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se não informada, a senha padrão será os 4 últimos dígitos do CPF
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'super_admin' | 'admin' | 'user') => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Operador
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Administrador
                      </div>
                    </SelectItem>
                    <SelectItem value="super_admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-500" />
                        Super Administrador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store">Loja</Label>
                <Select
                  value={formData.storeId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, storeId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma loja (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Store className="w-4 h-4" />
                        Nenhuma loja
                      </div>
                    </SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          {store.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingUser ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum usuário cadastrado</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg ${user.role !== 'user' ? 'bg-primary/10' : 'bg-blue-500/10'} flex items-center justify-center`}>
                        {user.role !== 'user' ? (
                          <Shield className="w-4 h-4 text-primary" />
                        ) : (
                          <User className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{user.name}</h4>
                          <Badge variant={user.role !== 'user' ? 'default' : 'secondary'}>
                            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Operador'}
                          </Badge>
                          {user.active ? (
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
                        <div className="text-sm text-muted-foreground mt-1">
                          CPF: {formatCPF(user.cpf)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Cadastrado em:</span>{' '}
                        {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                      {user.created_by && (
                        <div>
                          <span className="font-medium">Por:</span> {user.created_by}
                        </div>
                      )}
                      {getStoreName(user.store_id) && (
                        <div className="col-span-2">
                          <span className="font-medium">Loja:</span>{' '}
                          <Badge variant="outline" className="ml-1">
                            <Store className="w-3 h-3 mr-1" />
                            {getStoreName(user.store_id)}
                          </Badge>
                        </div>
                      )}
                      {user.last_login && (
                        <div className="col-span-2">
                          <span className="font-medium">Último acesso:</span>{' '}
                          {format(new Date(user.last_login), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(user)}
                    >
                      {user.active ? (
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
                            Tem certeza que deseja excluir o usuário {user.name}?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(user.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
