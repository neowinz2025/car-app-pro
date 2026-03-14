import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ImportType = 'reservations' | 'projection' | 'available';

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

function emptyProjections(date: string): ReservationProjection[] {
  return VEHICLE_CATEGORIES.map((cat) => ({
    category: cat,
    reservations_count: 0,
    no_show_rate: 0,
    available_vehicles: 0,
    projection: 0,
    projection_date: date,
  }));
}

const GLOBAL_NOSHOW_KEY = 'global_no_show_rate';

async function fetchRowCountsByType(
  date: string,
  fileType: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('daily_file_rows' as never)
    .select('category, count')
    .eq('upload_date', date)
    .eq('file_type', fileType);

  if (error) {
    console.error('Error fetching file rows:', error);
    return {};
  }

  const totals: Record<string, number> = {};
  for (const row of (data as { category: string; count: number }[]) ?? []) {
    totals[row.category] = (totals[row.category] ?? 0) + row.count;
  }
  return totals;
}

async function fetchAllDailyFileCounts(date: string): Promise<{
  reservations: Record<string, number>;
  projection: Record<string, number>;
  available: Record<string, number>;
}> {
  const [reservations, projection, di, lv, no, cq] = await Promise.all([
    fetchRowCountsByType(date, 'reservations'),
    fetchRowCountsByType(date, 'projection'),
    fetchRowCountsByType(date, 'di'),
    fetchRowCountsByType(date, 'lv'),
    fetchRowCountsByType(date, 'no'),
    fetchRowCountsByType(date, 'cq'),
  ]);

  const available: Record<string, number> = {};
  for (const counts of [di, lv, no, cq]) {
    for (const [cat, val] of Object.entries(counts)) {
      available[cat] = (available[cat] ?? 0) + val;
    }
  }

  return { reservations, projection, available };
}

