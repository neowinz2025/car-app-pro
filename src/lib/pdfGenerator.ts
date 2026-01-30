import { jsPDF } from 'jspdf';
import { PlateRecord } from '@/types/plate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface PDFGeneratorOptions {
  plates: PlateRecord[];
  shareToken?: string;
  createdBy?: string;
}

export function generateEnhancedPDF(options: PDFGeneratorOptions): jsPDF {
  const { plates, shareToken, createdBy = 'Sistema' } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 20;

  const loja = plates.filter(p => p.loja && !p.lavaJato);
  const lavaJato = plates.filter(p => p.lavaJato && !p.loja);
  const both = plates.filter(p => p.loja && p.lavaJato);
  const neither = plates.filter(p => !p.loja && !p.lavaJato);

  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  const addHeader = () => {
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('RELATÓRIO DE BATE FÍSICO', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Contagem Física de Placas - Sistema de Gestão', pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(10);
    const dateStr = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    doc.text(`Gerado em: ${dateStr}`, pageWidth / 2, 38, { align: 'center' });
    doc.text(`Por: ${createdBy}`, pageWidth / 2, 45, { align: 'center' });
  };

  const addInfoBox = () => {
    yPos = 60;

    doc.setFillColor(240, 248, 255);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'F');
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 3, 3, 'S');

    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('O QUE É ESTE RELATÓRIO?', margin + 5, yPos);

    yPos += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const infoText = [
      'Este documento registra a contagem física de todas as placas escaneadas',
      'durante o processo de verificação. Cada placa foi categorizada conforme',
      'sua localização (Loja, Lava-Jato, ou ambos) no momento da contagem.'
    ];

    infoText.forEach(line => {
      doc.text(line, margin + 5, yPos);
      yPos += 5;
    });

    yPos += 8;
  };

  const addLegend = () => {
    doc.setFillColor(255, 250, 240);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 32, 3, 3, 'F');
    doc.setDrawColor(255, 140, 0);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 32, 3, 3, 'S');

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 100, 0);
    doc.text('LEGENDA DAS CATEGORIAS', margin + 5, yPos);

    yPos += 7;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    const legends = [
      { icon: '🏪', text: 'LOJA: Veículo localizado apenas na área da loja' },
      { icon: '💧', text: 'LAVA-JATO: Veículo localizado apenas no lava-jato' },
      { icon: '🔄', text: 'AMBOS: Veículo registrado em ambas as localizações' },
      { icon: '❓', text: 'SEM CATEGORIA: Placa escaneada mas não categorizada' }
    ];

    legends.forEach(legend => {
      doc.text(`${legend.icon}  ${legend.text}`, margin + 8, yPos);
      yPos += 5;
    });

    yPos += 10;
  };

  const addSummaryBox = () => {
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(240, 245, 250);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 65, 3, 3, 'F');
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 65, 3, 3, 'S');

    yPos += 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 95);
    doc.text('RESUMO EXECUTIVO', pageWidth / 2, yPos, { align: 'center' });

    yPos += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const col1X = margin + 20;
    const col2X = pageWidth / 2 + 20;

    doc.text(`🏪  Apenas Loja:`, col1X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${loja.length} placas`, col1X + 50, yPos);

    doc.setFont('helvetica', 'normal');
    doc.text(`💧  Apenas Lava-Jato:`, col2X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${lavaJato.length} placas`, col2X + 50, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`🔄  Em Ambos:`, col1X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${both.length} placas`, col1X + 50, yPos);

    doc.setFont('helvetica', 'normal');
    doc.text(`❓  Sem Categoria:`, col2X, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${neither.length} placas`, col2X + 50, yPos);

    yPos += 14;
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(margin + 30, yPos - 4, pageWidth - 2 * margin - 60, 16, 2, 2, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`📊  TOTAL GERAL: ${plates.length} PLACAS`, pageWidth / 2, yPos + 7, { align: 'center' });

    yPos += 22;
  };

  const addSection = (
    title: string,
    items: PlateRecord[],
    headerColor: [number, number, number],
    icon: string
  ) => {
    if (items.length === 0) return;

    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(...headerColor);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${icon}  ${title}`, margin + 6, yPos + 8);
    doc.text(`Total: ${items.length}`, pageWidth - margin - 6, yPos + 8, { align: 'right' });
    yPos += 18;

    doc.setFillColor(245, 247, 250);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('PLACA', margin + 8, yPos + 7);
    doc.text('DATA', margin + 60, yPos + 7);
    doc.text('HORA', margin + 110, yPos + 7);
    doc.text('REGISTRO', margin + 145, yPos + 7);
    yPos += 12;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    items.forEach((p, index) => {
      if (yPos > pageHeight - 15) {
        doc.addPage();
        yPos = 20;
      }

      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(formatPlate(p.plate), margin + 8, yPos + 2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(format(p.timestamp, 'dd/MM/yyyy', { locale: ptBR }), margin + 60, yPos + 2);
      doc.text(format(p.timestamp, 'HH:mm', { locale: ptBR }), margin + 110, yPos + 2);
      doc.text(`#${index + 1}`, margin + 145, yPos + 2);
      yPos += 8;
    });

    yPos += 10;
  };

  const addShareInfo = () => {
    if (!shareToken) return;

    if (yPos > pageHeight - 35) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(250, 255, 250);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 3, 3, 'F');
    doc.setDrawColor(34, 139, 34);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 3, 3, 'S');

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 139, 34);
    doc.text('🔗  LINK PARA COMPARTILHAMENTO', margin + 5, yPos);

    yPos += 7;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Este relatório pode ser acessado online através do link:', margin + 5, yPos);

    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 255);
    const shareUrl = `${window.location.origin}/relatorio/${shareToken}`;
    doc.textWithLink(shareUrl, margin + 5, yPos, { url: shareUrl });

    yPos += 10;
  };

  const addFooter = () => {
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Sistema de Gestão de Bate Físico', margin, footerY);
    doc.text(
      `Página ${doc.internal.pages.length - 1}`,
      pageWidth - margin,
      footerY,
      { align: 'right' }
    );
    doc.text(
      format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  };

  addHeader();
  addInfoBox();
  addLegend();
  addSummaryBox();

  addSection('PLACAS NA LOJA', loja, [34, 139, 34], '🏪');
  addSection('PLACAS NO LAVA-JATO', lavaJato, [30, 144, 255], '💧');
  addSection('PLACAS EM AMBOS', both, [138, 43, 226], '🔄');
  addSection('PLACAS SEM CATEGORIA', neither, [128, 128, 128], '❓');

  addShareInfo();

  const totalPages = doc.internal.pages.length;
  for (let i = 1; i < totalPages; i++) {
    doc.setPage(i);
    addFooter();
  }

  return doc;
}
