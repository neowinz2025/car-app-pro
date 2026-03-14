import { useRef, useState } from 'react';
import {
  Save,
  ChartBar as BarChart3,
  Car,
  CircleAlert as AlertCircle,
  TrendingDown,
  CalendarDays,
  X,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useReservationProjections, computeEstimatedUsage, ImportType } from '@/hooks/useReservationProjections';

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface ImportedFile {
  name: string;
}

interface SpreadsheetImportButtonProps {
  label: string;
  type: ImportType;
  dateHint: string;
  selectedDate: string;
  onImport: (data: string | ArrayBuffer, isXLSX: boolean, type: ImportType, accumulate: boolean, filterDate: string | null) => void;
}

function SpreadsheetImportButton({ label, type, dateHint, selectedDate, onImport }: SpreadsheetImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ImportedFile[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    selected.forEach((file, idx) => {
      const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const reader = new FileReader();
      const acc = idx > 0 || files.length > 0;
      reader.onload = (evt) => {
        onImport(evt.target?.result as string | ArrayBuffer, isXLSX, type, acc, selectedDate);
        setFiles((prev) => [...prev, { name: file.name }]);
      };
      isXLSX ? reader.readAsArrayBuffer(file) : reader.readAsText(file, 'UTF-8');
    });
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" multiple className="hidden" onChange={handleFiles} />
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => inputRef.current?.click()}>
          <FileSpreadsheet className="w-3.5 h-3.5" />
          {label}
        </Button>
        {files.length > 0 && (
          <button onClick={() => setFiles([])} className="text-muted-foreground hover:text-destructive transition-colors" title="Limpar">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 pl-1">
        <Filter className="w-2.5 h-2.5 text-muted-foreground/60" />
        <span className="text-[10px] text-muted-foreground/70">
          filtra por <em>{dateHint}</em> = {formatDateBR(selectedDate)}
        </span>
      </div>
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground pl-1">
          <FileSpreadsheet className="w-3 h-3 text-green-500 shrink-0" />
          <span className="truncate max-w-[180px]">{f.name}</span>
        </div>
      ))}
    </div>
  );
}

interface NoDiImportButtonProps {
  label: string;
  onImport: (data: string | ArrayBuffer, isXLSX: boolean, type: ImportType, accumulate: boolean, filterDate: string | null) => void;
  filesImported: ImportedFile[];
  onFilesChange: (files: ImportedFile[]) => void;
}

function NoDiImportButton({ label, onImport, filesImported, onFilesChange }: NoDiImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    const newFiles = [...filesImported];
    selected.forEach((file, idx) => {
      const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const reader = new FileReader();
      reader.onload = (evt) => {
        const acc = idx > 0 || filesImported.length > 0;
        onImport(evt.target?.result as string | ArrayBuffer, isXLSX, 'available', acc, null);
        newFiles.push({ name: file.name });
        onFilesChange([...newFiles]);
      };
      isXLSX ? reader.readAsArrayBuffer(file) : reader.readAsText(file, 'UTF-8');
    });
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" multiple className="hidden" onChange={handleFiles} />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          {label}
        </Button>
        {filesImported.length > 0 && (
          <button onClick={() => onFilesChange([])} className="text-muted-foreground hover:text-destructive transition-colors" title="Limpar">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 pl-1">
        <span className="text-[10px] text-muted-foreground/70">coluna <em>Grupo</em></span>
      </div>
      {filesImported.map((f, i) => (
        <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground pl-1">
          <FileSpreadsheet className="w-3 h-3 text-green-500 shrink-0" />
          <span className="truncate max-w-[180px]">{f.name}</span>
        </div>
      ))}
    </div>
  );
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
    saveAll,
    importSpreadsheet,

    totalReservations,
    totalEstimated,
    avgNoShow,
  } = useReservationProjections();

  const [diFiles, setDiFiles] = useState<ImportedFile[]>([]);
  const [lvFiles, setLvFiles] = useState<ImportedFile[]>([]);
  const [noFiles, setNoFiles] = useState<ImportedFile[]>([]);
  const [cqFiles, setCqFiles] = useState<ImportedFile[]>([]);

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
  const allFilesCount = diFiles.length + lvFiles.length + noFiles.length + cqFiles.length;

  const handleClearNoDI = () => {
    setDiFiles([]);
    setLvFiles([]);
    setNoFiles([]);
    setCqFiles([]);
  };

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
              Dados para <strong>{formatDateBR(selectedDate)}</strong>. Importações de arquivo são filtradas automaticamente por essa data.
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

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border border-dashed border-border bg-muted/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Reservas e Projeção de Retorno (CSV / XLSX)
            </p>
            <div className="flex flex-wrap gap-5">
              <SpreadsheetImportButton
                label="Reservas"
                type="reservations"
                dateHint="Data Ret."
                selectedDate={selectedDate}
                onImport={importSpreadsheet}
              />
              <SpreadsheetImportButton
                label="Projeção de Retorno"
                type="projection"
                dateHint="Data Dev."
                selectedDate={selectedDate}
                onImport={importSpreadsheet}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-dashed border-blue-200 bg-blue-50/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                NO / DI — Veículos Disponíveis (CSV / XLSX)
              </p>
              {allFilesCount > 0 && (
                <button onClick={handleClearNoDI} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <NoDiImportButton label="DI" onImport={importSpreadsheet} filesImported={diFiles} onFilesChange={setDiFiles} />
              <NoDiImportButton label="LV" onImport={importSpreadsheet} filesImported={lvFiles} onFilesChange={setLvFiles} />
              <NoDiImportButton label="NO" onImport={importSpreadsheet} filesImported={noFiles} onFilesChange={setNoFiles} />
              <NoDiImportButton label="CQ" onImport={importSpreadsheet} filesImported={cqFiles} onFilesChange={setCqFiles} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Filtra pela coluna <strong>Data Ret.</strong> igual à data selecionada.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categorias de Veículos</CardTitle>
              <CardDescription>Projeção para {formatDateBR(selectedDate)}</CardDescription>
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
          <span>NO/DI preenchido via importação</span>
        </div>
      </div>
    </div>
  );
}
