'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import type { Vehicle, Payment } from '@/lib/types';

interface VehicleContextType {
  vehicles: Vehicle[];
  addVehicle: (item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'totalRent' | 'totalPaid' | 'balance'>) => void;
  addRentPayment: (vehicleId: string, amount: number) => void;
}

const VehicleContext = createContext<VehicleContextType | null>(null);

const initialVehicles: Vehicle[] = [
    {
        id: 'v1',
        vehicleNumber: 'OR02AB1234',
        driverName: 'Rakesh Sharma',
        ownerName: 'Sharma Transport',
        rentType: 'monthly',
        rentAmount: 30000,
        payments: [{ id: 'vp1', amount: 30000, date: new Date('2024-07-01') }],
        totalRent: 30000,
        totalPaid: 30000,
        balance: 0,
        dateAdded: new Date('2024-06-15')
    },
    {
        id: 'v2',
        vehicleNumber: 'OD05CD5678',
        driverName: 'Sanjay Yadav',
        ownerName: 'Yadav Logistics',
        rentType: 'daily',
        rentAmount: 1500,
        payments: [],
        totalRent: 4500, // Assuming 3 days of work
        totalPaid: 0,
        balance: 4500,
        dateAdded: new Date('2024-07-01')
    }
];

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);

  const addVehicle = useCallback((item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'totalRent' | 'totalPaid' | 'balance'>) => {
    const newVehicle: Vehicle = {
        ...item,
        id: new Date().toISOString(),
        dateAdded: new Date(),
        payments: [],
        totalRent: item.rentType === 'monthly' || item.rentType === 'daily' ? item.rentAmount : 0, // Initial rent assumption
        totalPaid: 0,
        balance: item.rentType === 'monthly' || item.rentType === 'daily' ? item.rentAmount : 0,
    };
    setVehicles(prev => [...prev, newVehicle]);
  }, []);

  const addRentPayment = useCallback((vehicleId: string, amount: number) => {
    setVehicles(prev => prev.map(v => {
        if(v.id === vehicleId) {
            const newPayment: Payment = {
                id: new Date().toISOString(),
                amount,
                date: new Date(),
            };
            const updatedPayments = [...v.payments, newPayment];
            const totalPaid = updatedPayments.reduce((acc, p) => acc + p.amount, 0);
            // Note: totalRent logic might need to be more sophisticated, e.g., based on trips or days worked.
            // For now, we assume it's manually managed or fixed.
            const balance = v.totalRent - totalPaid;
            return { ...v, payments: updatedPayments, totalPaid, balance };
        }
        return v;
    }));
  }, []);


  return (
    <VehicleContext.Provider value={{ vehicles, addVehicle, addRentPayment }}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicleData() {
    const context = useContext(VehicleContext);
    if (!context) {
        throw new Error('useVehicleData must be used within a VehicleProvider');
    }
    return context;
}
