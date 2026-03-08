
'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Mill } from '@/lib/types';
import * as db from '@/lib/db';

interface MillContextType {
  mills: Mill[];
  selectedMill: Mill | null;
  selectMill: (millId: string) => void;
  loading: boolean;
}

export const MillContext = createContext<MillContextType | null>(null);

const hardcodedMills: Mill[] = [
  { id: '1', name: 'Konkorada Mill', location: 'Konkorada' },
  { id: '2', name: 'Rambha Mill', location: 'Rambha' },
];

export function MillProvider({ children }: { children: ReactNode }) {
  const [mills, setMills] = useState<Mill[]>(hardcodedMills);
  const [selectedMill, setSelectedMill] = useState<Mill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMill = async () => {
      const storedMill = await db.getItem<Mill>('mandi-monitor-mill');
      if (storedMill) {
        setSelectedMill(storedMill);
      }
      setLoading(false);
    };
    loadMill();
  }, []);

  const selectMill = useCallback((millId: string) => {
    const mill = mills.find((m) => m.id === millId);
    if (mill) {
      setSelectedMill(mill);
      db.setItem('mandi-monitor-mill', mill);
    }
  }, [mills]);

  return (
    <MillContext.Provider value={{ mills, selectedMill, selectMill, loading }}>
      {children}
    </MillContext.Provider>
  );
}
