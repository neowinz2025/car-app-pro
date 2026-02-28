import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Flashlight, FlashlightOff, Plus, Store, Droplets, X, AlertCircle, Loader2, Database, ScanLine } from 'lucide-react';
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

  const handleCapturePlate = async () => {
    if (!isActive || !activeStep) {
      toast.error('Câmera não está ativa', {
        description: 'Inicie a câmera primeiro',
      });
      return;
    }

    if (isProcessing) {
      return; // Already processing
    }

    const frame = captureFrame();
    if (frame) {
      await recognizePlate(frame);
    } else {
      toast.error('Erro ao capturar imagem', {
        description: 'Tente novamente',
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

  // Stop camera and reset when component unmounts or step changes
  useEffect(() => {
    return () => {
      stopCamera();
      resetLastPlate();
    };
  }, [stopCamera, resetLastPlate]);

  return (
    <div className="flex flex-col h-full p-4 gap-4 bg-gradient-to-b from-muted/30 to-background">
      {/* Success Flash Overlay */}
      {showSuccessFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-green-500/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-green-500 text-white px-8 py-6 rounded-3xl shadow-2xl animate-in zoom-in duration-200 flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">PLACA COLETADA!</p>
              <p className="text-5xl font-mono font-black mt-2 tracking-wider">{detectedPlateText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step Selector - Maior e mais visível */}
      <div className="flex gap-3">
        <button
          onClick={() => onSetActiveStep(activeStep === 'loja' ? null : 'loja')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-3xl font-bold transition-all duration-200 touch-manipulation shadow-lg",
            activeStep === 'loja'
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/50 scale-105"
              : "bg-card text-foreground border-2 border-border active:scale-95"
          )}
        >
          <Store className="w-8 h-8" />
          <span className="text-lg">LOJA</span>
        </button>

        <button
          onClick={() => onSetActiveStep(activeStep === 'lavaJato' ? null : 'lavaJato')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-2 py-6 rounded-3xl font-bold transition-all duration-200 touch-manipulation shadow-lg",
            activeStep === 'lavaJato'
              ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-500/50 scale-105"
              : "bg-card text-foreground border-2 border-border active:scale-95"
          )}
        >
          <Droplets className="w-8 h-8" />
          <span className="text-lg">LAVA JATO</span>
        </button>
      </div>

      {/* Camera Viewfinder - Maior em mobile */}
      <div className="relative w-full max-w-2xl mx-auto aspect-[4/3] bg-card rounded-3xl overflow-hidden border-4 border-border shadow-2xl">
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
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-5 py-3 rounded-2xl border-2 border-green-400 shadow-xl">
              <span className="text-white text-base font-bold">
                {isProcessing ? '⏳ Analisando placa...' : '📸 Centralize e clique em CAPTURAR'}
              </span>
            </div>

            {/* Scanning frame - Plate-shaped rectangle */}
            <div className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-28 border-2 rounded-lg transition-colors",
              isProcessing ? "border-warning" : "border-primary/50"
            )}>
              {/* Corner markers */}
              <div className={cn(
                "absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors",
                isProcessing ? "border-warning" : "border-primary"
              )} />
              <div className={cn(
                "absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors",
                isProcessing ? "border-warning" : "border-primary"
              )} />
              <div className={cn(
                "absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors",
                isProcessing ? "border-warning" : "border-primary"
              )} />
              <div className={cn(
                "absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors",
                isProcessing ? "border-warning" : "border-primary"
              )} />

              {/* Scan line animation - only when processing */}
              {isProcessing && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-warning animate-scan-line" />
              )}
            </div>
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
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-4">
          {/* Flashlight button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={handleFlashlightToggle}
            disabled={!isActive}
            className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm border-2 border-white/20 hover:bg-black/80 transition-all"
          >
            {flashlightOn ? (
              <Flashlight className="w-6 h-6 text-yellow-400" />
            ) : (
              <FlashlightOff className="w-6 h-6 text-white" />
            )}
          </Button>

          {/* Camera toggle button */}
          <div className="flex flex-col items-center gap-1">
            <Button
              onClick={handleScanToggle}
              className={cn(
                "w-20 h-20 rounded-full transition-all duration-200 shadow-2xl",
                isActive
                  ? "bg-red-500 hover:bg-red-600 border-4 border-red-300"
                  : "bg-blue-500 hover:bg-blue-600 border-4 border-blue-300"
              )}
            >
              {isActive ? (
                <X className="w-9 h-9" />
              ) : (
                <Camera className="w-9 h-9" />
              )}
            </Button>
            <span className="text-xs font-semibold text-white bg-black/70 px-3 py-1 rounded-full">
              {isActive ? 'Fechar' : 'Câmera'}
            </span>
          </div>

          {/* Capture button - ALWAYS visible when camera is active */}
          {isActive && (
            <div className="flex flex-col items-center gap-1">
              <Button
                onClick={handleCapturePlate}
                disabled={isProcessing}
                className={cn(
                  "w-20 h-20 rounded-full transition-all duration-200 shadow-2xl",
                  isProcessing
                    ? "bg-yellow-500 border-4 border-yellow-300"
                    : "bg-green-500 hover:bg-green-600 border-4 border-green-300 animate-pulse"
                )}
              >
                {isProcessing ? (
                  <Loader2 className="w-9 h-9 animate-spin" />
                ) : (
                  <Camera className="w-9 h-9" />
                )}
              </Button>
              <span className="text-xs font-bold text-white bg-green-600 px-3 py-1 rounded-full shadow-lg">
                {isProcessing ? 'Analisando...' : 'CAPTURAR'}
              </span>
            </div>
          )}

          {/* Manual input button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setShowManualInput(!showManualInput)}
            className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm border-2 border-white/20 hover:bg-black/80 transition-all"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </div>
      </div>

      {/* Manual Input - Maior e mais fácil de usar */}
      {showManualInput && (
        <div className="flex flex-col gap-3 p-4 bg-card rounded-3xl border-2 border-border shadow-lg animate-slide-up">
          <label className="text-sm font-semibold text-muted-foreground text-center">
            Digite a placa manualmente
          </label>
          <Input
            placeholder="AAA1A23"
            value={manualPlate}
            onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
            className="h-16 text-center text-2xl font-mono font-bold uppercase bg-muted rounded-2xl border-2"
            maxLength={7}
            autoFocus
          />
          <Button
            onClick={handleManualAdd}
            className="h-14 text-lg font-bold rounded-2xl"
            disabled={manualPlate.length < 7}
            size="lg"
          >
            Adicionar Placa
          </Button>
        </div>
      )}

      {/* Status */}
      <div className="flex flex-col items-center justify-center gap-3 py-3">
        {isActive && (
          <div className="flex items-center gap-3 px-6 py-3 bg-green-500/20 border-2 border-green-500 rounded-2xl">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-base font-bold text-green-700">
              {isProcessing ? '⏳ Analisando placa...' : '✓ Pronta para capturar'}
            </span>
          </div>
        )}

        {/* Cache Status */}
        {cacheSize > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
            <Database className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-semibold">
              {cacheSize} placas em cache local
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
