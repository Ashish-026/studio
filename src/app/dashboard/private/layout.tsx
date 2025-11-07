import { PrivateProvider } from '@/context/private-context';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <PrivateProvider>{children}</PrivateProvider>;
}
