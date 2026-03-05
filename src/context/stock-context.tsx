'use client';

import { createContext, useContext, ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import type { StockItem, ProcessingResult, PrivatePurchase, Payment, PrivateSale, MandiProcessingResult } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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

export function StockProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useState<PrivatePurchase[]>([]);
  const [sales, setSales] = useState<PrivateSale[]>([]);
  const [processingHistory, setProcessingHistory] = useState<ProcessingResult[]>([]);
  const [mandiProcessingHistory, setMandiProcessingHistory] = useState<MandiProcessingResult[]>([]);
  const [transferredInStock, setTransferredInStock] = useState<{ date: Date; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;

    const unsubPurchases = onSnapshot(collection(db, 'privatePurchases'), (s) => {
      setPurchases(s.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date?.toDate() || new Date(d.data().date), payments: (d.data().payments || []).map((p:any) => ({...p, date: p.date?.toDate() || new Date(p.date)})) } as PrivatePurchase)));
    });

    const unsubSales = onSnapshot(collection(db, 'privateSales'), (s) => {
      setSales(s.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date?.toDate() || new Date(d.data().date), payments: (d.data().payments || []).map((p:any) => ({...p, date: p.date?.toDate() || new Date(p.date)})) } as PrivateSale)));
    });

    const unsubProcessing = onSnapshot(collection(db, 'processingHistory'), (s) => {
      setProcessingHistory(s.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date?.toDate() || new Date(d.data().date) } as ProcessingResult)));
    });

    const unsubMandiProc = onSnapshot(collection(db, 'mandiProcessingHistory'), (s) => {
      setMandiProcessingHistory(s.docs.map(d => ({ ...d.data(), id: d.id, date: d.data().date?.toDate() || new Date(d.data().date) } as MandiProcessingResult)));
    });

    const unsubTransfers = onSnapshot(collection(db, 'transferredInStock'), (s) => {
      setTransferredInStock(s.docs.map(d => ({ ...d.data(), date: d.data().date?.toDate() || new Date(d.data().date) } as { date: Date, quantity: number })));
      setLoading(false);
    });

    return () => {
      unsubPurchases(); unsubSales(); unsubProcessing(); unsubMandiProc(); unsubTransfers();
    };
  }, [db]);

  const processedPaddyBySource = useMemo(() => {
    return (processingHistory || []).reduce((acc, item) => {
        if(item.type === 'paddy') acc[item.source] = (acc[item.source] || 0) + item.paddyUsed;
        return acc;
    }, { private: 0 });
  }, [processingHistory]);

  const processedYieldsBySource = useMemo(() => {
    return (processingHistory || []).reduce((acc, item) => {
        const source = item.source;
        if (!acc[source]) acc[source] = { rice: 0, bran: 0, brokenRice: 0 };
        acc[source].rice += item.riceYield;
        acc[source].bran += item.branYield;
        acc[source].brokenRice += item.brokenRiceYield;
        return acc;
    }, { private: { rice: 0, bran: 0, brokenRice: 0 } });
  }, [processingHistory]);

  const privateStock = useMemo<StockItem>(() => {
    const purchasedPaddy = (purchases || []).filter(p => p.itemType === 'paddy').reduce((acc, p) => acc + p.quantity, 0);
    const purchasedRice = (purchases || []).filter(p => p.itemType === 'rice').reduce((acc, p) => acc + p.quantity, 0);
    const soldPaddy = (sales || []).filter(s => s.itemType === 'paddy').reduce((acc, s) => acc + s.quantity, 0);
    const soldRice = (sales || []).filter(s => s.itemType === 'rice').reduce((acc, s) => acc + s.quantity, 0);
    const transOut = (transferredInStock || []).reduce((sum, t) => sum + t.quantity, 0);
    const yields = processedYieldsBySource.private;

    return {
      paddy: purchasedPaddy - processedPaddyBySource.private - soldPaddy,
      rice: (purchasedRice + yields.rice) - soldRice - transOut,
      bran: yields.bran,
      brokenRice: yields.brokenRice,
    };
  }, [purchases, sales, processedPaddyBySource, processedYieldsBySource, transferredInStock]);
  
  const totalStock = useMemo<StockItem>(() => {
    const mandiBran = (mandiProcessingHistory || []).reduce((acc, item) => acc + item.branYield, 0) || 0;
    const mandiBrokenRice = (mandiProcessingHistory || []).reduce((acc, item) => acc + item.brokenRiceYield, 0) || 0;
    return { paddy: privateStock.paddy, rice: privateStock.rice, bran: privateStock.bran + mandiBran, brokenRice: privateStock.brokenRice + mandiBrokenRice };
  }, [privateStock, mandiProcessingHistory]);

  const addProcessingResult = useCallback((result: Omit<ProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => {
    if (!db) return;
    const id = Date.now().toString();
    setDocumentNonBlocking(doc(db, 'processingHistory', id), { ...result, id, date: new Date(), yieldPercentage: result.type === 'paddy' ? (result.riceYield / result.paddyUsed) * 100 : 0 }, { merge: true });
  }, [db]);

  const addMandiProcessing = useCallback((item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => {
    if (!db) return;
    const id = Date.now().toString();
    setDocumentNonBlocking(doc(db, 'mandiProcessingHistory', id), { ...item, id, date: new Date(), yieldPercentage: (item.riceYield / item.paddyUsed) * 100 }, { merge: true });
  }, [db]);

  const addPurchase = useCallback((item: Omit<PrivatePurchase, 'id' | 'date' | 'totalAmount' | 'amountPaid' | 'balance' | 'payments'> & { initialPayment: number }) => {
    if (!db) return;
    const totalAmount = item.quantity * item.rate;
    const id = Date.now().toString();
    const newPurchase: Partial<PrivatePurchase> = { ...item, id, date: new Date(), totalAmount, amountPaid: item.initialPayment, balance: totalAmount - item.initialPayment, payments: item.initialPayment > 0 ? [{ id: id + '-p', amount: item.initialPayment, date: new Date() }] : [] };
    setDocumentNonBlocking(doc(db, 'privatePurchases', id), newPurchase, { merge: true });
  }, [db]);

  const addPayment = useCallback((purchaseId: string, amount: number) => {
    if (!db) return;
    const p = purchases.find(p => p.id === purchaseId);
    if (!p) return;
    const updatedPaid = p.amountPaid + Number(amount);
    const newPayment = { id: Date.now().toString(), amount: Number(amount), date: new Date() };
    updateDocumentNonBlocking(doc(db, 'privatePurchases', purchaseId), { amountPaid: updatedPaid, balance: p.totalAmount - updatedPaid, payments: [...p.payments, newPayment] });
  }, [db, purchases]);

  const addSale = useCallback((item: Omit<PrivateSale, 'id' | 'date' | 'totalAmount' | 'amountReceived' | 'balance' | 'payments'> & { initialPayment: number }) => {
    if (!db) return;
    const totalAmount = item.quantity * item.rate;
    const id = Date.now().toString();
    const newSale: Partial<PrivateSale> = { ...item, id, date: new Date(), totalAmount, amountReceived: item.initialPayment, balance: totalAmount - item.initialPayment, payments: item.initialPayment > 0 ? [{ id: id + '-sp', amount: item.initialPayment, date: new Date() }] : [] };
    setDocumentNonBlocking(doc(db, 'privateSales', id), newSale, { merge: true });
  }, [db]);

  const addSalePayment = useCallback((saleId: string, amount: number) => {
    if (!db) return;
    const s = sales.find(s => s.id === saleId);
    if (!s) return;
    const updatedReceived = s.amountReceived + Number(amount);
    const newPayment = { id: Date.now().toString(), amount: Number(amount), date: new Date() };
    updateDocumentNonBlocking(doc(db, 'privateSales', saleId), { amountReceived: updatedReceived, balance: s.totalAmount - updatedReceived, payments: [...s.payments, newPayment] });
  }, [db, sales]);

  const transferRiceToMandi = useCallback((quantity: number) => {
    if (!db) return;
    const id = Date.now().toString();
    setDocumentNonBlocking(doc(db, 'transferredInStock', id), { date: new Date(), quantity: Number(quantity) }, { merge: true });
  }, [db]);

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
