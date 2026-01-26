import { useState } from 'react';
import { 
  Car, 
  Clock, 
  Wrench, 
  Building2, 
  Fuel, 
  Droplets, 
  Baby, 
  CheckCircle2, 
  AlertCircle,
  Save,
  History,
  ChevronLeft,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShiftCounter } from './ShiftCounter';
import { useShiftHandover } from '@/hooks/useShiftHandover';
import { ShiftType, SHIFT_LABELS } from '@/types/shift';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
    saveShift,
    setShiftType,
  } = useShiftHandover();

  const shiftTypes: ShiftType[] = ['manha', 'noite', 'madrugada'];

  const handleSave = async () => {
    await saveShift(registeredBy || undefined);
  };

  if (showHistory) {
    return (
      <div className="flex flex-col h-full px-4 py-4 overflow-y-auto scrollbar-hide">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(false)}
            className="rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-bold">Histórico de Turnos</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum registro encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((shift) => (
              <div
                key={shift.id}
                className="bg-card rounded-xl border border-border p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">
                    {SHIFT_LABELS[shift.shift_type as ShiftType]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(shift.created_at!), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Disponível: {shift.di_disponivel}</div>
                  <div>Lavados: {shift.veiculos_lavados}</div>
                  <div>Reservas: {shift.reservas_atendidas}</div>
                  <div>Pendentes: {shift.reservas_pendentes}</div>
                </div>
                {shift.registered_by && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Por: {shift.registered_by}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
            <span className="font-bold">{SHIFT_LABELS[currentShift.shift_type].toLowerCase()}</span>
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
              colorClass="bg-green-600"
            />
            <ShiftCounter
              icon={Car}
              code="LM"
              label="Locação Mensal"
              value={currentShift.lm_locacao_mensal}
              onIncrement={() => incrementField('lm_locacao_mensal')}
              onDecrement={() => decrementField('lm_locacao_mensal')}
              colorClass="bg-blue-600"
            />
            <ShiftCounter
              icon={Clock}
              code="LE"
              label="Locação Diária"
              value={currentShift.le_locacao_diaria}
              onIncrement={() => incrementField('le_locacao_diaria')}
              onDecrement={() => decrementField('le_locacao_diaria')}
              colorClass="bg-yellow-600"
            />
            <ShiftCounter
              icon={Wrench}
              code="FS"
              label="Fora de Serviço"
              value={currentShift.fs_fora_servico}
              onIncrement={() => incrementField('fs_fora_servico')}
              onDecrement={() => decrementField('fs_fora_servico')}
              colorClass="bg-red-600"
            />
            <ShiftCounter
              icon={Building2}
              code="NE"
              label="Oficina Externa"
              value={currentShift.ne_oficina_externa}
              onIncrement={() => incrementField('ne_oficina_externa')}
              onDecrement={() => decrementField('ne_oficina_externa')}
              colorClass="bg-blue-500"
            />
            <ShiftCounter
              icon={Wrench}
              code="FE"
              label="Funilaria Externa"
              value={currentShift.fe_funilaria_externa}
              onIncrement={() => incrementField('fe_funilaria_externa')}
              onDecrement={() => decrementField('fe_funilaria_externa')}
              colorClass="bg-purple-600"
            />
            <ShiftCounter
              icon={Car}
              code="TG"
              label="Triagem de Manutenção"
              value={currentShift.tg_triagem_manutencao}
              onIncrement={() => incrementField('tg_triagem_manutencao')}
              onDecrement={() => decrementField('tg_triagem_manutencao')}
              colorClass="bg-gray-600"
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
              colorClass="bg-green-500"
            />
            <ShiftCounter
              icon={Droplets}
              label="Veículos Lavados"
              value={currentShift.veiculos_lavados}
              onIncrement={() => incrementField('veiculos_lavados')}
              onDecrement={() => decrementField('veiculos_lavados')}
              colorClass="bg-blue-500"
            />
            <ShiftCounter
              icon={Car}
              label="Veículos Sujos na Gaveta"
              value={currentShift.veiculos_sujos_gaveta}
              onIncrement={() => incrementField('veiculos_sujos_gaveta')}
              onDecrement={() => decrementField('veiculos_sujos_gaveta')}
              colorClass="bg-yellow-500"
            />
            <ShiftCounter
              icon={Baby}
              label="Qnt. Cadeirinhas"
              value={currentShift.qnt_cadeirinhas}
              onIncrement={() => incrementField('qnt_cadeirinhas')}
              onDecrement={() => decrementField('qnt_cadeirinhas')}
              colorClass="bg-pink-500"
            />
            <ShiftCounter
              icon={Baby}
              label="Qnt. Bebê Conforto"
              value={currentShift.qnt_bebe_conforto}
              onIncrement={() => incrementField('qnt_bebe_conforto')}
              onDecrement={() => decrementField('qnt_bebe_conforto')}
              colorClass="bg-pink-600"
            />
            <ShiftCounter
              icon={Baby}
              label="Qnt. Assentos de Elevação"
              value={currentShift.qnt_assentos_elevacao}
              onIncrement={() => incrementField('qnt_assentos_elevacao')}
              onDecrement={() => decrementField('qnt_assentos_elevacao')}
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
              colorClass="bg-green-500"
            />
            <ShiftCounter
              icon={AlertCircle}
              label="Reservas Pendentes"
              value={currentShift.reservas_pendentes}
              onIncrement={() => incrementField('reservas_pendentes')}
              onDecrement={() => decrementField('reservas_pendentes')}
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
          />
        </div>

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
