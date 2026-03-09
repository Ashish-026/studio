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

/**
 * UPDATED MILL LIST: Swapped names to correct data entry error.
 */
const hardcodedMills: Mill[] = [
  { id: '1', name: 'Rambha Mill', location: 'Rambha' },
  { id: '2', name: 'Konkorada Mill', location: 'Konkorada' },
];

export function MillProvider({ children }: { children: ReactNode }) {
  const [mills, setMills] = useState<Mill[]>(hardcodedMills);
  const [selectedMill, setSelectedMill] = useState<Mill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMill = async () => {
      const storedMill = await db.getItem<Mill>('mandi-monitor-mill');
      if (storedMill) {
        // Find existing mill by ID to ensure name changes reflect immediately
        const updatedMill = hardcodedMills.find(m => m.id === storedMill.id);
        setSelectedMill(updatedMill || storedMill);
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
