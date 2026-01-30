import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { BottomNav, TabType } from '@/components/layout/BottomNav';
import { ScannerView } from '@/components/scanner/ScannerView';
import { PlatesList } from '@/components/plates/PlatesList';
import { StatsView } from '@/components/stats/StatsView';
import { ExportView } from '@/components/export/ExportView';
import { ShiftView } from '@/components/shift/ShiftView';
import { MonthlyReportsView } from '@/components/reports/MonthlyReportsView';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { usePlates } from '@/hooks/usePlates';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('scanner');
  const {
    plates,
    activeStep,
    setActiveStep,
    addPlate,
    removePlate,
    updatePlate,
    clearPlates,
    fillStep,
    stats,
  } = usePlates();

  const renderContent = () => {
    switch (activeTab) {
      case 'scanner':
        return (
          <ScannerView
            activeStep={activeStep}
            onSetActiveStep={setActiveStep}
            onAddPlate={addPlate}
          />
        );
      case 'plates':
        return (
          <PlatesList
            plates={plates}
            onUpdatePlate={updatePlate}
            onRemovePlate={removePlate}
            onClearPlates={clearPlates}
          />
        );
      case 'stats':
        return <StatsView plates={plates} stats={stats} />;
      case 'export':
        return <ExportView plates={plates} onFillStep={fillStep} onClearPlates={clearPlates} />;
      case 'reports':
        return <MonthlyReportsView />;
      case 'shift':
        return <ShiftView />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header plateCount={stats.total} />
      
      <main className="flex-1 pb-20">
        {renderContent()}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <InstallPrompt />
    </div>
  );
};

export default Index;
