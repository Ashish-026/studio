'use client';

import { PrivatePurchases } from './private-purchases';
import { PrivateSummaryCards } from './private-summary-cards';


export function PrivateDashboard() {
  return (
    <div className="space-y-8">
      <PrivateSummaryCards />
      <PrivatePurchases />
    </div>
  );
}
