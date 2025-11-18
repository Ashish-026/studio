'use client';

import { useContext } from 'react';
import { KmsYearContext } from '@/context/kms-year-context';

export function useKmsYear() {
  const context = useContext(KmsYearContext);
  if (!context) {
    throw new Error('useKmsYear must be used within a KmsYearProvider');
  }
  return context;
}
