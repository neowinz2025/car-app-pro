import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Plus, Search, Trash2, Camera, X, FileText, Download, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useDamagedVehicles, DamagedVehicle, PhotoMetadata } from '@/hooks/useDamagedVehicles';
import { usePlates } from '@/hooks/usePlates';
import { usePlateCache } from '@/hooks/usePlateCache';
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
  const [selectedFiles, setSelectedFiles] = useState<PhotoMetadata[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [availablePlates, setAvailablePlates] = useState<string[]>([]);
  const [showPlateSuggestions, setShowPlateSuggestions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const { loading, getAllDamagedVehicles, createDamagedVehicle, deleteDamagedVehicle } = useDamagedVehicles();
  const { plates } = usePlates();
  const { searchPlates } = usePlateCache();

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
    const loadPlatesForAutocomplete = async () => {
      if (searchPlate.length >= 3) {
        const dbPlates = await searchPlates(searchPlate);
        const currentSessionPlates = plates.map(p => p.plate);
        const allPlates = Array.from(new Set([...currentSessionPlates, ...dbPlates]));
        setAvailablePlates(allPlates);
      } else {
        const uniquePlates = Array.from(new Set(plates.map(p => p.plate)));
        setAvailablePlates(uniquePlates);
      }
    };

    loadPlatesForAutocomplete();
  }, [plates, searchPlate, searchPlates]);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowPlateSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadVehicles = async () => {
    const data = await getAllDamagedVehicles();
    setVehicles(data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (selectedFiles.length + files.length > 10) {
      toast.error('Máximo de 10 fotos permitidas');
      return;
    }

    const photosWithMetadata: PhotoMetadata[] = await Promise.all(
      files.map(async (file) => {
        const metadata: PhotoMetadata = {
          file,
          timestamp: new Date(),
        };

        try {
          if ('geolocation' in navigator) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
              });
            });

            metadata.latitude = position.coords.latitude;
            metadata.longitude = position.coords.longitude;
            metadata.accuracy = position.coords.accuracy;
          }
        } catch (error) {
          console.log('Location not available for photo:', error);
        }

        return metadata;
      })
    );

    setSelectedFiles(prev => [...prev, ...photosWithMetadata]);

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
    <div className="flex flex-col h-full p-4 overflow-y-auto scrollbar-hide bg-gradient-to-b from-muted/30 to-background">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-3xl border-2 border-red-500/20">
        <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg">
          <AlertTriangle className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Registro de Avarias</h2>
          <p className="text-sm text-muted-foreground">Veículos com danos</p>
        </div>
      </div>

      {/* Botão de Adicionar - Grande e destacado */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="w-full h-16 rounded-3xl text-lg font-bold mb-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg">
            <Plus className="w-6 h-6 mr-2" />
            REGISTRAR NOVA AVARIA
          </Button>
        </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Nova Avaria</DialogTitle>
              <DialogDescription>
                Registre o veículo e adicione fotos dos danos
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-3">
                <Label htmlFor="plate" className="text-base font-semibold">Placa do Veículo</Label>
                <div className="relative" ref={autocompleteRef}>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    id="plate"
                    placeholder="AAA1A23 - Buscar ou digitar"
                    value={searchPlate}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setSearchPlate(value);
                      setSelectedPlate(value);
                    }}
                    onFocus={() => {
                      if (searchPlate.length >= 3) {
                        setShowPlateSuggestions(true);
                      }
                    }}
                    className="uppercase h-14 text-lg font-bold pl-12 rounded-2xl border-2"
                  />
                  {showPlateSuggestions && filteredPlates.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border-2 border-primary/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                      <div className="p-2 text-xs font-semibold text-muted-foreground border-b">
                        {filteredPlates.length} placa(s) encontrada(s)
                      </div>
                      {filteredPlates.slice(0, 10).map((plate) => (
                        <button
                          key={plate}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-primary/10 flex items-center gap-3 transition-colors border-b last:border-0"
                          onClick={() => selectPlateFromSuggestion(plate)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Search className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-mono font-bold text-lg">{plate}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  Digite 3 ou mais caracteres para buscar no histórico
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="createdBy" className="text-base font-semibold">Registrado por</Label>
                <Input
                  id="createdBy"
                  placeholder="Seu nome"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  disabled
                  className="h-12 text-base rounded-2xl border-2 bg-muted"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="notes" className="text-base font-semibold">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Descreva os danos encontrados..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="text-base rounded-2xl border-2"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Fotos das Avarias (mínimo 2)</Label>
                <div className="border-2 border-dashed rounded-2xl p-6 text-center bg-muted/50">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer block">
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          Adicionar Fotos
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedFiles.length}/10 fotos adicionadas
                        </p>
                      </div>
                    </div>
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
                className="w-full h-14 text-lg font-bold rounded-2xl"
                size="lg"
              >
                {loading ? 'Salvando...' : 'Salvar Registro de Avaria'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      {/* Campo de Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa..."
            value={filterSearchPlate}
            onChange={(e) => setFilterSearchPlate(e.target.value.toUpperCase())}
            className="pl-12 h-14 text-lg uppercase rounded-2xl border-2"
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
                    <div className="grid grid-cols-1 gap-3">
                      {vehicle.photos.map((photo, index) => (
                        <div key={photo.id} className="border border-border rounded-lg overflow-hidden">
                          <a
                            href={photo.photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group cursor-pointer block"
                          >
                            <img
                              src={photo.photo_url}
                              alt={`Avaria ${index + 1}`}
                              className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              Foto {index + 1}
                            </div>
                          </a>

                          <div className="p-3 bg-muted/30 space-y-2">
                            {photo.photo_timestamp && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {format(new Date(photo.photo_timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                                </span>
                              </div>
                            )}

                            {photo.photo_latitude && photo.photo_longitude && (
                              <div className="flex items-start gap-2 text-xs">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <a
                                    href={`https://www.google.com/maps?q=${photo.photo_latitude},${photo.photo_longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    {photo.photo_latitude.toFixed(6)}, {photo.photo_longitude.toFixed(6)}
                                  </a>
                                  {photo.photo_location_accuracy && (
                                    <span className="text-muted-foreground ml-1">
                                      (±{photo.photo_location_accuracy.toFixed(0)}m)
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
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
