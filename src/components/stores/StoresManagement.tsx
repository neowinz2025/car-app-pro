import { useState, useEffect } from 'react';
import { useStores, Store } from '@/hooks/useStores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Store as StoreIcon, Plus, Pencil, Trash2, Upload, X, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function StoresManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [editStoreName, setEditStoreName] = useState('');
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const {
    loading,
    getAllStores,
    createStore,
    updateStore,
    toggleStoreStatus,
    deleteStore,
  } = useStores();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    const data = await getAllStores();
    setStores(data);
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      toast.error('Nome da loja é obrigatório');
      return;
    }

    const success = await createStore(newStoreName, newLogoFile || undefined);
    if (success) {
      setIsCreateDialogOpen(false);
      setNewStoreName('');
      setNewLogoFile(null);
      setLogoPreview(null);
      loadStores();
    }
  };

  const handleEditStore = async () => {
    if (!editingStore) return;

    if (!editStoreName.trim()) {
      toast.error('Nome da loja é obrigatório');
      return;
    }

    const success = await updateStore(
      editingStore.id,
      editStoreName,
      editLogoFile || undefined,
      removeLogo
    );

    if (success) {
      setIsEditDialogOpen(false);
      setEditingStore(null);
      setEditStoreName('');
      setEditLogoFile(null);
      setEditLogoPreview(null);
      setRemoveLogo(false);
      loadStores();
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const success = await toggleStoreStatus(id, !currentStatus);
    if (success) {
      loadStores();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteStore(id);
    if (success) {
      loadStores();
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isEdit) {
        setEditLogoFile(file);
        setRemoveLogo(false);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setNewLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const openEditDialog = (store: Store) => {
    setEditingStore(store);
    setEditStoreName(store.name);
    setEditLogoPreview(store.logo_url || null);
    setEditLogoFile(null);
    setRemoveLogo(false);
    setIsEditDialogOpen(true);
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">Gerenciar Lojas</h2>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Loja
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Loja</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Nome da Loja</Label>
                <Input
                  id="store-name"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Digite o nome da loja"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-logo">Logo da Loja (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="store-logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoChange(e, false)}
                  />
                  {logoPreview && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setLogoPreview(null);
                        setNewLogoFile(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {logoPreview && (
                  <div className="mt-2">
                    <img src={logoPreview} alt="Preview" className="h-20 w-auto rounded border" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateStore} disabled={loading}>
                Criar Loja
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Buscar lojas..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStores.map((store) => (
          <Card key={store.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="h-12 w-12 object-contain rounded" />
                  ) : (
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                      <StoreIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{store.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Switch
                        checked={store.is_active}
                        onCheckedChange={() => handleToggleStatus(store.id, store.is_active)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {store.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(store)}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Editar
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a loja "{store.name}"?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(store.id)}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingStore && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Loja</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-store-name">Nome da Loja</Label>
                <Input
                  id="edit-store-name"
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  placeholder="Digite o nome da loja"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo da Loja</Label>

                {editLogoPreview && !removeLogo && (
                  <div className="flex items-center gap-2">
                    <img src={editLogoPreview} alt="Preview" className="h-20 w-auto rounded border" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRemoveLogo(true);
                        setEditLogoPreview(null);
                        setEditLogoFile(null);
                      }}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                )}

                {(!editLogoPreview || removeLogo) && (
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoChange(e, true)}
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditStore} disabled={loading}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
