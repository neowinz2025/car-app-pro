import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Copy,
  Save,
  Plus,
  Trash2,
  MessageSquare,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buildReportText, STATUS_OPTIONS, BateReservaRow } from '@/hooks/useBateReserva';
import { useBateReserva } from '@/hooks/useBateReserva';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  OK: 'bg-green-100 text-green-700 border-green-300',
  FALTA: 'bg-red-100 text-red-700 border-red-300',
  LAVANDO: 'bg-blue-100 text-blue-700 border-blue-300',
  OFICINA: 'bg-amber-100 text-amber-700 border-amber-300',
  INDISPONIVEL: 'bg-gray-100 text-gray-700 border-gray-300',
};

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function StatusBadge({
  value,
  faltaCount,
  onChange,
}: {
  value: string;
  faltaCount: number;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const displayLabel = value.startsWith('FALTA') && faltaCount > 0
    ? `FALTA ${faltaCount}`
    : value;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'px-2 py-1 rounded-md text-xs font-bold border whitespace-nowrap transition-colors',
          STATUS_COLORS[value.split(' ')[0]] ?? STATUS_COLORS['FALTA']
        )}
      >
        {displayLabel}
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-card border border-border rounded-lg shadow-lg min-w-[130px] py-1 flex flex-col">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={cn(
                'text-left px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors',
                opt === value.split(' ')[0] && 'bg-muted'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  row,
  onUpdate,
  onRemove,
  isCustom,
}: {
  row: BateReservaRow;
  onUpdate: (field: keyof BateReservaRow, value: string | number) => void;
  onRemove: () => void;
  isCustom: boolean;
}) {
  const isFalta = row.status.startsWith('FALTA');
  const available = row.total - (row.status === 'OK' ? row.total : 0);
  const faltaCount = isFalta ? (parseInt(row.status.split(' ')[1] ?? '0') || row.total) : 0;

  return (
    <tr className={cn(
      'border-b border-border last:border-0 transition-colors',
      row.total > 0 ? 'bg-background hover:bg-muted/20' : 'bg-muted/10 opacity-60'
    )}>
      <td className="py-2 px-2 w-14">
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-10 px-1.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-sm">
            {row.category}
          </span>
          {isCustom && (
            <button
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Remover categoria"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </td>
      <td className="py-1.5 px-2 w-20">
        <Input
          type="number"
          min={0}
          value={row.total === 0 ? '' : row.total}
          placeholder="0"
          onChange={(e) => onUpdate('total', Math.max(0, parseInt(e.target.value) || 0))}
          className="w-16 h-8 text-center font-medium mx-auto block"
        />
      </td>
      <td className="py-1.5 px-2">
        <Input
          type="text"
          value={row.times}
          placeholder="ex: 06:30, (4)10:00, 14:00"
          onChange={(e) => onUpdate('times', e.target.value)}
          className="h-8 text-sm font-mono"
        />
      </td>
      <td className="py-2 px-2 w-28 text-right">
        <StatusBadge
          value={row.status}
          faltaCount={faltaCount}
          onChange={(v) => {
            if (v === 'FALTA') {
              onUpdate('status', row.total > 0 ? `FALTA ${row.total}` : 'FALTA');
            } else {
              onUpdate('status', v);
            }
          }}
        />
      </td>
    </tr>
  );
}

const DEFAULT_CATEGORIES = [
  'AM','AT','B','BS','C','CA','CX','CG',
  'E','EA','G1','G2','I','IE','LX','SG',
  'SM','SP','SU','SV','T','TT','TS','J','VU','VC',
];

export function BateReservaView() {

  const [previewOpen, setPreviewOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Smart Paste State
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [hideEmpty, setHideEmpty] = useState(false); // Hide empty categories toggle

  const {
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
    injectSmartPaste
  } = useBateReserva();

  useEffect(() => {
    load(selectedDate);
  }, [load, selectedDate]);

  const activeRows = report.rows.filter((r) => r.total > 0);
  const totalReservations = activeRows.reduce((s, r) => s + r.total, 0);
  const previewText = buildReportText(report);

  const handleCopy = async () => {
    await copyToClipboard();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddCategory = () => {
    const cat = newCategory.trim().toUpperCase();
    if (!cat) return;
    addCustomCategory(cat);
    setNewCategory('');
  };

  const handleSmartPasteSubmit = () => {
    const importedCount = injectSmartPaste(pasteText);
    if (importedCount > 0) {
      toast.success(`${importedCount} reservas importadas automaticamente!`);
      setShowSmartPaste(false);
      setPasteText('');
      setHideEmpty(true); // Auto-hide empties to show what was imported beautifully
    } else {
      toast.error('Nenhuma reserva válida detectada no formato (Cole direto da tabela do Uni+)');
    }
  };

  const visibleRows = hideEmpty ? activeRows : report.rows;

  return (
    <div className="space-y-6 relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex justify-center items-start pt-16 bg-background/60 backdrop-blur-sm rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Smart Paste Modal */}
      {showSmartPaste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl animate-in slide-in-from-bottom-10 fade-in zoom-in-95">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-blue-500" />
                Preenchimento Mágico (Smart Paste)
              </CardTitle>
              <CardDescription>
                Vá até a tabela "Buscar Reserva" no <strong>uni+</strong>, selecione as linhas das reservas pendentes, dê <strong>Ctrl+C</strong> e cole aqui embaixo com <strong>Ctrl+V</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Exemplo colado:&#10;BSB2  |  31284859  |  SEGURPRO...  |  12/05/2026 10:00  |  CA  |  CFA..."
                className="w-full h-48 p-4 text-sm font-mono border-2 border-dashed border-blue-300 rounded-xl bg-blue-50/50 focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setShowSmartPaste(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSmartPasteSubmit} disabled={!pasteText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Extrair e Preencher
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border border-border bg-muted/10">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Data do Relatório
                </p>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => changeDate(e.target.value)}
                    className="border rounded px-3 h-9 text-sm bg-background cursor-pointer font-medium"
                  />
                </div>
              </div>
              <div className="h-8 w-px bg-border hidden md:block" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Período
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={report.period_start}
                    onChange={(e) => updatePeriod('period_start', e.target.value)}
                    className="w-28 h-9 text-sm font-medium"
                  />
                  <span className="text-muted-foreground text-sm">até</span>
                  <Input
                    type="time"
                    value={report.period_end}
                    onChange={(e) => updatePeriod('period_end', e.target.value)}
                    className="w-28 h-9 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md mr-2"
                onClick={() => setShowSmartPaste(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Importar Uni+ (Ctrl+V)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setPreviewOpen((o) => !o)}
              >
                {previewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {previewOpen ? 'Ocultar WA' : 'Preview WA'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'gap-1.5 text-xs',
                  copied && 'border-green-400 text-green-600 bg-green-50'
                )}
                onClick={handleCopy}
                disabled={totalReservations === 0}
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={save}
                disabled={saving}
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-0 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground font-medium">Total Reservas</p>
            <p className="text-2xl font-bold text-primary">{totalReservations}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-green-500/5">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground font-medium">Categorias Ativas</p>
            <p className="text-2xl font-bold text-green-600">{activeRows.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-500/5 col-span-2 md:col-span-1">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">Com Falta</p>
              {report.rows.filter((r) => r.status.startsWith('FALTA') && r.total > 0).length > 0 && (
                 <span className="flex w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-bold text-red-500">
              {report.rows.filter((r) => r.status.startsWith('FALTA') && r.total > 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {previewOpen && (
        <Card className="border border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <CardTitle className="text-sm text-green-700">Preview — WhatsApp</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-green-700 hover:bg-green-100"
                onClick={handleCopy}
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <pre className="text-sm font-mono whitespace-pre-wrap text-green-900 bg-white/70 rounded-lg p-4 border border-green-200 leading-relaxed">
              {previewText || '(preencha os dados acima)'}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Categorias de Veículos</CardTitle>
              <CardDescription>
                {formatDateBR(selectedDate)} — informe total, horários e status por grupo
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* Ocultar Vazios Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={hideEmpty}
                    onChange={(e) => setHideEmpty(e.target.checked)}
                  />
                  <div className={cn("w-10 h-5 rounded-full transition-colors", hideEmpty ? "bg-primary" : "bg-muted-foreground/30")}></div>
                  <div className={cn("absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform", hideEmpty ? "translate-x-5" : "")}></div>
                </div>
                <span>Ocultar vazios</span>
              </label>
              
              <div className="h-6 w-px bg-border"></div>

              <div className="flex items-center gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Nova categ."
                  className="w-24 h-8 text-sm uppercase rounded-lg"
                  maxLength={6}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8 rounded-lg"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim()}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 shadow-sm">
                <tr>
                  <th className="text-left py-2.5 px-2 font-semibold text-muted-foreground w-20">GRUPO</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-muted-foreground w-20">TOTAL</th>
                  <th className="text-left py-2.5 px-2 font-semibold text-muted-foreground">
                    <span className="flex flex-col leading-tight">
                      <span>HORÁRIOS</span>
                      <span className="text-[10px] font-normal text-muted-foreground/70">ex: 06:30, (4)10:00, 14:15</span>
                    </span>
                  </th>
                  <th className="text-right py-2.5 px-2 font-semibold text-muted-foreground w-28 pr-4">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground bg-muted/10">
                      <p className="text-base font-semibold">Nenhuma categoria ativa encontrada</p>
                      <p className="text-sm mt-1 mb-4">Adicione manualmente ou importe do Uni+</p>
                      <Button variant="outline" onClick={() => setHideEmpty(false)}>Mostrar todas as categorias</Button>
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <CategoryRow
                      key={row.category}
                      row={row}
                      onUpdate={(field, value) => updateRow(row.category, field, value)}
                      onRemove={() => removeRow(row.category)}
                      isCustom={!DEFAULT_CATEGORIES.includes(row.category)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Observações Adicionais</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={report.notes || ''}
            onChange={(e) => updateNotes(e.target.value)}
            placeholder="Adicione observações para colar ao final do relatório (opcional)..."
            className="w-full min-h-[80px] rounded-xl border-2 border-border/50 bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors"
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground px-1 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-green-100 border border-green-300 shadow-sm" />
          <span>OK</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-red-100 border border-red-300 shadow-sm" />
          <span>FALTA (define automaticamente a quantidade com base no total preenchido)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-blue-100 border border-blue-300 shadow-sm" />
          <span>LAVANDO</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-amber-100 border border-amber-300 shadow-sm" />
          <span>OFICINA</span>
        </div>
      </div>
    </div>
  );
}
