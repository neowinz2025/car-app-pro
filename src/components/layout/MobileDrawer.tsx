import { Camera, List, Download, FileText, ClipboardList, AlertTriangle, LogOut, Menu, X, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export type TabType = 'scanner' | 'plates' | 'export' | 'reports' | 'shift' | 'damaged';

interface MobileDrawerProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isOpen: boolean;
  onToggle: () => void;
  plateCount: number;
}

const menuItems = [
  { id: 'scanner' as const, icon: Camera, label: 'Scanner de Placas', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'plates' as const, icon: List, label: 'Lista de Placas', color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'damaged' as const, icon: AlertTriangle, label: 'Avarias', color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'shift' as const, icon: ClipboardList, label: 'Controle de Turno', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'reports' as const, icon: FileText, label: 'Relatórios', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'export' as const, icon: Download, label: 'Exportar Dados', color: 'text-teal-500', bg: 'bg-teal-500/10' },
];

export function MobileDrawer({ activeTab, onTabChange, isOpen, onToggle, plateCount }: MobileDrawerProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    navigate('/login');
    toast.success('Logout realizado com sucesso');
  };

  const handleMenuClick = (tab: TabType) => {
    onTabChange(tab);
    onToggle();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={onToggle}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border z-50 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header do Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shadow-lg">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Baty Car</h2>
              <p className="text-xs text-muted-foreground">Controle de Pátio</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="rounded-lg h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Contador de Placas */}
        <div className="px-4 py-3 bg-primary/5">
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl border border-primary/20">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total de Placas</p>
              <p className="text-2xl font-bold text-primary">{plateCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 touch-manipulation",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "text-foreground hover:bg-muted active:scale-95"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    isActive ? "bg-white/20" : item.bg
                  )}>
                    <Icon className={cn("w-5 h-5", isActive ? "text-white" : item.color)} />
                  </div>
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer com Logout */}
        <div className="p-3 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200 touch-manipulation active:scale-95">
                <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold">Sair do Sistema</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja sair do sistema? Todos os dados salvos serão mantidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Sair
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
}
