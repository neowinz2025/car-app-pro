import { useState } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  Car, 
  Wrench, 
  Building2, 
  Fuel, 
  Droplets, 
  Baby,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShiftHandover, ShiftType, SHIFT_LABELS } from '@/types/shift';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ShiftHistoryViewProps {
  history: ShiftHandover[];
  isLoading: boolean;
  onBack: () => void;
}

export function ShiftHistoryView({ history, isLoading, onBack }: ShiftHistoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatShiftForWhatsApp = (shift: ShiftHandover) => {
    const date = format(new Date(shift.created_at!), 'dd/MM/yyyy', { locale: ptBR });
    const time = format(new Date(shift.created_at!), 'HH:mm', { locale: ptBR });
    
    const total = shift.di_disponivel + 
                  shift.fs_fora_servico + 
                  shift.ne_oficina_externa + 
                  shift.fe_funilaria_externa + 
                  shift.do_retorno_oficina;

    return `📋 *PASSAGEM DE TURNO*
📅 ${date} às ${time}
🕐 Turno: *${SHIFT_LABELS[shift.shift_type as ShiftType]}*

━━━━━━━━━━━━━━━━━━━━
🚗 *STATUS DA FROTA*
━━━━━━━━━━━━━━━━━━━━
🟢 DI - Disponível: *${shift.di_disponivel}*
🔴 FS - Fora de Serviço: *${shift.fs_fora_servico}*
🔷 NE - Oficina Externa: *${shift.ne_oficina_externa}*
🟣 FE - Funilaria Externa: *${shift.fe_funilaria_externa}*
🔵 DO - Retorno de Oficina: *${shift.do_retorno_oficina}*
📊 *TOTAL: ${total}*

━━━━━━━━━━━━━━━━━━━━
📝 *OUTRAS INFORMAÇÕES*
━━━━━━━━━━━━━━━━━━━━
⛽ Carros Abastecidos: *${shift.carros_abastecidos}*
💧 Veículos Lavados: *${shift.veiculos_lavados}*
🚙 Veículos Sujos na Gaveta: *${shift.veiculos_sujos_gaveta}*
👶 Cadeirinhas: *${shift.qnt_cadeirinhas}*
🍼 Bebê Conforto: *${shift.qnt_bebe_conforto}*
🪑 Assentos de Elevação: *${shift.qnt_assentos_elevacao}*

━━━━━━━━━━━━━━━━━━━━
📊 *RESERVAS*
━━━━━━━━━━━━━━━━━━━━
✅ Atendidas: *${shift.reservas_atendidas}*
⏳ Pendentes: *${shift.reservas_pendentes}*
${shift.registered_by ? `\n👤 Registrado por: *${shift.registered_by}*` : ''}`;
  };

  const handleCopy = async (shift: ShiftHandover) => {
    try {
      await navigator.clipboard.writeText(formatShiftForWhatsApp(shift));
      setCopiedId(shift.id!);
      toast.success('Copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1e3a5f] text-white px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20 rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">Histórico de Passagens</h2>
            <p className="text-xs text-white/70">{history.length} registros</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhuma passagem registrada
            </p>
          </div>
        ) : (
          history.map((shift) => {
            const isExpanded = expandedId === shift.id;
            const total = shift.di_disponivel + 
                          shift.fs_fora_servico + 
                          shift.ne_oficina_externa + 
                          shift.fe_funilaria_externa + 
                          shift.do_retorno_oficina;

            return (
              <div
                key={shift.id}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : shift.id!)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        {SHIFT_LABELS[shift.shift_type as ShiftType]}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(shift.created_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{total}</div>
                    <div className="text-xs text-muted-foreground">veículos</div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-fade-in">
                    {/* Fleet Status */}
                    <div className="bg-muted/30 rounded-xl p-3">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">STATUS DA FROTA</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                          <span>DI: {shift.di_disponivel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-600" />
                          <span>FS: {shift.fs_fora_servico}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>NE: {shift.ne_oficina_externa}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-600" />
                          <span>FE: {shift.fe_funilaria_externa}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-cyan-600" />
                          <span>DO: {shift.do_retorno_oficina}</span>
                        </div>
                      </div>
                    </div>

                    {/* Other Info */}
                    <div className="bg-muted/30 rounded-xl p-3">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">OUTRAS INFORMAÇÕES</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Fuel className="w-3 h-3" />
                          <span>Abastecidos: {shift.carros_abastecidos}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Droplets className="w-3 h-3" />
                          <span>Lavados: {shift.veiculos_lavados}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="w-3 h-3" />
                          <span>Sujos: {shift.veiculos_sujos_gaveta}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Baby className="w-3 h-3" />
                          <span>Cadeirinhas: {shift.qnt_cadeirinhas}</span>
                        </div>
                      </div>
                    </div>

                    {/* Reservations */}
                    <div className="bg-muted/30 rounded-xl p-3">
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">RESERVAS</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span>Atendidas: {shift.reservas_atendidas}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-3 h-3 text-yellow-500" />
                          <span>Pendentes: {shift.reservas_pendentes}</span>
                        </div>
                      </div>
                    </div>

                    {shift.registered_by && (
                      <div className="text-sm text-muted-foreground">
                        Registrado por: <strong>{shift.registered_by}</strong>
                      </div>
                    )}

                    {/* Copy Button */}
                    <Button
                      onClick={() => handleCopy(shift)}
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                    >
                      {copiedId === shift.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar para WhatsApp
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
