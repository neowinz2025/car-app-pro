import { useState } from 'react';
import {
  Save,
  ChartBar as BarChart3,
  Car,
  CircleAlert as AlertCircle,
  TrendingDown,
  CalendarDays,
  Share2,
  Copy,
  Link,
  Percent,
  CheckCheck,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useReservationProjections, computeEstimatedUsage } from '@/hooks/useReservationProjections';
import { useProjectionShare } from '@/hooks/useProjectionShare';

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function DateSelector({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="w-4 h-4 text-muted-foreground" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-3 h-9 text-sm bg-background cursor-pointer font-medium"
        title="Selecionar data"
      />
    </div>
  );
}

export function ReservationProjectionsView() {
  const {
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
  } = useReservationProjections();

  const { generateShareLink, copyShareLink, revokeShareLink, generating, shareToken } = useProjectionShare();
  const [globalNoShow, setGlobalNoShowInput] = useState<string>('');

  const totalNoShow = totalReservations - totalEstimated;
  const totalAvailable = projections.reduce((s, p) => s + p.available_vehicles, 0);
  const totalProjection = projections.reduce((s, p) => s + p.projection, 0);
  const totalBalance = totalAvailable + totalProjection - totalEstimated;

  return (
    <div className="space-y-6 relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex justify-center items-start pt-16 bg-background/60 backdrop-blur-sm rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      <Card className="border border-border bg-muted/10">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Data da Projeção
                </p>
                <DateSelector value={selectedDate} onChange={changeDate} />
              </div>
              <div className="h-8 w-px bg-border hidden md:block" />
              <p className="text-xs text-muted-foreground">
                Dados para <strong>{formatDateBR(selectedDate)}</strong>. Os valores são carregados automaticamente dos arquivos enviados para essa data.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={reloadFromFiles}
                disabled={loading}
                title="Recarregar dados dos arquivos enviados"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Recarregar
              </Button>
              {shareToken ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => copyShareLink(shareToken)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar link
                  </Button>
                  <button
                    onClick={revokeShareLink}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                    title="Revogar link"
                  >
                    <Trash2 className="w-3 h-3" />
                    Revogar
                  </button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => generateShareLink()}
                  disabled={generating}
                >
                  {generating ? (
                    <div className="w-3.5 h-3.5 animate-spin rounded-full border-b border-current" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  Compartilhar
                </Button>
              )}
              {shareToken && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Link className="w-3 h-3 text-green-600" />
                  <span className="font-mono truncate max-w-[130px] text-green-700">/projecao/{shareToken.slice(0, 8)}…</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-primary/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Reservas</p>
                <p className="text-2xl font-bold text-primary">{totalReservations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-green-500/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Utilização Estimada</p>
                <p className="text-2xl font-bold text-green-600">{totalEstimated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-red-500/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">No-Show Estimado</p>
                <p className="text-2xl font-bold text-red-500">{totalNoShow}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-orange-500/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Taxa Média No-Show</p>
                <p className="text-2xl font-bold text-orange-500">{avgNoShow.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Categorias de Veículos</CardTitle>
              <CardDescription>Projeção para {formatDateBR(selectedDate)}</CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                <Percent className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-orange-700 whitespace-nowrap">No-Show global</span>
                  {globalNoShowRate > 0 && (
                    <span className="text-[10px] text-orange-500">atual: {globalNoShowRate}%</span>
                  )}
                </div>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={globalNoShow}
                  placeholder={globalNoShowRate > 0 ? String(globalNoShowRate) : 'ex: 15'}
                  onChange={(e) => setGlobalNoShowInput(e.target.value)}
                  className="w-16 h-7 text-center text-xs border-orange-300 bg-white"
                />
                <span className="text-xs text-orange-600">%</span>
                <button
                  onClick={() => {
                    const rate = Math.min(100, Math.max(0, parseFloat(globalNoShow) || 0));
                    setGlobalNoShowRate(rate);
                    setGlobalNoShowInput('');
                  }}
                  className="flex items-center gap-1 text-xs text-orange-700 hover:text-orange-900 font-semibold transition-colors"
                  title="Aplicar a todos os grupos e salvar como padrão"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Aplicar
                </button>
              </div>
              <Button onClick={saveAll} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground w-16">GRUPOS</th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">RESERVAS</th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                    <span className="flex flex-col items-center leading-tight">
                      <span>TX NSH</span>
                      <span className="text-[10px] font-normal text-muted-foreground/70">por grupo</span>
                    </span>
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                    <span className="flex flex-col items-center leading-tight">
                      <span>NO / DI</span>
                      <span className="text-[10px] font-normal text-muted-foreground/70">disponível</span>
                    </span>
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                    <span className="flex flex-col items-center leading-tight">
                      <span>PROJEÇÃO</span>
                      <span className="text-[10px] font-normal text-muted-foreground/70">retorno</span>
                    </span>
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                    <span className="flex flex-col items-center leading-tight">
                      <span>TX</span>
                      <span className="text-[10px] font-normal text-muted-foreground/70">utilização</span>
                    </span>
                  </th>
                  <th className="text-center py-3 px-3 font-semibold w-20">SALDO</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((proj) => {
                  const estimated = computeEstimatedUsage(proj.reservations_count, proj.no_show_rate);
                  const balance = proj.available_vehicles + proj.projection - estimated;
                  const hasAnyData = proj.reservations_count > 0 || proj.available_vehicles > 0 || proj.projection > 0;

                  return (
                    <tr key={proj.category} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          {proj.category}
                        </span>
                      </td>
                      <td className="py-1.5 px-3">
                        <Input
                          type="number"
                          min={0}
                          value={proj.reservations_count === 0 ? '' : proj.reservations_count}
                          placeholder="0"
                          onChange={(e) =>
                            updateProjection(proj.category, 'reservations_count', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-24 h-8 text-center font-medium mx-auto block"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={proj.no_show_rate === 0 ? '' : proj.no_show_rate}
                            placeholder="0"
                            onChange={(e) =>
                              updateProjection(
                                proj.category,
                                'no_show_rate',
                                Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                              )
                            }
                            className="w-20 h-8 text-center font-medium"
                          />
                          <span className="text-muted-foreground text-xs">%</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-3">
                        <Input
                          type="number"
                          min={0}
                          value={proj.available_vehicles === 0 ? '' : proj.available_vehicles}
                          placeholder="0"
                          onChange={(e) =>
                            updateProjection(proj.category, 'available_vehicles', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className={`w-24 h-8 text-center font-medium mx-auto block ${proj.available_vehicles > 0 ? 'border-blue-300 bg-blue-50/50' : ''}`}
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <Input
                          type="number"
                          min={0}
                          value={proj.projection === 0 ? '' : proj.projection}
                          placeholder="0"
                          onChange={(e) =>
                            updateProjection(proj.category, 'projection', Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className="w-24 h-8 text-center font-medium mx-auto block"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        {proj.reservations_count > 0 ? (
                          <span className="font-bold text-sm">{estimated}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {hasAnyData ? (
                          <span
                            className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg font-bold text-sm ${
                              balance > 0
                                ? 'bg-blue-500/10 text-blue-600'
                                : balance < 0
                                ? 'bg-red-500/10 text-red-600'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {balance > 0 ? `+${balance}` : balance}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/40 font-bold">
                  <td className="py-3 px-3 text-center text-sm">TOTAL</td>
                  <td className="py-3 px-3 text-center text-sm">{totalReservations || '—'}</td>
                  <td className="py-3 px-3 text-center text-sm text-orange-500">
                    {totalReservations > 0 ? `${avgNoShow.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-3 px-3 text-center text-sm">{totalAvailable || '—'}</td>
                  <td className="py-3 px-3 text-center text-sm">{totalProjection || '—'}</td>
                  <td className="py-3 px-3 text-center text-sm text-green-600">{totalEstimated || '—'}</td>
                  <td className="py-3 px-3 text-center">
                    {totalAvailable + totalProjection + totalReservations > 0 ? (
                      <span
                        className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg font-bold text-sm ${
                          totalBalance > 0
                            ? 'bg-blue-500/10 text-blue-600'
                            : totalBalance < 0
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {totalBalance > 0 ? `+${totalBalance}` : totalBalance}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded bg-blue-500/20 border border-blue-300" />
          <span>Saldo positivo (sobra de veículos)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded bg-red-500/20 border border-red-300" />
          <span>Saldo negativo (falta de veículos)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded bg-blue-50 border border-blue-300" />
          <span>NO/DI preenchido via arquivos</span>
        </div>
      </div>
    </div>
  );
}
