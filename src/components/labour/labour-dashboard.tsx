'use client';

import { LabourRecords } from './labour-records';
import { LabourSummaryCards } from './labour-summary-cards';

export function LabourDashboard() {
  return (
    <div className="space-y-8">
      <LabourSummaryCards />
      <LabourRecords />
    </div>
  );
}
