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

const parseStoredData = (key: string, initialData: any[]) => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return initialData;

        const parsed = JSON.parse(stored);
        // Revive dates
        return parsed.map((item: any) => ({
            ...item,
            date: new Date(item.date),
            payments: (item.payments || []).map((p: any) => ({...p, date: new Date(p.date)})),
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
    setPurchases(parseStoredData('purchases', []));
    setSales(parseStoredData('sales', []));
  }, []);

  useEffect(() => {
    localStorage.setItem('purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('sales', JSON.stringify(sales));
  }, [sales]);


  const addPurchase = useCallback((item: Omit<PrivatePurchase, 'id' | 'date' | 'totalAmount' | 'amountPaid' | 'balance' | 'payments'> & { initialPayment: number }) => {
    const totalAmount = item.quantity * item.rate;
    const id = Date.now().toString();
    const newPurchase: PrivatePurchase = {
        ...item,
        id,
        date: new Date(),
        totalAmount,
        amountPaid: item.initialPayment,
        balance: totalAmount - item.initialPayment,
        payments: item.initialPayment > 0 ? [{ id: id + '-p', amount: item.initialPayment, date: new Date() }] : []
    };
    setPurchases((prev) => [...prev, newPurchase]);
  }, []);

  const addPayment = useCallback((purchaseId: string, amount: number) => {
    setPurchases(prev => prev.map(p => {
        if(p.id === purchaseId) {
            const newPayment: Payment = {
                id: Date.now().toString(),
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
    const id = Date.now().toString();
    const newSale: PrivateSale = {
        ...item,
        id,
        date: new Date(),
        totalAmount,
        amountReceived: item.initialPayment,
        balance: totalAmount - item.initialPayment,
        payments: item.initialPayment > 0 ? [{ id: id + '-sp', amount: item.initialPayment, date: new Date() }] : []
    };
    setSales((prev) => [...prev, newSale]);
  }, []);

  const addSalePayment = useCallback((saleId: string, amount: number) => {
    setSales(prev => prev.map(s => {
        if(s.id === saleId) {
            const newPayment: Payment = {
                id: Date.now().toString(),
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
