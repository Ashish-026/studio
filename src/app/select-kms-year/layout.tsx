'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useMill } from '@/hooks/use-mill';
import { KmsYearProvider } from '@/context/kms-year-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function SelectKmsYearLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: userLoading } = useAuth();
  const { selectedMill, loading: millLoading } = useMill();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/');
    } else if (!millLoading && !selectedMill) {
      router.replace('/select-mill');
    }
  }, [user, userLoading, selectedMill, millLoading, router]);

  if (userLoading || millLoading || !user || !selectedMill) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-[400px] w-[400px]" />
      </div>
    );
  }

  return <KmsYearProvider>{children}</KmsYearProvider>;
}
