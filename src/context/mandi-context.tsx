
'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useMemo, useEffect } from 'react';
import type { MandiProcessingResult, MandiStockRelease, TargetAllocation, PaddyLifted } from '@/lib/types';
import { useStockData } from './stock-context';
import * as db from '@/lib/db';

interface MandiContextType {
  targetAllocations: TargetAllocation[];
  paddyLiftedItems: PaddyLifted[];
  processingHistory: MandiProcessingResult[];
  stockReleases: MandiStockRelease[];
  totalRiceFromProcessing: number;
  availableRiceForSupply: number;
  addTarget: (item: Omit<TargetAllocation, 'id'>) => void;
  updateTarget: (id: string, updatedTarget: Omit<TargetAllocation, 'id'>) => void;
  deleteTarget: (id: string) => void;
  addPaddyLifted: (item: Omit<PaddyLifted, 'id'>) => PaddyLifted;
  deletePaddyLifted: (id: string) => void;
  addMandiProcessing: (item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
  addStockRelease: (item: Omit<MandiStockRelease, 'id'>) => void;
  updateStockRelease: (id: string, updatedStockRelease: Omit<MandiStockRelease, 'id' | 'date'>) => void;
  loading: boolean;
}

const MandiContext = createContext<MandiContextType | null>(null);

const KEYS = {
  TARGETS: 'mandi-monitor-targets-v2',
  LIFTING: 'mandi-monitor-lifting-v2',
  RELEASES: 'mandi-monitor-releases-v2'
};

export function MandiProvider({ children }: { children: ReactNode }) {
  const { addMandiProcessing: addMandiProcessingToStock, mandiProcessingHistory, transferredInStock } = useStockData();

  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [paddyLiftedItems, setPaddyLiftedItems] = useState<PaddyLifted[]>([]);
  const [stockReleases, setStockReleases] = useState<MandiStockRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      const targets = await db.getItem<any[]>(KEYS.TARGETS);
      const lifting = await db.getItem<any[]>(KEYS.LIFTING);
      const releases = await db.getItem<any[]>(KEYS.RELEASES);

      if (targets) setTargetAllocations(targets.map(i => ({ ...i, date: new Date(i.date) })));
      if (lifting) setPaddyLiftedItems(lifting.map(i => ({ ...i, date: new Date(i.date) })));
      if (releases) setStockReleases(releases.map(i => ({ ...i, date: new Date(i.date) })));
      
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => { if (!loading) db.setItem(KEYS.TARGETS, targetAllocations); }, [targetAllocations, loading]);
  useEffect(() => { if (!loading) db.setItem(KEYS.LIFTING, paddyLiftedItems); }, [paddyLiftedItems, loading]);
  useEffect(() => { if (!loading) db.setItem(KEYS.RELEASES, stockReleases); }, [stockReleases, loading]);

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

  const deleteTarget = useCallback((id: string) => {
    setTargetAllocations(prev => prev.filter(t => t.id !== id));
  }, []);

  const addPaddyLifted = useCallback((item: Omit<PaddyLifted, 'id'>) => {
    const newEntry = { ...item, id: Date.now().toString() } as PaddyLifted;
    setPaddyLiftedItems(prev => [...prev, newEntry]);
    return newEntry;
  }, []);

  const deletePaddyLifted = useCallback((id: string) => {
    setPaddyLiftedItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const addStockRelease = useCallback((item: Omit<MandiStockRelease, 'id'>) => {
    const newRelease = { ...item, id: Date.now().toString() };
    setStockReleases(prev => [...prev, newRelease]);
  }, []);

  const updateStockRelease = useCallback((id: string, updatedStockRelease: Omit<MandiStockRelease, 'id' | 'date'>) => {
    setStockReleases(prev => prev.map(s => s.id === id ? { ...s, ...updatedStockRelease } : s));
  }, []);

  const contextValue = useMemo(() => ({
    targetAllocations,
    paddyLiftedItems,
    processingHistory: mandiProcessingHistory,
    stockReleases,
    addTarget,
    updateTarget,
    deleteTarget,
    addPaddyLifted,
    deletePaddyLifted,
    addMandiProcessing: addMandiProcessingToStock,
    addStockRelease,
    availableRiceForSupply,
    totalRiceFromProcessing,
    updateStockRelease,
    loading
  }), [
    targetAllocations,
    paddyLiftedItems,
    mandiProcessingHistory,
    stockReleases,
    addTarget,
    updateTarget,
    deleteTarget,
    addPaddyLifted,
    deletePaddyLifted,
    addMandiProcessingToStock,
    addStockRelease,
    availableRiceForSupply,
    totalRiceFromProcessing,
    updateStockRelease,
    loading
  ]);

  return (
    <MandiContext.Provider value={contextValue}>
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
