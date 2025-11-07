'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import type { PrivatePurchase, Payment } from '@/lib/types';


interface PrivateContextType {
  purchases: PrivatePurchase[];
  addPurchase: (item: Omit<PrivatePurchase, 'id' | 'date' | 'totalAmount' | 'amountPaid' | 'balance' | 'payments'> & { initialPayment: number }) => void;
  addPayment: (purchaseId: string, amount: number) => void;
}

const PrivateContext = createContext<PrivateContextType | null>(null);

const initialPurchases: PrivatePurchase[] = [
    { 
        id: '1', 
        farmerName: 'Gopal Verma',
        itemType: 'paddy',
        quantity: 150,
        rate: 2000,
        totalAmount: 300000,
        amountPaid: 250000,
        balance: 50000,
        description: 'First batch of the season.',
        date: new Date('2024-05-20'),
        payments: [
            { id: 'p1', amount: 200000, date: new Date('2024-05-20') },
            { id: 'p2', amount: 50000, date: new Date('2024-06-01') },
        ]
    },
    { 
        id: '2', 
        farmerName: 'Sunita Devi', 
        itemType: 'rice',
        quantity: 200, 
        rate: 3750,
        totalAmount: 750000,
        amountPaid: 800000,
        balance: -50000,
        description: 'Advance for next delivery.',
        date: new Date('2024-05-22'),
        payments: [
            { id: 'p3', amount: 800000, date: new Date('2024-05-22') }
        ]
    },
    { 
        id: '3', 
        farmerName: 'Gopal Verma',
        itemType: 'paddy',
        quantity: 100,
        rate: 2050,
        totalAmount: 205000,
        amountPaid: 205000,
        balance: 0,
        description: '',
        date: new Date('2024-06-05'),
        payments: [
            { id: 'p4', amount: 205000, date: new Date('2024-06-05') }
        ]
    },
];

export function PrivateProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useState<PrivatePurchase[]>(initialPurchases);

  const addPurchase = useCallback((item: Omit<PrivatePurchase, 'id' | 'date' | 'totalAmount' | 'amountPaid' | 'balance' | 'payments'> & { initialPayment: number }) => {
    const totalAmount = item.quantity * item.rate;
    const newPurchase: PrivatePurchase = {
        ...item,
        id: new Date().toISOString(),
        date: new Date(),
        totalAmount,
        amountPaid: item.initialPayment,
        balance: totalAmount - item.initialPayment,
        payments: item.initialPayment > 0 ? [{ id: new Date().toISOString() + '-p', amount: item.initialPayment, date: new Date() }] : []
    };
    setPurchases((prev) => [...prev, newPurchase]);
  }, []);

  const addPayment = useCallback((purchaseId: string, amount: number) => {
    setPurchases(prev => prev.map(p => {
        if(p.id === purchaseId) {
            const newPayment: Payment = {
                id: new Date().toISOString(),
                amount,
                date: new Date(),
            };
            const updatedAmountPaid = p.amountPaid + amount;
            const updatedBalance = p.totalAmount - updatedAmountPaid;
            return {
                ...p,
                amountPaid: updatedAmountPaid,
                balance: updatedBalance,
                payments: [...p.payments, newPayment]
            };
        }
        return p;
    }));
  }, []);


  return (
    <PrivateContext.Provider value={{ purchases, addPurchase, addPayment }}>
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