export function useReservationProjections() {
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const selectedDateRef = useRef<string>(todayISO());
  const [projections, setProjections] = useState<ReservationProjection[]>(() =>
    emptyProjections(todayISO())
  );
  const projectionsRef = useRef<ReservationProjection[]>(emptyProjections(todayISO()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalNoShowRate, setGlobalNoShowRateState] = useState<number>(0);
  const isDirty = useRef(false);
  const loadSequence = useRef(0);

  const loadGlobalNoShowRate = useCallback(async (): Promise<number> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('projection_settings' as any) as any)
      .select('value')
      .eq('key', GLOBAL_NOSHOW_KEY)
      .maybeSingle();
    const rate = data ? parseFloat((data as { value: string }).value) || 0 : 0;
    setGlobalNoShowRateState(rate);
    return rate;
  }, []);

  const load = useCallback(async (date: string) => {
    const seq = ++loadSequence.current;
    try {
      setLoading(true);

      const [{ data, error }, globalRate, fileCounts] = await Promise.all([
        supabase.from('reservation_projections').select('*').eq('projection_date', date),
        loadGlobalNoShowRate(),
        fetchAllDailyFileCounts(date),
      ]);

      if (seq !== loadSequence.current) return;
      if (error) throw error;

      const loaded = VEHICLE_CATEGORIES.map((cat) => {
        const existing = data?.find((r) => r.category === cat);

        const fromFileReservations = fileCounts.reservations[cat] ?? 0;
        const fromFileProjection = fileCounts.projection[cat] ?? 0;
        const fromFileAvailable = fileCounts.available[cat] ?? 0;

        if (existing) {
          const reservations_count =
            fromFileReservations > 0 ? fromFileReservations : existing.reservations_count;
          const projection =
            fromFileProjection > 0 ? fromFileProjection : (existing.projection ?? 0);
          const available_vehicles =
            fromFileAvailable > 0 ? fromFileAvailable : (existing.available_vehicles ?? 0);

          const savedRate = Number(existing.no_show_rate);
          const no_show_rate = savedRate > 0 ? savedRate : globalRate;

          return {
            id: existing.id,
            category: existing.category,
            reservations_count,
            no_show_rate,
            available_vehicles,
            projection,
            projection_date: existing.projection_date ?? date,
          };
        }

        return {
          category: cat,
          reservations_count: fromFileReservations,
          no_show_rate: globalRate,
          available_vehicles: fromFileAvailable,
          projection: fromFileProjection,
          projection_date: date,
        };
      });

      setProjections(loaded);
      projectionsRef.current = loaded;
      isDirty.current = false;
    } catch (err) {
      if (seq !== loadSequence.current) return;
      console.error('Error loading reservation projections:', err);
      toast.error('Erro ao carregar projeções');
    } finally {
      if (seq === loadSequence.current) setLoading(false);
    }
  }, [loadGlobalNoShowRate]);

  useEffect(() => {
    load(selectedDate);
  }, [load, selectedDate]);

  const changeDate = useCallback(async (date: string) => {
    if (isDirty.current) {
      const confirmed = window.confirm(
        'Você tem dados não salvos. Deseja salvar antes de mudar a data?'
      );
      if (confirmed) {
        try {
          const { error } = await supabase
            .from('reservation_projections')
            .upsert(
              projectionsRef.current.map((p) => ({
                ...(p.id ? { id: p.id } : {}),
                category: p.category,
                reservations_count: p.reservations_count,
                no_show_rate: p.no_show_rate,
                available_vehicles: p.available_vehicles,
                projection: p.projection,
                projection_date: selectedDateRef.current,
                updated_at: new Date().toISOString(),
              })),
              { onConflict: 'category,projection_date' }
            );
          if (!error) {
            isDirty.current = false;
            toast.success('Dados salvos automaticamente');
          }
        } catch { /* ignore, user still navigates */ }
      }
    }
    selectedDateRef.current = date;
    setSelectedDate(date);
  }, []);

  const markDirty = () => { isDirty.current = true; };

  const updateProjection = (
    category: string,
    field: 'reservations_count' | 'no_show_rate' | 'available_vehicles' | 'projection',
    value: number
  ) => {
    markDirty();
    setProjections((prev) => {
      const next = prev.map((p) => (p.category === category ? { ...p, [field]: value } : p));
      projectionsRef.current = next;
      return next;
    });
  };

  const buildUpsertPayload = (rows: ReservationProjection[], date: string) =>
    rows.map((p) => ({
      ...(p.id ? { id: p.id } : {}),
      category: p.category,
      reservations_count: p.reservations_count,
      no_show_rate: p.no_show_rate,
      available_vehicles: p.available_vehicles,
      projection: p.projection,
      projection_date: date,
      updated_at: new Date().toISOString(),
    }));

  const setGlobalNoShowRate = async (rate: number) => {
    setGlobalNoShowRateState(rate);
    const updated = projectionsRef.current.map((p) => ({ ...p, no_show_rate: rate }));
    setProjections(updated);
    projectionsRef.current = updated;
    isDirty.current = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('projection_settings' as any) as any)
        .upsert({ key: GLOBAL_NOSHOW_KEY, value: String(rate), updated_at: new Date().toISOString() }, { onConflict: 'key' });
      await supabase
        .from('reservation_projections')
        .upsert(buildUpsertPayload(updated, selectedDateRef.current), { onConflict: 'category,projection_date' });
      toast.success(`No-Show global de ${rate}% aplicado e salvo`);
    } catch (err) {
      console.error('Error saving global no-show rate:', err);
      toast.error('Erro ao salvar no-show global');
    }
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('reservation_projections')
        .upsert(buildUpsertPayload(projectionsRef.current, selectedDateRef.current), { onConflict: 'category,projection_date' });

      if (error) throw error;

      isDirty.current = false;
      toast.success('Projeções salvas com sucesso');
    } catch (err) {
      console.error('Error saving projections:', err);
      toast.error('Erro ao salvar projeções');
    } finally {
      setSaving(false);
    }
  };

  const reloadFromFiles = useCallback(async () => {
    await load(selectedDateRef.current);
    toast.success('Dados recarregados dos arquivos enviados');
  }, [load]);

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
    globalNoShowRate,
    saveAll,
    reloadFromFiles,
    totalReservations,
    totalEstimated,
    avgNoShow,
  };
}
