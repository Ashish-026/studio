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

const parseStoredData = (key: string, initialData: any[]) => {
    try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        if (!stored) return initialData;

        const parsed = JSON.parse(stored);
        return parsed.map((item: any) => ({
            ...item,
            date: item.date ? new Date(item.date) : undefined,
            workEntries: item.workEntries?.map((w: any) => ({...w, date: new Date(w.date)})),
            payments: item.payments?.map((p: any) => ({...p, date: new Date(p.date)})),
            trips: item.trips?.map((t: any) => ({...t, date: new Date(t.date)})),
        }));
    } catch (e) {
        return initialData;
    }
}

export function MandiProvider({ children }: { children: ReactNode }) {
  const { addMandiProcessing: addMandiProcessingToStock, mandiProcessingHistory, transferredInStock } = useStockData();

  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [paddyLiftedItems, setPaddyLiftedItems] = useState<PaddyLifted[]>([]);
  const [stockReleases, setStockReleases] = useState<MandiStockRelease[]>([]);

  useEffect(() => {
    setTargetAllocations(parseStoredData('targetAllocations', []));
    setPaddyLiftedItems(parseStoredData('paddyLiftedItems', []));
    setStockReleases(parseStoredData('stockReleases', []));
  }, []);

  useEffect(() => {
    localStorage.setItem('targetAllocations', JSON.stringify(targetAllocations));
  }, [targetAllocations]);

  useEffect(() => {
    localStorage.setItem('paddyLiftedItems', JSON.stringify(paddyLiftedItems));
  }, [paddyLiftedItems]);
  
  useEffect(() => {
    localStorage.setItem('stockReleases', JSON.stringify(stockReleases));
  }, [stockReleases]);

  const totalRiceFromProcessing = useMemo(() => {
    return (mandiProcessingHistory || []).reduce((acc, item) => acc + (Number(item.riceYield) || 0), 0);
  }, [mandiProcessingHistory]);

  const totalRiceSupplied = useMemo(() => {
      return (stockReleases || []).reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }, [stockReleases]);
  
  const totalTransferredInStock = useMemo(() => {
      return (transferredInStock || []).reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
  }, [transferredInStock]);

  const availableRiceForSupply = useMemo(() => {
    return totalRiceFromProcessing + totalTransferredInStock - totalRiceSupplied;
  }, [totalRiceFromProcessing, totalTransferredInStock, totalRiceSupplied]);

  const addTarget = useCallback((item: Omit<TargetAllocation, 'id'>) => {
    setTargetAllocations((prev) => [...(prev || []), { ...item, id: new Date().toISOString() }]);
  }, []);

  const updateTarget = useCallback((id: string, updatedTarget: Omit<TargetAllocation, 'id'>) => {
    setTargetAllocations(prev => (prev || []).map(t => t.id === id ? { ...updatedTarget, id } : t));
  }, []);

  const addPaddyLifted = useCallback((item: Omit<PaddyLifted, 'id'>) => {
    const newEntry = { ...item, id: new Date().toISOString() } as PaddyLifted;
    setPaddyLiftedItems((prev) => [...(prev || []), newEntry]);
    return newEntry;
  }, []);

  const updatePaddyLifted = useCallback((id: string, updatedPaddyLifted: Omit<PaddyLifted, 'id'>) => {
    setPaddyLiftedItems(prev => (prev || []).map(p => p.id === id ? { ...updatedPaddyLifted, id } : p));
  }, []);

  const addStockRelease = useCallback((item: Omit<MandiStockRelease, 'id'>) => {
      const newStockRelease: MandiStockRelease = {
          ...item,
          id: new Date().toISOString(),
      };
      setStockReleases(prev => [...(prev || []), newStockRelease]);
  }, []);

  const updateStockRelease = useCallback((id: string, updatedStockRelease: Omit<MandiStockRelease, 'id' | 'date'>) => {
    setStockReleases(prev => (prev || []).map(sr => sr.id === id ? { ...sr, ...updatedStockRelease } : sr));
  }, []);

  return (
    <MandiContext.Provider value={{ targetAllocations, paddyLiftedItems, processingHistory: mandiProcessingHistory, stockReleases, addTarget, updateTarget, addPaddyLifted, updatePaddyLifted, addMandiProcessing: addMandiProcessingToStock, addStockRelease, availableRiceForSupply, totalRiceFromProcessing, updateStockRelease }}>
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
