import { useState, useEffect, useCallback } from 'react';
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
import { CalendarDays, Car, TrendingDown, CircleAlert as AlertCircle, ChartBar as BarChart3, ArrowLeft, ArrowRight } from 'lucide-react';

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

  const load = useCallback(async (date: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('reservation_projections')
      .select('*')
      .eq('projection_date', date);

    const rows: Projection[] = VEHICLE_CATEGORIES.map((cat) => {
      const existing = data?.find((r: Projection) => r.category === cat);
      return existing ?? {
        category: cat,
        reservations_count: 0,
        no_show_rate: 0,
        available_vehicles: 0,
        projection: 0,
        projection_date: date,
      };
    });

    setProjections(rows);
    setLoading(false);
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
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
                                  <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg font-bold text-sm ${
                                    balance > 0 ? 'bg-blue-50 text-blue-700' :
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
                            <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg font-bold text-sm ${
                              totalBalance > 0 ? 'bg-blue-50 text-blue-700' :
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
