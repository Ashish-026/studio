'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppHeader } from '@/components/dashboard/header';
import { Skeleton } from '@/components/ui/skeleton';
import { MandiProvider } from '@/context/mandi-context';
import { StockProvider } from '@/context/stock-context';
import { VehicleProvider } from '@/context/vehicle-context';
import { LabourProvider } from '@/context/labour-context';
import { MillProvider } from '@/context/mill-context';
import { KmsYearProvider } from '@/context/kms-year-context';
import { useMill } from '@/hooks/use-mill';
import { useKmsYear } from '@/hooks/use-kms-year';

function ProtectedDashboard({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useAuth();
  const { selectedMill, loading: millLoading } = useMill();
  const { selectedKmsYear, loading: kmsYearLoading } = useKmsYear();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/');
    } else if (!millLoading && !selectedMill) {
      router.replace('/select-mill');
    } else if (!kmsYearLoading && !selectedKmsYear) {
        router.replace('/select-kms-year');
    }
  }, [user, userLoading, selectedMill, millLoading, selectedKmsYear, kmsYearLoading, router]);

  if (userLoading || millLoading || kmsYearLoading || !user || !selectedMill || !selectedKmsYear) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-card">
          <div className="container flex h-16 items-center px-4 md:px-6">
            <Skeleton className="h-8 w-32" />
            <div className="ml-auto">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </header>
        <main className="flex-1 container py-8">
            <div className="flex justify-center items-center h-64">
                <p>Loading user, mill and KMS year data...</p>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col">
        <LabourProvider>
          <VehicleProvider>
            <StockProvider>
              <MandiProvider>{children}</MandiProvider>
            </StockProvider>
          </VehicleProvider>
        </LabourProvider>
      </main>
    </div>
  );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MillProvider>
        <KmsYearProvider>
            <ProtectedDashboard>
                {children}
            </ProtectedDashboard>
        </KmsYearProvider>
    </MillProvider>
  );
}
