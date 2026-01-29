import { useState } from 'react';
import { Store, Droplets, ChevronLeft, Calendar, Trash2 } from 'lucide-react';
import { PlateRecord } from '@/types/plate';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlatesHistoryViewProps {
  plates: PlateRecord[];
  onBack: () => void;
  onClearPlates: () => void;
}

export function PlatesHistoryView({ plates, onBack, onClearPlates }: PlatesHistoryViewProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  // Group plates by date
  const groupedPlates = plates.reduce((acc, plate) => {
    const dateKey = format(plate.timestamp, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(plate);
    return acc;
  }, {} as Record<string, PlateRecord[]>);

  const sortedDates = Object.keys(groupedPlates).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const getCategorySummary = (datePlates: PlateRecord[]) => {
    const loja = datePlates.filter(p => p.loja && !p.lavaJato).length;
    const lavaJato = datePlates.filter(p => p.lavaJato && !p.loja).length;
    const both = datePlates.filter(p => p.loja && p.lavaJato).length;
    return { loja, lavaJato, both, total: datePlates.length };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">Histórico de Bate Fiscos</h2>
            <p className="text-xs text-muted-foreground">{plates.length} placas registradas</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Nenhum bate fisco registrado
            </p>
          </div>
        ) : (
          sortedDates.map((dateKey) => {
            const datePlates = groupedPlates[dateKey];
            const summary = getCategorySummary(datePlates);
            
            return (
              <div
                key={dateKey}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                {/* Date Header */}
                <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold">
                      {format(new Date(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {summary.total} placas
                  </span>
                </div>

                {/* Summary */}
                <div className="px-4 py-3 border-b border-border flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-primary" />
                    <span>Loja: <strong>{summary.loja}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-success" />
                    <span>Lava Jato: <strong>{summary.lavaJato}</strong></span>
                  </div>
                  {summary.both > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span>Ambos: <strong>{summary.both}</strong></span>
                    </div>
                  )}
                </div>

                {/* Plates */}
                <div className="p-3 grid grid-cols-3 gap-2">
                  {datePlates.map((plate) => (
                    <div
                      key={plate.id}
                      className="bg-muted/50 rounded-lg p-2 text-center"
                    >
                      <span className="font-mono font-bold text-sm">
                        {formatPlate(plate.plate)}
                      </span>
                      <div className="flex justify-center gap-1 mt-1">
                        {plate.loja && (
                          <Store className="w-3 h-3 text-primary" />
                        )}
                        {plate.lavaJato && (
                          <Droplets className="w-3 h-3 text-success" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clear Button */}
      {plates.length > 0 && (
        <div className="p-4 border-t border-border">
          {showClearConfirm ? (
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1 h-11 rounded-xl"
                onClick={() => {
                  onClearPlates();
                  setShowClearConfirm(false);
                }}
              >
                Confirmar exclusão
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar todo o histórico
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
