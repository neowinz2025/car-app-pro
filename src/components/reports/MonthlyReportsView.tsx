import { useState, useEffect } from 'react';
import { Calendar, FileText, Download, Share2, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePhysicalCountReports, PhysicalCountReport } from '@/hooks/usePhysicalCountReports';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateEnhancedPDF } from '@/lib/pdfGenerator';

export function MonthlyReportsView() {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [reports, setReports] = useState<PhysicalCountReport[]>([]);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const { getMonthlyReports, loading } = usePhysicalCountReports();

  useEffect(() => {
    const loadReports = async () => {
      const data = await getMonthlyReports(selectedMonth);
      setReports(data);
    };

    loadReports();
  }, [selectedMonth, getMonthlyReports]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedMonth + '-01');
    const newDate = direction === 'prev'
      ? new Date(currentDate.setMonth(currentDate.getMonth() - 1))
      : new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    setSelectedMonth(format(newDate, 'yyyy-MM'));
  };

  const handleDownloadPDF = (report: PhysicalCountReport) => {
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

  const handleShareLink = (token: string) => {
    const shareUrl = `${window.location.origin}/relatorio/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copiado!', {
      description: 'O link foi copiado para a área de transferência',
    });
  };

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  const getTotalStats = () => {
    return reports.reduce(
      (acc, report) => ({
        total: acc.total + report.total_plates,
        loja: acc.loja + report.loja_count,
        lavaJato: acc.lavaJato + report.lava_jato_count,
        both: acc.both + report.both_count,
      }),
      { total: 0, loja: 0, lavaJato: 0, both: 0 }
    );
  };

  const stats = getTotalStats();
  const monthDisplay = format(new Date(selectedMonth + '-01'), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="flex flex-col h-full px-4 py-4 overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Relatórios Mensais</h2>
          <p className="text-xs text-muted-foreground">Histórico de bate físico</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMonthChange('prev')}
            className="rounded-lg"
          >
            ‹ Anterior
          </Button>

          <h3 className="font-semibold capitalize text-center flex-1">
            {monthDisplay}
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMonthChange('next')}
            className="rounded-lg"
            disabled={selectedMonth === format(new Date(), 'yyyy-MM')}
          >
            Próximo ›
          </Button>
        </div>

        {reports.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-primary">{reports.length}</div>
              <div className="text-xs text-muted-foreground">Relatórios</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total de Placas</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{stats.loja}</div>
              <div className="text-xs text-muted-foreground">Loja</div>
            </div>
            <div className="bg-cyan-500/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-cyan-600">{stats.lavaJato}</div>
              <div className="text-xs text-muted-foreground">Lava-Jato</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando relatórios...
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum relatório encontrado para este mês</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {format(new Date(report.report_date), "dd 'de' MMMM", { locale: ptBR })}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {format(new Date(report.report_date), 'HH:mm', { locale: ptBR })} • {report.created_by}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReportExpansion(report.id)}
                  >
                    {expandedReport === report.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-primary">{report.total_plates}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{report.loja_count}</div>
                    <div className="text-xs text-muted-foreground">Loja</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{report.lava_jato_count}</div>
                    <div className="text-xs text-muted-foreground">Lava-Jato</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{report.both_count}</div>
                    <div className="text-xs text-muted-foreground">Ambos</div>
                  </div>
                </div>

                {expandedReport === report.id && report.notes && (
                  <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs font-semibold mb-1">Observações:</div>
                    <div className="text-xs text-muted-foreground">{report.notes}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => handleDownloadPDF(report)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => handleShareLink(report.share_token)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copiar Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
