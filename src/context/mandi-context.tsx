'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useMemo } from 'react';
import type { MandiProcessingResult, MandiStockRelease, TargetAllocation, PaddyLifted } from '@/lib/types';
import { useStockData } from './stock-context';

interface MandiContextType {
  targetAllocations: TargetAllocation[];
  paddyLiftedItems: PaddyLifted[];
  processingHistory: MandiProcessingResult[];
  stockReleases: MandiStockRelease[];
  totalRiceFromProcessing: number;
  availableRiceForSupply: number;
  addTarget: (item: Omit<TargetAllocation, 'id'>) => void;
  addPaddyLifted: (item: Omit<PaddyLifted, 'id'>) => void;
  addMandiProcessing: (item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
  addStockRelease: (item: Omit<MandiStockRelease, 'id'>) => void;
}

const MandiContext = createContext<MandiContextType | null>(null);

const initialTargets: TargetAllocation[] = [
    { id: '1', mandiName: 'Bargarh Main', date: new Date('2024-05-10'), target: 5000 },
    { id: '2', mandiName: 'Sambalpur Town', date: new Date('2024-05-12'), target: 7500 },
    { id: '3', mandiName: 'Bargarh Main', date: new Date('2024-05-15'), target: 2500 },
];

const initialPaddyLifted: PaddyLifted[] = [
    { id: '1', mandiName: 'Bargarh Main', farmerName: 'Ramesh Patel', totalPaddyReceived: 120, mandiWeight: 118.5, entryType: 'physical' },
    { id: '2', mandiName: 'Sambalpur Town', farmerName: 'Suresh Meher', totalPaddyReceived: 80, mandiWeight: 79.2, entryType: 'physical' },
    { id: '3', mandiName: 'Bargarh Main', farmerName: 'Monetary Entry', moneyReceived: 220000, ratePerQuintal: 2200, totalPaddyReceived: 100, mandiWeight: 0, entryType: 'monetary' },
];

export function MandiProvider({ children }: { children: ReactNode }) {
  const { addMandiProcessing, mandiProcessingHistory, transferredInStock } = useStockData();

  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>(initialTargets);
  const [paddyLiftedItems, setPaddyLiftedItems] = useState<PaddyLifted[]>(initialPaddyLifted);
  const [stockReleases, setStockReleases] = useState<MandiStockRelease[]>([]);

  const totalRiceFromProcessing = useMemo(() => {
    return mandiProcessingHistory.reduce((acc, item) => acc + item.riceYield, 0);
  }, [mandiProcessingHistory]);

  const totalRiceSupplied = useMemo(() => {
      return stockReleases.reduce((acc, item) => acc + item.quantity, 0);
  }, [stockReleases]);

  const availableRiceForSupply = useMemo(() => {
    return totalRiceFromProcessing + transferredInStock - totalRiceSupplied;
  }, [totalRiceFromProcessing, transferredInStock, totalRiceSupplied]);

  const addTarget = useCallback((item: Omit<TargetAllocation, 'id'>) => {
    setTargetAllocations((prev) => [...prev, { ...item, id: new Date().toISOString() }]);
  }, []);

  const addPaddyLifted = useCallback((item: Omit<PaddyLifted, 'id'>) => {
    setPaddyLiftedItems((prev) => [...prev, { ...item, id: new Date().toISOString() }]);
  }, []);

  const addStockRelease = useCallback((item: Omit<MandiStockRelease, 'id'>) => {
      const newStockRelease: MandiStockRelease = {
          ...item,
          id: new Date().toISOString(),
      };
      setStockReleases(prev => [...prev, newStockRelease]);
  }, []);


  return (
    <MandiContext.Provider value={{ targetAllocations, paddyLiftedItems, processingHistory: mandiProcessingHistory, stockReleases, addTarget, addPaddyLifted, addMandiProcessing, addStockRelease, availableRiceForSupply, totalRiceFromProcessing }}>
      {children}
    </MandiContext.Provider>
  );
}

export function useMandiData() {
    const context = useContext(MandiContext);
    if (!context) {
        throw new Error('useMandiData must be used within an MandiProvider');
    }
    return context;
}
