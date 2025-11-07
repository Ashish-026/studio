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

export type PrivatePurchase = {
  id: string;
  mandiName: string;
  itemType: 'rice' | 'paddy';
  farmerName: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
};

export type LabourRecord = {
    id: string;
    name: string;
    activity: string;
    hoursWorked: number;
};
