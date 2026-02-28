import { Car, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  plateCount: number;
  onMenuClick: () => void;
}

export function Header({ plateCount, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg safe-area-inset-top">
      <div className="flex items-center justify-between px-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="w-12 h-12 rounded-xl hover:bg-white/20 text-white"
        >
          <Menu className="w-6 h-6" />
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Baty Car</h1>
            <p className="text-xs text-white/80">Controle de Pátio</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <span className="text-xl font-bold">{plateCount}</span>
          <Car className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
