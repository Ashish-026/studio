'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import type { TargetAllocation, PaddyLifted } from '@/lib/types';

interface OSCSCContextType {
  targetAllocations: TargetAllocation[];
  paddyLiftedItems: PaddyLifted[];
  addTarget: (item: Omit<TargetAllocation, 'id'>) => void;
  addPaddyLifted: (item: Omit<PaddyLifted, 'id'>) => void;
}

const OSCSCContext = createContext<OSCSCContextType | null>(null);

const initialTargets: TargetAllocation[] = [
    { id: '1', mandiName: 'Bargarh Main', date: new Date('2024-05-10'), target: 5000 },
    { id: '2', mandiName: 'Sambalpur Town', date: new Date('2024-05-12'), target: 7500 },
    { id: '3', mandiName: 'Bargarh Main', date: new Date('2024-05-15'), target: 2500 },
];

const initialPaddyLifted: PaddyLifted[] = [
    { id: '1', mandiName: 'Bargarh Main', farmerName: 'Ramesh Patel', totalPaddyReceived: 120, mandiWeight: 118.5, entryType: 'physical' },
    { id: '2', mandiName: 'Sambalpur Town', farmerName: 'Suresh Meher', totalPaddyReceived: 80, mandiWeight: 79.2, entryType: 'physical' },
];


export function OSCSCProvider({ children }: { children: ReactNode }) {
  const [targetAllocations, setTargetAllocations] = useState<TargetAllocation[]>(initialTargets);
  const [paddyLiftedItems, setPaddyLiftedItems] = useState<PaddyLifted[]>(initialPaddyLifted);

  const addTarget = useCallback((item: Omit<TargetAllocation, 'id'>) => {
    setTargetAllocations((prev) => [...prev, { ...item, id: new Date().toISOString() }]);
  }, []);

  const addPaddyLifted = useCallback((item: Omit<PaddyLifted, 'id'>) => {
    setPaddyLiftedItems((prev) => [...prev, { ...item, id: new Date().toISOString() }]);
  }, []);

  return (
    <OSCSCContext.Provider value={{ targetAllocations, paddyLiftedItems, addTarget, addPaddyLifted }}>
      {children}
    </OSCSCContext.Provider>
  );
}

export function useOSCSCData() {
    const context = useContext(OSCSCContext);
    if (!context) {
        throw new Error('useOSCSCData must be used within an OSCSCProvider');
    }
    return context;
}
