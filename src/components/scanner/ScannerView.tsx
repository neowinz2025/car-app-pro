import { useState } from 'react';
import { Camera, Flashlight, FlashlightOff, Plus, Store, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ActiveStep } from '@/types/plate';
import { toast } from 'sonner';

interface ScannerViewProps {
  activeStep: ActiveStep;
  onSetActiveStep: (step: ActiveStep) => void;
  onAddPlate: (plate: string) => boolean;
}

export function ScannerView({ activeStep, onSetActiveStep, onAddPlate }: ScannerViewProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [manualPlate, setManualPlate] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleScanToggle = () => {
    if (!activeStep) {
      toast.error('Selecione uma etapa primeiro', {
        description: 'Escolha Loja ou Lava Jato para começar',
      });
      return;
    }
    setIsScanning(!isScanning);
  };

  const handleManualAdd = () => {
    if (manualPlate.trim()) {
      const success = onAddPlate(manualPlate.trim());
      if (success) {
        toast.success('Placa registrada!', {
          description: manualPlate.toUpperCase(),
        });
        setManualPlate('');
        setShowManualInput(false);
      } else {
        toast.error('Placa inválida', {
          description: 'Digite uma placa válida com 7 caracteres',
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full px-4 py-4 gap-4">
      {/* Step Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => onSetActiveStep(activeStep === 'loja' ? null : 'loja')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all duration-200 touch-manipulation",
            activeStep === 'loja'
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              : "bg-card text-foreground border border-border"
          )}
        >
          <Store className="w-5 h-5" />
          <span>Loja</span>
        </button>
        
        <button
          onClick={() => onSetActiveStep(activeStep === 'lavaJato' ? null : 'lavaJato')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition-all duration-200 touch-manipulation",
            activeStep === 'lavaJato'
              ? "bg-success text-success-foreground shadow-lg shadow-success/30"
              : "bg-card text-foreground border border-border"
          )}
        >
          <Droplets className="w-5 h-5" />
          <span>Lava Jato</span>
        </button>
      </div>

      {/* Camera Viewfinder */}
      <div className="relative flex-1 min-h-[300px] bg-card rounded-3xl overflow-hidden border border-border">
        {/* Placeholder for camera */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-muted">
          {isScanning ? (
            <>
              {/* Scanning animation */}
              <div className="relative w-64 h-40">
                <div className="absolute inset-0 border-2 border-primary/30 rounded-lg" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary animate-scan-line" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse-ring" />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Posicione a placa na área</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Camera className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">Toque para iniciar</p>
              {!activeStep && (
                <p className="text-xs text-destructive mt-2">Selecione Loja ou Lava Jato acima</p>
              )}
            </>
          )}
        </div>

        {/* Scan controls overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setFlashlightOn(!flashlightOn)}
            className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm"
          >
            {flashlightOn ? (
              <Flashlight className="w-5 h-5 text-warning" />
            ) : (
              <FlashlightOff className="w-5 h-5" />
            )}
          </Button>

          <Button
            onClick={handleScanToggle}
            className={cn(
              "w-16 h-16 rounded-full transition-all duration-200",
              isScanning 
                ? "bg-destructive hover:bg-destructive/90" 
                : "bg-primary hover:bg-primary/90"
            )}
          >
            <Camera className="w-7 h-7" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowManualInput(!showManualInput)}
            className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Manual Input */}
      {showManualInput && (
        <div className="flex gap-2 animate-slide-up">
          <Input
            placeholder="Digite a placa (AAA1A23)"
            value={manualPlate}
            onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
            className="flex-1 h-12 text-center text-lg font-mono uppercase bg-card rounded-xl"
            maxLength={7}
          />
          <Button 
            onClick={handleManualAdd}
            className="h-12 px-6 rounded-xl"
            disabled={manualPlate.length < 7}
          >
            Adicionar
          </Button>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isScanning ? "bg-success animate-pulse" : "bg-muted-foreground"
        )} />
        <span className="text-sm text-muted-foreground">
          {isScanning ? 'Escaneando...' : 'Aguardando'}
        </span>
      </div>
    </div>
  );
}
