export type User = {
  id: string;
  name: string;
  role: 'admin' | 'user';
};

export type TargetAllocation = {
  id:string;
  mandiName: string;
  date: Date;
  target: number;
};

export type PaddyLifted = {
  id: string;
  mandiName: string;
  farmerName: string;
  totalPaddyReceived: number;
  mandiWeight: number;
  moneyReceived?: number;
  ratePerQuintal?: number;
  entryType?: 'physical' | 'monetary';
};

export type Payment = {
  id: string;
  amount: number;
  date: Date;
};

export type PrivatePurchase = {
  id: string;
  farmerName: string;
  itemType: 'rice' | 'paddy';
  quantity: number;
  rate: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  description?: string;
  date: Date;
  payments: Payment[];
};

export type PrivateSale = {
  id: string;
  customerName: string;
  itemType: 'rice' | 'paddy';
  quantity: number;
  rate: number;
  totalAmount: number;
  amountReceived: number;
  balance: number;
  description?: string;
  date: Date;
  payments: Payment[];
  source: 'oscsc' | 'private';
}

export type LabourWorkEntry = {
  id: string;
  date: Date;
  description: string;
  entryType: 'daily' | 'item_rate';
  wage: number;
  // Daily wage fields
  activity?: string;
  dailyRate?: number; // Rate for a full day
  // Item rate fields
  itemName?: string;
  quantity?: number;
  ratePerItem?: number;
};

export type Labourer = {
    id: string;
    name: string;
    workEntries: LabourWorkEntry[];
    payments: Payment[];
    totalWages: number;
    totalPaid: number;
    balance: number;
};

export type VehicleTrip = {
    id: string;
    date: Date;
    source: string;
    destination: string;
    quantity: number;
    tripCharge: number;
};

export type Vehicle = {
    id: string;
    vehicleNumber: string;
    driverName: string;
    ownerName: string;
    rentType: 'daily' | 'monthly' | 'per_trip';
    rentAmount: number;
    payments: Payment[];
    trips: VehicleTrip[];
    totalRent: number;
    totalPaid: number;
    balance: number;
    dateAdded: Date;
};

export type PrivateEntry = {
  id: string;
  name: string;
  quantityReceived: number;
  amountPaid: number;
};

export type StockItem = {
    paddy: number;
    rice: number;
    bran: number;
    brokenRice: number;
}

export type ProcessingResult = {
  id: string;
  date: Date;
  source: 'oscsc' | 'private';
  paddyUsed: number;
  riceYield: number;
  branYield: number;
  brokenRiceYield: number;
  yieldPercentage: number;
};
