import { useState } from 'react';
import { Download, FileSpreadsheet, Eye, Store, Droplets, Check, FileText, Share2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlateRecord } from '@/types/plate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { generateEnhancedPDF } from '@/lib/pdfGenerator';
import { usePhysicalCountReports } from '@/hooks/usePhysicalCountReports';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExportViewProps {
  plates: PlateRecord[];
  onFillStep: (step: 'loja' | 'lavaJato') => void;
  onClearPlates: () => void;
}

export function ExportView({ plates, onFillStep, onClearPlates }: ExportViewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [createdBy, setCreatedBy] = useState<string>('Sistema');
  const { saveReport } = usePhysicalCountReports();

  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  const getCategorizedPlates = () => {
    return {
      loja: plates.filter(p => p.loja && !p.lavaJato),
      lavaJato: plates.filter(p => p.lavaJato && !p.loja),
      both: plates.filter(p => p.loja && p.lavaJato),
      neither: plates.filter(p => !p.loja && !p.lavaJato),
    };
  };

  const handleExportCSV = () => {
    if (plates.length === 0) {
      toast.error('Nenhuma placa para exportar');
      return;
    }

    const { loja, lavaJato, both, neither } = getCategorizedPlates();
    const dateStr = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });

    const lines: string[] = [];
    
    // Header
    lines.push('════════════════════════════════════════════════════════');
    lines.push('                    RELATÓRIO DE PLACAS                  ');
    lines.push(`                   Gerado em: ${dateStr}                 `);
    lines.push('════════════════════════════════════════════════════════');
    lines.push('');
    
    // Helper function to add section
    const addSection = (title: string, items: typeof plates, emoji: string) => {
      if (items.length === 0) return;
      
      lines.push('');
      lines.push(`┌─────────────────────────────────────────────────────────┐`);
      lines.push(`│  ${emoji} ${title.padEnd(52)}│`);
      lines.push(`├─────────────────────────────────────────────────────────┤`);
      lines.push(`│  PLACA          │  DATA          │  HORA               │`);
      lines.push(`├─────────────────────────────────────────────────────────┤`);
      
      items.forEach(p => {
        const plateFormatted = formatPlate(p.plate).padEnd(14);
        const dateFormatted = format(p.timestamp, 'dd/MM/yyyy', { locale: ptBR }).padEnd(13);
        const timeFormatted = format(p.timestamp, 'HH:mm', { locale: ptBR }).padEnd(18);
        lines.push(`│  ${plateFormatted}│  ${dateFormatted}│  ${timeFormatted}│`);
      });
      
      lines.push(`├─────────────────────────────────────────────────────────┤`);
      lines.push(`│  TOTAL: ${String(items.length).padStart(3)} placas                                     │`);
      lines.push(`└─────────────────────────────────────────────────────────┘`);
    };
    
    // Add sections
    addSection('LOJA', loja, '🏪');
    addSection('LAVA JATO', lavaJato, '💧');
    addSection('LOJA + LAVA JATO', both, '🔄');
    addSection('SEM CATEGORIA', neither, '❓');
    
    // Summary
    lines.push('');
    lines.push('════════════════════════════════════════════════════════');
    lines.push(`                    RESUMO GERAL                         `);
    lines.push('════════════════════════════════════════════════════════');
    lines.push(`  🏪 Loja:            ${String(loja.length).padStart(4)} placas`);
    lines.push(`  💧 Lava Jato:       ${String(lavaJato.length).padStart(4)} placas`);
    lines.push(`  🔄 Ambos:           ${String(both.length).padStart(4)} placas`);
    lines.push(`  ❓ Sem Categoria:   ${String(neither.length).padStart(4)} placas`);
    lines.push('────────────────────────────────────────────────────────');
    lines.push(`  📊 TOTAL GERAL:     ${String(plates.length).padStart(4)} placas`);
    lines.push('════════════════════════════════════════════════════════');

    const csvContent = lines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_placas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Relatório exportado!', {
      description: `${plates.length} placas exportadas`,
    });

    // Clear plates after export
    onClearPlates();
  };

  const handleExportPDF = async () => {
    if (plates.length === 0) {
      toast.error('Nenhuma placa para exportar');
      return;
    }

    try {
      const result = await saveReport(plates, createdBy);

      if (!result.success || !result.shareToken) {
        toast.error('Erro ao salvar relatório no banco de dados');
        return;
      }

      const shareUrl = `${window.location.origin}/relatorio/${result.shareToken}`;
      setShareLink(shareUrl);

      const doc = generateEnhancedPDF({
        plates,
        shareToken: result.shareToken,
        createdBy
      });

      doc.save(`relatorio_bate_fisico_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);

      toast.success('Relatório gerado com sucesso!', {
        description: `${plates.length} placas exportadas e salvas no banco`,
        duration: 5000,
      });

      onClearPlates();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao gerar relatório');
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      toast.success('Link copiado!', {
        description: 'O link foi copiado para a área de transferência',
      });
    }
  };

  return (
    <div className="flex flex-col h-full px-4 py-4 overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Exportar Dados</h2>
          <p className="text-xs text-muted-foreground">{plates.length} placas registradas</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <h3 className="font-semibold mb-3">Ações Rápidas</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Marque todas as placas como passadas em uma etapa
        </p>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl"
            onClick={() => {
              onFillStep('loja');
              toast.success('Todas marcadas como Loja');
            }}
          >
            <Store className="w-4 h-4 mr-2" />
            Preencher Loja
          </Button>
          
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl"
            onClick={() => {
              onFillStep('lavaJato');
              toast.success('Todas marcadas como Lava Jato');
            }}
          >
            <Droplets className="w-4 h-4 mr-2" />
            Preencher Lava Jato
          </Button>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <h3 className="font-semibold mb-3">Informações do Relatório</h3>
        <div className="space-y-2">
          <Label htmlFor="createdBy" className="text-sm">Responsável pela contagem</Label>
          <Input
            id="createdBy"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            placeholder="Digite seu nome"
            className="h-10"
          />
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-card rounded-2xl p-4 border border-border mb-4">
        <h3 className="font-semibold mb-3">Exportar</h3>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl justify-start"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-5 h-5 mr-3" />
            <span className="flex-1 text-left">Prévia dos Dados</span>
          </Button>

          <Button
            className="w-full h-12 rounded-xl justify-start"
            onClick={handleExportCSV}
            disabled={plates.length === 0}
          >
            <FileSpreadsheet className="w-5 h-5 mr-3" />
            <span className="flex-1 text-left">Baixar Relatório TXT</span>
            <span className="text-xs opacity-70">.txt</span>
          </Button>

          <Button
            className="w-full h-12 rounded-xl justify-start bg-red-600 hover:bg-red-700"
            onClick={handleExportPDF}
            disabled={plates.length === 0}
          >
            <FileText className="w-5 h-5 mr-3" />
            <span className="flex-1 text-left">Gerar PDF Completo</span>
            <span className="text-xs opacity-70">.pdf</span>
          </Button>
        </div>
      </div>

      {/* Share Link */}
      {shareLink && (
        <div className="bg-green-50 dark:bg-green-950 rounded-2xl p-4 border border-green-200 dark:border-green-800 mb-4 animate-scale-in">
          <div className="flex items-start gap-3 mb-3">
            <Share2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                Link para Compartilhamento
              </h3>
              <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                Compartilhe este link para que outras pessoas possam visualizar o relatório online
              </p>
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="h-9 text-sm bg-white dark:bg-gray-900"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyShareLink}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {showPreview && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden animate-scale-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Placa</th>
                  <th className="text-left py-3 px-4 font-medium">Data</th>
                  <th className="text-center py-3 px-2 font-medium">
                    <Store className="w-4 h-4 inline" />
                  </th>
                  <th className="text-center py-3 px-2 font-medium">
                    <Droplets className="w-4 h-4 inline" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {plates.slice(0, 10).map((plate) => (
                  <tr key={plate.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 font-mono font-medium">
                      {formatPlate(plate.plate)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {format(plate.timestamp, 'dd/MM HH:mm')}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {plate.loja && (
                        <Check className="w-4 h-4 text-primary inline" />
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {plate.lavaJato && (
                        <Check className="w-4 h-4 text-success inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {plates.length > 10 && (
            <div className="py-2 px-4 text-center text-xs text-muted-foreground bg-muted/30">
              Mostrando 10 de {plates.length} placas
            </div>
          )}
        </div>
      )}
    </div>
  );
}