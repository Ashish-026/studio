'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppHeader } from '@/components/dashboard/header';
import { Skeleton } from '@/components/ui/skeleton';
import { MandiProvider } from '@/context/mandi-context';
import { StockProvider } from '@/context/stock-context';
import { VehicleProvider } from '@/context/vehicle-context';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
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
            <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col">
        <VehicleProvider>
          <StockProvider>
              <MandiProvider>
                  {children}
              </MandiProvider>
          </StockProvider>
        </VehicleProvider>
      </main>
    </div>
  );
}
