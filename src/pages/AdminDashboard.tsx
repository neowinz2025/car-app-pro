import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, FileText, Database, Trash2, Eye, Calendar, User, ClipboardList, Users } from 'lucide-react';
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
  both_count: number;
  neither_count: number;
  month_year: string;
  notes: string | null;
}

interface PlateRecord {
  id: string;
  plate: string;
  timestamp: string;
  loja: boolean;
  lava_jato: boolean;
  session_id: string | null;
}

interface ShiftHandover {
  id: string;
  shift_type: string;
  shift_date: string;
  registered_at: string;
  registered_by: string | null;
  di_disponivel: number;
  lm_locacao_mensal: number;
  le_locacao_diaria: number;
  fs_fora_servico: number;
  ne_oficina_externa: number;
  fe_funilaria_externa: number;
  tg_triagem_manutencao: number;
  do_retorno_oficina: number;
  carros_abastecidos: number;
  veiculos_lavados: number;
  veiculos_sujos_gaveta: number;
  qnt_cadeirinhas: number;
  qnt_bebe_conforto: number;
  qnt_assentos_elevacao: number;
  reservas_atendidas: number;
  reservas_pendentes: number;
}

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, adminUsername, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [plates, setPlates] = useState<PlateRecord[]>([]);
  const [shifts, setShifts] = useState<ShiftHandover[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingPlates, setLoadingPlates] = useState(true);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [deletePlateDialogOpen, setDeletePlateDialogOpen] = useState(false);
  const [plateToDelete, setPlateToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
      loadPlates();
      loadShifts();
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

  const loadShifts = async () => {
    try {
      const { data, error } = await supabase
        .from('shift_handovers')
        .select('*')
        .order('registered_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setShifts(data || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
      toast.error('Erro ao carregar passagens de turno');
    } finally {
      setLoadingShifts(false);
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

  const handleDeletePlate = async (plateId: string) => {
    try {
      const { error } = await supabase
        .from('plate_records')
        .delete()
        .eq('id', plateId);

      if (error) throw error;

      setPlates(plates.filter(p => p.id !== plateId));
      toast.success('Placa excluída com sucesso');
    } catch (error) {
      console.error('Error deleting plate:', error);
      toast.error('Erro ao excluir placa');
    } finally {
      setDeletePlateDialogOpen(false);
      setPlateToDelete(null);
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
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="reports">
              <FileText className="w-4 h-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="plates">
              <Database className="w-4 h-4 mr-2" />
              Placas
            </TabsTrigger>
            <TabsTrigger value="bate-fisco">
              <ClipboardList className="w-4 h-4 mr-2" />
              Bate Fisco
            </TabsTrigger>
            <TabsTrigger value="shifts">
              <Users className="w-4 h-4 mr-2" />
              Turnos
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
                          <th className="text-center py-3 px-4 font-medium">Ações</th>
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
                            <td className="py-3 px-4 text-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setPlateToDelete(plate.id);
                                  setDeletePlateDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

          <TabsContent value="bate-fisco">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Bate Fisco</CardTitle>
                  <CardDescription>
                    Resumo geral dos relatórios de contagem física
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingReports ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-border rounded-xl bg-accent/30">
                        <div className="text-2xl font-bold text-primary">
                          {reports.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Total de Relatórios</div>
                      </div>
                      <div className="p-4 border border-border rounded-xl bg-accent/30">
                        <div className="text-2xl font-bold text-primary">
                          {reports.reduce((sum, r) => sum + r.total_plates, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total de Placas</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico Detalhado</CardTitle>
                  <CardDescription>
                    {reports.length} relatórios de bate fisco
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingReports ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum relatório de bate fisco encontrado
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="p-5 border border-border rounded-xl hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-primary" />
                                <span className="font-bold text-lg">
                                  {format(new Date(report.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>{report.created_by}</span>
                                <span className="mx-1">•</span>
                                <span>{format(new Date(report.created_at), 'HH:mm', { locale: ptBR })}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`/relatorio/${report.share_token}`, '_blank')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
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

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            <div className="text-center p-3 bg-primary/5 rounded-lg">
                              <div className="text-2xl font-bold text-primary">{report.total_plates}</div>
                              <div className="text-xs text-muted-foreground mt-1">Total</div>
                            </div>
                            <div className="text-center p-3 bg-blue-500/5 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">{report.loja_count}</div>
                              <div className="text-xs text-muted-foreground mt-1">Loja</div>
                            </div>
                            <div className="text-center p-3 bg-cyan-500/5 rounded-lg">
                              <div className="text-2xl font-bold text-cyan-600">{report.lava_jato_count}</div>
                              <div className="text-xs text-muted-foreground mt-1">Lava Jato</div>
                            </div>
                            <div className="text-center p-3 bg-green-500/5 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">{report.both_count}</div>
                              <div className="text-xs text-muted-foreground mt-1">Ambos</div>
                            </div>
                          </div>

                          {report.notes && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <div className="text-xs font-medium text-muted-foreground mb-1">Observações:</div>
                              <div className="text-sm">{report.notes}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="shifts">
            <Card>
              <CardHeader>
                <CardTitle>Passagens de Turno</CardTitle>
                <CardDescription>
                  Histórico completo das passagens de turno ({shifts.length} registros)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingShifts ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : shifts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma passagem de turno encontrada
                  </div>
                ) : (
                  <div className="space-y-6">
                    {shifts.map((shift) => {
                      const totalVeiculos = shift.di_disponivel + shift.lm_locacao_mensal + shift.le_locacao_diaria +
                        shift.fs_fora_servico + shift.ne_oficina_externa + shift.fe_funilaria_externa +
                        shift.tg_triagem_manutencao + shift.do_retorno_oficina;

                      const shiftLabels: { [key: string]: string } = {
                        'manha': 'Manhã',
                        'noite': 'Noite',
                        'madrugada': 'Madrugada'
                      };

                      return (
                        <div
                          key={shift.id}
                          className="p-5 border-2 border-border rounded-xl hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-bold">
                                  {shiftLabels[shift.shift_type] || shift.shift_type}
                                </div>
                                <span className="text-lg font-semibold">
                                  {format(new Date(shift.shift_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="w-3 h-3" />
                                <span>{shift.registered_by || 'Sistema'}</span>
                                <span className="mx-1">•</span>
                                <span>Registrado em {format(new Date(shift.registered_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-primary">{totalVeiculos}</div>
                              <div className="text-xs text-muted-foreground">Total Veículos</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="p-3 bg-green-500/10 rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">DI - Disponível</div>
                              <div className="text-2xl font-bold text-green-600">{shift.di_disponivel}</div>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">LM - Locação Mensal</div>
                              <div className="text-2xl font-bold text-blue-600">{shift.lm_locacao_mensal}</div>
                            </div>
                            <div className="p-3 bg-cyan-500/10 rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">LE - Locação Diária</div>
                              <div className="text-2xl font-bold text-cyan-600">{shift.le_locacao_diaria}</div>
                            </div>
                            <div className="p-3 bg-orange-500/10 rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">FS - Fora de Serviço</div>
                              <div className="text-2xl font-bold text-orange-600">{shift.fs_fora_servico}</div>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">NE - Oficina Externa</div>
                              <div className="text-2xl font-bold text-red-600">{shift.ne_oficina_externa}</div>
                            </div>
                            <div className="p-3 bg-pink-500/10 rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">FE - Funilaria Externa</div>
                              <div className="text-2xl font-bold text-pink-600">{shift.fe_funilaria_externa}</div>
                            </div>
                            <div className="p-3 bg-purple-500/10 rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">TG - Triagem</div>
                              <div className="text-2xl font-bold text-purple-600">{shift.tg_triagem_manutencao}</div>
                            </div>
                            <div className="p-3 bg-teal-500/10 rounded-lg">
                              <div className="text-sm text-muted-foreground mb-1">DO - Retorno Oficina</div>
                              <div className="text-2xl font-bold text-teal-600">{shift.do_retorno_oficina}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-border">
                            <div className="p-2 bg-accent/50 rounded-lg text-center">
                              <div className="text-lg font-bold">{shift.carros_abastecidos}</div>
                              <div className="text-xs text-muted-foreground">Abastecidos</div>
                            </div>
                            <div className="p-2 bg-accent/50 rounded-lg text-center">
                              <div className="text-lg font-bold">{shift.veiculos_lavados}</div>
                              <div className="text-xs text-muted-foreground">Lavados</div>
                            </div>
                            <div className="p-2 bg-accent/50 rounded-lg text-center">
                              <div className="text-lg font-bold">{shift.veiculos_sujos_gaveta}</div>
                              <div className="text-xs text-muted-foreground">Sujos Gaveta</div>
                            </div>
                            <div className="p-2 bg-accent/50 rounded-lg text-center">
                              <div className="text-lg font-bold">{shift.qnt_cadeirinhas}</div>
                              <div className="text-xs text-muted-foreground">Cadeirinhas</div>
                            </div>
                            <div className="p-2 bg-accent/50 rounded-lg text-center">
                              <div className="text-lg font-bold">{shift.qnt_bebe_conforto}</div>
                              <div className="text-xs text-muted-foreground">Bebê Conforto</div>
                            </div>
                            <div className="p-2 bg-accent/50 rounded-lg text-center">
                              <div className="text-lg font-bold">{shift.qnt_assentos_elevacao}</div>
                              <div className="text-xs text-muted-foreground">Assentos Elevação</div>
                            </div>
                            <div className="p-2 bg-primary/10 rounded-lg text-center">
                              <div className="text-lg font-bold text-primary">{shift.reservas_atendidas}</div>
                              <div className="text-xs text-muted-foreground">Reservas Atendidas</div>
                            </div>
                            <div className="p-2 bg-orange-500/10 rounded-lg text-center">
                              <div className="text-lg font-bold text-orange-600">{shift.reservas_pendentes}</div>
                              <div className="text-xs text-muted-foreground">Reservas Pendentes</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

      <AlertDialog open={deletePlateDialogOpen} onOpenChange={setDeletePlateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Placa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta placa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => plateToDelete && handleDeletePlate(plateToDelete)}
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
