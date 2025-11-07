'use client';

import { createContext, useContext, ReactNode, useMemo, useState, useCallback } from 'react';
import { useOSCSCData } from './oscsc-context';
import type { StockItem, ProcessingResult, PrivatePurchase, Payment, PrivateSale } from '@/lib/types';

interface StockContextType {
  oscscStock: StockItem;
  privateStock: StockItem;
  totalStock: StockItem;
  processingHistory: ProcessingResult[];
  addProcessingResult: (result: Omit<ProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => void;
  purchases: PrivatePurchase[];
  addPurchase: (item: Omit<PrivatePurchase, 'id' | 'date' | 'totalAmount' | 'amountPaid' | 'balance' | 'payments'> & { initialPayment: number }) => void;
  addPayment: (purchaseId: string, amount: number) => void;
  sales: PrivateSale[];
  addSale: (item: Omit<PrivateSale, 'id' | 'date' | 'totalAmount' | 'amountReceived' | 'balance' | 'payments'> & { initialPayment: number }) => void;
  addSalePayment: (saleId: string, amount: number) => void;
}

const StockContext = createContext<StockContextType | null>(null);

const initialProcessingHistory: ProcessingResult[] = [
    {
        id: 'p1',
        date: new Date('2024-07-20'),
        source: 'private',
        paddyUsed: 100, // in quintals
        riceYield: 65, // in quintals
        branYield: 5,
        brokenRiceYield: 2,
        yieldPercentage: 65
    }
];

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


export function StockProvider({ children }: { children: ReactNode }) {
  const { paddyLiftedItems } = useOSCSCData();
  const [purchases, setPurchases] = useState<PrivatePurchase[]>(initialPurchases);
  const [sales, setSales] = useState<PrivateSale[]>(initialSales);
  const [processingHistory, setProcessingHistory] = useState<ProcessingResult[]>(initialProcessingHistory);

  const processedPaddyBySource = useMemo(() => {
    return processingHistory.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + item.paddyUsed;
        return acc;
    }, { oscsc: 0, private: 0 });
  }, [processingHistory]);

  const processedYieldsBySource = useMemo(() => {
    return processingHistory.reduce((acc, item) => {
        const source = item.source;
        if (!acc[source]) {
            acc[source] = { rice: 0, bran: 0, brokenRice: 0 };
        }
        acc[source].rice += item.riceYield;
        acc[source].bran += item.branYield;
        acc[source].brokenRice += item.brokenRiceYield;
        return acc;
    }, { 
        oscsc: { rice: 0, bran: 0, brokenRice: 0 }, 
        private: { rice: 0, bran: 0, brokenRice: 0 } 
    });
  }, [processingHistory]);

  const oscscStock = useMemo<StockItem>(() => {
    const totalPaddyLifted = paddyLiftedItems.reduce((acc, item) => acc + item.totalPaddyReceived, 0);
    const soldPaddy = sales.filter(s => s.source === 'oscsc' && s.itemType === 'paddy').reduce((acc, s) => acc + s.quantity, 0);
    const paddyUsedForProcessing = processedPaddyBySource.oscsc;
    
    const yields = processedYieldsBySource.oscsc;
    const soldRice = sales.filter(s => s.source === 'oscsc' && s.itemType === 'rice').reduce((acc, s) => acc + s.quantity, 0);

    return { 
        paddy: totalPaddyLifted - soldPaddy - paddyUsedForProcessing, 
        rice: yields.rice - soldRice, 
        bran: yields.bran, 
        brokenRice: yields.brokenRice
    };
  }, [paddyLiftedItems, sales, processedPaddyBySource, processedYieldsBySource]);

  const privateStock = useMemo<StockItem>(() => {
    const purchasedPaddy = purchases.filter(p => p.itemType === 'paddy').reduce((acc, p) => acc + p.quantity, 0);
    const purchasedRice = purchases.filter(p => p.itemType === 'rice').reduce((acc, p) => acc + p.quantity, 0);

    const soldPaddy = sales.filter(s => s.source === 'private' && s.itemType === 'paddy').reduce((acc, s) => acc + s.quantity, 0);
    const soldRice = sales.filter(s => s.source === 'private' && s.itemType === 'rice').reduce((acc, s) => acc + s.quantity, 0);

    const paddyUsedForProcessing = processedPaddyBySource.private;
    const yields = processedYieldsBySource.private;

    return {
      paddy: purchasedPaddy - paddyUsedForProcessing - soldPaddy,
      rice: (purchasedRice + yields.rice) - soldRice,
      bran: yields.bran,
      brokenRice: yields.brokenRice,
    };
  }, [purchases, sales, processedPaddyBySource, processedYieldsBySource]);
  
  const totalStock = useMemo<StockItem>(() => {
    return {
      paddy: oscscStock.paddy + privateStock.paddy,
      rice: oscscStock.rice + privateStock.rice,
      bran: oscscStock.bran + privateStock.bran,
      brokenRice: oscscStock.brokenRice + privateStock.brokenRice,
    };
  }, [oscscStock, privateStock]);

  const addProcessingResult = useCallback((result: Omit<ProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => {
    const newResult: ProcessingResult = {
        ...result,
        id: new Date().toISOString(),
        date: new Date(),
        yieldPercentage: (result.riceYield / result.paddyUsed) * 100,
    };
    setProcessingHistory(prev => [...prev, newResult]);
  }, []);

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
    <StockContext.Provider value={{ oscscStock, privateStock, totalStock, processingHistory, addProcessingResult, purchases, addPurchase, addPayment, sales, addSale, addSalePayment }}>
      {children}
    </StockContext.Provider>
  );
}

export function useStockData() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStockData must be used within a StockProvider');
  }
  return context;
}
