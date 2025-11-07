'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useMemo } from 'react';
import type { TargetAllocation, PaddyLifted, MandiProcessingResult, MandiStockRelease } from '@/lib/types';

interface MandiContextType {
  targetAllocations: TargetAllocation[];
  paddyLiftedItems: PaddyLifted[];
  processingHistory: MandiProcessingResult[];
  stockReleases: MandiStockRelease[];
  totalRiceFromProcessing: number;
  availableRiceForSupply: number;
  addTarget: (item: Omit<TargetAllocation, 'id'>) => void;
  addPaddyLifted: (item: Omit<PaddyLifted, 'id'>) => void;
  addProcessing: (item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
  addStockRelease: (item: Omit<MandiStockRelease, 'id'>) => void;
  addTransferredStock: (quantity: number) => void;
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

const initialProcessingHistory: MandiProcessingResult[] = [
    { id: 'mp1', date: new Date('2024-07-20'), paddyUsed: 150, riceYield: 97.5, branYield: 7.5, brokenRiceYield: 3, yieldPercentage: 65 }
];

const initialStockReleases: MandiStockRelease[] = [
    { id: 'msr1', date: new Date('2024-07-22'), lotNumber: 'LOT-001', godownDetails: 'Central Godown, Bay 4', quantity: 50 }
];


export function MandiProvider({ children }: { children: ReactNode }) {
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>(initialTargets);
  const [paddyLiftedItems, setPaddyLiftedItems] = useState<PaddyLifted[]>(initialPaddyLifted);
  const [processingHistory, setProcessingHistory] = useState<MandiProcessingResult[]>(initialProcessingHistory);
  const [stockReleases, setStockReleases] = useState<MandiStockRelease[]>(initialStockReleases);
  const [transferredInStock, setTransferredInStock] = useState(0);

  const totalRiceFromProcessing = useMemo(() => {
    return processingHistory.reduce((acc, item) => acc + item.riceYield, 0);
  }, [processingHistory]);

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

  const addProcessing = useCallback((item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => {
    const newProcessingEntry: MandiProcessingResult = {
        ...item,
        id: new Date().toISOString(),
        date: new Date(),
        yieldPercentage: (item.riceYield / item.paddyUsed) * 100,
    };
    setProcessingHistory(prev => [...prev, newProcessingEntry]);
  }, []);

  const addStockRelease = useCallback((item: Omit<MandiStockRelease, 'id'>) => {
      const newStockRelease: MandiStockRelease = {
          ...item,
          id: new Date().toISOString(),
      };
      setStockReleases(prev => [...prev, newStockRelease]);
  }, []);

  const addTransferredStock = useCallback((quantity: number) => {
    setTransferredInStock(prev => prev + quantity);
  }, []);

  return (
    <MandiContext.Provider value={{ targetAllocations, paddyLiftedItems, processingHistory, stockReleases, addTarget, addPaddyLifted, addProcessing, addStockRelease, availableRiceForSupply, totalRiceFromProcessing, addTransferredStock }}>
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
