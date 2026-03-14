import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import {
  parsePDFByGrupoAllDates,
  parseSpreadsheetRowsByAllDates,
} from '@/lib/pdfFleetParser';
import { toast } from 'sonner';

export type FileType = 'reservations' | 'projection' | 'di' | 'lv' | 'no' | 'cq';

export interface UploadedFile {
  id: string;
  upload_date: string;
  file_type: FileType;
  file_name: string;
  uploaded_at: string;
  row_count: number;
}

const DATE_COL: Record<FileType, string[]> = {
  reservations: ['Data Ret.', 'Data Ret'],
  projection: ['Data Dev.', 'Data Dev'],
  di: ['Data Ret', 'Data Ret.'],
  lv: ['Data Ret', 'Data Ret.'],
  no: ['Data Ret', 'Data Ret.'],
  cq: ['Data Ret', 'Data Ret.'],
};

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSVRows(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const cols = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cols[i] ?? '').trim(); });
    return row;
  });
}

function formatExcelDate(val: unknown): string {
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return String(val ?? '');
}

function parseXLSXRows(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rows.map((r) => {
    const out: Record<string, string> = {};
    for (const k of Object.keys(r)) {
      const v = r[k];
      out[k.trim()] = v instanceof Date ? formatExcelDate(v) : String(v ?? '').trim();
    }
    return out;
  });
}

function detectDateColumn(rows: Record<string, string>[], candidates: string[]): string {
  if (rows.length === 0) return candidates[0] ?? '';
  const firstRow = rows[0];
  for (const col of candidates) {
    if (col in firstRow) return col;
  }
  return candidates[0] ?? '';
}

async function extractCountsByAllDates(
  data: string | ArrayBuffer,
  isPDF: boolean,
  isXLSX: boolean,
  fileType: FileType,
): Promise<Record<string, Record<string, number>>> {
  if (isPDF) {
    return parsePDFByGrupoAllDates(data as ArrayBuffer);
  }
  const rows = isXLSX
    ? parseXLSXRows(data as ArrayBuffer)
    : parseCSVRows(data as string);
  const dateCandidates = DATE_COL[fileType];
  const dateCol = detectDateColumn(rows, dateCandidates);
  return parseSpreadsheetRowsByAllDates(rows, dateCol);
}

