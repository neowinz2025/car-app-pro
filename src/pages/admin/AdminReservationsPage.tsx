import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReservationProjectionsView } from '@/components/reservations/ReservationProjectionsView';

export default function AdminReservationsPage() {
  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Projeção de Reservas Futuras</CardTitle>
        <CardDescription>
          Controle de categorias de veículos com aplicação da taxa de no-show. Os dados são carregados automaticamente dos arquivos enviados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReservationProjectionsView />
      </CardContent>
    </Card>
  );
}
