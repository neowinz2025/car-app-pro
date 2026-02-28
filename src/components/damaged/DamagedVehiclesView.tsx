import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, Trash2, Camera, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDamagedVehicles, DamagedVehicle } from '@/hooks/useDamagedVehicles';
import { usePlates } from '@/hooks/usePlates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function DamagedVehiclesView() {
  const [vehicles, setVehicles] = useState<DamagedVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<DamagedVehicle[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlate, setSelectedPlate] = useState('');
  const [searchPlate, setSearchPlate] = useState('');
  const [filterSearchPlate, setFilterSearchPlate] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [availablePlates, setAvailablePlates] = useState<string[]>([]);
  const [showPlateSuggestions, setShowPlateSuggestions] = useState(false);

  const { loading, getAllDamagedVehicles, createDamagedVehicle, deleteDamagedVehicle } = useDamagedVehicles();
  const { plates } = usePlates();

  useEffect(() => {
    loadVehicles();

    const session = localStorage.getItem('user_session');
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        setCreatedBy(sessionData.name || '');
      } catch (error) {
        console.error('Error loading user session:', error);
      }
    }
  }, []);

  useEffect(() => {
    const uniquePlates = Array.from(new Set(plates.map(p => p.plate)));
    setAvailablePlates(uniquePlates);
  }, [plates]);

  useEffect(() => {
    if (searchPlate.length >= 3) {
      setShowPlateSuggestions(true);
    } else {
      setShowPlateSuggestions(false);
    }
  }, [searchPlate]);

  useEffect(() => {
    if (filterSearchPlate.trim()) {
      const filtered = vehicles.filter(vehicle =>
        vehicle.plate.toLowerCase().includes(filterSearchPlate.toLowerCase())
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [filterSearchPlate, vehicles]);

  const loadVehicles = async () => {
    const data = await getAllDamagedVehicles();
    setVehicles(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (selectedFiles.length + files.length > 10) {
      toast.error('Máximo de 10 fotos permitidas');
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedPlate.trim()) {
      toast.error('Digite a placa do veículo');
      return;
    }

    if (!createdBy.trim()) {
      toast.error('Digite seu nome');
      return;
    }

    if (selectedFiles.length < 2) {
      toast.error('Adicione pelo menos 2 fotos');
      return;
    }

    const success = await createDamagedVehicle(
      selectedPlate,
      createdBy,
      notes,
      selectedFiles
    );

    if (success) {
      setIsDialogOpen(false);
      resetForm();
      loadVehicles();
    }
  };

  const handleDelete = async (vehicleId: string) => {
    const success = await deleteDamagedVehicle(vehicleId);
    if (success) {
      loadVehicles();
    }
  };

  const resetForm = () => {
    setSelectedPlate('');
    setSearchPlate('');
    setCreatedBy('');
    setNotes('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setShowPlateSuggestions(false);
  };

  const selectPlateFromSuggestion = (plate: string) => {
    setSelectedPlate(plate);
    setSearchPlate(plate);
    setShowPlateSuggestions(false);
  };

  const filteredPlates = availablePlates.filter(plate =>
    plate.toLowerCase().includes(searchPlate.toLowerCase())
  );

  const groupedByPlate = filteredVehicles.reduce((acc, vehicle) => {
    if (!acc[vehicle.plate]) {
      acc[vehicle.plate] = [];
    }
    acc[vehicle.plate].push(vehicle);
    return acc;
  }, {} as Record<string, DamagedVehicle[]>);

  return (
    <div className="flex flex-col h-full px-4 py-4 overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Veículos com Avarias</h2>
          <p className="text-xs text-muted-foreground">Registro de veículos que chegaram com danos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Registrar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Veículo com Avaria</DialogTitle>
              <DialogDescription>
                Preencha os dados do veículo e adicione fotos das avarias
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plate">Placa do Veículo</Label>
                <div className="relative">
                  <Input
                    id="plate"
                    placeholder="Digite ou busque a placa"
                    value={searchPlate}
                    onChange={(e) => {
                      setSearchPlate(e.target.value.toUpperCase());
                      setSelectedPlate(e.target.value.toUpperCase());
                    }}
                    className="uppercase"
                  />
                  {showPlateSuggestions && filteredPlates.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredPlates.slice(0, 10).map((plate) => (
                        <button
                          key={plate}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                          onClick={() => selectPlateFromSuggestion(plate)}
                        >
                          <Search className="w-4 h-4 text-muted-foreground" />
                          {plate}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite para buscar placas já cadastradas ou insira manualmente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="createdBy">Registrado por</Label>
                <Input
                  id="createdBy"
                  placeholder="Seu nome"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Descreva as avarias encontradas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Fotos das Avarias (mínimo 2)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique para adicionar fotos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedFiles.length}/10 fotos
                    </p>
                  </label>
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Foto {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || selectedFiles.length < 2 || !selectedPlate || !createdBy}
                className="w-full"
              >
                {loading ? 'Salvando...' : 'Salvar Registro'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa..."
            value={filterSearchPlate}
            onChange={(e) => setFilterSearchPlate(e.target.value.toUpperCase())}
            className="pl-9 uppercase"
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading && vehicles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando registros...
          </div>
        ) : vehicles.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum veículo com avaria registrado</p>
              </div>
            </CardContent>
          </Card>
        ) : Object.keys(groupedByPlate).length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum veículo encontrado para "{filterSearchPlate}"</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedByPlate).map(([plate, plateVehicles]) => (
            <div key={plate} className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <div className="text-sm font-bold">{plate}</div>
                {plateVehicles.length > 1 && (
                  <div className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                    {plateVehicles.length} registros
                  </div>
                )}
              </div>
              {plateVehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardDescription className="text-xs mb-1">
                      {format(new Date(vehicle.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {' • '}
                      {vehicle.created_by}
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(vehicle.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {vehicle.notes && (
                  <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs font-semibold mb-1">Observações:</div>
                    <div className="text-xs text-muted-foreground">{vehicle.notes}</div>
                  </div>
                )}

                {vehicle.pdf_url && (
                  <div className="mb-3">
                    <a
                      href={vehicle.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                          Relatório PDF Completo
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Clique para visualizar ou baixar
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </a>
                  </div>
                )}

                {vehicle.photos.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold mb-2">
                      Fotos ({vehicle.photos.length})
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {vehicle.photos.map((photo, index) => (
                        <a
                          key={photo.id}
                          href={photo.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group cursor-pointer"
                        >
                          <img
                            src={photo.photo_url}
                            alt={`Avaria ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-border hover:border-primary transition-colors"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
