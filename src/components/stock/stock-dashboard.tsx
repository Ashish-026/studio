'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrivatePurchases } from '../private/private-purchases';
import { PrivateSales } from '../private/private-sales';
import { StockSummary } from './stock-summary';
import { StockProcessing } from './stock-processing';

export function StockDashboard() {
  return (
    <div className="space-y-8">
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <StockSummary />
        </TabsContent>
        <TabsContent value="purchases">
          <PrivatePurchases />
        </TabsContent>
        <TabsContent value="sales">
          <PrivateSales />
        </TabsContent>
        <TabsContent value="processing">
          <StockProcessing />
        </TabsContent>
      </Tabs>
    </div>
  );
}
