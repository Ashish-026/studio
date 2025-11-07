export type User = {
  id: string;
  name: string;
  role: 'admin' | 'user';
};

export type TargetAllocation = {
  id: string;
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
};
