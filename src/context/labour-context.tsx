'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';

export type LabourRecord = {
  id: string;
  name: string;
  activity: string;
  hoursWorked: number;
};

interface LabourContextType {
  records: LabourRecord[];
  addRecord: (item: Omit<LabourRecord, 'id'>) => void;
}

const LabourContext = createContext<LabourContextType | null>(null);

const initialRecords: LabourRecord[] = [
    { id: '1', name: 'Manoj Kumar', activity: 'Loading', hoursWorked: 8 },
    { id: '2', name: 'Anita Singh', activity: 'Cleaning', hoursWorked: 6 },
];

export function LabourProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<LabourRecord[]>(initialRecords);

  const addRecord = useCallback((item: Omit<LabourRecord, 'id'>) => {
    setRecords((prev) => [...prev, { ...item, id: new Date().toISOString() }]);
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
