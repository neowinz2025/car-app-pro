import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Download, Calendar, User, Store, Droplets, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePhysicalCountReports, PhysicalCountReport } from '@/hooks/usePhysicalCountReports';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateEnhancedPDF } from '@/lib/pdfGenerator';
import { PlateRecord } from '@/types/plate';

export function SharedReportView() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<PhysicalCountReport | null>(null);
  const { getReportByToken, loading } = usePhysicalCountReports();

  useEffect(() => {
    const loadReport = async () => {
      if (!token) return;

      const data = await getReportByToken(token);
      if (data) {
        setReport(data);
      } else {
        toast.error('Relatório não encontrado');
      }
    };

    if (token) {
      loadReport();
    }
  }, [token, getReportByToken]);

  const handleDownloadPDF = () => {
    if (!report) return;

    try {
      const doc = generateEnhancedPDF({
        plates: report.plates_data,
        shareToken: report.share_token,
        createdBy: report.created_by
      });

      doc.save(`relatorio_${format(new Date(report.report_date), 'yyyy-MM-dd_HH-mm')}.pdf`);

      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erro ao baixar PDF');
    }
  };

  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  const getCategorizedPlates = () => {
    if (!report) return { loja: [], lavaJato: [], both: [], neither: [] };

    const plates = report.plates_data;
    return {
      loja: plates.filter(p => p.loja && !p.lavaJato),
      lavaJato: plates.filter(p => p.lavaJato && !p.loja),
      both: plates.filter(p => p.loja && p.lavaJato),
      neither: plates.filter(p => !p.loja && !p.lavaJato),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-bold mb-2">Relatório não encontrado</h2>
              <p className="text-muted-foreground">
                O relatório que você está tentando acessar não existe ou foi removido.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categorized = getCategorizedPlates();

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl mb-2">
                  <FileText className="w-6 h-6" />
                  Relatório de Bate Físico
                </CardTitle>
                <CardDescription>
                  Documento oficial de contagem física de placas
                </CardDescription>
              </div>
              <Button onClick={handleDownloadPDF} className="shrink-0">
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Data e Hora</div>
                  <div className="font-semibold">
                    {format(new Date(report.report_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Responsável</div>
                  <div className="font-semibold">{report.created_by}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-center">Resumo Executivo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{report.total_plates}</div>
                  <div className="text-xs text-muted-foreground">Total de Placas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{report.loja_count}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Store className="w-3 h-3" /> Loja
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{report.lava_jato_count}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3" /> Lava-Jato
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{report.both_count}</div>
                  <div className="text-xs text-muted-foreground">Ambos</div>
                </div>
              </div>
            </div>

            {report.notes && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 text-sm">
                  Observações
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{report.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {[
          { title: '🏪 Placas na Loja', data: categorized.loja, color: 'green' },
          { title: '💧 Placas no Lava-Jato', data: categorized.lavaJato, color: 'blue' },
          { title: '🔄 Placas em Ambos', data: categorized.both, color: 'purple' },
          { title: '❓ Placas Sem Categoria', data: categorized.neither, color: 'gray' }
        ].map(({ title, data, color }) => {
          if (data.length === 0) return null;

          return (
            <Card key={title} className="mb-4">
              <CardHeader className={`bg-${color}-50 dark:bg-${color}-950`}>
                <CardTitle className="text-lg flex items-center justify-between">
                  {title}
                  <span className="text-sm font-normal text-muted-foreground">
                    {data.length} {data.length === 1 ? 'placa' : 'placas'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {data.map((plate, index) => (
                    <div
                      key={plate.id}
                      className="p-3 bg-muted/50 rounded-lg text-center"
                    >
                      <div className="font-mono font-bold text-lg mb-1">
                        {formatPlate(plate.plate)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(plate.timestamp), 'dd/MM HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Este é um documento compartilhado do Sistema de Gestão de Bate Físico</p>
          <p className="mt-1">Gerado automaticamente em {format(new Date(report.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
      </div>
    </div>
  );
}
