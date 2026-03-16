import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { computeEstimatedUsage, VEHICLE_CATEGORIES } from '@/hooks/useReservationProjections';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { CalendarDays, Car, TrendingDown, CircleAlert as AlertCircle, ChartBar as BarChart3, ArrowLeft, ArrowRight, Camera } from 'lucide-react';

interface Projection {
  category: string;
  reservations_count: number;
  no_show_rate: number;
  available_vehicles: number;
  projection: number;
  projection_date: string;
}

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ProjectionDashboard() {
  const { token } = useParams<{ token: string }>();
  const [valid, setValid] = useState<boolean | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [projections, setProjections] = useState<Projection[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const printCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) { setValid(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('projection_share_tokens' as any) as any)
      .select('id')
      .eq('token', token)
      .eq('active', true)
      .maybeSingle()
      .then(({ data }: { data: unknown }) => setValid(!!data));
  }, [token]);

  useEffect(() => {
    supabase
      .from('reservation_projections')
      .select('projection_date')
      .order('projection_date', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((r: { projection_date: string }) => r.projection_date))].sort().reverse();
          setAvailableDates(unique);
        }
      });
  }, []);

  const fetchFileRows = useCallback(async (date: string, fileType: string): Promise<Record<string, number>> => {
    const { data, error } = await supabase
      .from('daily_file_rows' as never)
      .select('category, count')
      .eq('upload_date', date)
      .eq('file_type', fileType);
    if (error || !data) return {};
    const rows = data as { category: string; count: number }[];
    const totals: Record<string, number> = {};
    for (const r of rows) totals[r.category] = (totals[r.category] ?? 0) + r.count;
    return totals;
  }, []);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    const [{ data }, resv, proj, di, lv, no, cq] = await Promise.all([
      supabase.from('reservation_projections').select('*').eq('projection_date', date),
      fetchFileRows(date, 'reservations'),
      fetchFileRows(date, 'projection'),
      fetchFileRows(date, 'di'),
      fetchFileRows(date, 'lv'),
      fetchFileRows(date, 'no'),
      fetchFileRows(date, 'cq'),
    ]);

    const available: Record<string, number> = {};
    for (const counts of [di, lv, no, cq]) {
      for (const [cat, val] of Object.entries(counts)) {
        available[cat] = (available[cat] ?? 0) + val;
      }
    }

    const rows: Projection[] = VEHICLE_CATEGORIES.map((cat) => {
      const existing = data?.find((r: Projection) => r.category === cat);
      const fromFileRes = resv[cat] ?? 0;
      const fromFileProj = proj[cat] ?? 0;
      const fromFileAvail = available[cat] ?? 0;

      if (existing) {
        return {
          ...existing,
          reservations_count: fromFileRes > 0 ? fromFileRes : existing.reservations_count,
          projection: fromFileProj > 0 ? fromFileProj : (existing.projection ?? 0),
          available_vehicles: fromFileAvail > 0 ? fromFileAvail : (existing.available_vehicles ?? 0),
        };
      }
      return {
        category: cat,
        reservations_count: fromFileRes,
        no_show_rate: 0,
        available_vehicles: fromFileAvail,
        projection: fromFileProj,
        projection_date: date,
      };
    });

    setProjections(rows);
    setLoading(false);
  }, [fetchFileRows]);

  useEffect(() => {
    if (valid) load(selectedDate);
  }, [valid, selectedDate, load]);

  if (valid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <p className="text-2xl font-bold text-gray-800">Link inválido ou expirado</p>
          <p className="text-gray-500">Este link de compartilhamento não está mais disponível.</p>
        </div>
      </div>
    );
  }

  const activeProjections = projections.filter(
    (p) => p.reservations_count > 0 || p.available_vehicles > 0 || p.projection > 0
  );

  const totalReservations = projections.reduce((s, p) => s + p.reservations_count, 0);
  const totalEstimated = projections.reduce((s, p) => s + computeEstimatedUsage(p.reservations_count, p.no_show_rate), 0);
  const totalNoShow = totalReservations - totalEstimated;
  const totalAvailable = projections.reduce((s, p) => s + p.available_vehicles, 0);
  const totalProjection = projections.reduce((s, p) => s + p.projection, 0);
  const totalBalance = totalAvailable + totalProjection - totalEstimated;
  const avgNoShow =
    projections.filter((p) => p.reservations_count > 0).length > 0
      ? projections.filter((p) => p.reservations_count > 0).reduce((s, p) => s + p.no_show_rate, 0) /
      projections.filter((p) => p.reservations_count > 0).length
      : 0;

  const chartData = activeProjections.map((p) => {
    const estimated = computeEstimatedUsage(p.reservations_count, p.no_show_rate);
    return {
      name: p.category,
      Reservas: p.reservations_count,
      Estimado: estimated,
      Disponível: p.available_vehicles + p.projection,
      Saldo: p.available_vehicles + p.projection - estimated,
    };
  });

  const prevDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);
  const hasNext = nextDate <= todayISO();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-card, #print-card * { visibility: visible !important; }
          #print-card {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            background: white !important;
            padding: 24px !important;
            z-index: 99999 !important;
          }
        }
      `}</style>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight">Projeções de Frota</p>
              <p className="text-xs text-gray-500">Dashboard de visualização</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(prevDate)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              title="Dia anterior"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
              <CalendarDays className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm font-semibold bg-transparent border-none outline-none text-gray-800 cursor-pointer"
              />
            </div>
            {hasNext && (
              <button
                onClick={() => setSelectedDate(nextDate)}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                title="Próximo dia"
              >
                <ArrowRight className="w-4 h-4 text-gray-600" />
              </button>
            )}
            {!loading && activeProjections.length > 0 && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                title="Gerar print para WhatsApp"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading || valid === null ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Reservas" value={totalReservations} color="blue" icon={<BarChart3 className="w-5 h-5 text-blue-600" />} />
              <StatCard label="Utilização Est." value={totalEstimated} color="green" icon={<Car className="w-5 h-5 text-green-600" />} />
              <StatCard label="No-Show Est." value={totalNoShow} color="red" icon={<AlertCircle className="w-5 h-5 text-red-500" />} />
              <StatCard label="Tx. No-Show" value={`${avgNoShow.toFixed(1)}%`} color="orange" icon={<TrendingDown className="w-5 h-5 text-orange-500" />} />
              <StatCard label="Disponível+Proj." value={totalAvailable + totalProjection} color="sky" icon={<Car className="w-5 h-5 text-sky-600" />} />
              <StatCard
                label="Saldo Total"
                value={totalBalance > 0 ? `+${totalBalance}` : `${totalBalance}`}
                color={totalBalance > 0 ? 'green' : totalBalance < 0 ? 'red' : 'gray'}
                icon={<BarChart3 className="w-5 h-5" />}
                bold
              />
            </div>

            {activeProjections.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum dado para {formatDateBR(selectedDate)}</p>
                <p className="text-gray-400 text-sm mt-1">Selecione outra data ou aguarde a importação dos dados.</p>
              </div>
            ) : (
              <>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-semibold text-gray-700 mb-4">Reservas vs Utilização Estimada por Grupo</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Reservas" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Estimado" fill="#22c55e" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-sm font-semibold text-gray-700 mb-4">Saldo por Grupo (Disponível + Projeção − Estimado)</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar
                          dataKey="Saldo"
                          radius={[3, 3, 0, 0]}
                          fill="#3b82f6"
                          label={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {availableDates.length > 1 && (
                  <HistoryChart dates={availableDates.slice(0, 14)} />
                )}

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-800">Detalhe por Categoria — {formatDateBR(selectedDate)}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                          <th className="py-3 px-4 text-center font-semibold">Grupo</th>
                          <th className="py-3 px-4 text-center font-semibold">Reservas</th>
                          <th className="py-3 px-4 text-center font-semibold">Tx. No-Show</th>
                          <th className="py-3 px-4 text-center font-semibold">Utilização Est.</th>
                          <th className="py-3 px-4 text-center font-semibold">Disponível</th>
                          <th className="py-3 px-4 text-center font-semibold">Projeção Ret.</th>
                          <th className="py-3 px-4 text-center font-semibold">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeProjections.map((p) => {
                          const estimated = computeEstimatedUsage(p.reservations_count, p.no_show_rate);
                          const balance = p.available_vehicles + p.projection - estimated;
                          return (
                            <tr key={p.category} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-sm">
                                  {p.category}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-medium text-gray-800">{p.reservations_count || '—'}</td>
                              <td className="py-3 px-4 text-center text-orange-600 font-medium">
                                {p.reservations_count > 0 ? `${p.no_show_rate}%` : '—'}
                              </td>
                              <td className="py-3 px-4 text-center font-medium text-green-700">{estimated || '—'}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{p.available_vehicles || '—'}</td>
                              <td className="py-3 px-4 text-center text-gray-700">{p.projection || '—'}</td>
                              <td className="py-3 px-4 text-center">
                                {(p.reservations_count > 0 || p.available_vehicles > 0 || p.projection > 0) ? (
                                  <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg font-bold text-sm ${balance > 0 ? 'bg-blue-50 text-blue-700' :
                                      balance < 0 ? 'bg-red-50 text-red-600' :
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                    {balance > 0 ? `+${balance}` : balance}
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                          <td className="py-3 px-4 text-center text-gray-700">TOTAL</td>
                          <td className="py-3 px-4 text-center">{totalReservations || '—'}</td>
                          <td className="py-3 px-4 text-center text-orange-600">{totalReservations > 0 ? `${avgNoShow.toFixed(1)}%` : '—'}</td>
                          <td className="py-3 px-4 text-center text-green-700">{totalEstimated || '—'}</td>
                          <td className="py-3 px-4 text-center">{totalAvailable || '—'}</td>
                          <td className="py-3 px-4 text-center">{totalProjection || '—'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg font-bold text-sm ${totalBalance > 0 ? 'bg-blue-50 text-blue-700' :
                                totalBalance < 0 ? 'bg-red-50 text-red-600' :
                                  'bg-gray-100 text-gray-500'
                              }`}>
                              {totalBalance > 0 ? `+${totalBalance}` : totalBalance}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between text-xs text-gray-400">
        <span>Somente visualização — dados atualizados diariamente</span>
        <span>{formatDateBR(selectedDate)}</span>
      </footer>

      <div id="print-card" ref={printCardRef} style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
        <PrintCard
          date={selectedDate}
          projections={activeProjections}
          totalReservations={totalReservations}
          totalEstimated={totalEstimated}
          totalNoShow={totalNoShow}
          totalAvailable={totalAvailable}
          totalProjection={totalProjection}
          totalBalance={totalBalance}
          avgNoShow={avgNoShow}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
  bold?: boolean;
}

