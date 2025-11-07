'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useOSCSCData } from './oscsc-context';
import { usePrivateData } from './private-context';
import type { StockItem } from '@/lib/types';

interface StockContextType {
  oscscStock: StockItem;
  privateStock: StockItem;
  totalStock: StockItem;
}

const StockContext = createContext<StockContextType | null>(null);

export function StockProvider({ children }: { children: ReactNode }) {
  const { paddyLiftedItems } = useOSCSCData();
  const { purchases, sales } = usePrivateData();

  const oscscStock = useMemo<StockItem>(() => {
    const totalPaddy = paddyLiftedItems.reduce((acc, item) => acc + item.totalPaddyReceived, 0);
    // Assuming OSCSC only deals with paddy for now
    return { paddy: totalPaddy, rice: 0 };
  }, [paddyLiftedItems]);

  const privateStock = useMemo<StockItem>(() => {
    const purchasedPaddy = purchases.filter(p => p.itemType === 'paddy').reduce((acc, p) => acc + p.quantity, 0);
    const purchasedRice = purchases.filter(p => p.itemType === 'rice').reduce((acc, p) => acc + p.quantity, 0);

    const soldPaddy = sales.filter(s => s.itemType === 'paddy').reduce((acc, s) => acc + s.quantity, 0);
    const soldRice = sales.filter(s => s.itemType === 'rice').reduce((acc, s) => acc + s.quantity, 0);

    return {
      paddy: purchasedPaddy - soldPaddy,
      rice: purchasedRice - soldRice
    };
  }, [purchases, sales]);
  
  const totalStock = useMemo<StockItem>(() => {
    return {
      paddy: oscscStock.paddy + privateStock.paddy,
      rice: oscscStock.rice + privateStock.rice,
    };
  }, [oscscStock, privateStock]);

  return (
    <StockContext.Provider value={{ oscscStock, privateStock, totalStock }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStockData() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStockData must be used within a StockProvider');
  }
  return context;
}
