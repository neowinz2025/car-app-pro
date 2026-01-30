import * as XLSX from 'xlsx';
import { PlateRecord } from '@/types/plate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ExcelGeneratorOptions {
  plates: PlateRecord[];
  createdBy?: string;
}

export function generateExcelReport(options: ExcelGeneratorOptions): void {
  const { plates, createdBy = 'Sistema' } = options;

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

  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ['RESUMO DO BATE FÍSICO'],
    [],
    ['Data do Relatório:', format(new Date(), 'dd/MM/yyyy', { locale: ptBR })],
    ['Hora:', format(new Date(), 'HH:mm', { locale: ptBR })],
    ['Gerado por:', createdBy],
    [],
    ['TOTALIZADORES'],
    ['Categoria', 'Quantidade'],
    ['🏪 Apenas Loja', loja.length],
    ['💧 Apenas Lava-Jato', lavaJato.length],
    ['🔄 Ambos (Loja + Lava-Jato)', both.length],
    ['❓ Sem Categoria', neither.length],
    [],
    ['TOTAL GERAL', plates.length],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  summarySheet['!cols'] = [
    { wch: 30 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

  const addCategorySheet = (
    sheetName: string,
    items: PlateRecord[],
    categoryLabel: string
  ) => {
    if (items.length === 0) return;

    const sheetData = [
      [categoryLabel],
      [],
      ['PLACA', 'DATA', 'HORA', 'LOCALIZAÇÃO'],
    ];

    items.forEach((plate) => {
      let location = '';
      if (plate.loja && plate.lavaJato) {
        location = 'Loja + Lava-Jato';
      } else if (plate.loja) {
        location = 'Loja';
      } else if (plate.lavaJato) {
        location = 'Lava-Jato';
      } else {
        location = 'Sem Categoria';
      }

      sheetData.push([
        formatPlate(plate.plate),
        format(plate.timestamp, 'dd/MM/yyyy', { locale: ptBR }),
        format(plate.timestamp, 'HH:mm', { locale: ptBR }),
        location
      ]);
    });

    sheetData.push([]);
    sheetData.push(['Total:', items.length]);

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);

    sheet['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  };

  addCategorySheet('Loja', loja, '🏪 PLACAS NA LOJA');
  addCategorySheet('Lava-Jato', lavaJato, '💧 PLACAS NO LAVA-JATO');
  addCategorySheet('Ambos', both, '🔄 PLACAS EM AMBOS');
  addCategorySheet('Sem Categoria', neither, '❓ PLACAS SEM CATEGORIA');

  const allPlatesData = [
    ['TODAS AS PLACAS'],
    [],
    ['PLACA', 'DATA', 'HORA', 'LOCALIZAÇÃO'],
  ];

  plates.forEach((plate) => {
    let location = '';
    if (plate.loja && plate.lavaJato) {
      location = 'Loja + Lava-Jato';
    } else if (plate.loja) {
      location = 'Loja';
    } else if (plate.lavaJato) {
      location = 'Lava-Jato';
    } else {
      location = 'Sem Categoria';
    }

    allPlatesData.push([
      formatPlate(plate.plate),
      format(plate.timestamp, 'dd/MM/yyyy', { locale: ptBR }),
      format(plate.timestamp, 'HH:mm', { locale: ptBR }),
      location
    ]);
  });

  allPlatesData.push([]);
  allPlatesData.push(['Total:', plates.length]);

  const allPlatesSheet = XLSX.utils.aoa_to_sheet(allPlatesData);

  allPlatesSheet['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 }
  ];

  XLSX.utils.book_append_sheet(workbook, allPlatesSheet, 'Todas');

  const fileName = `BATE FÍSICO ${format(new Date(), 'dd-MM-yyyy', { locale: ptBR })}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