function StatCard({ label, value, color, icon, bold }: StatCardProps) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-50', green: 'bg-green-50', red: 'bg-red-50',
    orange: 'bg-orange-50', sky: 'bg-sky-50', gray: 'bg-gray-50',
  };
  const text: Record<string, string> = {
    blue: 'text-blue-700', green: 'text-green-700', red: 'text-red-600',
    orange: 'text-orange-600', sky: 'text-sky-700', gray: 'text-gray-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
      <div className={`w-9 h-9 rounded-lg ${bg[color] ?? 'bg-gray-50'} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${text[color] ?? 'text-gray-800'} ${bold ? 'text-xl' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function HistoryChart({ dates }: { dates: string[] }) {
  const [data, setData] = useState<{ date: string; Reservas: number; Estimado: number; Saldo: number }[]>([]);

  useEffect(() => {
    const sorted = [...dates].sort();
    Promise.all(
      sorted.map((d) =>
        supabase
          .from('reservation_projections')
          .select('reservations_count, no_show_rate, available_vehicles, projection')
          .eq('projection_date', d)
          .then(({ data: rows }) => {
            if (!rows) return null;
            const res = rows.reduce((s: number, r: Projection) => s + r.reservations_count, 0);
            const est = rows.reduce((s: number, r: Projection) => s + computeEstimatedUsage(r.reservations_count, r.no_show_rate), 0);
            const avail = rows.reduce((s: number, r: Projection) => s + r.available_vehicles + r.projection, 0);
            return { date: formatDateBR(d), Reservas: res, Estimado: est, Saldo: avail - est };
          })
      )
    ).then((results) => {
      setData(results.filter(Boolean) as { date: string; Reservas: number; Estimado: number; Saldo: number }[]);
    });
  }, [dates]);

  if (data.length < 2) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">Histórico — últimos {data.length} dias</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="Reservas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Estimado" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Saldo" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PrintCardProps {
  date: string;
  projections: Projection[];
  totalReservations: number;
  totalEstimated: number;
  totalNoShow: number;
  totalAvailable: number;
  totalProjection: number;
  totalBalance: number;
  avgNoShow: number;
}

function PrintCard({ date, projections, totalReservations, totalEstimated, totalNoShow, totalAvailable, totalProjection, totalBalance, avgNoShow }: PrintCardProps) {
  const now = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#fff', color: '#111', padding: '20px', maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '2px solid #1d4ed8', paddingBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8' }}>Projeção de Frota</div>
          <div style={{ fontSize: '13px', color: '#555' }}>Data: {formatDateBR(date)}</div>
        </div>
        <div style={{ fontSize: '11px', color: '#888' }}>Gerado em {now}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'Reservas', value: totalReservations, color: '#1d4ed8' },
          { label: 'Utilização Est.', value: totalEstimated, color: '#16a34a' },
          { label: 'No-Show Est.', value: totalNoShow, color: '#dc2626' },
          { label: 'Tx. No-Show', value: `${avgNoShow.toFixed(1)}%`, color: '#ea580c' },
          { label: 'Disponível+Proj.', value: totalAvailable + totalProjection, color: '#0284c7' },
          { label: 'Saldo Total', value: totalBalance > 0 ? `+${totalBalance}` : String(totalBalance), color: totalBalance >= 0 ? '#16a34a' : '#dc2626' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#1d4ed8', color: '#fff' }}>
            {['Grupo', 'Reservas', 'Tx NSH', 'Utiliz.', 'Disp.', 'Proj.', 'Saldo'].map((h) => (
              <th key={h} style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projections.map((p, i) => {
            const estimated = computeEstimatedUsage(p.reservations_count, p.no_show_rate);
            const balance = p.available_vehicles + p.projection - estimated;
            return (
              <tr key={p.category} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8' }}>{p.category}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>{p.reservations_count || '—'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#ea580c' }}>{p.reservations_count > 0 ? `${p.no_show_rate}%` : '—'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#16a34a' }}>{estimated || '—'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>{p.available_vehicles || '—'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>{p.projection || '—'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 'bold', color: balance > 0 ? '#1d4ed8' : balance < 0 ? '#dc2626' : '#64748b' }}>
                  {balance > 0 ? `+${balance}` : balance}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: '#1e3a5f', color: '#fff', fontWeight: 'bold' }}>
            <td style={{ padding: '6px 8px', textAlign: 'center' }}>TOTAL</td>
            <td style={{ padding: '6px 8px', textAlign: 'center' }}>{totalReservations || '—'}</td>
            <td style={{ padding: '6px 8px', textAlign: 'center', color: '#fbbf24' }}>{totalReservations > 0 ? `${avgNoShow.toFixed(1)}%` : '—'}</td>
            <td style={{ padding: '6px 8px', textAlign: 'center', color: '#86efac' }}>{totalEstimated || '—'}</td>
            <td style={{ padding: '6px 8px', textAlign: 'center' }}>{totalAvailable || '—'}</td>
            <td style={{ padding: '6px 8px', textAlign: 'center' }}>{totalProjection || '—'}</td>
            <td style={{ padding: '6px 8px', textAlign: 'center', color: totalBalance > 0 ? '#86efac' : totalBalance < 0 ? '#fca5a5' : '#d1d5db' }}>
              {totalBalance > 0 ? `+${totalBalance}` : totalBalance}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: '14px', fontSize: '10px', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
        Sistema de Gestão de Frota — Dados de {formatDateBR(date)}
      </div>
    </div>
  );
}
