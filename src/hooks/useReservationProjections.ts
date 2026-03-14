import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    totalReservations,
    totalEstimated,
    avgNoShow,
  };
}
