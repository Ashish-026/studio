'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useMemo, useEffect } from 'react';
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
  updateTarget: (id: string, updatedTarget: Omit<TargetAllocation, 'id'>) => void;
  addPaddyLifted: (item: Omit<PaddyLifted, 'id'>) => PaddyLifted;
  updatePaddyLifted: (id: string, updatedPaddyLifted: Omit<PaddyLifted, 'id'>) => void;
  addMandiProcessing: (item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
  addStockRelease: (item: Omit<MandiStockRelease, 'id'>) => void;
  updateStockRelease: (id: string, updatedStockRelease: Omit<MandiStockRelease, 'id' | 'date'>) => void;
}

const MandiContext = createContext<MandiContextType | null>(null);

const initialTargets: TargetAllocation[] = [
    { id: '1', mandiName: 'Bargarh Main', date: new Date('2024-05-10'), target: 5000 },
    { id: '2', mandiName: 'Sambalpur Town', date: new Date('2024-05-12'), target: 7500 },
    { id: '3', mandiName: 'Bargarh Main', date: new Date('2024-05-15'), target: 2500 },
];

const initialPaddyLifted: PaddyLifted[] = [
    { id: '1', mandiName: 'Bargarh Main', farmerName: 'Ramesh Patel', totalPaddyReceived: 120, mandiWeight: 118.5, entryType: 'physical', vehicleType: 'farmer' },
    { id: '2', mandiName: 'Sambalpur Town', farmerName: 'Suresh Meher', totalPaddyReceived: 80, mandiWeight: 79.2, entryType: 'physical', vehicleType: 'own' },
    { id: '3', mandiName: 'Bargarh Main', farmerName: 'Monetary Entry', moneyReceived: 220000, ratePerQuintal: 2200, totalPaddyReceived: 100, mandiWeight: 0, entryType: 'monetary' },
];

const parseStoredData = (key: string, initialData: any[]) => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return initialData;

        const parsed = JSON.parse(stored);
        // Revive dates
        return parsed.map((item: any) => ({
            ...item,
            date: item.date ? new Date(item.date) : undefined,
            dateAdded: item.dateAdded ? new Date(item.dateAdded) : undefined,
            workEntries: item.workEntries?.map((w: any) => ({...w, date: new Date(w.date)})),
            payments: item.payments?.map((p: any) => ({...p, date: new Date(p.date)})),
            trips: item.trips?.map((t: any) => ({...t, date: new Date(t.date)})),
        }));
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        return initialData;
    }
}


export function MandiProvider({ children }: { children: ReactNode }) {
  const { addMandiProcessing, mandiProcessingHistory, transferredInStock } = useStockData();

  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [paddyLiftedItems, setPaddyLiftedItems] = useState<PaddyLifted[]>([]);
  const [stockReleases, setStockReleases] = useState<MandiStockRelease[]>([]);

  useEffect(() => {
    setTargetAllocations(parseStoredData('targetAllocations', initialTargets));
    setPaddyLiftedItems(parseStoredData('paddyLiftedItems', initialPaddyLifted));
    setStockReleases(parseStoredData('stockReleases', []));
  }, []);

  useEffect(() => {
    if (targetAllocations.length > 0) localStorage.setItem('targetAllocations', JSON.stringify(targetAllocations));
  }, [targetAllocations]);

  useEffect(() => {
    if (paddyLiftedItems.length > 0) localStorage.setItem('paddyLiftedItems', JSON.stringify(paddyLiftedItems));
  }, [paddyLiftedItems]);
  
  useEffect(() => {
    if (stockReleases.length > 0) localStorage.setItem('stockReleases', JSON.stringify(stockReleases));
  }, [stockReleases]);


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

  const updateTarget = useCallback((id: string, updatedTarget: Omit<TargetAllocation, 'id'>) => {
    setTargetAllocations(prev => prev.map(t => t.id === id ? { ...updatedTarget, id } : t));
  }, []);

  const addPaddyLifted = useCallback((item: Omit<PaddyLifted, 'id'>) => {
    const newEntry = { ...item, id: new Date().toISOString() };
    setPaddyLiftedItems((prev) => [...prev, newEntry]);
    return newEntry;
  }, []);

  const updatePaddyLifted = useCallback((id: string, updatedPaddyLifted: Omit<PaddyLifted, 'id'>) => {
    setPaddyLiftedItems(prev => prev.map(p => p.id === id ? { ...updatedPaddyLifted, id } : p));
  }, []);

  const addStockRelease = useCallback((item: Omit<MandiStockRelease, 'id'>) => {
      const newStockRelease: MandiStockRelease = {
          ...item,
          id: new Date().toISOString(),
      };
      setStockReleases(prev => [...prev, newStockRelease]);
  }, []);

  const updateStockRelease = useCallback((id: string, updatedStockRelease: Omit<MandiStockRelease, 'id' | 'date'>) => {
    setStockReleases(prev => prev.map(sr => sr.id === id ? { ...sr, ...updatedStockRelease } : sr));
  }, []);


  return (
    <MandiContext.Provider value={{ targetAllocations, paddyLiftedItems, processingHistory: mandiProcessingHistory, stockReleases, addTarget, updateTarget, addPaddyLifted, updatePaddyLifted, addMandiProcessing, addStockRelease, availableRiceForSupply, totalRiceFromProcessing, updateStockRelease }}>
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
