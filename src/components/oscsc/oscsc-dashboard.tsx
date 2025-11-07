'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryCards } from './summary-cards';
import { TargetAllotment } from './target-allotment';
import { PaddyLifted } from './paddy-lifted';
import { MandiSummary } from './mandi-summary';
import { Separator } from '../ui/separator';

export function OscscDashboard() {
  return (
    <div className="space-y-8">
      <SummaryCards />
      <MandiSummary />
      <Separator />
      <Tabs defaultValue="paddy-lifted" className="space-y-4">
        <TabsList>
          <TabsTrigger value="target-allotment">Target Allotment</TabsTrigger>
          <TabsTrigger value="paddy-lifted">Paddy Lifted</TabsTrigger>
        </TabsList>
        <TabsContent value="target-allotment" className="space-y-4">
          <TargetAllotment />
        </TabsContent>
        <TabsContent value="paddy-lifted" className="space-y-4">
          <PaddyLifted />
        </TabsContent>
      </Tabs>
    </div>
  );
}
