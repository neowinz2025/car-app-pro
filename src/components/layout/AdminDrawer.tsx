import { Shield, LogOut, FileText, Database, ClipboardList, Users, AlertTriangle, Key, X, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

export type AdminTabType = 'reports' | 'plates' | 'bate-fisco' | 'shifts' | 'damaged' | 'users' | 'api-keys';

interface AdminDrawerProps {
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  adminUsername: string;
  adminRole: string;
  isSuperAdmin: boolean;
}

const getMenuItems = (isSuperAdmin: boolean) => {
  const baseItems = [
    { id: 'reports' as const, icon: FileText, label: 'Relatórios', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'plates' as const, icon: Database, label: 'Placas', color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'bate-fisco' as const, icon: ClipboardList, label: 'Bate Fisco', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'shifts' as const, icon: Users, label: 'Turnos', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { id: 'damaged' as const, icon: AlertTriangle, label: 'Avarias', color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'users' as const, icon: Users, label: 'Usuários', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  if (isSuperAdmin) {
    baseItems.push({ id: 'api-keys' as const, icon: Key, label: 'API Keys', color: 'text-yellow-500', bg: 'bg-yellow-500/10' });
  }

  return baseItems;
};

export function AdminDrawer({
  activeTab,
  onTabChange,
  isOpen,
  onToggle,
  onLogout,
  adminUsername,
  adminRole,
  isSuperAdmin
}: AdminDrawerProps) {
  const menuItems = getMenuItems(isSuperAdmin);

  const handleMenuClick = (tab: AdminTabType) => {
    onTabChange(tab);
    onToggle();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={onToggle}
        />
      )}

      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border z-50 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground shadow-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Admin</h2>
              <p className="text-xs text-muted-foreground">Painel de Controle</p>
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

        <div className="px-4 py-3 bg-primary/5">
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl border border-primary/20">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Usuário</p>
              <p className="text-sm font-bold text-primary">{adminUsername}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

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
                  Tem certeza que deseja sair do painel administrativo?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onLogout}>
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
