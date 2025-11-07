'use client';

import { VehicleRecords } from './vehicle-records';
import { VehicleSummaryCards } from './vehicle-summary-cards';

export function VehicleDashboard() {
  return (
    <div className="space-y-8">
      <VehicleSummaryCards />
      <VehicleRecords />
    </div>
  );
}
