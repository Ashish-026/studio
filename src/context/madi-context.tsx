'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import type { TargetAllocation, PaddyLifted } from '@/lib/types';

interface MadiContextType {
  targetAllocations: TargetAllocation[];
  paddyLiftedItems: PaddyLifted[];
  addTarget: (item: Omit<TargetAllocation, 'id'>) => void;
  addPaddyLifted: (item: Omit<PaddyLifted, 'id'>) => void;
}

const MadiContext = createContext<MadiContextType | null>(null);

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


export function MadiProvider({ children }: { children: ReactNode }) {
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>(initialTargets);
  const [paddyLiftedItems, setPaddyLiftedItems] = useState<PaddyLifted[]>(initialPaddyLifted);

  const addTarget = useCallback((item: Omit<TargetAllocation, 'id'>) => {
    setTargetAllocations((prev) => [...prev, { ...item, id: new Date().toISOString() }]);
  }, []);

  const addPaddyLifted = useCallback((item: Omit<PaddyLifted, 'id'>) => {
    setPaddyLiftedItems((prev) => [...prev, { ...item, id: new Date().toISOString() }]);
  }, []);

  return (
    <MadiContext.Provider value={{ targetAllocations, paddyLiftedItems, addTarget, addPaddyLifted }}>
      {children}
    </MadiContext.Provider>
  );
}

export function useMadiData() {
    const context = useContext(MadiContext);
    if (!context) {
        throw new Error('useMadiData must be used within an MadiProvider');
    }
    return context;
}
