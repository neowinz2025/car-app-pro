import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Flashlight, FlashlightOff, Plus, Store, Droplets, X, AlertCircle, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ActiveStep } from '@/types/plate';
import { toast } from 'sonner';
import { useCamera } from '@/hooks/useCamera';
import { usePlateRecognition } from '@/hooks/usePlateRecognition';
import { usePlateCache } from '@/hooks/usePlateCache';

interface ScannerViewProps {
  activeStep: ActiveStep;
  onSetActiveStep: (step: ActiveStep) => void;
  onAddPlate: (plate: string) => Promise<boolean>;
}

export function ScannerView({ activeStep, onSetActiveStep, onAddPlate }: ScannerViewProps) {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [manualPlate, setManualPlate] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [detectedPlateText, setDetectedPlateText] = useState('');
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    videoRef,
    isActive,
    error,
    startCamera,
    stopCamera,
    toggleFlashlight,
    captureFrame,
  } = useCamera({ facingMode: 'environment' });

  const { cacheSize, syncWithDatabase } = usePlateCache();

  // Sync cache with database on mount
  useEffect(() => {
    syncWithDatabase();
  }, [syncWithDatabase]);

  const handlePlateDetected = useCallback(async (plate: string) => {
    if (!activeStep) return;

    const success = await onAddPlate(plate);
    if (success) {
      setDetectedPlateText(plate.toUpperCase());
      setShowSuccessFlash(true);
      setTimeout(() => setShowSuccessFlash(false), 1500);

      toast.success('✓ PLACA COLETADA!', {
        description: plate.toUpperCase(),
        duration: 3000,
        style: {
          fontSize: '1.25rem',
          fontWeight: 'bold',
          padding: '1.5rem',
          minWidth: '300px',
        },
      });
    }
  }, [activeStep, onAddPlate]);

  const { recognizePlate, isProcessing, resetLastPlate } = usePlateRecognition({
    onPlateDetected: handlePlateDetected,
    confidenceThreshold: 0.7,
  });

  const handleScanToggle = async () => {
    if (!activeStep) {
      toast.error('Selecione uma etapa primeiro', {
        description: 'Escolha Loja ou Lava Jato para começar',
      });
      return;
    }

    if (isActive) {
      stopCamera();
    } else {
      await startCamera();
    }
  };

  const handleFlashlightToggle = async () => {
    const newState = !flashlightOn;
    const success = await toggleFlashlight(newState);
    if (success) {
      setFlashlightOn(newState);
    } else if (newState) {
      toast.error('Lanterna não disponível', {
        description: 'Este dispositivo não suporta lanterna',
      });
    }
  };

  const handleManualAdd = async () => {
    if (manualPlate.trim()) {
      const success = await onAddPlate(manualPlate.trim());
      if (success) {
        setDetectedPlateText(manualPlate.toUpperCase());
        setShowSuccessFlash(true);
        setTimeout(() => setShowSuccessFlash(false), 1500);

        toast.success('✓ PLACA REGISTRADA!', {
          description: manualPlate.toUpperCase(),
          duration: 3000,
          style: {
            fontSize: '1.25rem',
            fontWeight: 'bold',
            padding: '1.5rem',
            minWidth: '300px',
          },
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

  // Auto-scan when camera is active
  useEffect(() => {
    if (isActive && activeStep) {
      // Start scanning interval
      scanIntervalRef.current = setInterval(async () => {
        const frame = captureFrame();
        if (frame) {
          await recognizePlate(frame);
        }
      }, 2500); // Scan every 2.5 seconds
    } else {
      // Clear interval when camera stops
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [isActive, activeStep, captureFrame, recognizePlate]);

  // Stop camera and reset when component unmounts or step changes
  useEffect(() => {
    return () => {
      stopCamera();
      resetLastPlate();
    };
  }, [stopCamera, resetLastPlate]);

  return (
    <div className="flex flex-col h-full px-4 py-4 gap-4">
      {/* Success Flash Overlay */}
      {showSuccessFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-500/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-green-500 text-white px-8 py-6 rounded-3xl shadow-2xl animate-in zoom-in duration-200 flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">PLACA COLETADA!</p>
              <p className="text-4xl font-mono font-black mt-2 tracking-wider">{detectedPlateText}</p>
            </div>
          </div>
        </div>
      )}

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
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            !isActive && "hidden"
          )}
        />

        {/* Overlay when camera is active */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Top instruction */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-white text-sm font-medium">Aponte para a placa do veículo</span>
            </div>

            {/* Scanning frame - Plate-shaped rectangle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-28 border-2 border-primary/50 rounded-lg">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

              {/* Scan line animation */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-0.5 bg-primary animate-scan-line",
                isProcessing && "bg-warning"
              )} />
            </div>

            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-warning/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-sm font-medium text-white">Reconhecendo placa...</span>
              </div>
            )}
          </div>
        )}

        {/* Placeholder when camera is inactive */}
        {!isActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-muted">
            {error ? (
              <>
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <p className="text-destructive text-sm text-center px-8 mb-4">{error}</p>
                <Button variant="outline" onClick={startCamera}>
                  Tentar novamente
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Camera className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">Toque para iniciar a câmera</p>
                {!activeStep && (
                  <p className="text-xs text-destructive mt-2">Selecione Loja ou Lava Jato acima</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Scan controls overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleFlashlightToggle}
            disabled={!isActive}
            className="w-12 h-12 rounded-full bg-card/90 backdrop-blur-sm"
          >
            {flashlightOn ? (
              <Flashlight className="w-5 h-5 text-warning" />
            ) : (
              <FlashlightOff className="w-5 h-5" />
            )}
          </Button>

          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handleScanToggle}
              className={cn(
                "w-16 h-16 rounded-full transition-all duration-200",
                isActive
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {isActive ? (
                <X className="w-7 h-7" />
              ) : (
                <Camera className="w-7 h-7" />
              )}
            </Button>
            {!isActive && (
              <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                Iniciar
              </span>
            )}
          </div>

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
      <div className="flex flex-col items-center justify-center gap-2 py-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isActive && isProcessing ? "bg-warning animate-pulse" :
            isActive ? "bg-success animate-pulse" : "bg-muted-foreground"
          )} />
          <span className="text-sm text-muted-foreground">
            {isActive && isProcessing ? 'Reconhecendo placa...' :
             isActive ? 'Escaneando automaticamente' :
             error ? 'Erro na câmera' : 'Aguardando'}
          </span>
        </div>

        {/* Cache Status */}
        {cacheSize > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
            <Database className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">
              {cacheSize} placas em cache local
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
