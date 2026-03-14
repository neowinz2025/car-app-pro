import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CsvImportType = 'reservations' | 'projection' | 'available';

function parseCSVRows(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

function parseXLSXRows(buffer: ArrayBuffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rows.map((r) => {
    const out: Record<string, string> = {};
    for (const k of Object.keys(r)) {
      out[k] = String(r[k] ?? '');
    }
    return out;
  });
}

function countByGrupo(rows: Record<string, string>[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const grupo = (row['Grupo'] ?? '').trim();
    if (grupo) {
      counts[grupo] = (counts[grupo] ?? 0) + 1;
    }
  }
  return counts;
}

export function parseReservationsCSV(text: string): Record<string, number> {
  return countByGrupo(parseCSVRows(text));
}

export function parseVehicleGroupCSV(text: string): Record<string, number> {
  return countByGrupo(parseCSVRows(text));
}

export function parseXLSXByGrupo(buffer: ArrayBuffer): Record<string, number> {
  return countByGrupo(parseXLSXRows(buffer));
}

export const VEHICLE_CATEGORIES = [
  'AM', 'AT', 'B', 'BS', 'C', 'CA', 'CX', 'CG',
  'E', 'EA', 'G1', 'G2', 'I', 'IE', 'LX', 'SG',
  'SM', 'SP', 'SU', 'SV', 'T', 'TT', 'TS', 'J', 'VU', 'VC',
];

export interface ReservationProjection {
  id?: string;
  category: string;
  reservations_count: number;
  no_show_rate: number;
  available_vehicles: number;
  projection: number;
}

export function computeEstimatedUsage(reservations: number, noShowRate: number): number {
  return Math.floor(reservations * (1 - noShowRate / 100));
}

export function useReservationProjections() {
  const [projections, setProjections] = useState<ReservationProjection[]>(() =>
    VEHICLE_CATEGORIES.map((cat) => ({
      category: cat,
      reservations_count: 0,
      no_show_rate: 0,
      available_vehicles: 0,
      projection: 0,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservation_projections')
        .select('*');

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
              }
            : { category: cat, reservations_count: 0, no_show_rate: 0, available_vehicles: 0, projection: 0 };
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
    load();
  }, [load]);

  const updateProjection = (category: string, field: 'reservations_count' | 'no_show_rate' | 'available_vehicles' | 'projection', value: number) => {
    setProjections((prev) =>
      prev.map((p) => (p.category === category ? { ...p, [field]: value } : p))
    );
  };

  const applyImport = (counts: Record<string, number>, type: CsvImportType) => {
    const total = Object.values(counts).reduce((s, v) => s + v, 0);
    if (total === 0) {
      toast.error('Nenhum dado encontrado no arquivo. Verifique se o formato está correto.');
      return;
    }
    setProjections((prev) =>
      prev.map((p) => {
        const val = counts[p.category] ?? 0;
        if (type === 'reservations') return { ...p, reservations_count: val };
        if (type === 'projection') return { ...p, projection: val };
        if (type === 'available') return { ...p, available_vehicles: p.available_vehicles + val };
        return p;
      })
    );
    const label = type === 'reservations' ? 'Reservas' : type === 'projection' ? 'Projeção de Retorno' : 'Veículos Disponíveis';
    toast.success(`${label} importado com sucesso (${total} registros)`);
  };

  const importFromCSV = (csvText: string, type: CsvImportType) => {
    const counts = type === 'reservations' ? parseReservationsCSV(csvText) : parseVehicleGroupCSV(csvText);
    applyImport(counts, type);
  };

  const importFromXLSX = (buffer: ArrayBuffer, type: CsvImportType) => {
    const counts = parseXLSXByGrupo(buffer);
    applyImport(counts, type);
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
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('reservation_projections')
        .upsert(toUpsert, { onConflict: 'category' });

      if (error) throw error;

      toast.success('Projeções salvas com sucesso');
      await load();
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
    updateProjection,
    saveAll,
    importFromCSV,
    importFromXLSX,
    totalReservations,
    totalEstimated,
    avgNoShow,
  };
}
