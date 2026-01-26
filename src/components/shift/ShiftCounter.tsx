import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ShiftCounterProps {
  icon: LucideIcon;
  label: string;
  code?: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  colorClass?: string;
}

export function ShiftCounter({
  icon: Icon,
  label,
  code,
  value,
  onIncrement,
  onDecrement,
  colorClass = 'bg-primary',
}: ShiftCounterProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-card rounded-xl border border-border">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium truncate">
          {code && <span className="font-bold">{code} - </span>}
          {label}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500"
          onClick={onDecrement}
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <div className="w-12 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
          <span className="font-bold text-black text-sm">
            {value.toString().padStart(2, '0')}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-500"
          onClick={onIncrement}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
