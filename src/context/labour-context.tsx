
'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useEffect } from 'react';
import type { Labourer, LabourWorkEntry, Payment } from '@/lib/types';

interface LabourContextType {
  labourers: Labourer[];
  addLabourer: (labourerName: string) => void;
  addWorkEntry: (labourerId: string, item: Omit<LabourWorkEntry, 'id' | 'date' | 'wage'>) => void;
  addGroupWorkEntry: (labourerIds: string[], totalCharge: number, description: string, quantity: number) => void;
  addPayment: (labourerId: string, amount: number) => void;
}

const LabourContext = createContext<LabourContextType | null>(null);

const initialLabourers: Labourer[] = [
    { 
        id: '1', 
        name: 'Manoj Kumar',
        workEntries: [
            { id: 'w1', date: new Date('2024-07-01'), description: 'Morning shift', entryType: 'daily', activity: 'Loading', dailyRate: 500, wage: 500 },
            { id: 'w2', date: new Date('2024-07-03'), description: 'Urgent work', entryType: 'item_rate', itemName: 'Paddy Bags', quantity: 100, ratePerItem: 3, wage: 300 },
        ],
        payments: [
            { id: 'p1', amount: 700, date: new Date('2024-07-05') }
        ],
        totalWages: 800,
        totalPaid: 700,
        balance: 100
    },
    { 
        id: '2', 
        name: 'Anita Singh',
        workEntries: [
            { id: 'w3', date: new Date('2024-07-02'), description: 'Site cleaning', entryType: 'daily', activity: 'Cleaning', dailyRate: 400, wage: 400 },
        ],
        payments: [],
        totalWages: 400,
        totalPaid: 0,
        balance: 400
    },
];

const calculateTotals = (workEntries: LabourWorkEntry[], payments: Payment[]) => {
    const totalWages = workEntries.reduce((acc, entry) => acc + entry.wage, 0);
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const balance = totalWages - totalPaid;
    return { totalWages, totalPaid, balance };
};

const parseStoredData = (key: string, initialData: any[]) => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return initialData;

        const parsed = JSON.parse(stored);
        // Revive dates
        return parsed.map((item: any) => ({
            ...item,
            date: item.date ? new Date(item.date) : undefined,
            dateAdded: item.dateAdded ? new Date(item.dateAdded) : undefined,
            workEntries: item.workEntries?.map((w: any) => ({...w, date: new Date(w.date)})),
            payments: item.payments?.map((p: any) => ({...p, date: new Date(p.date)})),
            trips: item.trips?.map((t: any) => ({...t, date: new Date(t.date)})),
        }));
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        return initialData;
    }
}


export function LabourProvider({ children }: { children: ReactNode }) {
  const [labourers, setLabourers] = useState<Labourer[]>([]);

  useEffect(() => {
    const storedLabourers = parseStoredData('labourers', initialLabourers);
    const updatedLabourers = (storedLabourers || []).map((l: Labourer) => {
        const { totalWages, totalPaid, balance } = calculateTotals(l.workEntries, l.payments);
        return { ...l, totalWages, totalPaid, balance };
    });
    setLabourers(updatedLabourers);
  }, []);

  useEffect(() => {
    localStorage.setItem('labourers', JSON.stringify(labourers));
  }, [labourers]);

  const addLabourer = useCallback((labourerName: string) => {
    setLabourers(prev => {
        const existingLabourer = (prev || []).find(l => l.name === labourerName);
        if (existingLabourer) {
            return prev;
        }
        const newLabourer: Labourer = {
            id: new Date().toISOString() + '-l',
            name: labourerName,
            workEntries: [],
            payments: [],
            totalWages: 0,
            totalPaid: 0,
            balance: 0,
        };
        return [...(prev || []), newLabourer];
    });
  }, []);

  const addWorkEntry = useCallback((labourerId: string, item: Omit<LabourWorkEntry, 'id' | 'date' | 'wage'>) => {
    let wage = 0;
    if (item.entryType === 'daily' && item.dailyRate) {
        wage = item.dailyRate;
    } else if (item.entryType === 'item_rate' && item.quantity && item.ratePerItem) {
        wage = item.quantity * item.ratePerItem;
    }

    const newWorkEntry: LabourWorkEntry = {
        ...item,
        id: new Date().toISOString(),
        date: new Date(),
        wage,
    };

    setLabourers(prev => {
        return (prev || []).map(l => {
            if (l.id === labourerId) {
                const updatedWorkEntries = [...l.workEntries, newWorkEntry];
                const { totalWages, totalPaid, balance } = calculateTotals(updatedWorkEntries, l.payments);
                return { ...l, workEntries: updatedWorkEntries, totalWages, totalPaid, balance };
            }
            return l;
        });
    });
  }, []);

  const addGroupWorkEntry = useCallback((labourerIds: string[], totalCharge: number, description: string, quantity: number) => {
    if (labourerIds.length === 0) return;
    
    const wagePerLabourer = totalCharge / labourerIds.length;
    const ratePerItem = totalCharge / quantity;

    setLabourers(prev => {
      return (prev || []).map(l => {
        if (labourerIds.includes(l.id)) {
          const newWorkEntry: LabourWorkEntry = {
            id: new Date().toISOString() + `-${l.id}`,
            date: new Date(),
            description: description,
            entryType: 'item_rate',
            itemName: 'Group Work',
            quantity: quantity / labourerIds.length, // Distribute quantity
            ratePerItem: ratePerItem, // Rate is same for all
            wage: wagePerLabourer
          };
          const updatedWorkEntries = [...l.workEntries, newWorkEntry];
          const { totalWages, totalPaid, balance } = calculateTotals(updatedWorkEntries, l.payments);
          return { ...l, workEntries: updatedWorkEntries, totalWages, totalPaid, balance };
        }
        return l;
      });
    });
  }, []);


  const addPayment = useCallback((labourerId: string, amount: number) => {
    setLabourers(prev => (prev || []).map(l => {
        if(l.id === labourerId) {
            const newPayment: Payment = {
                id: new Date().toISOString() + '-p',
                amount,
                date: new Date(),
            };
            const updatedPayments = [...l.payments, newPayment];
            const { totalWages, totalPaid, balance } = calculateTotals(l.workEntries, updatedPayments);
            return { ...l, payments: updatedPayments, totalWages, totalPaid, balance };
        }
        return l;
    }));
  }, []);


  return (
    <LabourContext.Provider value={{ labourers, addLabourer, addWorkEntry, addGroupWorkEntry, addPayment }}>
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
