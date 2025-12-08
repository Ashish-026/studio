
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
}

const StockContext = createContext<StockContextType | null>(null);

const initialProcessingHistory: ProcessingResult[] = [
    {
        id: 'p1',
        date: new Date('2024-07-20'),
        source: 'private',
        type: 'paddy',
        paddyUsed: 100, // in quintals
        riceYield: 65, // in quintals
        branYield: 5,
        brokenRiceYield: 2,
        yieldPercentage: 65
    }
];

const initialMandiProcessingHistory: MandiProcessingResult[] = [
    { id: 'mp1', date: new Date('2024-07-20'), paddyUsed: 150, riceYield: 97.5, branYield: 7.5, brokenRiceYield: 3, yieldPercentage: 65 }
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
        ],
        vehicleType: 'farmer',
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
        ],
        vehicleType: 'hired',
        vehicleNumber: 'UP78XY9012',
        driverName: 'Amit',
        ownerName: 'Yadav Logistics',
        tripCharge: 3000,
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
        ],
        vehicleType: 'own'
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
        vehicleType: 'customer',
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
        vehicleType: 'hired',
        vehicleNumber: 'MH12DE3456',
        driverName: 'Vijay',
        ownerName: 'Deccan Transports',
        tripCharge: 8000,
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
            date: item.date ? new Date(item.date) : undefined,
            dateAdded: item.dateAdded ? new Date(item.dateAdded) : undefined,
            payments: item.payments?.map((p: any) => ({...p, date: new Date(p.date)})),
        }));
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        return initialData;
    }
}

const parseStoredValue = (key: string, initialValue: any) => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return initialValue;
        return JSON.parse(stored, (key, value) => {
            if (key === 'date') return new Date(value);
            return value;
        });
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        return initialValue;
    }
}


