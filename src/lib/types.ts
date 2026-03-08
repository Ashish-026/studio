export type User = {
  id: string;
  name: string;
  role: 'admin' | 'user';
};

export type Mill = {
  id: string;
  name: string;
  location: string;
};

export type TargetAllocation = {
  id:string;
  mandiName: string;
  mandiIdNumber?: string;
  date: Date;
  target: number;
};

export type PaddyLifted = {
  id: string;
  date: Date;
  mandiName: string;
  farmerName: string;
  totalPaddyReceived: number;
  mandiWeight: number;
  moneyReceived?: number;
  ratePerQuintal?: number;
  entryType?: 'physical' | 'monetary';
  vehicleType?: 'farmer' | 'own' | 'hired';
  vehicleNumber?: string;
  driverName?: string;
  ownerName?: string;
  tripCharge?: number;
  source?: string;
  destination?: string;
  labourerIds?: string[];
  labourCharge?: number;
  labourWageType?: 'per_item' | 'total_amount';
  // New Fields for Token Logic
  tokenNumber?: string;
  mandiTokenLimit?: number;
  privateOverflowQty?: number;
  privateOverflowRate?: number;
  isPrivateOverflow?: boolean;
};

export type MandiProcessingResult = {
    id: string;
    date: Date;
    paddyUsed: number;
    riceYield: number;
    branYield: number;
    brokenRiceYield: number;
    yieldPercentage: number;
    labourerIds?: string[];
    labourCharge?: number;
    labourWageType?: 'per_item' | 'total_amount';
};

export type MandiStockRelease = {
    id: string;
    date: Date;
    lotNumber: string;
    godownDetails: string;
    quantity: number;
    vehicleType?: 'own' | 'hired';
    vehicleNumber?: string;
    driverName?: string;
    ownerName?: string;
    tripCharge?: number;
    source?: string;
    destination?: string;
    labourerIds?: string[];
    labourCharge?: number;
    labourWageType?: 'per_item' | 'total_amount';
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
  vehicleType?: 'farmer' | 'own' | 'hired';
  vehicleNumber?: string;
  driverName?: string;
  ownerName?: string;
  tripCharge?: number;
  source?: string;
  destination?: string;
  labourerIds?: string[];
  labourCharge?: number;
  labourWageType?: 'per_item' | 'total_amount';
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
  source: 'private';
  vehicleType?: 'customer' | 'own' | 'hired';
  vehicleNumber?: string;
  driverName?: string;
  ownerName?: string;
  tripCharge?: number;
  destination?: string;
  sourceLocation?: string;
  labourerIds?: string[];
  labourCharge?: number;
  labourWageType?: 'per_item' | 'total_amount';
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
  source: 'private';
  type: 'paddy' | 'rice';
  paddyUsed: number;
  riceUsed?: number;
  finalRiceYield?: number;
  riceYield: number;
  branYield: number;
  brokenRiceYield: number;
  yieldPercentage: number;
  labourerIds?: string[];
  labourCharge?: number;
  labourWageType?: 'per_item' | 'total_amount';
};
