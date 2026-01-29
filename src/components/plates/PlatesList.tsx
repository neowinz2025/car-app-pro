import { useState } from 'react';
import { Store, Droplets, Trash2, Search, X, History } from 'lucide-react';
import { PlateRecord } from '@/types/plate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlatesHistoryView } from './PlatesHistoryView';

interface PlatesListProps {
  plates: PlateRecord[];
  onUpdatePlate: (id: string, updates: Partial<PlateRecord>) => void;
  onRemovePlate: (id: string) => void;
  onClearPlates: () => void;
}

export function PlatesList({ plates, onUpdatePlate, onRemovePlate, onClearPlates }: PlatesListProps) {
  const [search, setSearch] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredPlates = plates.filter(p => 
    p.plate.toLowerCase().includes(search.toLowerCase())
  );

  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  if (showHistory) {
    return (
      <PlatesHistoryView 
        plates={plates} 
        onBack={() => setShowHistory(false)} 
        onClearPlates={onClearPlates}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="sticky top-0 z-10 bg-background px-4 py-3 border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar placa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl bg-card"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowHistory(true)}
            className="h-11 w-11 rounded-xl"
          >
            <History className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-hide">
        {filteredPlates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {search ? 'Nenhuma placa encontrada' : 'Nenhuma placa registrada'}
            </p>
          </div>
        ) : (
          filteredPlates.map((plate, index) => (
            <div
              key={plate.id}
              className="bg-card rounded-2xl p-4 border border-border animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold font-mono tracking-wider">
                  {formatPlate(plate.plate)}
                </span>
                <button
                  onClick={() => onRemovePlate(plate.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(plate.timestamp, { addSuffix: true, locale: ptBR })}
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdatePlate(plate.id, { loja: !plate.loja })}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      plate.loja
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Store className="w-3.5 h-3.5" />
                    Loja
                  </button>
                  
                  <button
                    onClick={() => onUpdatePlate(plate.id, { lavaJato: !plate.lavaJato })}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      plate.lavaJato
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    Lava Jato
                  </button>
                </div>
              </div>
            </div>
          ))
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
              Limpar todas as placas
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
