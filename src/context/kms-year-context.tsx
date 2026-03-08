
'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as db from '@/lib/db';

interface KmsYearContextType {
  availableKmsYears: string[];
  selectedKmsYear: string | null;
  selectKmsYear: (year: string) => void;
  loading: boolean;
  getKmsYearForDate: (date: Date) => string;
}

export const KmsYearContext = createContext<KmsYearContextType | null>(null);

const generateKmsYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = -2; i <= 2; i++) {
    const startYear = currentYear + i;
    years.push(`${startYear}-${(startYear + 1).toString().slice(-2)}`);
  }
  return years;
};

const getKmsYearForDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 9) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
};

export function KmsYearProvider({ children }: { children: ReactNode }) {
  const [availableKmsYears] = useState<string[]>(generateKmsYears());
  const [selectedKmsYear, setSelectedKmsYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadYear = async () => {
      const storedYear = await db.getItem<string>('mandi-monitor-kms-year');
      if (storedYear) {
        setSelectedKmsYear(storedYear);
      }
      setLoading(false);
    };
    loadYear();
  }, []);

  const selectKmsYear = useCallback((year: string) => {
    setSelectedKmsYear(year);
    db.setItem('mandi-monitor-kms-year', year);
  }, []);

  return (
    <KmsYearContext.Provider value={{ availableKmsYears, selectedKmsYear, selectKmsYear, loading, getKmsYearForDate }}>
      {children}
    </KmsYearContext.Provider>
  );
}
