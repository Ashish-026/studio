'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import type { LabourRecord } from '@/lib/types';

interface LabourContextType {
  records: LabourRecord[];
  addRecord: (item: Omit<LabourRecord, 'id' | 'date' | 'wage'>) => void;
}

const LabourContext = createContext<LabourContextType | null>(null);

const initialRecords: LabourRecord[] = [
    { id: '1', name: 'Manoj Kumar', activity: 'Loading', hoursWorked: 8, dailyRate: 500, date: new Date('2024-07-01'), entryType: 'daily', wage: 500 },
    { id: '2', name: 'Anita Singh', activity: 'Cleaning', hoursWorked: 6, dailyRate: 400, date: new Date('2024-07-01'), entryType: 'daily', wage: 300 },
    { id: '3', name: 'Rakesh Sharma', itemName: 'Paddy Bags', quantity: 200, ratePerItem: 2.5, date: new Date('2024-07-02'), entryType: 'item_rate', wage: 500 },
];

export function LabourProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<LabourRecord[]>(initialRecords);

  const addRecord = useCallback((item: Omit<LabourRecord, 'id' | 'date' | 'wage'>) => {
    let wage = 0;
    if (item.entryType === 'daily' && item.hoursWorked && item.dailyRate) {
        // Assuming dailyRate is for an 8-hour day
        wage = (item.hoursWorked / 8) * item.dailyRate;
    } else if (item.entryType === 'item_rate' && item.quantity && item.ratePerItem) {
        wage = item.quantity * item.ratePerItem;
    }

    const newRecord: LabourRecord = {
        ...item,
        id: new Date().toISOString(),
        date: new Date(),
        wage,
    };
    setRecords((prev) => [...prev, newRecord]);
  }, []);

  return (
    <LabourContext.Provider value={{ records, addRecord }}>
      {children}
    </LabourContext.Provider>
  );
}

export function useLabourData() {
    const context = useContext(LabourContext);
    if (!context) {
        throw new Error('useLabourData must be used within a LabourProvider');
    }
    return context;
}
