'use client';

import { createContext, useContext, ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import type { StockItem, ProcessingResult, PrivatePurchase, Payment, PrivateSale, MandiProcessingResult } from '@/lib/types';

interface StockContextType {
  privateStock: StockItem;
  totalStock: StockItem;
  processingHistory: ProcessingResult[];
  mandiProcessingHistory: MandiProcessingResult[];
  transferredInStock: { date: Date, quantity: number }[];
  addProcessingResult: (result: Omit<ProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
  addMandiProcessing: (item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
  purchases: PrivatePurchase[];
  addPurchase: (item: Omit<PrivatePurchase, 'id' | 'date' | 'totalAmount' | 'amountPaid' | 'balance' | 'payments'> & { initialPayment: number }) => void;
  addPayment: (purchaseId: string, amount: number) => void;
  sales: PrivateSale[];
  addSale: (item: Omit<PrivateSale, 'id' | 'date' | 'totalAmount' | 'amountReceived' | 'balance' | 'payments'> & { initialPayment: number }) => void;
  addSalePayment: (saleId: string, amount: number) => void;
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
    const load = (key: string, setFn: any) => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setFn(parsed.map((item: any) => ({
            ...item,
            date: new Date(item.date),
            payments: (item.payments || []).map((p: any) => ({ ...p, date: new Date(p.date) }))
          })));
        } catch (e) { console.error(e); }
      }
    };
    load(KEYS.PURCHASES, setPurchases);
    load(KEYS.SALES, setSales);
    load(KEYS.PROCESSING, setProcessingHistory);
    load(KEYS.MANDI_PROC, setMandiProcessingHistory);
    load(KEYS.TRANSFERS, setTransferredInStock);
    setLoading(false);
  }, []);

  useEffect(() => { if (!loading) localStorage.setItem(KEYS.PURCHASES, JSON.stringify(purchases)); }, [purchases, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(KEYS.SALES, JSON.stringify(sales)); }, [sales, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(KEYS.PROCESSING, JSON.stringify(processingHistory)); }, [processingHistory, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(KEYS.MANDI_PROC, JSON.stringify(mandiProcessingHistory)); }, [mandiProcessingHistory, loading]);
  useEffect(() => { if (!loading) localStorage.setItem(KEYS.TRANSFERS, JSON.stringify(transferredInStock)); }, [transferredInStock, loading]);

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
    setPurchases(prev => [...prev, newPurchase]);
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
    setSales(prev => [...prev, newSale]);
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

  const transferRiceToMandi = useCallback((quantity: number) => {
    const newTransfer = { date: new Date(), quantity: Number(quantity) };
    setTransferredInStock(prev => [...prev, newTransfer]);
  }, []);

  return (
    <StockContext.Provider value={{ privateStock, totalStock, processingHistory, mandiProcessingHistory, transferredInStock, addProcessingResult, addMandiProcessing, purchases, addPurchase, addPayment, sales, addSale, addSalePayment, transferRiceToMandi, loading }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStockData() {
  const context = useContext(StockContext);
  if (!context) throw new Error('useStockData must be used within a StockProvider');
  return context;
}
