import { Car, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  plateCount: number;
  onMenuClick?: () => void;
}

export function Header({ plateCount, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border safe-area-inset-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Baty Car</h1>
            <p className="text-xs text-muted-foreground">Controle de placas</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
            <span className="text-sm font-semibold">{plateCount}</span>
            <span className="text-xs">placas</span>
          </div>
          
          {onMenuClick && (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="rounded-xl">
              <Menu className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
