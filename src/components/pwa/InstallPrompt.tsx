import { useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';
import { cn } from '@/lib/utils';

export function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, install } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  // Show iOS guide
  if (isIOS) {
    if (!showIOSGuide) {
      return (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Instalar Baty Car</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adicione à tela inicial para acesso rápido
                </p>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => setDismissed(true)}
              >
                Agora não
              </Button>
              <Button
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => setShowIOSGuide(true)}
              >
                Ver como
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center p-4 animate-fade-in">
        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold">Instalar no iPhone/iPad</h2>
            <button
              onClick={() => {
                setShowIOSGuide(false);
                setDismissed(true);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm">Toque no botão <strong>Compartilhar</strong></p>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Share className="w-4 h-4" />
                  <span className="text-xs">Na barra inferior do Safari</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm">Selecione <strong>Adicionar à Tela de Início</strong></p>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Plus className="w-4 h-4" />
                  <span className="text-xs">Role para baixo se necessário</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm">Toque em <strong>Adicionar</strong></p>
                <span className="text-xs text-muted-foreground">Pronto! O app aparecerá na sua tela inicial</span>
              </div>
            </div>
          </div>

          <Button
            className="w-full mt-6 rounded-xl"
            onClick={() => {
              setShowIOSGuide(false);
              setDismissed(true);
            }}
          >
            Entendi
          </Button>
        </div>
      </div>
    );
  }

  // Show Android/Desktop install prompt
  if (!canInstall) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Instalar Baty Car</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instale para acesso rápido e uso offline
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl"
            onClick={() => setDismissed(true)}
          >
            Agora não
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-xl"
            onClick={install}
          >
            <Download className="w-4 h-4 mr-2" />
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
}
