import { useState } from 'react';
import { Store, Droplets, Trash2, Search, X, History } from 'lucide-react';
import { PlateRecord } from '@/types/plate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlatesHistoryView } from './PlatesHistoryView';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [plateToDelete, setPlateToDelete] = useState<string | null>(null);

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
    <div className="flex flex-col h-full bg-gradient-to-b from-muted/30 to-background">
      {/* Header com busca */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md px-4 py-4 border-b-2 border-border">
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar placa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 text-lg rounded-2xl bg-card border-2"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowHistory(true)}
            className="h-14 w-14 rounded-2xl border-2"
          >
            <History className="w-6 h-6" />
          </Button>
        </div>

        {/* Contador */}
        <div className="flex items-center justify-between px-2">
          <p className="text-sm font-semibold text-muted-foreground">
            {filteredPlates.length} {filteredPlates.length === 1 ? 'placa' : 'placas'}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {filteredPlates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground">
              {search ? 'Nenhuma placa encontrada' : 'Nenhuma placa registrada'}
            </p>
          </div>
        ) : (
          filteredPlates.map((plate, index) => (
            <div
              key={plate.id}
              className="bg-card rounded-3xl p-5 border-2 border-border shadow-sm hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold font-mono tracking-wider">
                  {formatPlate(plate.plate)}
                </span>
                <button
                  onClick={() => setPlateToDelete(plate.id)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl text-destructive hover:bg-destructive/10 transition-colors active:scale-95"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-sm text-muted-foreground font-medium">
                  {formatDistanceToNow(plate.timestamp, { addSuffix: true, locale: ptBR })}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdatePlate(plate.id, { loja: !plate.loja })}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                      plate.loja
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Store className="w-4 h-4" />
                    Loja
                  </button>

                  <button
                    onClick={() => onUpdatePlate(plate.id, { lavaJato: !plate.lavaJato })}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                      plate.lavaJato
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Droplets className="w-4 h-4" />
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
        <div className="p-4 border-t-2 border-border bg-background">
          {showClearConfirm ? (
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1 h-14 rounded-2xl text-base font-bold"
                onClick={() => {
                  onClearPlates();
                  setShowClearConfirm(false);
                }}
              >
                Confirmar exclusão
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-2xl text-base font-bold"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-14 rounded-2xl text-base font-bold text-destructive border-2 border-destructive/30 hover:bg-destructive/10"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Limpar todas as placas
            </Button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!plateToDelete} onOpenChange={() => setPlateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta placa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (plateToDelete) {
                  onRemovePlate(plateToDelete);
                  setPlateToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
