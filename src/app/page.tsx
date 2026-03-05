'use client';

import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const loginBg = PlaceHolderImages.find((img) => img.id === 'login-background');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary/20 rounded-full mb-4" />
          <p className="text-primary font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {loginBg && (
        <Image
          src={loginBg.imageUrl}
          alt={loginBg.description}
          fill
          className="object-cover -z-10"
          data-ai-hint={loginBg.imageHint}
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/50 -z-10" />
      <LoginForm />
    </main>
  );
}
