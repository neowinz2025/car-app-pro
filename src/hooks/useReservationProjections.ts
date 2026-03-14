import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { parsePDFByGrupo, parseSpreadsheetRowsByDate } from '@/lib/pdfFleetParser';
import { toast } from 'sonner';

export type ImportType = 'reservations' | 'projection' | 'available';

export const RESERVATIONS_DATE_COL = 'Data Ret.';
export const PROJECTION_DATE_COL = 'Data Dev.';

function parseCSVRows(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    return row;
  });
}

function parseXLSXRows(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rows.map((r) => {
    const out: Record<string, string> = {};
    for (const k of Object.keys(r)) out[k] = String(r[k] ?? '');
    return out;
  });
}

export const VEHICLE_CATEGORIES = [
  'AM','AT','B','BS','C','CA','CX','CG',
  'E','EA','G1','G2','I','IE','LX','SG',
  'SM','SP','SU','SV','T','TT','TS','J','VU','VC',
];

export interface ReservationProjection {
  id?: string;
  category: string;
  reservations_count: number;
  no_show_rate: number;
  available_vehicles: number;
  projection: number;
  projection_date: string;
}

export function computeEstimatedUsage(reservations: number, noShowRate: number): number {
  return Math.floor(reservations * (1 - noShowRate / 100));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useReservationProjections() {
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [projections, setProjections] = useState<ReservationProjection[]>(() =>
    VEHICLE_CATEGORIES.map((cat) => ({
      category: cat,
      reservations_count: 0,
      no_show_rate: 0,
      available_vehicles: 0,
      projection: 0,
      projection_date: todayISO(),
    }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (date: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservation_projections')
        .select('*')
        .eq('projection_date', date);

      if (error) throw error;

      setProjections(
        VEHICLE_CATEGORIES.map((cat) => {
          const existing = data?.find((r) => r.category === cat);
          return existing
            ? {
                id: existing.id,
                category: existing.category,
                reservations_count: existing.reservations_count,
                no_show_rate: Number(existing.no_show_rate),
                available_vehicles: existing.available_vehicles ?? 0,
                projection: existing.projection ?? 0,
                projection_date: existing.projection_date ?? date,
              }
            : { category: cat, reservations_count: 0, no_show_rate: 0, available_vehicles: 0, projection: 0, projection_date: date };
        })
      );
    } catch (err) {
      console.error('Error loading reservation projections:', err);
      toast.error('Erro ao carregar projeções');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedDate);
  }, [load, selectedDate]);

  const changeDate = (date: string) => setSelectedDate(date);

  const updateProjection = (
    category: string,
    field: 'reservations_count' | 'no_show_rate' | 'available_vehicles' | 'projection',
    value: number
  ) => {
    setProjections((prev) =>
      prev.map((p) => (p.category === category ? { ...p, [field]: value } : p))
    );
  };

  const setGlobalNoShowRate = (rate: number) => {
    setProjections((prev) => prev.map((p) => ({ ...p, no_show_rate: rate })));
  };

  const applyImportCounts = (
    counts: Record<string, number>,
    type: ImportType,
    accumulate: boolean,
    label: string,
    filteredDate: string | null
  ) => {
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    if (total === 0) {
      if (filteredDate) {
        toast.error(`Nenhum veículo encontrado para a data ${filteredDate.split('-').reverse().join('/')}. Verifique se o arquivo contém dados para essa data.`);
      } else {
        toast.error('Nenhum veículo encontrado no arquivo. Verifique a coluna "Grupo".');
      }
      return;
    }
    setProjections((prev) =>
      prev.map((p) => {
        const val = counts[p.category] ?? 0;
        if (type === 'reservations') return { ...p, reservations_count: accumulate ? p.reservations_count + val : val };
        if (type === 'projection') return { ...p, projection: accumulate ? p.projection + val : val };
        if (type === 'available') return { ...p, available_vehicles: accumulate ? p.available_vehicles + val : val };
        return p;
      })
    );
    const dateLabel = filteredDate
      ? ` (${filteredDate.split('-').reverse().join('/')})`
      : '';
    toast.success(`${label} importado${dateLabel}: ${total} veículos`);
  };

  const importSpreadsheet = (
    data: string | ArrayBuffer,
    isXLSX: boolean,
    type: ImportType,
    accumulate: boolean,
    filterDate: string | null
  ) => {
    const rows = isXLSX
      ? parseXLSXRows(data as ArrayBuffer)
      : parseCSVRows(data as string);

    const dateCol =
      type === 'reservations' ? RESERVATIONS_DATE_COL
      : type === 'projection' ? PROJECTION_DATE_COL
      : null;

    const counts = parseSpreadsheetRowsByDate(rows, dateCol ?? '', filterDate);
    const label =
      type === 'reservations' ? 'Reservas'
      : type === 'projection' ? 'Projeção de Retorno'
      : 'Disponível';

    applyImportCounts(counts, type, accumulate, label, filterDate);
  };

  const importPDF = async (
    buffer: ArrayBuffer,
    fileName: string,
    accumulate: boolean,
    filterDate: string | null
  ) => {
    try {
      const counts = await parsePDFByGrupo(buffer, filterDate);
      applyImportCounts(counts, 'available', accumulate, fileName, filterDate);
    } catch (err) {
      console.error('PDF parse error:', err);
      toast.error(`Erro ao ler PDF: ${fileName}`);
    }
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      const toUpsert = projections.map((p) => ({
        ...(p.id ? { id: p.id } : {}),
        category: p.category,
        reservations_count: p.reservations_count,
        no_show_rate: p.no_show_rate,
        available_vehicles: p.available_vehicles,
        projection: p.projection,
        projection_date: selectedDate,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('reservation_projections')
        .upsert(toUpsert, { onConflict: 'category,projection_date' });

      if (error) throw error;

      toast.success('Projeções salvas com sucesso');
      await load(selectedDate);
    } catch (err) {
      console.error('Error saving projections:', err);
      toast.error('Erro ao salvar projeções');
    } finally {
      setSaving(false);
    }
  };

  const totalReservations = projections.reduce((s, p) => s + p.reservations_count, 0);
  const totalEstimated = projections.reduce(
    (s, p) => s + computeEstimatedUsage(p.reservations_count, p.no_show_rate),
    0
  );
  const avgNoShow =
    projections.filter((p) => p.reservations_count > 0).length > 0
      ? projections
          .filter((p) => p.reservations_count > 0)
          .reduce((s, p) => s + p.no_show_rate, 0) /
        projections.filter((p) => p.reservations_count > 0).length
      : 0;

  return {
    projections,
    loading,
    saving,
    selectedDate,
    changeDate,
    updateProjection,
    setGlobalNoShowRate,
    saveAll,
    importSpreadsheet,
    importPDF,
    totalReservations,
    totalEstimated,
    avgNoShow,
  };
}
