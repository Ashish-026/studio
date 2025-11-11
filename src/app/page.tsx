import Image from 'next/image';
import { LoginForm } from '@/components/auth/login-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const loginBg = PlaceHolderImages.find((img) => img.id === 'login-background');

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
