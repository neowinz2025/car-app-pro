import { BarChart3, Car, Store, Droplets, TrendingUp } from 'lucide-react';
import { PlateRecord } from '@/types/plate';
import { cn } from '@/lib/utils';

interface StatsViewProps {
  plates: PlateRecord[];
  stats: {
    total: number;
    unique: number;
    loja: number;
    lavaJato: number;
  };
}

export function StatsView({ plates, stats }: StatsViewProps) {
  const completedBoth = plates.filter(p => p.loja && p.lavaJato).length;
  const pendingLoja = plates.filter(p => !p.loja).length;
  const pendingLavaJato = plates.filter(p => !p.lavaJato).length;

  const statCards = [
    {
      label: 'Total de Placas',
      value: stats.total,
      icon: Car,
      color: 'primary',
      bgClass: 'bg-primary/10',
      textClass: 'text-primary',
    },
    {
      label: 'Placas Únicas',
      value: stats.unique,
      icon: TrendingUp,
      color: 'accent',
      bgClass: 'bg-accent',
      textClass: 'text-accent-foreground',
    },
    {
      label: 'Passou na Loja',
      value: stats.loja,
      icon: Store,
      color: 'primary',
      bgClass: 'bg-primary/10',
      textClass: 'text-primary',
    },
    {
      label: 'Passou no Lava Jato',
      value: stats.lavaJato,
      icon: Droplets,
      color: 'success',
      bgClass: 'bg-success/10',
      textClass: 'text-success',
    },
  ];

  return (
    <div className="flex flex-col h-full px-4 py-4 overflow-y-auto scrollbar-hide">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Estatísticas</h2>
          <p className="text-xs text-muted-foreground">Resumo do dia</p>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card rounded-2xl p-4 border border-border animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bgClass)}>
                <Icon className={cn("w-5 h-5", stat.textClass)} />
              </div>
              <p className="text-3xl font-bold mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Progress Section */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <h3 className="font-semibold mb-4">Progresso</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Completou ambos</span>
              <span className="font-medium">{completedBoth} de {stats.total}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: stats.total > 0 ? `${(completedBoth / stats.total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Pendente Loja</span>
              <span className="font-medium text-warning">{pendingLoja}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: stats.total > 0 ? `${(stats.loja / stats.total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Pendente Lava Jato</span>
              <span className="font-medium text-warning">{pendingLavaJato}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success rounded-full transition-all duration-500"
                style={{ width: stats.total > 0 ? `${(stats.lavaJato / stats.total) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
