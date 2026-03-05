'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useMemo, useEffect } from 'react';
import type { MandiProcessingResult, MandiStockRelease, TargetAllocation, PaddyLifted } from '@/lib/types';
import { useStockData } from './stock-context';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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

export function MandiProvider({ children }: { children: ReactNode }) {
  const { addMandiProcessing: addMandiProcessingToStock, mandiProcessingHistory, transferredInStock } = useStockData();
  const db = useFirestore();

  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>([]);
  const [paddyLiftedItems, setPaddyLiftedItems] = useState<PaddyLifted[]>([]);
  const [stockReleases, setStockReleases] = useState<MandiStockRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const unsubTargets = onSnapshot(collection(db, 'targetAllocations'), (s) => {
      setTargetAllocations(s.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date?.toDate() || new Date(d.data().date) } as TargetAllocation)));
    });

    const unsubLifting = onSnapshot(collection(db, 'paddyLiftedItems'), (s) => {
      setPaddyLiftedItems(s.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date?.toDate() || new Date(d.data().date) } as PaddyLifted)));
    });

    const unsubReleases = onSnapshot(collection(db, 'stockReleases'), (s) => {
      setStockReleases(s.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date?.toDate() || new Date(d.data().date) } as MandiStockRelease)));
      setLoading(false);
    });

    return () => {
      unsubTargets();
      unsubLifting();
      unsubReleases();
    };
  }, [db]);

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
    if (!db) return;
    const id = Date.now().toString();
    setDocumentNonBlocking(doc(db, 'targetAllocations', id), { ...item, id }, { merge: true });
  }, [db]);

  const updateTarget = useCallback((id: string, updatedTarget: Omit<TargetAllocation, 'id'>) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'targetAllocations', id), updatedTarget);
  }, [db]);

  const addPaddyLifted = useCallback((item: Omit<PaddyLifted, 'id'>) => {
    if (!db) return {} as PaddyLifted;
    const id = Date.now().toString();
    const newEntry = { ...item, id } as PaddyLifted;
    setDocumentNonBlocking(doc(db, 'paddyLiftedItems', id), newEntry, { merge: true });
    return newEntry;
  }, [db]);

  const updatePaddyLifted = useCallback((id: string, updatedPaddyLifted: Omit<PaddyLifted, 'id'>) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'paddyLiftedItems', id), updatedPaddyLifted);
  }, [db]);

  const addStockRelease = useCallback((item: Omit<MandiStockRelease, 'id'>) => {
    if (!db) return;
    const id = Date.now().toString();
    setDocumentNonBlocking(doc(db, 'stockReleases', id), { ...item, id }, { merge: true });
  }, [db]);

  const updateStockRelease = useCallback((id: string, updatedStockRelease: Omit<MandiStockRelease, 'id' | 'date'>) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'stockReleases', id), updatedStockRelease);
  }, [db]);

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
