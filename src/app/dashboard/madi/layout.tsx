import { MadiProvider } from '@/context/madi-context';

export default function MadiLayout({ children }: { children: React.ReactNode }) {
  return <MadiProvider>{children}</MadiProvider>;
}
