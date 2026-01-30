import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, FileText, Database, Trash2, Eye, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Report {
  id: string;
  created_at: string;
  created_by: string;
  share_token: string;
  total_plates: number;
  loja_count: number;
  lava_jato_count: number;
}

interface PlateRecord {
  id: string;
  plate: string;
  timestamp: string;
  loja: boolean;
  lava_jato: boolean;
  session_id: string | null;
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, adminUsername, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [plates, setPlates] = useState<PlateRecord[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingPlates, setLoadingPlates] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
      loadPlates();
    }
  }, [isAuthenticated]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('physical_count_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoadingReports(false);
    }
  };

  const loadPlates = async () => {
    try {
      const { data, error } = await supabase
        .from('plate_records')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;
      setPlates(data || []);
    } catch (error) {
      console.error('Error loading plates:', error);
      toast.error('Erro ao carregar placas');
    } finally {
      setLoadingPlates(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      if (!adminUsername) {
        toast.error('Sessão inválida. Faça login novamente.');
        navigate('/admin/login');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${supabaseUrl}/functions/v1/delete-report`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ reportId, adminUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete report' }));
        throw new Error(errorData.error);
      }

      setReports(reports.filter(r => r.id !== reportId));
      toast.success('Relatório excluído com sucesso');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Erro ao excluir relatório');
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    toast.success('Logout realizado com sucesso');
  };

  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <p className="text-xs text-muted-foreground">Bem-vindo, {adminUsername}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="plates">
              <Database className="w-4 h-4 mr-2" />
              Placas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Gerados</CardTitle>
                <CardDescription>
                  Total de {reports.length} relatórios no banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingReports ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum relatório encontrado
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(report.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{report.created_by}</span>
                            <span className="mx-2">•</span>
                            <span>{report.total_plates} placas</span>
                            <span className="mx-2">•</span>
                            <span>🏪 {report.loja_count}</span>
                            <span className="mx-2">•</span>
                            <span>💧 {report.lava_jato_count}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/relatorio/${report.share_token}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setReportToDelete(report.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plates">
            <Card>
              <CardHeader>
                <CardTitle>Placas Coletadas</CardTitle>
                <CardDescription>
                  Total de {plates.length} placas no banco de dados (últimas 500)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingPlates ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : plates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma placa encontrada
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left py-3 px-4 font-medium">Placa</th>
                          <th className="text-left py-3 px-4 font-medium">Data/Hora</th>
                          <th className="text-center py-3 px-4 font-medium">Loja</th>
                          <th className="text-center py-3 px-4 font-medium">Lava Jato</th>
                          <th className="text-left py-3 px-4 font-medium">Sessão</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plates.map((plate) => (
                          <tr key={plate.id} className="border-b border-border last:border-0">
                            <td className="py-3 px-4 font-mono font-medium">
                              {formatPlate(plate.plate)}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {format(new Date(plate.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {plate.loja ? '✅' : '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {plate.lava_jato ? '✅' : '—'}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                              {plate.session_id ? `${plate.session_id.slice(0, 8)}...` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reportToDelete && handleDeleteReport(reportToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