export function useFileUploads() {
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const loadUploads = useCallback(async (date: string) => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('daily_file_uploads' as never)
        .select('*')
        .eq('upload_date', date)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      setUploads((data as UploadedFile[]) ?? []);
    } catch (err) {
      console.error('Error loading uploads:', err);
      toast.error('Erro ao carregar arquivos enviados');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      fileType: FileType,
      uploadDate: string
    ): Promise<boolean> => {
      setUploading(true);
      try {
        const isPDF = file.name.toLowerCase().endsWith('.pdf');
        const isXLSX =
          file.name.toLowerCase().endsWith('.xlsx') ||
          file.name.toLowerCase().endsWith('.xls');

        const data = await new Promise<string | ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string | ArrayBuffer);
          reader.onerror = reject;
          if (isPDF || isXLSX) {
            reader.readAsArrayBuffer(file);
          } else {
            reader.readAsText(file, 'UTF-8');
          }
        });

        const byDate = await extractCountsByAllDates(data, isPDF, isXLSX, fileType);

        const dates = Object.keys(byDate).filter((d) => d !== 'sem-data');

        if (dates.length === 0) {
          const semDataCounts = byDate['sem-data'];
          if (!semDataCounts || Object.values(semDataCounts).reduce((s, v) => s + v, 0) === 0) {
            toast.error(
              `Nenhum veículo encontrado em "${file.name}". Verifique se o arquivo está no formato correto.`
            );
            return false;
          }
          const totalCount = Object.values(semDataCounts).reduce((s, v) => s + v, 0);
          const { data: uploadRow, error: uploadError } = await supabase
            .from('daily_file_uploads' as never)
            .insert({
              upload_date: uploadDate,
              file_type: fileType,
              file_name: file.name,
              row_count: totalCount,
            } as never)
            .select()
            .single();
          if (uploadError) throw uploadError;
          const uploadId = (uploadRow as { id: string }).id;
          const rowsToInsert = Object.entries(semDataCounts).map(([category, count]) => ({
            upload_id: uploadId,
            upload_date: uploadDate,
            file_type: fileType,
            category,
            count,
          }));
          if (rowsToInsert.length > 0) {
            const { error: rowsError } = await supabase
              .from('daily_file_rows' as never)
              .insert(rowsToInsert as never);
            if (rowsError) throw rowsError;
          }
          toast.success(`"${file.name}" importado: ${totalCount} veículos (sem data definida → ${uploadDate.split('-').reverse().join('/')})`);
          await loadUploads(uploadDate);
          return true;
        }

        const uploadRows = dates.map((date) => ({
          upload_date: date,
          file_type: fileType,
          file_name: file.name,
          row_count: Object.values(byDate[date]).reduce((s, v) => s + v, 0),
        }));

        const { data: insertedUploads, error: uploadsError } = await supabase
          .from('daily_file_uploads' as never)
          .insert(uploadRows as never)
          .select('id, upload_date');
        if (uploadsError) throw uploadsError;

        const uploadIdByDate: Record<string, string> = {};
        for (const u of (insertedUploads as { id: string; upload_date: string }[]) ?? []) {
          uploadIdByDate[u.upload_date] = u.id;
        }

        const allFileRows: { upload_id: string; upload_date: string; file_type: string; category: string; count: number }[] = [];
        let totalVehicles = 0;
        for (const date of dates) {
          const counts = byDate[date];
          const uploadId = uploadIdByDate[date];
          if (!uploadId) continue;
          for (const [category, count] of Object.entries(counts)) {
            allFileRows.push({ upload_id: uploadId, upload_date: date, file_type: fileType, category, count });
            totalVehicles += count;
          }
        }

        const CHUNK = 500;
        for (let i = 0; i < allFileRows.length; i += CHUNK) {
          const chunk = allFileRows.slice(i, i + CHUNK);
          const { error: rowsError } = await supabase
            .from('daily_file_rows' as never)
            .insert(chunk as never);
          if (rowsError) throw rowsError;
        }

        toast.success(
          `"${file.name}" importado: ${totalVehicles} veículos em ${dates.length} data${dates.length !== 1 ? 's' : ''}`
        );
        await loadUploads(uploadDate);
        return true;
      } catch (err) {
        console.error('Error uploading file:', err);
        toast.error(`Erro ao importar "${file.name}"`);
        return false;
      } finally {
        setUploading(false);
      }
    },
    [loadUploads]
  );

  const deleteUpload = useCallback(
    async (uploadId: string, uploadDate: string) => {
      try {
        const { error } = await supabase
          .from('daily_file_uploads' as never)
          .delete()
          .eq('id', uploadId);
        if (error) throw error;
        toast.success('Arquivo removido');
        await loadUploads(uploadDate);
      } catch (err) {
        console.error('Error deleting upload:', err);
        toast.error('Erro ao remover arquivo');
      }
    },
    [loadUploads]
  );

  const getCountsForDate = useCallback(
    async (date: string, fileType: FileType): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from('daily_file_rows' as never)
        .select('category, count')
        .eq('upload_date', date)
        .eq('file_type', fileType);

      if (error) {
        console.error('Error fetching counts:', error);
        return {};
      }

      const totals: Record<string, number> = {};
      for (const row of (data as { category: string; count: number }[]) ?? []) {
        totals[row.category] = (totals[row.category] ?? 0) + row.count;
      }
      return totals;
    },
    []
  );

  return {
    uploads,
    uploading,
    loadingList,
    loadUploads,
    uploadFile,
    deleteUpload,
    getCountsForDate,
  };
}
