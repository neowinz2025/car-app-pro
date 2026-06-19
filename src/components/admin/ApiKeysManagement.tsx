import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  usage_count: number;
  monthly_limit: number;
  reset_date: string;
  active: boolean;
  priority: number;
  created_at: string;
}

export function ApiKeysManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newLimit, setNewLimit] = useState('2500');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plate_recognizer_api_keys')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast.error('Erro ao carregar chaves API');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async () => {
    if (!newKeyName.trim() || !newApiKey.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const { error } = await supabase
        .from('plate_recognizer_api_keys')
        .insert({
          name: newKeyName,
          api_key: newApiKey,
          monthly_limit: parseInt(newLimit),
          priority: apiKeys.length,
        });

      if (error) throw error;

      toast.success('Chave API adicionada com sucesso');
      setIsDialogOpen(false);
      setNewKeyName('');
      setNewApiKey('');
      setNewLimit('2500');
      loadApiKeys();
    } catch (error) {
      console.error('Error adding API key:', error);
      toast.error('Erro ao adicionar chave API');
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('plate_recognizer_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Chave API removida');
      loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Erro ao remover chave API');
    }
  };

  const handleResetUsage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('plate_recognizer_api_keys')
        .update({
          usage_count: 0,
          reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          active: true,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Contador zerado com sucesso');
      loadApiKeys();
    } catch (error) {
      console.error('Error resetting usage:', error);
      toast.error('Erro ao zerar contador');
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('plate_recognizer_api_keys')
        .update({ active: !currentState })
        .eq('id', id);

      if (error) throw error;

      toast.success(currentState ? 'Chave desativada' : 'Chave ativada');
      loadApiKeys();
    } catch (error) {
      console.error('Error toggling key:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const getUsagePercentage = (usage: number, limit: number) => {
    return (usage / limit) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Chaves API - Plate Recognizer</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as chaves API com rotação automática
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Chave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Chave API</DialogTitle>
              <DialogDescription>
                Adicione uma nova chave do Plate Recognizer para rotação automática
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Nome da Chave</Label>
                <Input
                  id="keyName"
                  placeholder="Ex: Chave Principal"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">Chave API</Label>
                <Input
                  id="apiKey"
                  placeholder="Cole a chave do Plate Recognizer"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Limite Mensal</Label>
                <Input
                  id="limit"
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Limite padrão do Plate Recognizer: 2500 requisições/mês
                </p>
              </div>
              <Button onClick={handleAddKey} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando chaves...
        </div>
      ) : apiKeys.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Nenhuma chave API cadastrada</p>
              <p className="text-sm text-muted-foreground">
                Adicione chaves do Plate Recognizer para habilitar o reconhecimento automático
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((key, index) => {
            const usagePercentage = getUsagePercentage(key.usage_count, key.monthly_limit);
            const isNearLimit = usagePercentage >= 70;
            const isAtLimit = usagePercentage >= 90;

            return (
              <Card key={key.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base">{key.name}</CardTitle>
                        <Badge variant={key.active ? 'default' : 'secondary'}>
                          {key.active ? 'Ativa' : 'Inativa'}
                        </Badge>
                        {index === 0 && key.active && (
                          <Badge variant="outline" className="bg-primary/10">
                            Prioridade 1
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        <Key className="w-3 h-3 inline mr-1" />
                        {maskApiKey(key.api_key)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-muted-foreground">Uso Mensal</span>
                      <span className={isAtLimit ? 'text-red-500 font-semibold' : isNearLimit ? 'text-yellow-600' : ''}>
                        {key.usage_count} / {key.monthly_limit}
                      </span>
                    </div>
                    <Progress
                      value={usagePercentage}
                      className="h-2"
                    />
                    {isAtLimit && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
                        <AlertCircle className="w-3 h-3" />
                        <span>Limite quase atingido - rotação automática ativada</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Resetará em: {new Date(key.reset_date).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(key.id, key.active)}
                      className="flex-1"
                    >
                      {key.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetUsage(key.id)}
                      className="flex-1"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Zerar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a chave "{key.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteKey(key.id)}
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
            );
          })}
        </div>
      )}

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Como funciona a rotação automática:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>O sistema usa a chave com menor prioridade e menor uso</li>
                <li>Quando uma chave atinge 90% do limite, o sistema troca automaticamente</li>
                <li>As chaves são resetadas automaticamente no início de cada mês</li>
                <li>Você pode adicionar quantas chaves precisar para garantir disponibilidade contínua</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
