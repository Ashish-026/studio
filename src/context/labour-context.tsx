'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useEffect, useMemo } from 'react';
import type { Labourer, LabourWorkEntry, Payment } from '@/lib/types';

interface LabourContextType {
  labourers: Labourer[];
  addLabourer: (labourerName: string) => void;
  addWorkEntry: (labourerId: string, item: Omit<LabourWorkEntry, 'id' | 'date' | 'wage'>) => void;
  addGroupWorkEntry: (labourerIds: string[], totalCharge: number, description: string, quantity: number) => void;
  addPayment: (labourerId: string, amount: number) => void;
  loading: boolean;
}

const LabourContext = createContext<LabourContextType | null>(null);

const STORAGE_KEY = 'mandi-monitor-labour-v2';

const calculateTotals = (workEntries: LabourWorkEntry[], payments: Payment[]) => {
    const totalWages = (workEntries || []).reduce((acc, entry) => acc + (entry.wage || 0), 0);
    const totalPaid = (payments || []).reduce((acc, p) => acc + (p.amount || 0), 0);
    const balance = totalWages - totalPaid;
    return { totalWages, totalPaid, balance };
};

export function LabourProvider({ children }: { children: ReactNode }) {
  const [labourers, setLabourers] = useState<Labourer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const revived = parsed.map((l: any) => ({
          ...l,
          workEntries: (l.workEntries || []).map((w: any) => ({ ...w, date: new Date(w.date) })),
          payments: (l.payments || []).map((p: any) => ({ ...p, date: new Date(p.date) })),
        }));
        setLabourers(revived);
      } catch (e) {
        console.error("Failed to load labour data", e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(labourers));
    }
  }, [labourers, loading]);

  const addLabourer = useCallback((labourerName: string) => {
    const id = Date.now().toString();
    const newLabourer: Labourer = {
        id,
        name: labourerName,
        workEntries: [],
        payments: [],
        totalWages: 0,
        totalPaid: 0,
        balance: 0
    };
    setLabourers(prev => [...prev, newLabourer]);
  }, []);

  const addWorkEntry = useCallback((labourerId: string, item: Omit<LabourWorkEntry, 'id' | 'date' | 'wage'>) => {
    setLabourers(prev => prev.map(l => {
      if (l.id === labourerId) {
        let wage = 0;
        if (item.entryType === 'daily' && item.dailyRate) {
            wage = Number(item.dailyRate);
        } else if (item.entryType === 'item_rate' && item.quantity && item.ratePerItem) {
            wage = Number(item.quantity) * Number(item.ratePerItem);
        }

        const newWorkEntry: LabourWorkEntry = {
            ...item,
            id: Date.now().toString(),
            date: new Date(),
            wage,
        };

        const updatedEntries = [...(l.workEntries || []), newWorkEntry];
        const totals = calculateTotals(updatedEntries, l.payments);
        return { ...l, workEntries: updatedEntries, ...totals };
      }
      return l;
    }));
  }, []);

  const addGroupWorkEntry = useCallback((labourerIds: string[], totalCharge: number, description: string, quantity: number) => {
    if (!labourerIds || labourerIds.length === 0) return;
    
    const wagePerLabourer = totalCharge / labourerIds.length;
    const ratePerItem = quantity > 0 ? totalCharge / quantity : 0;

    setLabourers(prev => prev.map(l => {
      if (labourerIds.includes(l.id)) {
        const newEntry: LabourWorkEntry = {
            id: Date.now().toString() + `-${l.id}`,
            date: new Date(),
            description: description,
            entryType: 'item_rate',
            itemName: 'Group Work',
            quantity: quantity / labourerIds.length,
            ratePerItem: ratePerItem,
            wage: wagePerLabourer
        };
        const updatedEntries = [...(l.workEntries || []), newEntry];
        const totals = calculateTotals(updatedEntries, l.payments);
        return { ...l, workEntries: updatedEntries, ...totals };
      }
      return l;
    }));
  }, []);

  const addPayment = useCallback((labourerId: string, amount: number) => {
    setLabourers(prev => prev.map(l => {
      if (l.id === labourerId) {
        const newPayment: Payment = {
            id: Date.now().toString(),
            amount: Number(amount),
            date: new Date(),
        };
        const updatedPayments = [...(l.payments || []), newPayment];
        const totals = calculateTotals(l.workEntries, updatedPayments);
        return { ...l, payments: updatedPayments, ...totals };
      }
      return l;
    }));
  }, []);

  const contextValue = useMemo(() => ({
    labourers,
    addLabourer,
    addWorkEntry,
    addGroupWorkEntry,
    addPayment,
    loading
  }), [labourers, addLabourer, addWorkEntry, addGroupWorkEntry, addPayment, loading]);

  return (
    <LabourContext.Provider value={contextValue}>
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
