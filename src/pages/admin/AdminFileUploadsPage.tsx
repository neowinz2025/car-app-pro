import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyUploadsView } from '@/components/reservations/DailyUploadsView';

export default function AdminFileUploadsPage() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Envio de Arquivos Diários</CardTitle>
        <CardDescription>
          Envie os arquivos CSV, XLSX ou PDF do dia. Os dados extraídos ficam salvos no banco e a Projeção de Reservas os carrega automaticamente ao selecionar a data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DailyUploadsView />
      </CardContent>
    </Card>
  );
}
