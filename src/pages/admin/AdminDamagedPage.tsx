import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DamagedVehiclesView } from '@/components/damaged/DamagedVehiclesView';

export default function AdminDamagedPage() {
  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Veículos com Avarias</CardTitle>
        <CardDescription>
          Gerenciamento de registros de veículos que chegaram com danos
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[750px]">
          <DamagedVehiclesView />
        </div>
      </CardContent>
    </Card>
  );
}
