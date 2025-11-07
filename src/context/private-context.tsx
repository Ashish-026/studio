'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import type { PrivateEntry } from '@/lib/types';


interface PrivateContextType {
  entries: PrivateEntry[];
  addEntry: (item: Omit<PrivateEntry, 'id'>) => void;
}

const PrivateContext = createContext<PrivateContextType | null>(null);

const initialEntries: PrivateEntry[] = [
    { 
        id: '1', 
        name: 'Gopal Verma', 
        quantityReceived: 150, 
        amountPaid: 300000, 
    },
    { 
        id: '2', 
        name: 'Sunita Devi', 
        quantityReceived: 200, 
        amountPaid: 750000,
    },
];

export function PrivateProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<PrivateEntry[]>(initialEntries);

  const addEntry = useCallback((item: Omit<PrivateEntry, 'id'>) => {
    setEntries((prev) => [...prev, { ...item, id: new Date().toISOString() }]);
  }, []);


  return (
    <PrivateContext.Provider value={{ entries, addEntry }}>
      {children}
    </PrivateContext.Provider>
  );
}

export function usePrivateData() {
    const context = useContext(PrivateContext);
    if (!context) {
        throw new Error('usePrivateData must be used within a PrivateProvider');
    }
    return context;
}
