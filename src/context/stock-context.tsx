
'use client';

import { createContext, useContext, ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import type { StockItem, ProcessingResult, PrivatePurchase, Payment, PrivateSale, MandiProcessingResult } from '@/lib/types';
import * as db from '@/lib/db';

interface StockContextType {
  privateStock: StockItem;
  totalStock: StockItem;
  processingHistory: ProcessingResult[];
  mandiProcessingHistory: MandiProcessingResult[];
  transferredInStock: { date: Date, quantity: number }[];
  addProcessingResult: (result: Omit<ProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
  addMandiProcessing: (item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
  purchases: PrivatePurchase[];
  addPurchase: (item: Omit<PrivatePurchase, 'date' | 'totalAmount' | 'amountPaid' | 'balance' | 'payments'> & { id?: string; initialPayment?: number; date?: Date }) => void;
  deletePurchase: (id: string) => void;
  addPayment: (purchaseId: string, amount: number) => void;
  addFarmerPaymentByName: (farmerName: string, amount: number) => void;
  sales: PrivateSale[];
  addSale: (item: Omit<PrivateSale, 'id' | 'date' | 'totalAmount' | 'amountReceived' | 'balance' | 'payments'> & { initialPayment: number }) => void;
  deleteSale: (id: string) => void;
  addSalePayment: (saleId: string, amount: number) => void;
  addCustomerPaymentByName: (customerName: string, amount: number) => void;
  transferRiceToMandi: (quantity: number) => void;
  loading: boolean;
}

const StockContext = createContext<StockContextType | null>(null);

const KEYS = {
  PURCHASES: 'mandi-monitor-purchases',
  SALES: 'mandi-monitor-sales',
  PROCESSING: 'mandi-monitor-processing',
  MANDI_PROC: 'mandi-monitor-mandi-proc',
  TRANSFERS: 'mandi-monitor-transfers'
};

export function StockProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useState<PrivatePurchase[]>([]);
  const [sales, setSales] = useState<PrivateSale[]>([]);
  const [processingHistory, setProcessingHistory] = useState<ProcessingResult[]>([]);
  const [mandiProcessingHistory, setMandiProcessingHistory] = useState<MandiProcessingResult[]>([]);
  const [transferredInStock, setTransferredInStock] = useState<{ date: Date; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      const p = await db.getItem<any[]>(KEYS.PURCHASES);
      const s = await db.getItem<any[]>(KEYS.SALES);
      const pr = await db.getItem<any[]>(KEYS.PROCESSING);
      const mp = await db.getItem<any[]>(KEYS.MANDI_PROC);
      const tr = await db.getItem<any[]>(KEYS.TRANSFERS);

      const revive = (arr: any[] | null) => (arr || []).map(item => ({
        ...item,
        date: new Date(item.date),
        payments: (item.payments || []).map((pay: any) => ({ ...pay, date: new Date(pay.date) }))
      }));

      if (p) setPurchases(revive(p));
      if (s) setSales(revive(s));
      if (pr) setProcessingHistory(revive(pr));
      if (mp) setMandiProcessingHistory(revive(mp));
      if (tr) setTransferredInStock(tr.map(i => ({ ...i, date: new Date(i.date) })));
      
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => { if (!loading) db.setItem(KEYS.PURCHASES, purchases); }, [purchases, loading]);
  useEffect(() => { if (!loading) db.setItem(KEYS.SALES, sales); }, [sales, loading]);
  useEffect(() => { if (!loading) db.setItem(KEYS.PROCESSING, processingHistory); }, [processingHistory, loading]);
  useEffect(() => { if (!loading) db.setItem(KEYS.MANDI_PROC, mandiProcessingHistory); }, [mandiProcessingHistory, loading]);
  useEffect(() => { if (!loading) db.setItem(KEYS.TRANSFERS, transferredInStock); }, [transferredInStock, loading]);

  const privateStock = useMemo<StockItem>(() => {
    const purchasedPaddy = (purchases || []).filter(p => p.itemType === 'paddy').reduce((acc, p) => acc + p.quantity, 0);
    const purchasedRice = (purchases || []).filter(p => p.itemType === 'rice').reduce((acc, p) => acc + p.quantity, 0);
    const soldPaddy = (sales || []).filter(s => s.itemType === 'paddy').reduce((acc, s) => acc + s.quantity, 0);
    const soldRice = (sales || []).filter(s => s.itemType === 'rice').reduce((acc, s) => acc + s.quantity, 0);
    const transOut = (transferredInStock || []).reduce((sum, t) => sum + t.quantity, 0);
    
    const usedPaddy = (processingHistory || []).filter(p => p.type === 'paddy').reduce((acc, p) => acc + p.paddyUsed, 0);
    const yieldRice = (processingHistory || []).reduce((acc, p) => acc + p.riceYield, 0);
    const yieldBran = (processingHistory || []).reduce((acc, p) => acc + p.branYield, 0);
    const yieldBroken = (processingHistory || []).reduce((acc, p) => acc + p.brokenRiceYield, 0);

    return {
      paddy: purchasedPaddy - usedPaddy - soldPaddy,
      rice: (purchasedRice + yieldRice) - soldRice - transOut,
      bran: yieldBran,
      brokenRice: yieldBroken,
    };
  }, [purchases, sales, processingHistory, transferredInStock]);
  
  const totalStock = useMemo<StockItem>(() => {
    const mandiBran = (mandiProcessingHistory || []).reduce((acc, item) => acc + item.branYield, 0);
    const mandiBrokenRice = (mandiProcessingHistory || []).reduce((acc, item) => acc + item.brokenRiceYield, 0);
    return { paddy: privateStock.paddy, rice: privateStock.rice, bran: privateStock.bran + mandiBran, brokenRice: privateStock.brokenRice + mandiBrokenRice };
  }, [privateStock, mandiProcessingHistory]);

  const addProcessingResult = useCallback((result: Omit<ProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => {
    const id = Date.now().toString();
    const newResult = { ...result, id, date: new Date(), yieldPercentage: result.type === 'paddy' ? (result.riceYield / result.paddyUsed) * 100 : 0 };
    setProcessingHistory(prev => [...prev, newResult as ProcessingResult]);
  }, []);

  const addMandiProcessing = useCallback((item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => {
    const id = Date.now().toString();
    const newProc = { ...item, id, date: new Date(), yieldPercentage: (item.riceYield / item.paddyUsed) * 100 };
    setMandiProcessingHistory(prev => [...prev, newProc as MandiProcessingResult]);
  }, []);

  const addPurchase = useCallback((item: Omit<PrivatePurchase, 'date' | 'totalAmount' | 'amountPaid' | 'balance' | 'payments'> & { id?: string; initialPayment?: number; date?: Date }) => {
    const totalAmount = item.quantity * item.rate;
    const id = item.id || Date.now().toString();
    const initialPayment = item.initialPayment || 0;
    
    setPurchases(prev => {
      const existing = prev.find(p => p.id === id);
      if (existing) {
        return prev.map(p => p.id === id ? { ...p, ...item, id, totalAmount, balance: totalAmount - p.amountPaid } as PrivatePurchase : p);
      }
      const newPurchase: PrivatePurchase = { 
        ...item, 
        id, 
        date: item.date || new Date(), 
        totalAmount, 
        amountPaid: initialPayment, 
        balance: totalAmount - initialPayment, 
        payments: initialPayment > 0 ? [{ id: id + '-p', amount: initialPayment, date: new Date(), note: 'Initial payment' }] : [] 
      } as PrivatePurchase;
      return [...prev, newPurchase];
    });
  }, []);

  const deletePurchase = useCallback((id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  }, []);

  const addPayment = useCallback((purchaseId: string, amount: number) => {
    setPurchases(prev => prev.map(p => {
      if (p.id === purchaseId) {
        const updatedPaid = p.amountPaid + Number(amount);
        const newPayment = { id: Date.now().toString(), amount: Number(amount), date: new Date() };
        return { ...p, amountPaid: updatedPaid, balance: p.totalAmount - updatedPaid, payments: [...p.payments, newPayment] };
      }
      return p;
    }));
  }, []);

  const addFarmerPaymentByName = useCallback((farmerName: string, amount: number) => {
    setPurchases(prev => {
      let remainingPayment = Number(amount);
      return prev.map(p => {
        if (p.farmerName === farmerName && remainingPayment > 0 && p.balance > 0) {
          const paymentForThisRecord = Math.min(p.balance, remainingPayment);
          remainingPayment -= paymentForThisRecord;
          const updatedPaid = p.amountPaid + paymentForThisRecord;
          const newPayment = { id: Date.now().toString() + '-' + p.id, amount: paymentForThisRecord, date: new Date(), note: 'Account payment' };
          return { ...p, amountPaid: updatedPaid, balance: p.totalAmount - updatedPaid, payments: [...p.payments, newPayment] };
        }
        return p;
      });
    });
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
      payments: item.initialPayment > 0 ? [{ id: id + '-sp', amount: item.initialPayment, date: new Date(), note: 'Initial payment' }] : [] 
    };
    setSales(prev => [...prev, newSale]);
  }, []);

  const deleteSale = useCallback((id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  }, []);

  const addSalePayment = useCallback((saleId: string, amount: number) => {
    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        const updatedReceived = s.amountReceived + Number(amount);
        const newPayment = { id: Date.now().toString(), amount: Number(amount), date: new Date() };
        return { ...s, amountReceived: updatedReceived, balance: s.totalAmount - updatedReceived, payments: [...s.payments, newPayment] };
      }
      return s;
    }));
  }, []);

  const addCustomerPaymentByName = useCallback((customerName: string, amount: number) => {
    setSales(prev => {
      let remainingPayment = Number(amount);
      return prev.map(s => {
        if (s.customerName === customerName && remainingPayment > 0 && s.balance > 0) {
          const paymentForThisRecord = Math.min(s.balance, remainingPayment);
          remainingPayment -= paymentForThisRecord;
          const updatedReceived = s.amountReceived + paymentForThisRecord;
          const newPayment = { id: Date.now().toString() + '-' + s.id, amount: paymentForThisRecord, date: new Date(), note: 'Account payment' };
          return { ...s, amountReceived: updatedReceived, balance: s.totalAmount - updatedReceived, payments: [...s.payments, newPayment] };
        }
        return s;
      });
    });
  }, []);

  const transferRiceToMandi = useCallback((quantity: number) => {
    const newTransfer = { date: new Date(), quantity: Number(quantity) };
    setTransferredInStock(prev => [...prev, newTransfer]);
  }, []);

  const contextValue = useMemo(() => ({
    privateStock,
    totalStock,
    processingHistory,
    mandiProcessingHistory,
    transferredInStock,
    addProcessingResult,
    addMandiProcessing,
    purchases,
    addPurchase,
    deletePurchase,
    addPayment,
    addFarmerPaymentByName,
    sales,
    addSale,
    deleteSale,
    addSalePayment,
    addCustomerPaymentByName,
    transferRiceToMandi,
    loading
  }), [
    privateStock,
    totalStock,
    processingHistory,
    mandiProcessingHistory,
    transferredInStock,
    addProcessingResult,
    addMandiProcessing,
    purchases,
    addPurchase,
    deletePurchase,
    addPayment,
    addFarmerPaymentByName,
    sales,
    addSale,
    deleteSale,
    addSalePayment,
    addCustomerPaymentByName,
    transferRiceToMandi,
    loading
  ]);

  return (
    <StockContext.Provider value={contextValue}>
      {children}
    </StockContext.Provider>
  );
}

export function useStockData() {
  const context = useContext(StockContext);
  if (!context) throw new Error('useStockData must be used within a StockProvider');
  return context;
}
