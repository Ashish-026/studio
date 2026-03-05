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
  loading: boolean;
}

const MandiContext = createContext<MandiContextType | null>(null);

const KEYS = {
  TARGETS: 'mandi-monitor-targets',
  LIFTING: 'mandi-monitor-lifting',
  RELEASES: 'mandi-monitor-releases'
};

export function MandiProvider({ children }: { children: ReactNode }) {
  const { addMandiProcessing: addMandiProcessingToStock, mandiProcessingHistory, transferredInStock } = useStockData();

  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [paddyLiftedItems, setPaddyLiftedItems] = useState<PaddyLifted[]>([]);
  const [stockReleases, setStockReleases] = useState<MandiStockRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = (key: string, setFn: any) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFn(parsed.map((item: any) => ({ ...item, date: new Date(item.date) })));
        } catch (e) { console.error(e); }
      }
    };
    load(KEYS.TARGETS, setTargetAllocations);
    load(KEYS.LIFTING, setPaddyLiftedItems);
    load(KEYS.RELEASES, setStockReleases);
    setLoading(false);
  }, []);

  useEffect(() => { if (!loading) localStorage.setItem(KEYS.TARGETS, JSON.stringify(targetAllocations)); }, [targetAllocations, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(KEYS.LIFTING, JSON.stringify(paddyLiftedItems)); }, [paddyLiftedItems, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(KEYS.RELEASES, JSON.stringify(stockReleases)); }, [stockReleases, loading]);

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
    const newTarget = { ...item, id: Date.now().toString() };
    setTargetAllocations(prev => [...prev, newTarget]);
  }, []);

  const updateTarget = useCallback((id: string, updatedTarget: Omit<TargetAllocation, 'id'>) => {
    setTargetAllocations(prev => prev.map(t => t.id === id ? { ...updatedTarget, id } : t));
  }, []);

  const addPaddyLifted = useCallback((item: Omit<PaddyLifted, 'id'>) => {
    const newEntry = { ...item, id: Date.now().toString() } as PaddyLifted;
    setPaddyLiftedItems(prev => [...prev, newEntry]);
    return newEntry;
  }, []);

  const updatePaddyLifted = useCallback((id: string, updatedPaddyLifted: Omit<PaddyLifted, 'id'>) => {
    setPaddyLiftedItems(prev => prev.map(p => p.id === id ? { ...updatedPaddyLifted, id } : p));
  }, []);

  const addStockRelease = useCallback((item: Omit<MandiStockRelease, 'id'>) => {
    const newRelease = { ...item, id: Date.now().toString() };
    setStockReleases(prev => [...prev, newRelease]);
  }, []);

  const updateStockRelease = useCallback((id: string, updatedStockRelease: Omit<MandiStockRelease, 'id' | 'date'>) => {
    setStockReleases(prev => prev.map(s => s.id === id ? { ...s, ...updatedStockRelease } : s));
  }, []);

  return (
    <MandiContext.Provider value={{ targetAllocations, paddyLiftedItems, processingHistory: mandiProcessingHistory, stockReleases, addTarget, updateTarget, addPaddyLifted, updatePaddyLifted, addMandiProcessing: addMandiProcessingToStock, addStockRelease, availableRiceForSupply, totalRiceFromProcessing, updateStockRelease, loading }}>
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
