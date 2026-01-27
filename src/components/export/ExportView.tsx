import { useState } from 'react';
import { Download, FileSpreadsheet, Eye, Store, Droplets, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlateRecord } from '@/types/plate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface ExportViewProps {
  plates: PlateRecord[];
  onFillStep: (step: 'loja' | 'lavaJato') => void;
  onClearPlates: () => void;
}

export function ExportView({ plates, onFillStep, onClearPlates }: ExportViewProps) {
  const [showPreview, setShowPreview] = useState(false);

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

    const lines: string[] = [];
    
    // Loja section
    lines.push('=== LOJA ===');
    lines.push('Placa,Data');
    loja.forEach(p => {
      lines.push(`${formatPlate(p.plate)},${format(p.timestamp, 'dd/MM/yyyy', { locale: ptBR })}`);
    });
    lines.push(`Total Loja: ${loja.length}`);
    lines.push('');
    
    // Lava Jato section
    lines.push('=== LAVA JATO ===');
    lines.push('Placa,Data');
    lavaJato.forEach(p => {
      lines.push(`${formatPlate(p.plate)},${format(p.timestamp, 'dd/MM/yyyy', { locale: ptBR })}`);
    });
    lines.push(`Total Lava Jato: ${lavaJato.length}`);
    lines.push('');
    
    // Both section (if any)
    if (both.length > 0) {
      lines.push('=== LOJA + LAVA JATO ===');
      lines.push('Placa,Data');
      both.forEach(p => {
        lines.push(`${formatPlate(p.plate)},${format(p.timestamp, 'dd/MM/yyyy', { locale: ptBR })}`);
      });
      lines.push(`Total Ambos: ${both.length}`);
      lines.push('');
    }
    
    // Neither section (if any)
    if (neither.length > 0) {
      lines.push('=== SEM CATEGORIA ===');
      lines.push('Placa,Data');
      neither.forEach(p => {
        lines.push(`${formatPlate(p.plate)},${format(p.timestamp, 'dd/MM/yyyy', { locale: ptBR })}`);
      });
      lines.push(`Total Sem Categoria: ${neither.length}`);
      lines.push('');
    }
    
    lines.push('');
    lines.push(`TOTAL GERAL: ${plates.length}`);

    const csvContent = lines.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `placas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success('Arquivo CSV exportado!', {
      description: `${plates.length} placas exportadas`,
    });

    // Clear plates after export
    onClearPlates();
  };

  const handleExportPDF = () => {
    if (plates.length === 0) {
      toast.error('Nenhuma placa para exportar');
      return;
    }

    const { loja, lavaJato, both, neither } = getCategorizedPlates();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO DE PLACAS', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    const addSection = (title: string, items: PlateRecord[], color: [number, number, number]) => {
      if (items.length === 0) return;

      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Section header
      doc.setFillColor(...color);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(title, margin + 4, yPos + 6);
      yPos += 12;

      // Table header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Placa', margin + 4, yPos + 5);
      doc.text('Data', pageWidth - margin - 40, yPos + 5);
      yPos += 10;

      // Items
      doc.setFont('helvetica', 'normal');
      items.forEach((p, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, yPos - 3, pageWidth - 2 * margin, 7, 'F');
        }

        doc.text(formatPlate(p.plate), margin + 4, yPos + 2);
        doc.text(format(p.timestamp, 'dd/MM/yyyy', { locale: ptBR }), pageWidth - margin - 40, yPos + 2);
        yPos += 7;
      });

      // Total
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ${items.length}`, margin + 4, yPos + 5);
      yPos += 15;
    };

    // Add sections with different colors
    addSection('LOJA', loja, [30, 90, 60]);
    addSection('LAVA JATO', lavaJato, [60, 130, 180]);
    addSection('LOJA + LAVA JATO', both, [140, 100, 160]);
    addSection('SEM CATEGORIA', neither, [120, 120, 120]);

    // Summary
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(30, 58, 95);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`TOTAL GERAL: ${plates.length} PLACAS`, pageWidth / 2, yPos + 8, { align: 'center' });

    // Save
    doc.save(`placas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);

    toast.success('Arquivo PDF exportado!', {
      description: `${plates.length} placas exportadas`,
    });

    // Clear plates after export
    onClearPlates();
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
            <span className="flex-1 text-left">Baixar CSV</span>
            <span className="text-xs opacity-70">.csv</span>
          </Button>

          <Button
            className="w-full h-12 rounded-xl justify-start bg-red-600 hover:bg-red-700"
            onClick={handleExportPDF}
            disabled={plates.length === 0}
          >
            <FileText className="w-5 h-5 mr-3" />
            <span className="flex-1 text-left">Baixar PDF</span>
            <span className="text-xs opacity-70">.pdf</span>
          </Button>
        </div>
      </div>

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