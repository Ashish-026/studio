'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMill } from '@/hooks/use-mill';
import { useKmsYear } from '@/hooks/use-kms-year';
import { LoginForm } from '@/components/auth/login-form';
import { MillSelectionInline } from '@/components/dashboard/mill-selection-inline';
import { KmsSelectionInline } from '@/components/dashboard/kms-selection-inline';
import { AppHeader } from '@/components/dashboard/header';
import { DashboardPage } from '@/components/dashboard/main-view';
import { MandiDashboard } from '@/components/mandi/mandi-dashboard';
import { PrivateDashboard } from '@/components/private/private-dashboard';
import { StockDashboard } from '@/components/stock/stock-dashboard';
import { LabourDashboard } from '@/components/labour/labour-dashboard';
import { VehicleDashboard } from '@/components/vehicle/vehicle-dashboard';
import SettingsPage from '@/components/dashboard/settings-view';
import { MandiProvider } from '@/context/mandi-context';
import { StockProvider } from '@/context/stock-context';
import { VehicleProvider } from '@/context/vehicle-context';
import { LabourProvider } from '@/context/labour-context';
import { MillProvider } from '@/context/mill-context';
import { KmsYearProvider } from '@/context/kms-year-context';
import { MasterReport } from '@/components/reports/master-report';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export type ViewState = 'main' | 'mandi' | 'private' | 'stock' | 'labour' | 'vehicle' | 'settings';

/**
 * SINGLE-PAGE CONTROLLER: This is the primary engine of the app.
 * To resolve 404 errors, we stay on the root URL (/) at all times.
 */
function AppController() {
  const { user, loading: authLoading } = useAuth();
  const { selectedMill, loading: millLoading } = useMill();
  const { selectedKmsYear, loading: kmsLoading } = useKmsYear();
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // FORCE ROOT URL: If the user lands on a sub-path, we push them to / 
    // to prevent 404 errors when the server is idle.
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  if (!isClient || authLoading || millLoading || kmsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
          <p className="text-primary font-medium animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  // 1. LOGIN SCREEN (Inline)
  if (!user) {
    const loginBg = PlaceHolderImages.find((img) => img.id === 'login-background');
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden">
        {loginBg && (
          <Image
            src={loginBg.imageUrl}
            alt={loginBg.description}
            fill
            className="object-cover -z-10 scale-105 blur-[2px]"
            data-ai-hint={loginBg.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 -z-10" />
        <LoginForm />
      </main>
    );
  }

  // 2. SETUP SCREENS (Inline)
  if (!selectedMill) {
    return <MillSelectionInline />;
  }

  if (!selectedKmsYear) {
    return <KmsSelectionInline />;
  }

  // 3. INTERNAL VIEW SWITCHER (State-based, no URL change)
  const renderRegister = () => {
    switch (currentView) {
      case 'mandi': return <MandiDashboard />;
      case 'private': return <PrivateDashboard />;
      case 'stock': return <StockDashboard />;
      case 'labour': return <LabourDashboard />;
      case 'vehicle': return <VehicleDashboard />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <LabourProvider>
        <VehicleProvider>
          <StockProvider>
            <MandiProvider>
              <AppHeader onNavigate={setCurrentView} currentView={currentView} />
              <main className="flex-1 flex flex-col container py-8 px-4 md:px-6">
                {currentView !== 'main' && (
                  <Button 
                    variant="ghost" 
                    className="w-fit mb-4 -ml-2 text-muted-foreground hover:text-primary"
                    onClick={() => setCurrentView('main')}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                )}
                <div className="absolute -left-[9999px] top-auto pointer-events-none" aria-hidden="true">
                  <div id="master-report-pdf">
                    <MasterReport />
                  </div>
                </div>
                {renderRegister()}
              </main>
            </MandiProvider>
          </StockProvider>
        </VehicleProvider>
      </LabourProvider>
    </div>
  );
}

export default function RootPage() {
  return (
    <MillProvider>
      <KmsYearProvider>
        <AppController />
      </KmsYearProvider>
    </MillProvider>
  );
}