export function StockProvider({ children }: { children: ReactNode }) {
  
  const [purchases, setPurchases] = useState<PrivatePurchase[]>([]);
  const [sales, setSales] = useState<PrivateSale[]>([]);
  const [processingHistory, setProcessingHistory] = useState<ProcessingResult[]>([]);
  const [mandiProcessingHistory, setMandiProcessingHistory] = useState<MandiProcessingResult[]>([]);
  const [transferredInStock, setTransferredInStock] = useState<{ date: Date; quantity: number }[]>([]);

  useEffect(() => {
    setPurchases(parseStoredData('purchases', initialPurchases));
    setSales(parseStoredData('sales', initialSales));
    setProcessingHistory(parseStoredData('processingHistory', initialProcessingHistory));
    setMandiProcessingHistory(parseStoredData('mandiProcessingHistory', initialMandiProcessingHistory));
    setTransferredInStock(parseStoredValue('transferredInStock', []));
  }, []);

  useEffect(() => { localStorage.setItem('purchases', JSON.stringify(purchases)); }, [purchases]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('processingHistory', JSON.stringify(processingHistory)); }, [processingHistory]);
  useEffect(() => { localStorage.setItem('mandiProcessingHistory', JSON.stringify(mandiProcessingHistory)); }, [mandiProcessingHistory]);
  useEffect(() => { localStorage.setItem('transferredInStock', JSON.stringify(transferredInStock)); }, [transferredInStock]);

  const processedPaddyBySource = useMemo(() => {
    return (processingHistory || []).reduce((acc, item) => {
        if(item.type === 'paddy') {
            acc[item.source] = (acc[item.source] || 0) + item.paddyUsed;
        }
        return acc;
    }, { private: 0 });
  }, [processingHistory]);

  const processedRiceBySource = useMemo(() => {
    return (processingHistory || []).reduce((acc, item) => {
        if(item.type === 'rice') {
            acc[item.source] = (acc[item.source] || 0) + (item.riceUsed || 0);
        }
        return acc;
    }, { private: 0 });
  }, [processingHistory]);

  const processedYieldsBySource = useMemo(() => {
    return (processingHistory || []).reduce((acc, item) => {
        const source = item.source;
        if (!acc[source]) {
            acc[source] = { rice: 0, bran: 0, brokenRice: 0 };
        }
        acc[source].rice += item.riceYield;
        acc[source].bran += item.branYield;
        acc[source].brokenRice += item.brokenRiceYield;
        return acc;
    }, { 
        private: { rice: 0, bran: 0, brokenRice: 0 } 
    });
  }, [processingHistory]);

  const transferredOutStock = useMemo(() => {
      return (transferredInStock || []).reduce((sum, t) => sum + t.quantity, 0);
  }, [transferredInStock])

  const privateStock = useMemo<StockItem>(() => {
    const purchasedPaddy = (purchases || []).filter(p => p.itemType === 'paddy').reduce((acc, p) => acc + p.quantity, 0);
    const purchasedRice = (purchases || []).filter(p => p.itemType === 'rice').reduce((acc, p) => acc + p.quantity, 0);

    const soldPaddy = (sales || []).filter(s => s.source === 'private' && s.itemType === 'paddy').reduce((acc, s) => acc + s.quantity, 0);
    const soldRice = (sales || []).filter(s => s.source === 'private' && s.itemType === 'rice').reduce((acc, s) => acc + s.quantity, 0);

    const paddyUsedForProcessing = processedPaddyBySource.private;
    const riceUsedForProcessing = processedRiceBySource.private;
    const yields = processedYieldsBySource.private;

    return {
      paddy: purchasedPaddy - paddyUsedForProcessing - soldPaddy,
      rice: (purchasedRice + yields.rice) - riceUsedForProcessing - soldRice - transferredOutStock,
      bran: yields.bran,
      brokenRice: yields.brokenRice,
    };
  }, [purchases, sales, processedPaddyBySource, processedRiceBySource, processedYieldsBySource, transferredOutStock]);
  
  const totalStock = useMemo<StockItem>(() => {
    const mandiBran = (mandiProcessingHistory || []).reduce((acc, item) => acc + item.branYield, 0) || 0;
    const mandiBrokenRice = (mandiProcessingHistory || []).reduce((acc, item) => acc + item.brokenRiceYield, 0) || 0;
    
    return {
      paddy: privateStock.paddy,
      rice: privateStock.rice,
      bran: privateStock.bran + mandiBran,
      brokenRice: privateStock.brokenRice + mandiBrokenRice,
    };
  }, [privateStock, mandiProcessingHistory]);

  const addProcessingResult = useCallback((result: Omit<ProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => {
    const yieldPercentage = result.type === 'paddy' ? (result.riceYield / result.paddyUsed) * 100 : 0;
    const newResult: ProcessingResult = {
        ...result,
        id: new Date().toISOString(),
        date: new Date(),
        yieldPercentage: yieldPercentage,
    };
    setProcessingHistory(prev => [...(prev || []), newResult]);
  }, []);

  const addMandiProcessing = useCallback((item: Omit<MandiProcessingResult, 'id' | 'date' | 'yieldPercentage'>) => {
    const newProcessingEntry: MandiProcessingResult = {
        ...item,
        id: new Date().toISOString(),
        date: new Date(),
        yieldPercentage: (item.riceYield / item.paddyUsed) * 100,
    };
    setMandiProcessingHistory(prev => [...(prev || []), newProcessingEntry]);
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
    setPurchases((prev) => [...(prev || []), newPurchase]);
  }, []);

  const addPayment = useCallback((purchaseId: string, amount: number) => {
    setPurchases(prev => (prev || []).map(p => {
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
    setSales((prev) => [...(prev || []), newSale]);
  }, []);

  const addSalePayment = useCallback((saleId: string, amount: number) => {
    setSales(prev => (prev || []).map(s => {
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

  const transferRiceToMandi = useCallback((quantity: number) => {
      setTransferredInStock(prev => [...(prev || []), { date: new Date(), quantity }]);
  }, []);


  return (
    <StockContext.Provider value={{ 
        privateStock, 
        totalStock, 
        processingHistory, 
        mandiProcessingHistory,
        transferredInStock, 
        addProcessingResult, 
        addMandiProcessing, 
        purchases, 
        addPurchase, 
        addPayment, 
        sales, 
        addSale, 
        addSalePayment, 
        transferRiceToMandi 
    }}>
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
