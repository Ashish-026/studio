import { MandiProvider } from '@/context/mandi-context';

export default function MandiLayout({ children }: { children: React.ReactNode }) {
  return <MandiProvider>{children}</MandiProvider>;
}
