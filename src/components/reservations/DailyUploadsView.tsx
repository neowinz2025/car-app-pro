import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Upload, Trash2, FileSpreadsheet, FileText, RefreshCw, CircleCheck as CheckCircle2, Clock, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFileUploads, FileType } from '@/hooks/useFileUploads';

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const FILE_TYPES: { key: FileType; label: string; description: string; accept: string; color: string }[] = [
  {
    key: 'reservations',
    label: 'Reservas',
    description: 'Separa por Data Ret. (todos os dias)',
    accept: '.csv,.xlsx,.xls',
    color: 'blue',
  },
  {
    key: 'reservations_today',
    label: 'Reservas do Dia',
    description: 'Apenas da data selecionada',
    accept: '.csv,.xlsx,.xls',
    color: 'indigo',
  },
  {
    key: 'projection',
    label: 'Projeção de Retorno',
    description: 'Coluna Data Dev.',
    accept: '.csv,.xlsx,.xls',
    color: 'green',
  },
  {
    key: 'di',
    label: 'DI',
    description: 'Disponível / Data Ret.',
    accept: '.csv,.xlsx,.xls,.pdf',
    color: 'amber',
  },
  {
    key: 'lv',
    label: 'LV',
    description: 'Disponível / Data Ret.',
    accept: '.csv,.xlsx,.xls,.pdf',
    color: 'amber',
  },
  {
    key: 'no',
    label: 'NO',
    description: 'Disponível / Data Ret.',
    accept: '.csv,.xlsx,.xls,.pdf',
    color: 'amber',
  },
  {
    key: 'cq',
    label: 'CQ',
    description: 'Disponível / Data Ret.',
    accept: '.csv,.xlsx,.xls,.pdf',
    color: 'amber',
  },
];

const COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
};

const BADGE_MAP: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
};

interface UploadCardProps {
  fileType: typeof FILE_TYPES[number];
  uploadDate: string;
  existingFiles: { id: string; file_name: string; row_count: number; uploaded_at: string; upload_date: string }[];
  onUpload: (file: File, type: FileType, date: string) => Promise<boolean>;
  onDelete: (id: string, date: string) => void;
  uploading: boolean;
}

function UploadCard({ fileType, uploadDate, existingFiles, onUpload, onDelete, uploading }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localUploading, setLocalUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setLocalUploading(true);
    for (const file of selected) {
      await onUpload(file, fileType.key, uploadDate);
    }
    setLocalUploading(false);
    e.target.value = '';
  };

  const isLoading = uploading && localUploading;
  const hasFiles = existingFiles.length > 0;
  const colorClass = COLOR_MAP[fileType.color];
  const badgeClass = BADGE_MAP[fileType.color];

  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
              {fileType.label}
            </span>
            {hasFiles && (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            )}
          </div>
          <p className="text-xs mt-1 opacity-70">{fileType.description}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={fileType.accept}
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs shrink-0 bg-white/80 hover:bg-white"
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {isLoading ? 'Importando...' : 'Enviar'}
        </Button>
      </div>

      {hasFiles ? (
        <div className="space-y-1.5">
          {existingFiles.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-2 bg-white/70 rounded-md px-2.5 py-1.5"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {f.file_name.toLowerCase().endsWith('.pdf') ? (
                  <FileText className="w-3.5 h-3.5 shrink-0 text-red-500" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-green-600" />
                )}
                <span className="text-xs font-medium truncate max-w-[120px]">{f.file_name}</span>
                <span className="text-xs text-muted-foreground shrink-0">{f.row_count} veíc.</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatTime(f.uploaded_at)}
                </span>
                <button
                  onClick={() => onDelete(f.id, uploadDate)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Remover arquivo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={async () => {
              for (const f of existingFiles) {
                await onDelete(f.id, uploadDate);
              }
            }}
            className="flex items-center justify-center gap-1.5 w-full mt-2 px-3 py-1.5 rounded-md text-xs font-medium text-destructive bg-white/80 border border-destructive/30 hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir {existingFiles.length > 1 ? 'todos' : 'arquivo'}
          </button>
        </div>
      ) : (
        <p className="text-xs opacity-60 italic">Nenhum arquivo para essa data</p>
      )}
    </div>
  );
}

export function DailyUploadsView() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [clearConfirm, setClearConfirm] = useState(false);
  const { uploads, uploading, loadingList, loadUploads, uploadFile, deleteUpload, clearAllData } = useFileUploads();

  useEffect(() => {
    loadUploads(selectedDate);
  }, [loadUploads, selectedDate]);

  const getFilesForType = (type: FileType) =>
    uploads.filter((u) => u.file_type === type);

  const totalFiles = uploads.length;
  const totalVehicles = uploads.reduce((s, u) => s + u.row_count, 0);

  return (
    <div className="space-y-6">
      <Card className="border border-blue-100 bg-blue-50/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700">
              Ao enviar um arquivo, os dados sao distribuídos automaticamente para cada data encontrada dentro do arquivo. Não é necessário selecionar a data antes de enviar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botão de emergência para limpar dados acumulados */}
      <div className="flex justify-end">
        {clearConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-destructive font-medium">Confirme: apagar TODOS os dados do banco?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => { await clearAllData(); setClearConfirm(false); }}
            >
              Sim, apagar tudo
            </Button>
            <Button variant="outline" size="sm" onClick={() => setClearConfirm(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setClearConfirm(true)}
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Limpar Todos os Dados do Banco
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Enviar Arquivos</CardTitle>
          <CardDescription>
            Envie os arquivos completos (com múltiplas datas). Os dados serão distribuídos automaticamente por data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FILE_TYPES.map((ft) => (
              <UploadCard
                key={ft.key}
                fileType={ft}
                uploadDate={selectedDate}
                existingFiles={getFilesForType(ft.key)}
                onUpload={uploadFile}
                onDelete={deleteUpload}
                uploading={uploading}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-muted/10">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Visualizar arquivos da data
                </p>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border rounded px-3 h-9 text-sm bg-background cursor-pointer font-medium"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {loadingList ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    <strong className="text-foreground">{totalFiles}</strong> arquivo{totalFiles !== 1 ? 's' : ''}
                  </span>
                  <span>
                    <strong className="text-foreground">{totalVehicles}</strong> veículos
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {totalFiles > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Arquivos de {formatDateBR(selectedDate)}</CardTitle>
            <CardDescription>
              Arquivos que foram importados com dados para esta data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FILE_TYPES.map((ft) => {
                const files = getFilesForType(ft.key);
                if (files.length === 0) return null;
                const colorClass = COLOR_MAP[ft.color];
                const badgeClass = BADGE_MAP[ft.color];
                return (
                  <div key={ft.key} className={`rounded-lg border p-4 ${colorClass}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {ft.label}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="space-y-1.5">
                      {files.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center justify-between gap-2 bg-white/70 rounded-md px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {f.file_name.toLowerCase().endsWith('.pdf') ? (
                              <FileText className="w-3.5 h-3.5 shrink-0 text-red-500" />
                            ) : (
                              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-green-600" />
                            )}
                            <span className="text-xs font-medium truncate max-w-[120px]">{f.file_name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{f.row_count} veíc.</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatTime(f.uploaded_at)}
                            </span>
                            <button
                              onClick={() => deleteUpload(f.id, selectedDate)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Remover arquivo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
