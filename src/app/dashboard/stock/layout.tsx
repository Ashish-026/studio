import { StockProvider } from '@/context/stock-context';

export default function StockLayout({ children }: { children: React.ReactNode }) {
  return (
    <StockProvider>{children}</StockProvider>
  );
}
