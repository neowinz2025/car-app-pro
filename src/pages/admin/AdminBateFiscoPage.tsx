import { useState } from 'react';
import { Calendar, Eye, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReports } from '@/hooks/api/useReports';
import { toast } from 'sonner';
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
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminBateFiscoPage() {
  const { reports, isLoading, deleteReport } = useReports();
  const { adminUsername } = useAdminAuth();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!reportToDelete || !adminUsername) return;
    try {
      await deleteReport({ reportId: reportToDelete, adminUsername });
      toast.success('Relatório excluído com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir relatório');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Bate Fisco</CardTitle>
          <CardDescription>
            Resumo geral dos relatórios de contagem física
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
          {isLoading ? (
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatório</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o relatório de bate fisco?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
