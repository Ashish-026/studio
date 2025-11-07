'use client';

import { createContext, useState, useCallback, ReactNode, useContext } from 'react';
import type { Vehicle, Payment, VehicleTrip } from '@/lib/types';

interface VehicleContextType {
  vehicles: Vehicle[];
  addVehicle: (item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'trips' | 'totalRent' | 'totalPaid' | 'balance'>) => void;
  addRentPayment: (vehicleId: string, amount: number) => void;
  addTrip: (vehicleId: string, trip: Omit<VehicleTrip, 'id' | 'date'>) => void;
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
        trips: [],
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
        rentType: 'per_trip',
        rentAmount: 0, // Not applicable for per_trip
        payments: [],
        trips: [
            { id: 't1', date: new Date('2024-07-02'), source: 'Bargarh', destination: 'Sambalpur', quantity: 120, tripCharge: 2500 },
            { id: 't2', date: new Date('2024-07-04'), source: 'Sambalpur', destination: 'Bhubaneswar', quantity: 150, tripCharge: 6000 },
        ],
        totalRent: 8500,
        totalPaid: 0,
        balance: 8500,
        dateAdded: new Date('2024-07-01')
    }
];

const calculateTotals = (rentType: Vehicle['rentType'], rentAmount: number, payments: Payment[], trips: VehicleTrip[]) => {
    let totalRent = 0;
    if (rentType === 'per_trip') {
        totalRent = trips.reduce((acc, trip) => acc + trip.tripCharge, 0);
    } else {
        // This is a simplified calculation. For daily/monthly a more complex logic might be needed based on time.
        // For now, we'll assume totalRent is managed elsewhere or equals rentAmount for a single period.
        totalRent = rentAmount; // Simplified for now
    }
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const balance = totalRent - totalPaid;
    return { totalRent, totalPaid, balance };
};

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);

  const addVehicle = useCallback((item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'trips' | 'totalRent' | 'totalPaid' | 'balance'>) => {
    const isPerTrip = item.rentType === 'per_trip';
    const rentAmount = isPerTrip ? 0 : item.rentAmount;
    const totalRent = isPerTrip ? 0 : item.rentAmount;

    const newVehicle: Vehicle = {
        ...item,
        id: new Date().toISOString(),
        dateAdded: new Date(),
        payments: [],
        trips: [],
        rentAmount: rentAmount,
        totalRent: totalRent,
        totalPaid: 0,
        balance: totalRent,
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
            const totals = calculateTotals(v.rentType, v.rentAmount, updatedPayments, v.trips);
            return { ...v, payments: updatedPayments, ...totals };
        }
        return v;
    }));
  }, []);

  const addTrip = useCallback((vehicleId: string, trip: Omit<VehicleTrip, 'id' | 'date'>) => {
    setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId && v.rentType === 'per_trip') {
            const newTrip: VehicleTrip = {
                ...trip,
                id: new Date().toISOString(),
                date: new Date(),
            };
            const updatedTrips = [...v.trips, newTrip];
            const totals = calculateTotals(v.rentType, v.rentAmount, v.payments, updatedTrips);
            return { ...v, trips: updatedTrips, ...totals };
        }
        return v;
    }));
  }, []);


  return (
    <VehicleContext.Provider value={{ vehicles, addVehicle, addRentPayment, addTrip }}>
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
