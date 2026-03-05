'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useEffect } from 'react';
import type { Labourer, LabourWorkEntry, Payment } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, collection, query } from 'firebase/firestore';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface LabourContextType {
  labourers: Labourer[];
  addLabourer: (labourerName: string) => void;
  addWorkEntry: (labourerId: string, item: Omit<LabourWorkEntry, 'id' | 'date' | 'wage'>) => void;
  addGroupWorkEntry: (labourerIds: string[], totalCharge: number, description: string, quantity: number) => void;
  addPayment: (labourerId: string, amount: number) => void;
  loading: boolean;
}

const LabourContext = createContext<LabourContextType | null>(null);

const calculateTotals = (workEntries: LabourWorkEntry[], payments: Payment[]) => {
    const totalWages = (workEntries || []).reduce((acc, entry) => acc + (entry.wage || 0), 0);
    const totalPaid = (payments || []).reduce((acc, p) => acc + (p.amount || 0), 0);
    const balance = totalWages - totalPaid;
    return { totalWages, totalPaid, balance };
};

export function LabourProvider({ children }: { children: ReactNode }) {
  const [labourers, setLabourers] = useState<Labourer[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'labourers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        const workEntries = (item.workEntries || []).map((w: any) => ({
            ...w, 
            date: w.date?.toDate ? w.date.toDate() : new Date(w.date)
        }));
        const payments = (item.payments || []).map((p: any) => ({
            ...p, 
            date: p.date?.toDate ? p.date.toDate() : new Date(p.date)
        }));
        
        const { totalWages, totalPaid, balance } = calculateTotals(workEntries, payments);
        
        return {
          ...item,
          id: doc.id,
          workEntries,
          payments,
          totalWages,
          totalPaid,
          balance
        } as Labourer;
      });
      setLabourers(data);
      setLoading(false);
    }, (error) => {
        console.error("Firestore Listen Error:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const addLabourer = useCallback((labourerName: string) => {
    if (!db) return;
    const id = Date.now().toString() + '-l';
    const newLabourer = {
        name: labourerName,
        workEntries: [],
        payments: [],
    };
    setDocumentNonBlocking(doc(db, 'labourers', id), newLabourer, { merge: true });
  }, [db]);

  const addWorkEntry = useCallback((labourerId: string, item: Omit<LabourWorkEntry, 'id' | 'date' | 'wage'>) => {
    if (!db) return;
    const labourer = labourers.find(l => l.id === labourerId);
    if (!labourer) return;

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

    const updatedWorkEntries = [...(labourer.workEntries || []), newWorkEntry];
    updateDocumentNonBlocking(doc(db, 'labourers', labourerId), { workEntries: updatedWorkEntries });
  }, [db, labourers]);

  const addGroupWorkEntry = useCallback((labourerIds: string[], totalCharge: number, description: string, quantity: number) => {
    if (!db || !labourerIds || labourerIds.length === 0) return;
    
    const wagePerLabourer = totalCharge / labourerIds.length;
    const ratePerItem = quantity > 0 ? totalCharge / quantity : 0;

    labourerIds.forEach(id => {
        const labourer = labourers.find(l => l.id === id);
        if (labourer) {
            const newEntry: LabourWorkEntry = {
                id: Date.now().toString() + `-${id}`,
                date: new Date(),
                description: description,
                entryType: 'item_rate',
                itemName: 'Group Work',
                quantity: quantity / labourerIds.length,
                ratePerItem: ratePerItem,
                wage: wagePerLabourer
            };
            const updatedEntries = [...(labourer.workEntries || []), newEntry];
            updateDocumentNonBlocking(doc(db, 'labourers', id), { workEntries: updatedEntries });
        }
    });
  }, [db, labourers]);

  const addPayment = useCallback((labourerId: string, amount: number) => {
    if (!db) return;
    const labourer = labourers.find(l => l.id === labourerId);
    if (!labourer) return;

    const newPayment: Payment = {
        id: Date.now().toString() + '-p',
        amount: Number(amount),
        date: new Date(),
    };
    const updatedPayments = [...(labourer.payments || []), newPayment];
    updateDocumentNonBlocking(doc(db, 'labourers', labourerId), { payments: updatedPayments });
  }, [db, labourers]);

  return (
    <LabourContext.Provider value={{ labourers, addLabourer, addWorkEntry, addGroupWorkEntry, addPayment, loading }}>
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