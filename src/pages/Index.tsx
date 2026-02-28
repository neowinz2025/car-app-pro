import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { MobileDrawer, TabType } from '@/components/layout/MobileDrawer';
import { ScannerView } from '@/components/scanner/ScannerView';
import { PlatesList } from '@/components/plates/PlatesList';
import { ExportView } from '@/components/export/ExportView';
import { ShiftView } from '@/components/shift/ShiftView';
import { MonthlyReportsView } from '@/components/reports/MonthlyReportsView';
import { DamagedVehiclesView } from '@/components/damaged/DamagedVehiclesView';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { usePlates } from '@/hooks/usePlates';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('scanner');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const hasShownWelcome = useRef(false);

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const sessionData = JSON.parse(session);
      if (!sessionData.id || !sessionData.name) {
        localStorage.removeItem('user_session');
        navigate('/login');
      }
    } catch (error) {
      localStorage.removeItem('user_session');
      navigate('/login');
    }
  }, [navigate]);
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

  useEffect(() => {
    if (!hasShownWelcome.current && plates.length > 0) {
      hasShownWelcome.current = true;
      toast.success('Dados recuperados!', {
        description: `${plates.length} placas salvas foram carregadas. Continue de onde parou!`,
        duration: 4000,
      });
    }
  }, [plates.length]);

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
      case 'export':
        return <ExportView plates={plates} onFillStep={fillStep} onClearPlates={clearPlates} />;
      case 'reports':
        return <MonthlyReportsView />;
      case 'damaged':
        return <DamagedVehiclesView />;
      case 'shift':
        return <ShiftView />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header plateCount={stats.total} onMenuClick={() => setIsDrawerOpen(true)} />

      <main className="flex-1">
        {renderContent()}
      </main>

      <MobileDrawer
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
        plateCount={stats.total}
      />

      <InstallPrompt />
    </div>
  );
};

export default Index;
