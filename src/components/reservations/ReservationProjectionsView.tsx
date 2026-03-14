import { TrendingDown, Save, ChartBar as BarChart3, Car, CircleAlert as AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useReservationProjections, computeEstimatedUsage } from '@/hooks/useReservationProjections';

export function ReservationProjectionsView() {
  const {
    projections,
    loading,
    saving,
    updateProjection,
    saveAll,
    totalReservations,
    totalEstimated,
    avgNoShow,
  } = useReservationProjections();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalNoShow = totalReservations - totalEstimated;

  return (
    <div className="space-y-6">
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias de Veículos</CardTitle>
              <CardDescription>
                Informe as reservas futuras e a taxa de no-show para cada categoria
              </CardDescription>
            </div>
            <Button onClick={saveAll} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-24">
                    Categoria
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    Reservas Futuras
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    Taxa No-Show (%)
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    Utilização Estimada
                  </th>
                </tr>
              </thead>
              <tbody>
                {projections.map((proj) => {
                  const estimated = computeEstimatedUsage(proj.reservations_count, proj.no_show_rate);
                  const hasData = proj.reservations_count > 0;

                  return (
                    <tr
                      key={proj.category}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                          {proj.category}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <Input
                          type="number"
                          min={0}
                          value={proj.reservations_count === 0 ? '' : proj.reservations_count}
                          placeholder="0"
                          onChange={(e) =>
                            updateProjection(
                              proj.category,
                              'reservations_count',
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-32 h-9 text-center font-medium"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
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
                            className="w-28 h-9 text-center font-medium"
                          />
                          <span className="text-muted-foreground text-xs font-medium">%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {hasData ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-green-600">{estimated}</span>
                            {proj.no_show_rate > 0 && (
                              <span className="text-xs text-muted-foreground">
                                (-{proj.reservations_count - estimated})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {totalReservations > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="py-3 px-4 font-bold text-sm">TOTAL</td>
                    <td className="py-3 px-4 font-bold text-sm">{totalReservations}</td>
                    <td className="py-3 px-4 font-bold text-sm text-orange-500">
                      {avgNoShow.toFixed(1)}% <span className="text-xs font-normal text-muted-foreground">(média)</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-sm text-green-600">{totalEstimated}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
