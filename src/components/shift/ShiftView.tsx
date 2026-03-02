import { useState, useEffect } from 'react';
import { 
  Car, 
  Wrench, 
  Building2, 
  Fuel, 
  Droplets, 
  Baby, 
  CheckCircle2, 
  AlertCircle,
  Save,
  History,
  Calendar,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShiftCounter } from './ShiftCounter';
import { ShiftHistoryView } from './ShiftHistoryView';
import { useShiftHandover } from '@/hooks/useShiftHandover';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ShiftType, SHIFT_LABELS } from '@/types/shift';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ShiftView() {
  const [showHistory, setShowHistory] = useState(false);
  const [registeredBy, setRegisteredBy] = useState('');

  const {
    currentShift,
    history,
    isLoading,
    isSaving,
    incrementField,
    decrementField,
    setFieldValue,
    saveShift,
    setShiftType,
  } = useShiftHandover();

  const { getStoreId } = useCurrentUser();

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        setRegisteredBy(sessionData.name || '');
      } catch (error) {
        console.error('Error loading user session:', error);
      }
    }
  }, []);

  const [copied, setCopied] = useState(false);
  const shiftTypes: ShiftType[] = ['manha', 'noite', 'madrugada'];

  const handleSave = async () => {
    const storeId = getStoreId();
    await saveShift(registeredBy || undefined, storeId || undefined);
  };

  const formatForWhatsApp = () => {
    const date = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
    const time = format(new Date(), 'HH:mm', { locale: ptBR });
    
    const total = currentShift.di_disponivel + 
                  currentShift.fs_fora_servico + 
                  currentShift.ne_oficina_externa + 
                  currentShift.fe_funilaria_externa + 
                  currentShift.do_retorno_oficina;

    const message = `📋 *PASSAGEM DE TURNO*
📅 ${date} às ${time}
🕐 Turno: *${SHIFT_LABELS[currentShift.shift_type as ShiftType]}*

━━━━━━━━━━━━━━━━━━━━
🚗 *STATUS DA FROTA*
━━━━━━━━━━━━━━━━━━━━
🟢 DI - Disponível: *${currentShift.di_disponivel}*
🔴 FS - Fora de Serviço: *${currentShift.fs_fora_servico}*
🔷 NE - Oficina Externa: *${currentShift.ne_oficina_externa}*
🟣 FE - Funilaria Externa: *${currentShift.fe_funilaria_externa}*
🔵 DO - Retorno de Oficina: *${currentShift.do_retorno_oficina}*
📊 *TOTAL: ${total}*

━━━━━━━━━━━━━━━━━━━━
📝 *OUTRAS INFORMAÇÕES*
━━━━━━━━━━━━━━━━━━━━
⛽ Carros Abastecidos: *${currentShift.carros_abastecidos}*
💧 Veículos Lavados: *${currentShift.veiculos_lavados}*
🚙 Veículos Sujos na Gaveta: *${currentShift.veiculos_sujos_gaveta}*
👶 Cadeirinhas: *${currentShift.qnt_cadeirinhas}*
🍼 Bebê Conforto: *${currentShift.qnt_bebe_conforto}*
🪑 Assentos de Elevação: *${currentShift.qnt_assentos_elevacao}*

━━━━━━━━━━━━━━━━━━━━
📊 *RESERVAS*
━━━━━━━━━━━━━━━━━━━━
✅ Atendidas: *${currentShift.reservas_atendidas}*
⏳ Pendentes: *${currentShift.reservas_pendentes}*
${registeredBy ? `\n👤 Registrado por: *${registeredBy}*` : ''}`;

    return message;
  };

  const handleCopyToClipboard = async () => {
    const message = formatForWhatsApp();
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success('Copiado!', { description: 'Cole no WhatsApp' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  if (showHistory) {
    return (
      <ShiftHistoryView 
        history={history} 
        isLoading={isLoading} 
        onBack={() => setShowHistory(false)} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Passagem de Turno</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(true)}
            className="text-white hover:bg-white/20 rounded-xl"
          >
            <History className="w-5 h-5" />
          </Button>
        </div>

        {/* Shift Type Selector */}
        <div className="flex gap-1 bg-white/10 rounded-xl p-1">
          {shiftTypes.map((type) => (
            <button
              key={type}
              onClick={() => setShiftType(type)}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                currentShift.shift_type === type
                  ? 'bg-[#c4a000] text-black'
                  : 'text-white hover:bg-white/10'
              )}
            >
              {SHIFT_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3 text-sm">
          <Calendar className="w-4 h-4" />
          <span>
            {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })} às{' '}
            <span className="font-bold">{SHIFT_LABELS[currentShift.shift_type as ShiftType].toLowerCase()}</span>
          </span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* STATUS DA FROTA */}
        <div>
          <h3 className="text-center font-bold mb-3 py-2 bg-[#1e3a5f] text-white rounded-xl">
            STATUS DA FROTA
          </h3>
          <div className="space-y-2">
            <ShiftCounter
              icon={Car}
              code="DI"
              label="Disponível"
              value={currentShift.di_disponivel}
              onIncrement={() => incrementField('di_disponivel')}
              onDecrement={() => decrementField('di_disponivel')}
              onValueChange={(v) => setFieldValue('di_disponivel', v)}
              colorClass="bg-green-600"
            />
            <ShiftCounter
              icon={Wrench}
              code="FS"
              label="Fora de Serviço"
              value={currentShift.fs_fora_servico}
              onIncrement={() => incrementField('fs_fora_servico')}
              onDecrement={() => decrementField('fs_fora_servico')}
              onValueChange={(v) => setFieldValue('fs_fora_servico', v)}
              colorClass="bg-red-600"
            />
            <ShiftCounter
              icon={Building2}
              code="NE"
              label="Oficina Externa"
              value={currentShift.ne_oficina_externa}
              onIncrement={() => incrementField('ne_oficina_externa')}
              onDecrement={() => decrementField('ne_oficina_externa')}
              onValueChange={(v) => setFieldValue('ne_oficina_externa', v)}
              colorClass="bg-blue-500"
            />
            <ShiftCounter
              icon={Wrench}
              code="FE"
              label="Funilaria Externa"
              value={currentShift.fe_funilaria_externa}
              onIncrement={() => incrementField('fe_funilaria_externa')}
              onDecrement={() => decrementField('fe_funilaria_externa')}
              onValueChange={(v) => setFieldValue('fe_funilaria_externa', v)}
              colorClass="bg-purple-600"
            />
            <ShiftCounter
              icon={RotateCcw}
              code="DO"
              label="Retorno de Oficina"
              value={currentShift.do_retorno_oficina}
              onIncrement={() => incrementField('do_retorno_oficina')}
              onDecrement={() => decrementField('do_retorno_oficina')}
              onValueChange={(v) => setFieldValue('do_retorno_oficina', v)}
              colorClass="bg-cyan-600"
            />
          </div>
        </div>

        {/* OUTRAS INFORMAÇÕES */}
        <div>
          <h3 className="text-center font-bold mb-3 py-2 bg-[#1e3a5f] text-white rounded-xl">
            OUTRAS INFORMAÇÕES
          </h3>
          <div className="space-y-2">
            <ShiftCounter
              icon={Fuel}
              label="Carros Abastecidos"
              value={currentShift.carros_abastecidos}
              onIncrement={() => incrementField('carros_abastecidos')}
              onDecrement={() => decrementField('carros_abastecidos')}
              onValueChange={(v) => setFieldValue('carros_abastecidos', v)}
              colorClass="bg-green-500"
            />
            <ShiftCounter
              icon={Droplets}
              label="Veículos Lavados"
              value={currentShift.veiculos_lavados}
              onIncrement={() => incrementField('veiculos_lavados')}
              onDecrement={() => decrementField('veiculos_lavados')}
              onValueChange={(v) => setFieldValue('veiculos_lavados', v)}
              colorClass="bg-blue-500"
            />
            <ShiftCounter
              icon={Car}
              label="Veículos Sujos na Gaveta"
              value={currentShift.veiculos_sujos_gaveta}
              onIncrement={() => incrementField('veiculos_sujos_gaveta')}
              onDecrement={() => decrementField('veiculos_sujos_gaveta')}
              onValueChange={(v) => setFieldValue('veiculos_sujos_gaveta', v)}
              colorClass="bg-yellow-500"
            />
            <ShiftCounter
              icon={Baby}
              label="Qnt. Cadeirinhas"
              value={currentShift.qnt_cadeirinhas}
              onIncrement={() => incrementField('qnt_cadeirinhas')}
              onDecrement={() => decrementField('qnt_cadeirinhas')}
              onValueChange={(v) => setFieldValue('qnt_cadeirinhas', v)}
              colorClass="bg-pink-500"
            />
            <ShiftCounter
              icon={Baby}
              label="Qnt. Bebê Conforto"
              value={currentShift.qnt_bebe_conforto}
              onIncrement={() => incrementField('qnt_bebe_conforto')}
              onDecrement={() => decrementField('qnt_bebe_conforto')}
              onValueChange={(v) => setFieldValue('qnt_bebe_conforto', v)}
              colorClass="bg-pink-600"
            />
            <ShiftCounter
              icon={Baby}
              label="Qnt. Assentos de Elevação"
              value={currentShift.qnt_assentos_elevacao}
              onIncrement={() => incrementField('qnt_assentos_elevacao')}
              onDecrement={() => decrementField('qnt_assentos_elevacao')}
              onValueChange={(v) => setFieldValue('qnt_assentos_elevacao', v)}
              colorClass="bg-pink-400"
            />
          </div>
        </div>

        {/* RESERVAS */}
        <div>
          <h3 className="text-center font-bold mb-3 py-2 bg-[#1e3a5f] text-white rounded-xl">
            RESERVAS
          </h3>
          <div className="space-y-2">
            <ShiftCounter
              icon={CheckCircle2}
              label="Reservas Atendidas"
              value={currentShift.reservas_atendidas}
              onIncrement={() => incrementField('reservas_atendidas')}
              onDecrement={() => decrementField('reservas_atendidas')}
              onValueChange={(v) => setFieldValue('reservas_atendidas', v)}
              colorClass="bg-green-500"
            />
            <ShiftCounter
              icon={AlertCircle}
              label="Reservas Pendentes"
              value={currentShift.reservas_pendentes}
              onIncrement={() => incrementField('reservas_pendentes')}
              onDecrement={() => decrementField('reservas_pendentes')}
              onValueChange={(v) => setFieldValue('reservas_pendentes', v)}
              colorClass="bg-blue-500"
            />
          </div>
        </div>

        {/* Registered By */}
        <div className="bg-card rounded-xl border border-border p-4">
          <label className="text-sm font-medium mb-2 block">Registrado por:</label>
          <Input
            placeholder="Seu nome"
            value={registeredBy}
            onChange={(e) => setRegisteredBy(e.target.value)}
            className="rounded-xl"
            disabled
          />
        </div>

        {/* Copy to WhatsApp Button */}
        <Button
          onClick={handleCopyToClipboard}
          variant="outline"
          className="w-full h-12 rounded-xl border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 font-semibold"
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              COPIADO!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 mr-2" />
              COPIAR PARA WHATSAPP
            </>
          )}
        </Button>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 rounded-xl bg-[#1e5f3a] hover:bg-[#1e5f3a]/90 text-white font-bold text-lg"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              SALVAR PASSAGEM DE TURNO
            </>
          )}
        </Button>
      </div>
    </div>
  );
}