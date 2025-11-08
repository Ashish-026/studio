'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useEffect } from 'react';
import type { PrivatePurchase, Payment, PrivateSale } from '@/lib/types';


interface PrivateContextType {
  purchases: PrivatePurchase[];
  addPurchase: (item: Omit<PrivatePurchase, 'id' | 'date' | 'totalAmount' | 'amountPaid' | 'balance' | 'payments'> & { initialPayment: number }) => void;
  addPayment: (purchaseId: string, amount: number) => void;
  sales: PrivateSale[];
  addSale: (item: Omit<PrivateSale, 'id' | 'date' | 'totalAmount' | 'amountReceived' | 'balance' | 'payments'> & { initialPayment: number }) => void;
  addSalePayment: (saleId: string, amount: number) => void;
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

const initialSales: PrivateSale[] = [
    {
        id: 's1',
        customerName: 'Local Mill Corp',
        itemType: 'paddy',
        quantity: 100,
        rate: 2100,
        totalAmount: 210000,
        amountReceived: 210000,
        balance: 0,
        description: 'Full payment received.',
        date: new Date('2024-06-10'),
        payments: [
            { id: 'sp1', amount: 210000, date: new Date('2024-06-10') }
        ],
        source: 'private',
    },
    {
        id: 's2',
        customerName: 'Regional Exporters',
        itemType: 'rice',
        quantity: 150,
        rate: 3800,
        totalAmount: 570000,
        amountReceived: 300000,
        balance: 270000,
        description: 'Partial payment received, rest due next month.',
        date: new Date('2024-06-12'),
        payments: [
            { id: 'sp2', amount: 300000, date: new Date('2024-06-12') }
        ],
        source: 'private',
    }
];

const parseStoredData = (key: string, initialData: any[]) => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return initialData;

        const parsed = JSON.parse(stored);
        // Revive dates
        return parsed.map((item: any) => ({
            ...item,
            date: new Date(item.date),
            payments: item.payments.map((p: any) => ({...p, date: new Date(p.date)})),
        }));
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        return initialData;
    }
}

export function PrivateProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useState<PrivatePurchase[]>([]);
  const [sales, setSales] = useState<PrivateSale[]>([]);

  useEffect(() => {
    setPurchases(parseStoredData('purchases', initialPurchases));
    setSales(parseStoredData('sales', initialSales));
  }, []);

  useEffect(() => {
    localStorage.setItem('purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);


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
                payments: [...p.payments, newPayment].sort((a, b) => b.date.getTime() - a.date.getTime())
            };
        }
        return p;
    }));
  }, []);

  const addSale = useCallback((item: Omit<PrivateSale, 'id' | 'date' | 'totalAmount' | 'amountReceived' | 'balance' | 'payments'> & { initialPayment: number }) => {
    const totalAmount = item.quantity * item.rate;
    const newSale: PrivateSale = {
        ...item,
        id: new Date().toISOString(),
        date: new Date(),
        totalAmount,
        amountReceived: item.initialPayment,
        balance: totalAmount - item.initialPayment,
        payments: item.initialPayment > 0 ? [{ id: new Date().toISOString() + '-sp', amount: item.initialPayment, date: new Date() }] : []
    };
    setSales((prev) => [...prev, newSale]);
  }, []);

  const addSalePayment = useCallback((saleId: string, amount: number) => {
    setSales(prev => prev.map(s => {
        if(s.id === saleId) {
            const newPayment: Payment = {
                id: new Date().toISOString(),
                amount,
                date: new Date(),
            };
            const updatedAmountReceived = s.amountReceived + amount;
            const updatedBalance = s.totalAmount - updatedAmountReceived;
            return {
                ...s,
                amountReceived: updatedAmountReceived,
                balance: updatedBalance,
                payments: [...s.payments, newPayment].sort((a, b) => b.date.getTime() - a.date.getTime())
            };
        }
        return s;
    }));
  }, []);

  return (
    <PrivateContext.Provider value={{ purchases, addPurchase, addPayment, sales, addSale, addSalePayment }}>
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
