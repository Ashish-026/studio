import { PrivateProvider } from '@/context/private-context';
import { OSCSCProvider } from '@/context/oscsc-context';
import { StockProvider } from '@/context/stock-context';

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return (
    <OSCSCProvider>
        <PrivateProvider>
            <StockProvider>{children}</StockProvider>
        </PrivateProvider>
    </OSCSCProvider>
  );
}
