import * as XLSX from 'xlsx';
import { PlateRecord } from '@/types/plate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ExcelGeneratorOptions {
  plates: PlateRecord[];
  createdBy?: string;
  reportDate?: Date;
}

export function generateExcelReport(options: ExcelGeneratorOptions): void {
  const { plates, reportDate } = options;

  const loja = plates.filter(p => p.loja && !p.lavaJato).map(p => p.plate.toUpperCase());
  const lavaJato = plates.filter(p => p.lavaJato && !p.loja).map(p => p.plate.toUpperCase());
  const both = plates.filter(p => p.loja && p.lavaJato).map(p => p.plate.toUpperCase());

  const workbook = XLSX.utils.book_new();

  const sheetData: any[][] = [];

  const dateToUse = reportDate || new Date();
  sheetData.push(['BATE FISICO', '']);
  sheetData.push([format(dateToUse, 'dd/MM/yyyy', { locale: ptBR }), '']);
  sheetData.push(['LAVA', 'LOJA']);

  const maxRows = Math.max(lavaJato.length + both.length, loja.length + both.length);

  const lavaList = [...lavaJato, ...both];
  const lojaList = [...loja, ...both];

  for (let i = 0; i < maxRows; i++) {
    const lavaPlate = lavaList[i] || '';
    const lojaPlate = lojaList[i] || '';
    sheetData.push([lavaPlate, lojaPlate]);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 15 }
  ];

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }
  ];

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' };
      }

      const cell = worksheet[cellAddress];

      if (R === 0) {
        cell.s = {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: 'B3D9FF' } },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      } else if (R === 1) {
        cell.s = {
          font: { bold: true, sz: 12 },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: 'B3D9FF' } },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      } else if (R === 2) {
        if (C === 0) {
          cell.s = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'FFFF00' } },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        } else if (C === 1) {
          cell.s = {
            font: { bold: true, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: '92D050' } },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        }
      } else if (R > 2) {
        if (C === 0) {
          cell.s = {
            font: { bold: true, sz: 10 },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: 'FFFF00' } },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        } else if (C === 1) {
          cell.s = {
            font: { bold: true, sz: 10 },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: '92D050' } },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'BATE FISICO');

  const fileName = `BATE FISICO ${format(dateToUse, 'dd-MM-yyyy', { locale: ptBR })}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
