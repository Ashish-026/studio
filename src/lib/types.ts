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
}

export type LabourRecord = {
  id: string;
  name: string;
  date: Date;
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


export type PrivateEntry = {
  id: string;
  name: string;
  quantityReceived: number;
  amountPaid: number;
};
