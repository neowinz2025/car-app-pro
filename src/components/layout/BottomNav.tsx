import { Camera, List, BarChart3, Download, ClipboardList, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TabType = 'scanner' | 'plates' | 'stats' | 'export' | 'shift' | 'reports';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'scanner' as const, icon: Camera, label: 'Scanner' },
  { id: 'plates' as const, icon: List, label: 'Placas' },
  { id: 'export' as const, icon: Download, label: 'Exportar' },
  { id: 'reports' as const, icon: FileText, label: 'Relatórios' },
  { id: 'shift' as const, icon: ClipboardList, label: 'Turno' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 touch-manipulation tap-highlight-none min-w-[64px]",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
