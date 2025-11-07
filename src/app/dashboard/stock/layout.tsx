'use client';

import { StockProvider } from '@/context/stock-context';
import { useMandiData } from '@/context/mandi-context';

export default function StockLayout({ children }: { children: React.ReactNode }) {
  const { processingHistory: mandiProcessingHistory } = useMandiData();
  
  return (
    <StockProvider mandiProcessingHistory={mandiProcessingHistory}>
      {children}
    </StockProvider>
  );
}
