import jsPDF from 'jspdf';

interface DamagePhoto {
  photo_url: string;
  photo_order: number;
}

interface DamageReportData {
  plate: string;
  created_by: string;
  created_at: string;
  notes: string;
  photos: DamagePhoto[];
}

export async function generateDamagePDF(data: DamageReportData): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RELATÓRIO DE AVARIA', pageWidth / 2, 20, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100);
  pdf.text(new Date(data.created_at).toLocaleString('pt-BR'), pageWidth / 2, 27, { align: 'center' });

  pdf.setDrawColor(200);
  pdf.line(margin, 30, pageWidth - margin, 30);

  let yPosition = 40;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0);
  pdf.text('DADOS DO VEÍCULO', margin, yPosition);
  yPosition += 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Placa: ${data.plate}`, margin + 5, yPosition);
  yPosition += 6;
  pdf.text(`Registrado por: ${data.created_by}`, margin + 5, yPosition);
  yPosition += 6;
  pdf.text(`Data/Hora: ${new Date(data.created_at).toLocaleString('pt-BR')}`, margin + 5, yPosition);
  yPosition += 10;

  if (data.notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('OBSERVAÇÕES', margin, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'normal');
    const notesLines = pdf.splitTextToSize(data.notes, contentWidth - 10);
    pdf.text(notesLines, margin + 5, yPosition);
    yPosition += (notesLines.length * 5) + 8;
  }

  if (data.photos.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('FOTOS DAS AVARIAS', margin, yPosition);
    yPosition += 8;

    const photoWidth = (contentWidth - 10) / 2;
    const photoHeight = photoWidth * 0.75;
    let column = 0;

    for (let i = 0; i < data.photos.length; i++) {
      const photo = data.photos[i];

      if (yPosition + photoHeight + 20 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      try {
        const xPosition = margin + (column * (photoWidth + 5));

        const imgData = await loadImageAsDataURL(photo.photo_url);

        pdf.addImage(imgData, 'JPEG', xPosition, yPosition, photoWidth, photoHeight);

        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(`Foto ${i + 1}`, xPosition + photoWidth / 2, yPosition + photoHeight + 4, { align: 'center' });

        column++;
        if (column >= 2) {
          column = 0;
          yPosition += photoHeight + 10;
        }
      } catch (error) {
        console.error(`Error loading photo ${i + 1}:`, error);
      }
    }

    if (column !== 0) {
      yPosition += photoHeight + 10;
    }
  }

  pdf.setFontSize(8);
  pdf.setTextColor(150);
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return pdf.output('blob');
}

async function loadImageAsDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataURL);
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };

    img.src = url;
  });
}
