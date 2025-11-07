'use client';

import { createContext, useContext, ReactNode, useMemo, useState, useCallback } from 'react';
import { useOSCSCData } from './oscsc-context';
import { usePrivateData } from './private-context';
import type { StockItem, ProcessingResult } from '@/lib/types';

interface StockContextType {
  oscscStock: StockItem;
  privateStock: StockItem;
  totalStock: StockItem;
  processingHistory: ProcessingResult[];
  addProcessingResult: (result: Omit<ProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
}

const StockContext = createContext<StockContextType | null>(null);

const initialProcessingHistory: ProcessingResult[] = [
    {
        id: 'p1',
        date: new Date('2024-07-20'),
        source: 'private',
        paddyUsed: 100, // in quintals
        riceYield: 65, // in quintals
        branYield: 5,
        brokenRiceYield: 2,
        yieldPercentage: 65
    }
];

export function StockProvider({ children }: { children: ReactNode }) {
  const { paddyLiftedItems } = useOSCSCData();
  const { purchases, sales } = usePrivateData();
  const [processingHistory, setProcessingHistory] = useState<ProcessingResult[]>(initialProcessingHistory);

  const processedPaddyBySource = useMemo(() => {
    return processingHistory.reduce((acc, item) => {
        acc[item.source] += item.paddyUsed;
        return acc;
    }, { oscsc: 0, private: 0 });
  }, [processingHistory]);

  const processedYields = useMemo(() => {
    return processingHistory.reduce((acc, item) => {
        acc.rice += item.riceYield;
        acc.bran += item.branYield;
        acc.brokenRice += item.brokenRiceYield;
        return acc;
    }, { rice: 0, bran: 0, brokenRice: 0 });
  }, [processingHistory]);


  const oscscStock = useMemo<StockItem>(() => {
    const totalPaddyLifted = paddyLiftedItems.reduce((acc, item) => acc + item.totalPaddyReceived, 0);
    const soldPaddy = sales.filter(s => s.source === 'oscsc' && s.itemType === 'paddy').reduce((acc, s) => acc + s.quantity, 0);
    const paddyUsedForProcessing = processedPaddyBySource.oscsc;
    
    // For now, assuming OSCSC doesn't directly deal in rice/bran etc. in this context
    return { 
        paddy: totalPaddyLifted - soldPaddy - paddyUsedForProcessing, 
        rice: 0, 
        bran: 0, 
        brokenRice: 0 
    };
  }, [paddyLiftedItems, sales, processedPaddyBySource]);

  const privateStock = useMemo<StockItem>(() => {
    const purchasedPaddy = purchases.filter(p => p.itemType === 'paddy').reduce((acc, p) => acc + p.quantity, 0);
    const purchasedRice = purchases.filter(p => p.itemType === 'rice').reduce((acc, p) => acc + p.quantity, 0);

    const soldPaddy = sales.filter(s => s.source === 'private' && s.itemType === 'paddy').reduce((acc, s) => acc + s.quantity, 0);
    const soldRice = sales.filter(s => s.source === 'private' && s.itemType === 'rice').reduce((acc, s) => acc + s.quantity, 0);

    const paddyUsedForProcessing = processedPaddyBySource.private;

    const availablePaddy = purchasedPaddy - paddyUsedForProcessing - soldPaddy;

    return {
      paddy: availablePaddy,
      rice: (purchasedRice + processedYields.rice) - soldRice,
      bran: processedYields.bran,
      brokenRice: processedYields.brokenRice,
    };
  }, [purchases, sales, processedPaddyBySource, processedYields]);
  
  const totalStock = useMemo<StockItem>(() => {
    return {
      paddy: oscscStock.paddy + privateStock.paddy,
      rice: oscscStock.rice + privateStock.rice,
      bran: privateStock.bran, // Assuming bran/broken only come from private processing for now
      brokenRice: privateStock.brokenRice,
    };
  }, [oscscStock, privateStock]);

  const addProcessingResult = useCallback((result: Omit<ProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => {
    const newResult: ProcessingResult = {
        ...result,
        id: new Date().toISOString(),
        date: new Date(),
        yieldPercentage: (result.riceYield / result.paddyUsed) * 100,
    };
    setProcessingHistory(prev => [...prev, newResult]);
  }, []);

  return (
    <StockContext.Provider value={{ oscscStock, privateStock, totalStock, processingHistory, addProcessingResult }}>
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
