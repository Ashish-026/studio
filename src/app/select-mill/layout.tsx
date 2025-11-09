'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { MillProvider } from '@/context/mill-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function SelectMillLayout({
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
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-[400px] w-[400px]" />
      </div>
    );
  }

  return <MillProvider>{children}</MillProvider>;
}
