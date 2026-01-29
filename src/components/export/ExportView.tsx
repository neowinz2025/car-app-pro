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

  const handleExportPDF = () => {
    if (plates.length === 0) {
      toast.error('Nenhuma placa para exportar');
      return;
    }

    const { loja, lavaJato, both, neither } = getCategorizedPlates();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Title Background
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('RELATÓRIO DE PLACAS', pageWidth / 2, 18, { align: 'center' });

    // Date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pageWidth / 2, 28, { align: 'center' });
    yPos = 45;

    const addSection = (title: string, items: PlateRecord[], headerColor: [number, number, number], icon: string) => {
      if (items.length === 0) return;

      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      // Section header with rounded style
      doc.setFillColor(...headerColor);
      doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${icon}  ${title}`, margin + 6, yPos + 8);
      doc.text(`${items.length} placas`, pageWidth - margin - 6, yPos + 8, { align: 'right' });
      yPos += 18;

      // Table header
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('PLACA', margin + 8, yPos + 7);
      doc.text('DATA', margin + 60, yPos + 7);
      doc.text('HORA', margin + 110, yPos + 7);
      yPos += 12;

      // Items in grid
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 40, 40);
      
      items.forEach((p, index) => {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }

        // Alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 253);
          doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(formatPlate(p.plate), margin + 8, yPos + 2);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(format(p.timestamp, 'dd/MM/yyyy', { locale: ptBR }), margin + 60, yPos + 2);
        doc.text(format(p.timestamp, 'HH:mm', { locale: ptBR }), margin + 110, yPos + 2);
        yPos += 8;
      });

      // Section divider
      yPos += 8;
    };

    // Add sections with different colors and icons
    addSection('LOJA', loja, [34, 139, 34], '🏪');
    addSection('LAVA JATO', lavaJato, [30, 144, 255], '💧');
    addSection('LOJA + LAVA JATO', both, [138, 43, 226], '🔄');
    addSection('SEM CATEGORIA', neither, [128, 128, 128], '❓');

    // Summary section
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    
    // Summary box
    doc.setFillColor(240, 245, 250);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 55, 3, 3, 'F');
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 55, 3, 3, 'S');
    
    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('RESUMO GERAL', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    const col1X = margin + 15;
    const col2X = pageWidth / 2 + 10;
    
    doc.text(`🏪  Loja: ${loja.length} placas`, col1X, yPos);
    doc.text(`💧  Lava Jato: ${lavaJato.length} placas`, col2X, yPos);
    yPos += 8;
    doc.text(`🔄  Ambos: ${both.length} placas`, col1X, yPos);
    doc.text(`❓  Sem Categoria: ${neither.length} placas`, col2X, yPos);
    yPos += 12;
    
    // Total highlight
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(margin + 40, yPos - 2, pageWidth - 2 * margin - 80, 14, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`📊  TOTAL GERAL: ${plates.length} PLACAS`, pageWidth / 2, yPos + 8, { align: 'center' });

    // Save
    doc.save(`relatorio_placas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);

    toast.success('PDF exportado!', {
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
            <span className="flex-1 text-left">Baixar Relatório TXT</span>
            <span className="text-xs opacity-70">.txt</span>
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