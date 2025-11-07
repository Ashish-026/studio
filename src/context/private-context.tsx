'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import type { PrivatePurchase } from '@/lib/types';


interface PrivateContextType {
  purchases: PrivatePurchase[];
  addPurchase: (item: Omit<PrivatePurchase, 'id' | 'totalAmount' | 'balance'>) => void;
}

const PrivateContext = createContext<PrivateContextType | null>(null);

const initialPurchases: PrivatePurchase[] = [
    { id: '1', mandiName: 'Private Mandi A', farmerName: 'Gopal Verma', itemType: 'paddy', quantity: 150, rate: 2200, totalAmount: 330000, amountPaid: 300000, balance: 30000 },
    { id: '2', mandiName: 'Private Mandi B', farmerName: 'Sunita Devi', itemType: 'rice', quantity: 200, rate: 3500, totalAmount: 700000, amountPaid: 700000, balance: 0 },
];

export function PrivateProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useState<PrivatePurchase[]>(initialPurchases);

  const addPurchase = useCallback((item: Omit<PrivatePurchase, 'id' | 'totalAmount' | 'balance'>) => {
    const totalAmount = item.quantity * item.rate;
    const balance = totalAmount - item.amountPaid;
    const newPurchase = {
      ...item,
      id: new Date().toISOString(),
      totalAmount,
      balance,
    };
    setPurchases((prev) => [...prev, newPurchase]);
  }, []);

  return (
    <PrivateContext.Provider value={{ purchases, addPurchase }}>
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
