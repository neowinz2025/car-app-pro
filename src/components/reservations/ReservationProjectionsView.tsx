import { useRef, useState } from 'react';
import { Save, ChartBar as BarChart3, Car, CircleAlert as AlertCircle, TrendingDown, Upload, CalendarDays, X, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useReservationProjections, computeEstimatedUsage, ImportType } from '@/hooks/useReservationProjections';

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function parseDateInput(val: string): string {
  const parts = val.replace(/\D/g, '');
  if (parts.length === 8) {
    return `${parts.slice(4)}-${parts.slice(2, 4)}-${parts.slice(0, 2)}`;
  }
  return val;
}

interface ImportedFile {
  name: string;
  count: number;
}

function MultiFileImportButton({
  label,
  type,
  onImport,
}: {
  label: string;
  type: ImportType;
  onImport: (data: string | ArrayBuffer, isXLSX: boolean, type: ImportType, accumulate: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ImportedFile[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    selected.forEach((file, idx) => {
      const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const reader = new FileReader();
      const accumulate = idx > 0 || files.length > 0 || type === 'available';
      reader.onload = (evt) => {
        const data = evt.target?.result as string | ArrayBuffer;
        onImport(data, isXLSX, type, accumulate);
        setFiles((prev) => [...prev, { name: file.name, count: 1 }]);
      };
      if (isXLSX) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file, 'UTF-8');
      }
    });
    e.target.value = '';
  };

  const clearFiles = () => {
    setFiles([]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple={type === 'available'}
          className="hidden"
          onChange={handleFiles}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-3.5 h-3.5" />
          {label}
        </Button>
        {files.length > 0 && (
          <button
            onClick={clearFiles}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Limpar arquivos importados"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {files.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileSpreadsheet className="w-3 h-3 text-green-500 shrink-0" />
              <span className="truncate max-w-[180px]">{f.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const [inputVal, setInputVal] = useState(formatDateBR(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
  };

  const handleBlur = () => {
    const iso = parseDateInput(inputVal.replace(/\//g, ''));
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      onChange(iso);
      setInputVal(formatDateBR(iso));
    } else {
      setInputVal(formatDateBR(value));
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setInputVal(formatDateBR(e.target.value));
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center">
        <CalendarDays className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="DD/MM/AAAA"
          value={inputVal}
          onChange={handleChange}
          onBlur={handleBlur}
          className="pl-9 w-36 text-sm font-medium"
          maxLength={10}
        />
      </div>
      <input
        type="date"
        value={value}
        onChange={handleNativeChange}
        className="w-8 h-8 opacity-0 absolute"
        style={{ pointerEvents: 'none' }}
        tabIndex={-1}
      />
      <input
        type="date"
        value={value}
        onChange={handleNativeChange}
        className="border rounded px-2 h-8 text-sm bg-background cursor-pointer"
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
    saveAll,
    importFile,
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
  const totalAvailable = projections.reduce((s, p) => s + p.available_vehicles, 0);
  const totalProjection = projections.reduce((s, p) => s + p.projection, 0);
  const totalBalance = totalAvailable + totalProjection - totalEstimated;

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-muted/10">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Data da Projeção
              </p>
              <DateSelector value={selectedDate} onChange={changeDate} />
            </div>
            <div className="h-8 w-px bg-border hidden md:block" />
            <p className="text-xs text-muted-foreground">
              Dados carregados para <strong>{formatDateBR(selectedDate)}</strong>. Mude a data para consultar ou criar projeções de outros dias.
            </p>
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

      <Card className="border border-dashed border-border bg-muted/20">
        <CardContent className="pt-4 pb-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Importar Arquivo (CSV / XLSX)
          </p>
          <div className="flex flex-wrap gap-6">
            <MultiFileImportButton
              label="Reservas"
              type="reservations"
              onImport={importFile}
            />
            <MultiFileImportButton
              label="Projeção de Retorno"
              type="projection"
              onImport={importFile}
            />
            <MultiFileImportButton
              label="Disponível (CQ / LV / DI)"
              type="available"
              onImport={importFile}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Formatos aceitos: CSV e XLSX/XLS (coluna Grupo). Para CQ+LV+DI, selecione múltiplos arquivos de uma vez — os valores serão somados automaticamente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias de Veículos</CardTitle>
              <CardDescription>
                Projeção para {formatDateBR(selectedDate)}
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
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground w-20">
                    GRUPOS
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                    RESERVAS
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                    TX NSH
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                    DI/NO
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                    PROJEÇÃO
                  </th>
                  <th className="text-center py-3 px-3 font-semibold text-muted-foreground">
                    TX
                  </th>
                  <th className="text-center py-3 px-3 font-semibold w-24">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {projections.map((proj) => {
                  const estimated = computeEstimatedUsage(proj.reservations_count, proj.no_show_rate);
                  const balance = proj.available_vehicles + proj.projection - estimated;
                  const hasAnyData =
                    proj.reservations_count > 0 ||
                    proj.available_vehicles > 0 ||
                    proj.projection > 0;

                  return (
                    <tr
                      key={proj.category}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
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
                            updateProjection(
                              proj.category,
                              'reservations_count',
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
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
                            updateProjection(
                              proj.category,
                              'available_vehicles',
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-24 h-8 text-center font-medium mx-auto block"
                        />
                      </td>
                      <td className="py-1.5 px-3">
                        <Input
                          type="number"
                          min={0}
                          value={proj.projection === 0 ? '' : proj.projection}
                          placeholder="0"
                          onChange={(e) =>
                            updateProjection(
                              proj.category,
                              'projection',
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
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
                    <span
                      className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg font-bold text-sm ${
                        totalBalance > 0
                          ? 'bg-blue-500/10 text-blue-600'
                          : totalBalance < 0
                          ? 'bg-red-500/10 text-red-600'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {totalBalance > 0 ? `+${totalBalance}` : totalBalance || '—'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-6 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded bg-blue-500/20 border border-blue-300" />
          <span>Sobra de veículos (TOTAL positivo)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 rounded bg-red-500/20 border border-red-300" />
          <span>Falta de veículos (TOTAL negativo)</span>
        </div>
      </div>
    </div>
  );
}
