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
  storeName?: string;
  storeAddress?: string;
  storeLogo?: string;
  reportNumber?: string;
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

  let yPosition = 0;

  // Header Banner Background (Red-ish to indicate Damage)
  pdf.setFillColor(239, 68, 68); // Tailwind red-500
  pdf.rect(0, 0, pageWidth, 40, 'F');

  yPosition = 15;

  // Title inside banner
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255); // White text
  pdf.text('LAUDO DE AVARIA VEICULAR', margin, yPosition + 8);

  // Logo over banner
  if (data.storeLogo) {
    try {
      const logoData = await loadImageAsDataURL(data.storeLogo);
      const logoHeight = 15;
      const logoWidth = 30;
      pdf.addImage(logoData, 'PNG', pageWidth - margin - logoWidth, yPosition - 2, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error loading store logo:', error);
      if (data.storeName) {
        pdf.setFontSize(12);
        pdf.text(data.storeName.toUpperCase(), pageWidth - margin, yPosition + 8, { align: 'right' });
      }
    }
  } else if (data.storeName) {
    pdf.setFontSize(12);
    pdf.text(data.storeName.toUpperCase(), pageWidth - margin, yPosition + 8, { align: 'right' });
  }

  yPosition = 50;

  // Helper method to draw a beautiful section box
  const drawSection = (title: string, yStart: number) => {
    pdf.setFillColor(243, 244, 246); // gray-100 background
    pdf.setDrawColor(209, 213, 219); // gray-300 border
    pdf.roundedRect(margin, yStart, contentWidth, 8, 2, 2, 'FD');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55); // gray-800
    pdf.text(title.toUpperCase(), margin + 5, yStart + 5.5);
    return yStart + 14;
  };

  // Section 1: Vehicle Info
  yPosition = drawSection('Dados do Veículo e Registro', yPosition);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(107, 114, 128); // gray-500
  pdf.text('PLACA REGISTRADA', margin + 5, yPosition);
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(17, 24, 39); // gray-900
  pdf.text(data.plate, margin + 5, yPosition + 7);

  // Divide into two columns for the metadata
  const midPoint = pageWidth / 2;
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('DATA E HORA DO REGISTRO', midPoint, yPosition);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text(new Date(data.created_at).toLocaleString('pt-BR'), midPoint, yPosition + 5);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text('REGISTRADO POR', midPoint, yPosition + 12);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(31, 41, 55);
  pdf.text(data.created_by, midPoint, yPosition + 17);

  if (data.storeName) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    pdf.text('FILIAL / LOJA ORIGEM', margin + 5, yPosition + 12);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text(data.storeName, margin + 5, yPosition + 17);
  }

  yPosition += 30;

  // Section 3: Notes
  if (data.notes) {
    yPosition = drawSection('Descrição e Notas da Avaria', yPosition);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99); // gray-600
    const notesLines = pdf.splitTextToSize(data.notes, contentWidth - 10);
    pdf.text(notesLines, margin + 5, yPosition);
    yPosition += (notesLines.length * 5) + 12;
  }

  // Section 4: Validation (Photos)
  if (data.photos.length > 0) {
    yPosition = drawSection(`Evidências Fotográficas (${data.photos.length} Fotos)`, yPosition);
    
    const photoWidth = (contentWidth - 10) / 2;
    const photoHeight = photoWidth * 0.75;
    let column = 0;

    for (let i = 0; i < data.photos.length; i++) {
      const photo = data.photos[i];

      if (yPosition + photoHeight + 15 > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin + 10;
      }

      try {
        const xPosition = margin + (column * (photoWidth + 5));
        const imgData = await loadImageAsDataURL(photo.photo_url);

        // Draw shadow/border
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.5);
        pdf.rect(xPosition - 1, yPosition - 1, photoWidth + 2, photoHeight + 2);
        
        pdf.addImage(imgData, 'JPEG', xPosition, yPosition, photoWidth, photoHeight);

        // Subtitle
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(75, 85, 99);
        const subtext = `Evidência ${i + 1}`;
        pdf.text(subtext, xPosition + photoWidth / 2, yPosition + photoHeight + 6, { align: 'center' });

        column++;
        if (column >= 2) {
          column = 0;
          yPosition += photoHeight + 14;
        }
      } catch (error) {
        console.error(`Error loading photo ${i + 1}:`, error);
      }
    }

    if (column !== 0) {
      yPosition += photoHeight + 14;
    }
  }

  // Footer for all pages
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(156, 163, 175); // gray-400
    
    // Left footer
    if (data.reportNumber) {
      pdf.text(`Documento Nº ${data.reportNumber}`, margin, pageHeight - 8);
    } else {
      pdf.text(`Batycar Sistema • Gerado em ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 8);
    }
    
    // Middle footer
    pdf.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
     
    // Right footer
    pdf.text('Documento Interno', pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  return pdf.output('blob');
}

async function loadImageAsDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/jpeg', 0.9);
          URL.revokeObjectURL(objectUrl);
          resolve(dataURL);
        };

        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Failed to load image: ${url}`));
        };

        img.src = objectUrl;
      })
      .catch(error => {
        reject(error);
      });
  });
}
