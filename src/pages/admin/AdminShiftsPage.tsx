import { User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useShifts } from '@/hooks/api/useShifts';

export default function AdminShiftsPage() {
  const { shifts, isLoading } = useShifts();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passagens de Turno</CardTitle>
        <CardDescription>
          Histórico completo das passagens de turno ({shifts.length} registros)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma passagem de turno encontrada
          </div>
        ) : (
          <div className="space-y-6">
            {shifts.map((shift) => {
              const totalVeiculos = shift.di_disponivel + shift.lm_locacao_mensal + shift.le_locacao_diaria +
                shift.fs_fora_servico + shift.ne_oficina_externa + shift.fe_funilaria_externa +
                shift.tg_triagem_manutencao + shift.do_retorno_oficina;

              const shiftLabels: { [key: string]: string } = {
                'manha': 'Manhã',
                'noite': 'Noite',
                'madrugada': 'Madrugada'
              };

              return (
                <div
                  key={shift.id}
                  className="p-5 border-2 border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-bold">
                          {shiftLabels[shift.shift_type] || shift.shift_type}
                        </div>
                        <span className="text-lg font-semibold">
                          {format(new Date(shift.shift_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{shift.registered_by || 'Sistema'}</span>
                        <span className="mx-1">•</span>
                        <span>Registrado em {format(new Date(shift.registered_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">{totalVeiculos}</div>
                      <div className="text-xs text-muted-foreground">Total Veículos</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">DI - Disponível</div>
                      <div className="text-2xl font-bold text-green-600">{shift.di_disponivel}</div>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">LM - Locação Mensal</div>
                      <div className="text-2xl font-bold text-blue-600">{shift.lm_locacao_mensal}</div>
                    </div>
                    <div className="p-3 bg-cyan-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">LE - Locação Diária</div>
                      <div className="text-2xl font-bold text-cyan-600">{shift.le_locacao_diaria}</div>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">FS - Fora de Serviço</div>
                      <div className="text-2xl font-bold text-orange-600">{shift.fs_fora_servico}</div>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">NE - Oficina Externa</div>
                      <div className="text-2xl font-bold text-red-600">{shift.ne_oficina_externa}</div>
                    </div>
                    <div className="p-3 bg-pink-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">FE - Funilaria Externa</div>
                      <div className="text-2xl font-bold text-pink-600">{shift.fe_funilaria_externa}</div>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">TG - Triagem</div>
                      <div className="text-2xl font-bold text-purple-600">{shift.tg_triagem_manutencao}</div>
                    </div>
                    <div className="p-3 bg-teal-500/10 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">DO - Retorno Oficina</div>
                      <div className="text-2xl font-bold text-teal-600">{shift.do_retorno_oficina}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-border">
                    <div className="p-2 bg-accent/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{shift.carros_abastecidos}</div>
                      <div className="text-xs text-muted-foreground">Abastecidos</div>
                    </div>
                    <div className="p-2 bg-accent/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{shift.veiculos_lavados}</div>
                      <div className="text-xs text-muted-foreground">Lavados</div>
                    </div>
                    <div className="p-2 bg-accent/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{shift.veiculos_sujos_gaveta}</div>
                      <div className="text-xs text-muted-foreground">Sujos Gaveta</div>
                    </div>
                    <div className="p-2 bg-accent/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{shift.qnt_cadeirinhas}</div>
                      <div className="text-xs text-muted-foreground">Cadeirinhas</div>
                    </div>
                    <div className="p-2 bg-accent/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{shift.qnt_bebe_conforto}</div>
                      <div className="text-xs text-muted-foreground">Bebê Conforto</div>
                    </div>
                    <div className="p-2 bg-accent/50 rounded-lg text-center">
                      <div className="text-lg font-bold">{shift.qnt_assentos_elevacao}</div>
                      <div className="text-xs text-muted-foreground">Assentos Elevação</div>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg text-center">
                      <div className="text-lg font-bold text-primary">{shift.reservas_atendidas}</div>
                      <div className="text-xs text-muted-foreground">Reservas Atendidas</div>
                    </div>
                    <div className="p-2 bg-orange-500/10 rounded-lg text-center">
                      <div className="text-lg font-bold text-orange-600">{shift.reservas_pendentes}</div>
                      <div className="text-xs text-muted-foreground">Reservas Pendentes</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
