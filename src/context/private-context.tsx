'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import type { PrivatePurchase, Payment } from '@/lib/types';


interface PrivateContextType {
  purchases: PrivatePurchase[];
  addPurchase: (item: Omit<PrivatePurchase, 'id' | 'totalAmount' | 'balance' | 'payments' | 'amountPaid'> & { amountPaid: number }) => void;
  addPayment: (purchaseId: string, paymentAmount: number) => void;
}

const PrivateContext = createContext<PrivateContextType | null>(null);

const initialPurchases: PrivatePurchase[] = [
    { 
        id: '1', 
        mandiName: 'Private Mandi A', 
        farmerName: 'Gopal Verma', 
        itemType: 'paddy', 
        quantity: 150, 
        rate: 2200, 
        totalAmount: 330000, 
        amountPaid: 300000, 
        balance: 30000, 
        description: 'First installment',
        payments: [
            { id: 'p1', amount: 200000, date: new Date('2024-05-10') },
            { id: 'p2', amount: 100000, date: new Date('2024-05-20') },
        ]
    },
    { 
        id: '2', 
        mandiName: 'Private Mandi B', 
        farmerName: 'Sunita Devi', 
        itemType: 'rice', 
        quantity: 200, 
        rate: 3500, 
        totalAmount: 700000, 
        amountPaid: 750000, 
        balance: -50000, 
        description: 'Paid in full with advance',
        payments: [
            { id: 'p3', amount: 750000, date: new Date('2024-05-15') }
        ]
    },
];

const calculatePurchaseTotals = (purchases: PrivatePurchase[]): PrivatePurchase[] => {
    return purchases.map(p => {
        const totalAmount = p.quantity * p.rate;
        const amountPaid = p.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const balance = totalAmount - amountPaid;
        return { ...p, totalAmount, amountPaid, balance };
    });
};


export function PrivateProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useState<PrivatePurchase[]>(calculatePurchaseTotals(initialPurchases));

  const addPurchase = useCallback((item: Omit<PrivatePurchase, 'id' | 'totalAmount' | 'balance' | 'payments' | 'amountPaid'> & { amountPaid: number }) => {
    const newPurchase: PrivatePurchase = {
      ...item,
      id: new Date().toISOString(),
      totalAmount: 0, 
      balance: 0,
      amountPaid: 0,
      payments: item.amountPaid > 0 ? [{ id: new Date().toISOString(), amount: item.amountPaid, date: new Date() }] : [],
    };
    
    setPurchases((prev) => calculatePurchaseTotals([...prev, newPurchase]));
  }, []);

  const addPayment = useCallback((purchaseId: string, paymentAmount: number) => {
    setPurchases((prev) => {
        const updatedPurchases = prev.map((p) => {
            if (p.id === purchaseId) {
                const newPayment: Payment = {
                    id: new Date().toISOString(),
                    amount: paymentAmount,
                    date: new Date(),
                };
                return { ...p, payments: [...p.payments, newPayment] };
            }
            return p;
        });
        return calculatePurchaseTotals(updatedPurchases);
    });
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
