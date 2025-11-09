'use client';

import { useContext } from 'react';
import { MillContext } from '@/context/mill-context';

export function useMill() {
  const context = useContext(MillContext);
  if (!context) {
    throw new Error('useMill must be used within a MillProvider');
  }
  return context;
}
