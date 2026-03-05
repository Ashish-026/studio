'use client';

import { createContext, useState, useCallback, ReactNode, useContext, useEffect } from 'react';
import type { Vehicle, Payment, VehicleTrip } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface VehicleContextType {
  vehicles: Vehicle[];
  addVehicle: (item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'trips' | 'totalRent' | 'totalPaid' | 'balance'>) => string;
  addRentPayment: (vehicleId: string, amount: number) => void;
  addTrip: (vehicleId: string, trip: Omit<VehicleTrip, 'id' | 'date'>) => void;
  updateTrip: (vehicleId: string, tripId: string, updatedTrip: VehicleTrip) => void;
  loading: boolean;
}

const VehicleContext = createContext<VehicleContextType | null>(null);

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
  const db = useFirestore();

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, 'vehicles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        const trips = (item.trips || []).map((t: any) => ({
            ...t, 
            date: t.date?.toDate ? t.date.toDate() : new Date(t.date)
        }));
        const payments = (item.payments || []).map((p: any) => ({
            ...p, 
            date: p.date?.toDate ? p.date.toDate() : new Date(p.date)
        }));
        
        const { totalRent, totalPaid, balance } = calculateTotals(item.rentType, item.rentAmount, payments, trips);
        
        return {
          ...item,
          id: doc.id,
          trips,
          payments,
          totalRent,
          totalPaid,
          balance,
          dateAdded: item.dateAdded?.toDate ? item.dateAdded.toDate() : new Date(item.dateAdded)
        } as Vehicle;
      });
      setVehicles(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const addVehicle = useCallback((item: Omit<Vehicle, 'id' | 'dateAdded' | 'payments' | 'trips' | 'totalRent' | 'totalPaid' | 'balance'>) => {
    if (!db) return '';
    
    const existingVehicle = (vehicles || []).find(v => v.vehicleNumber === item.vehicleNumber);
    if (existingVehicle) return existingVehicle.id;

    const id = Date.now().toString() + '-v';
    const newVehicle = {
        ...item,
        dateAdded: new Date(),
        payments: [],
        trips: [],
    };
    setDocumentNonBlocking(doc(db, 'vehicles', id), newVehicle, { merge: true });
    return id;
  }, [db, vehicles]);

  const addRentPayment = useCallback((vehicleId: string, amount: number) => {
    if (!db) return;
    const vehicle = (vehicles || []).find(v => v.id === vehicleId);
    if (!vehicle) return;

    const newPayment: Payment = {
        id: Date.now().toString() + '-p',
        amount: Number(amount),
        date: new Date(),
    };
    const updatedPayments = [...(vehicle.payments || []), newPayment];
    updateDocumentNonBlocking(doc(db, 'vehicles', vehicleId), { payments: updatedPayments });
  }, [db, vehicles]);

  const addTrip = useCallback((vehicleId: string, trip: Omit<VehicleTrip, 'id' | 'date'>) => {
    if (!db) return;
    const vehicle = (vehicles || []).find(v => v.id === vehicleId || v.vehicleNumber === vehicleId);
    if (vehicle && vehicle.rentType === 'per_trip') {
        const newTrip: VehicleTrip = {
            ...trip,
            id: Date.now().toString(),
            date: new Date(),
        };
        const updatedTrips = [...(vehicle.trips || []), newTrip];
        updateDocumentNonBlocking(doc(db, 'vehicles', vehicle.id), { trips: updatedTrips });
    }
  }, [db, vehicles]);
  
  const updateTrip = useCallback((vehicleId: string, tripId: string, updatedTripData: VehicleTrip) => {
    if (!db) return;
    const vehicle = (vehicles || []).find(v => v.id === vehicleId);
    if (vehicle) {
        const updatedTrips = vehicle.trips.map(t => t.id === tripId ? { ...t, ...updatedTripData } : t);
        updateDocumentNonBlocking(doc(db, 'vehicles', vehicleId), { trips: updatedTrips });
    }
  }, [db, vehicles]);

  return (
    <VehicleContext.Provider value={{ vehicles, addVehicle, addRentPayment, addTrip, updateTrip, loading }}>
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