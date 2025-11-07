'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';

// Simplified type for private purchases
export type PrivatePurchase = {
  id: string;
  mandiName: string;
  farmerName: string;
  paddyAmount: number;
};

interface PrivateContextType {
  purchases: PrivatePurchase[];
  addPurchase: (item: Omit<PrivatePurchase, 'id'>) => void;
}

const PrivateContext = createContext<PrivateContextType | null>(null);

const initialPurchases: PrivatePurchase[] = [
    { id: '1', mandiName: 'Private Mandi A', farmerName: 'Gopal Verma', paddyAmount: 150 },
    { id: '2', mandiName: 'Private Mandi B', farmerName: 'Sunita Devi', paddyAmount: 200 },
];

export function PrivateProvider({ children }: { children: ReactNode }) {
  const [purchases, setPurchases] = useState<PrivatePurchase[]>(initialPurchases);

  const addPurchase = useCallback((item: Omit<PrivatePurchase, 'id'>) => {
    setPurchases((prev) => [...prev, { ...item, id: new Date().toISOString() }]);
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
