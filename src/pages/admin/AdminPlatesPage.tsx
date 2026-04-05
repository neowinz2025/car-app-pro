import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
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
import { usePlatesAdmin } from '@/hooks/api/usePlatesAdmin';

export default function AdminPlatesPage() {
  const { plates, isLoading, deletePlate } = usePlatesAdmin();

  const [deletePlateDialogOpen, setDeletePlateDialogOpen] = useState(false);
  const [plateToDelete, setPlateToDelete] = useState<string | null>(null);

  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  const handleDelete = async () => {
    if (!plateToDelete) return;
    try {
      await deletePlate(plateToDelete);
      toast.success('Placa excluída com sucesso');
    } catch (error: any) {
      console.error('Error deleting plate:', error);
      toast.error('Erro ao excluir placa');
    } finally {
      setDeletePlateDialogOpen(false);
      setPlateToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Placas Coletadas</CardTitle>
          <CardDescription>
            Total de {plates.length} placas no banco de dados (últimas 500)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : plates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma placa encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium">Placa</th>
                    <th className="text-left py-3 px-4 font-medium">Data/Hora</th>
                    <th className="text-center py-3 px-4 font-medium">Loja</th>
                    <th className="text-center py-3 px-4 font-medium">Lava Jato</th>
                    <th className="text-left py-3 px-4 font-medium">Sessão</th>
                    <th className="text-center py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {plates.map((plate) => (
                    <tr key={plate.id} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium">
                        {formatPlate(plate.plate)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {format(new Date(plate.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {plate.loja ? '✅' : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {plate.lava_jato ? '✅' : '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                        {plate.session_id ? `${plate.session_id.slice(0, 8)}...` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setPlateToDelete(plate.id);
                            setDeletePlateDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deletePlateDialogOpen} onOpenChange={setDeletePlateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Placa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta placa do histórico? Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
