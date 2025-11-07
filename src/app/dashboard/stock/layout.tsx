import { OSCSCProvider } from '@/context/oscsc-context';
import { StockProvider } from '@/context/stock-context';

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return (
    <OSCSCProvider>
        <StockProvider>{children}</StockProvider>
    </OSCSCProvider>
  );
}
