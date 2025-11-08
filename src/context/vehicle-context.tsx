'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useEffect } from 'react';
import type { Vehicle, Payment, VehicleTrip } from '@/lib/types';

interface VehicleContextType {
  vehicles: Vehicle[];
  addVehicle: (item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'trips' | 'totalRent' | 'totalPaid' | 'balance'>) => string;
  addRentPayment: (vehicleId: string, amount: number) => void;
  addTrip: (vehicleId: string, trip: Omit<VehicleTrip, 'id' | 'date'>) => void;
  updateTrip: (vehicleId: string, tripId: string, updatedTrip: VehicleTrip) => void;
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
        totalRent = rentAmount; // Simplified for now
    }
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const balance = totalRent - totalPaid;
    return { totalRent, totalPaid, balance };
};

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
            trips: item.trips?.map((t: any) => ({...t, date: new Date(t.date)})),
        }));
    } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        return initialData;
    }
}


export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    setVehicles(parseStoredData('vehicles', initialVehicles));
  }, []);

  useEffect(() => {
    if (vehicles.length > 0) {
      localStorage.setItem('vehicles', JSON.stringify(vehicles));
    }
  }, [vehicles]);


  const addVehicle = useCallback((item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'trips' | 'totalRent' | 'totalPaid' | 'balance'>) => {
    let vehicleId = '';
    setVehicles(prev => {
        const existingVehicle = prev.find(v => v.vehicleNumber === item.vehicleNumber);
        if (existingVehicle) {
            vehicleId = existingVehicle.id;
            return prev; // Don't add if it already exists
        }

        const isPerTrip = item.rentType === 'per_trip';
        const rentAmount = isPerTrip ? 0 : item.rentAmount;
        const totalRent = isPerTrip ? 0 : rentAmount;
        
        const newVehicle: Vehicle = {
            ...item,
            id: new Date().toISOString() + '-v',
            dateAdded: new Date(),
            payments: [],
            trips: [],
            rentAmount: rentAmount,
            totalRent: totalRent,
            totalPaid: 0,
            balance: totalRent,
        };
        vehicleId = newVehicle.id;
        return [...prev, newVehicle];
    });
    return vehicleId;
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
    setVehicles(prev => {
        return prev.map(v => {
            const targetVehicle = v.id === vehicleId || v.vehicleNumber === vehicleId;
            if (targetVehicle && v.rentType === 'per_trip') {
                const newTrip: VehicleTrip = {
                    ...trip,
                    id: new Date().toISOString(),
                    date: new Date(),
                };
                const updatedTrips = [...v.trips, newTrip];
                const totalRent = updatedTrips.reduce((acc, t) => acc + t.tripCharge, 0);
                const balance = totalRent - v.totalPaid;
                return { ...v, trips: updatedTrips, totalRent, balance };
            }
            return v;
        });
    });
  }, []);
  
  const updateTrip = useCallback((vehicleId: string, tripId: string, updatedTripData: VehicleTrip) => {
    setVehicles(prev => prev.map(v => {
        if (v.id === vehicleId) {
            const updatedTrips = v.trips.map(t => t.id === tripId ? { ...t, ...updatedTripData } : t);
            const totals = calculateTotals(v.rentType, v.rentAmount, v.payments, updatedTrips);
            return { ...v, trips: updatedTrips, ...totals };
        }
        return v;
    }));
  }, []);


  return (
    <VehicleContext.Provider value={{ vehicles, addVehicle, addRentPayment, addTrip, updateTrip }}>
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
