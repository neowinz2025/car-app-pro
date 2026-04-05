import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BateReservaRow {
  category: string;
  total: number;
  times: string;
  status: string;
}

export interface BateReservaReport {
  id?: string;
  report_date: string;
  store_id?: string | null;
  period_start: string;
  period_end: string;
  rows: BateReservaRow[];
  notes?: string;
}

const STATUS_OPTIONS = ['OK', 'FALTA', 'LAVANDO', 'OFICINA', 'INDISPONIVEL'];

export { STATUS_OPTIONS };

const DEFAULT_CATEGORIES = [
  'AM','AT','B','BS','C','CA','CX','CG',
  'E','EA','G1','G2','I','IE','LX','SG',
  'SM','SP','SU','SV','T','TT','TS','J','VU','VC',
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyRows(): BateReservaRow[] {
  return DEFAULT_CATEGORIES.map((cat) => ({
    category: cat,
    total: 0,
    times: '',
    status: 'OK',
  }));
}

function buildReportText(report: BateReservaReport): string {
  const activeRows = report.rows.filter((r) => r.total > 0);
  const totalReservations = activeRows.reduce((s, r) => s + r.total, 0);

  const lines: string[] = [];
  lines.push(`${totalReservations} reservas de ${report.period_start} até as ${report.period_end}`);
  lines.push('');

  for (const row of activeRows) {
    const statusText = row.status.startsWith('FALTA')
      ? `*${row.status}*`
      : `*${row.status}*`;
    const timesStr = row.times.trim() ? ` - ${row.times}` : '';
    lines.push(`${row.category}(${row.total})${timesStr} / ${statusText}`);
  }

  if (report.notes?.trim()) {
    lines.push('');
    lines.push(report.notes.trim());
  }

  return lines.join('\n');
}

export { buildReportText };

export function useBateReserva() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [report, setReport] = useState<BateReservaReport>({
    report_date: todayISO(),
    period_start: '06:00',
    period_end: '14:30',
    rows: emptyRows(),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isDirty = useRef(false);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bate_reserva_reports' as never)
        .select('*')
        .eq('report_date', date)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const d = data as BateReservaReport & { id: string };
        const savedCategories = new Set((d.rows || []).map((r: BateReservaRow) => r.category));
        const mergedRows = DEFAULT_CATEGORIES.map((cat) => {
          const existing = (d.rows || []).find((r: BateReservaRow) => r.category === cat);
          return existing || { category: cat, total: 0, times: '', status: 'OK' };
        });
        const extraRows = (d.rows || []).filter((r: BateReservaRow) => !DEFAULT_CATEGORIES.includes(r.category));
        setReport({
          id: d.id,
          report_date: date,
          store_id: d.store_id,
          period_start: d.period_start || '06:00',
          period_end: d.period_end || '14:30',
          rows: [...mergedRows, ...extraRows],
          notes: d.notes || '',
        });
      } else {
        setReport({
          report_date: date,
          period_start: '06:00',
          period_end: '14:30',
          rows: emptyRows(),
          notes: '',
        });
      }
      isDirty.current = false;
    } catch (err) {
      console.error('Error loading bate reserva:', err);
      toast.error('Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  }, []);

  const changeDate = useCallback(async (date: string) => {
    setSelectedDate(date);
    await load(date);
  }, [load]);

  const updateRow = useCallback((category: string, field: keyof BateReservaRow, value: string | number) => {
    isDirty.current = true;
    setReport((prev) => ({
      ...prev,
      rows: prev.rows.map((r) =>
        r.category === category ? { ...r, [field]: value } : r
      ),
    }));
  }, []);

  const updatePeriod = useCallback((field: 'period_start' | 'period_end', value: string) => {
    isDirty.current = true;
    setReport((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateNotes = useCallback((notes: string) => {
    isDirty.current = true;
    setReport((prev) => ({ ...prev, notes }));
  }, []);

  const addCustomCategory = useCallback((category: string) => {
    isDirty.current = true;
    setReport((prev) => {
      if (prev.rows.some((r) => r.category === category)) return prev;
      return {
        ...prev,
        rows: [...prev.rows, { category, total: 0, times: '', status: 'OK' }],
      };
    });
  }, []);

  const removeRow = useCallback((category: string) => {
    isDirty.current = true;
    setReport((prev) => ({
      ...prev,
      rows: prev.rows.filter((r) => r.category !== category),
    }));
  }, []);

  const injectSmartPaste = useCallback((pastedText: string) => {
    if (!pastedText.trim()) return 0;
    
    // Parse the pasted text
    const lines = pastedText.split('\n');
    const grouped: Record<string, string[]> = {};
    let count = 0;

    for (const line of lines) {
      // Look for the pattern: date time \t group
      // Example line piece: ... \t 05/04/2026 12:00 \t CA \t CFA ...
      const match = line.match(/\d{2}\/\d{2}\/\d{4}\s+(\d{2}:\d{2})[\s\t]+([a-zA-Z0-9]{1,3})[\s\t]+/);
      if (match) {
        const time = match[1];
        const group = match[2].toUpperCase();
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(time);
        count++;
      }
    }

    if (count === 0) return 0;

    isDirty.current = true;
    setReport((prev) => {
      const newRows = [...prev.rows];
      
      // For each found group, aggregate and update
      Object.entries(grouped).forEach(([cat, timesArray]) => {
        // Sort times
        timesArray.sort();
        
        // Count frequencies e.g. ['10:00', '10:00', '12:00'] -> '(2)10:00, 12:00'
        const freq: Record<string, number> = {};
        timesArray.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
        
        const formattedTimes = Object.entries(freq).map(([time, c]) => {
          return c > 1 ? `(${c})${time}` : time;
        }).join(', ');

        const existingIdx = newRows.findIndex(r => r.category === cat);
        if (existingIdx >= 0) {
          // Add to existing, avoiding duplicates if they paste incrementally
          const currentTimes = newRows[existingIdx].times;
          newRows[existingIdx] = {
            ...newRows[existingIdx],
            total: timesArray.length, // Override total
            times: formattedTimes, // Override times
            status: 'OK' // Reset status to prompt review
          };
        } else {
          // Create new row
          newRows.push({
            category: cat,
            total: timesArray.length,
            times: formattedTimes,
            status: 'OK'
          });
        }
      });
      return { ...prev, rows: newRows };
    });

    return count;
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        report_date: report.report_date,
        period_start: report.period_start,
        period_end: report.period_end,
        rows: report.rows,
        notes: report.notes || '',
        updated_at: new Date().toISOString(),
      };

      if (report.id) {
        const { error } = await supabase
          .from('bate_reserva_reports' as never)
          .update(payload as never)
          .eq('id', report.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('bate_reserva_reports' as never)
          .insert({ ...payload, created_at: new Date().toISOString() } as never)
          .select('id')
          .single();
        if (error) throw error;
        setReport((prev) => ({ ...prev, id: (data as { id: string }).id }));
      }

      isDirty.current = false;
      toast.success('Relatório salvo com sucesso');
    } catch (err) {
      console.error('Error saving bate reserva:', err);
      toast.error('Erro ao salvar relatório');
    } finally {
      setSaving(false);
    }
  }, [report]);

  const copyToClipboard = useCallback(async () => {
    const text = buildReportText(report);
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Relatório copiado para área de transferência');
    } catch {
      toast.error('Não foi possível copiar automaticamente');
    }
  }, [report]);

  return {
    selectedDate,
    report,
    loading,
    saving,
    changeDate,
    updateRow,
    updatePeriod,
    updateNotes,
    addCustomCategory,
    removeRow,
    save,
    copyToClipboard,
    load,
    injectSmartPaste,
  };
}
