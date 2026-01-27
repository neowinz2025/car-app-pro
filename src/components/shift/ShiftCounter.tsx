import { useState } from 'react';
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
  onValueChange?: (value: number) => void;
  colorClass?: string;
}

export function ShiftCounter({
  icon: Icon,
  label,
  code,
  value,
  onIncrement,
  onDecrement,
  onValueChange,
  colorClass = 'bg-primary',
}: ShiftCounterProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue) && numValue >= 0 && onValueChange) {
      onValueChange(numValue);
    } else {
      setInputValue(value.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

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
        
        {isEditing && onValueChange ? (
          <input
            type="number"
            min="0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            autoFocus
            className="w-12 h-8 bg-yellow-400 rounded-lg text-center font-bold text-black text-sm border-none outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <div 
            className={cn(
              "w-12 h-8 bg-yellow-400 rounded-lg flex items-center justify-center",
              onValueChange && "cursor-pointer hover:bg-yellow-300"
            )}
            onClick={() => {
              if (onValueChange) {
                setInputValue(value.toString());
                setIsEditing(true);
              }
            }}
          >
            <span className="font-bold text-black text-sm">
              {value.toString().padStart(2, '0')}
            </span>
          </div>
        )}
        
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
