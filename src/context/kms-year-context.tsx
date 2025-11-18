'use client';

import { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

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

// Function to determine KMS year from a date
const getKmsYearForDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed (0 for January)
    // KMS is generally Oct-Sep. If date is Oct, Nov, Dec, it's the start of a new KMS year.
    if (month >= 9) { // October, November, December
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else { // Jan-Sep
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
};

export function KmsYearProvider({ children }: { children: ReactNode }) {
  const [availableKmsYears] = useState<string[]>(generateKmsYears());
  const [selectedKmsYear, setSelectedKmsYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedYear = localStorage.getItem('mandi-monitor-kms-year');
      if (storedYear) {
        setSelectedKmsYear(JSON.parse(storedYear));
      }
    } catch (error) {
      console.error('Failed to parse KMS year from localStorage', error);
      localStorage.removeItem('mandi-monitor-kms-year');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectKmsYear = useCallback((year: string) => {
    setSelectedKmsYear(year);
    localStorage.setItem('mandi-monitor-kms-year', JSON.stringify(year));
  }, []);

  return (
    <KmsYearContext.Provider value={{ availableKmsYears, selectedKmsYear, selectKmsYear, loading, getKmsYearForDate }}>
      {children}
    </KmsYearContext.Provider>
  );
}
