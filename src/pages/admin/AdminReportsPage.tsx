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
import { useNavigate } from 'react-router-dom';

export default function AdminReportsPage() {
  const { reports, isLoading, deleteReport } = useReports();
  const { adminUsername } = useAdminAuth();
  const navigate = useNavigate();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const handleDeleteConfigured = async () => {
    if (!reportToDelete) return;
    if (!adminUsername) {
      toast.error('Sessão inválida. Faça login novamente.');
      navigate('/admin/login');
      return;
    }

    try {
      await deleteReport({ reportId: reportToDelete, adminUsername });
      toast.success('Relatório excluído com sucesso');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erro ao excluir relatório');
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados</CardTitle>
          <CardDescription>
            Total de {reports.length} relatórios no banco de dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Resumo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir as placas importadas? Esta ação não excluirá o arquivo caso seja da V2.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfigured}
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
