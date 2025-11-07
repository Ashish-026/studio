'use client';

import { PrivatePurchases } from './private-purchases';
import { PrivateSales } from './private-sales';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrivateSummaryCards } from './private-summary-cards';


export function PrivateDashboard() {
  return (
    <div className="space-y-8">
      <PrivateSummaryCards />
      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases" className="space-y-4">
          <PrivatePurchases />
        </TabsContent>
        <TabsContent value="sales" className="space-y-4">
          <PrivateSales />
        </TabsContent>
      </Tabs>
    </div>
  );
}
