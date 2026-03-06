'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useEffect, useMemo } from 'react';
import type { Vehicle, Payment, VehicleTrip } from '@/lib/types';

interface VehicleContextType {
  vehicles: Vehicle[];
  addVehicle: (item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'trips' | 'totalRent' | 'totalPaid' | 'balance'>) => string;
  addRentPayment: (vehicleId: string, amount: number) => void;
  addTrip: (vehicleId: string, trip: Omit<VehicleTrip, 'id' | 'date'>) => void;
  updateTrip: (vehicleId: string, tripId: string, updatedTrip: VehicleTrip) => void;
  loading: boolean;
}

const VehicleContext = createContext<VehicleContextType | null>(null);

const STORAGE_KEY = 'mandi-monitor-vehicles-v2';

const calculateTotals = (rentType: Vehicle['rentType'], rentAmount: number, payments: Payment[], trips: VehicleTrip[]) => {
    let totalRent = 0;
    if (rentType === 'per_trip') {
        totalRent = (trips || []).reduce((acc, trip) => acc + (Number(trip.tripCharge) || 0), 0);
    } else {
        totalRent = Number(rentAmount) || 0;
    }
    const totalPaid = (payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const balance = totalRent - totalPaid;
    return { totalRent, totalPaid, balance };
};

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const revived = parsed.map((v: any) => ({
          ...v,
          dateAdded: new Date(v.dateAdded),
          trips: (v.trips || []).map((t: any) => ({ ...t, date: new Date(t.date) })),
          payments: (v.payments || []).map((p: any) => ({ ...p, date: new Date(p.date) })),
        }));
        setVehicles(revived);
      } catch (e) {
        console.error("Failed to load vehicle data", e);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    }
  }, [vehicles, loading]);

  const addVehicle = useCallback((item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'trips' | 'totalRent' | 'totalPaid' | 'balance'>) => {
    const existingVehicle = (vehicles || []).find(v => v.vehicleNumber === item.vehicleNumber);
    if (existingVehicle) return existingVehicle.id;

    const id = Date.now().toString();
    const newVehicle: Vehicle = {
        ...item,
        id,
        dateAdded: new Date(),
        payments: [],
        trips: [],
        totalRent: item.rentType === 'per_trip' ? 0 : Number(item.rentAmount),
        totalPaid: 0,
        balance: item.rentType === 'per_trip' ? 0 : Number(item.rentAmount),
    };
    setVehicles(prev => [...prev, newVehicle]);
    return id;
  }, [vehicles]);

  const addRentPayment = useCallback((vehicleId: string, amount: number) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const newPayment: Payment = {
            id: Date.now().toString(),
            amount: Number(amount),
            date: new Date(),
        };
        const updatedPayments = [...(v.payments || []), newPayment];
        const totals = calculateTotals(v.rentType, v.rentAmount, updatedPayments, v.trips);
        return { ...v, payments: updatedPayments, ...totals };
      }
      return v;
    }));
  }, []);

  const addTrip = useCallback((vehicleId: string, trip: Omit<VehicleTrip, 'id' | 'date'>) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId || v.vehicleNumber === vehicleId) {
        if (v.rentType === 'per_trip') {
          const newTrip: VehicleTrip = {
              ...trip,
              id: Date.now().toString(),
              date: new Date(),
          };
          const updatedTrips = [...(v.trips || []), newTrip];
          const totals = calculateTotals(v.rentType, v.rentAmount, v.payments, updatedTrips);
          return { ...v, trips: updatedTrips, ...totals };
        }
      }
      return v;
    }));
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

  const contextValue = useMemo(() => ({
    vehicles,
    addVehicle,
    addRentPayment,
    addTrip,
    updateTrip,
    loading
  }), [vehicles, addVehicle, addRentPayment, addTrip, updateTrip, loading]);

  return (
    <VehicleContext.Provider value={contextValue}>
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
