import { OSCSCProvider } from '@/context/oscsc-context';

export default function OscscLayout({ children }: { children: React.ReactNode }) {
  return <OSCSCProvider>{children}</OSCSCProvider>;
}
