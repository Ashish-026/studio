'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SummaryCards } from './summary-cards';
import { TargetAllotment } from './target-allotment';
import { PaddyLifted } from './paddy-lifted';
import { MandiSummary } from './mandi-summary';
import { Separator } from '../ui/separator';
import { MandiProcessing } from './mandi-processing';
import { MandiSupply } from './mandi-supply';
import { useAuth } from '@/hooks/use-auth';

export function MandiDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-8">
      <SummaryCards />
      <MandiSummary />
      <Separator />
      <Tabs defaultValue="paddy-lifted" className="space-y-4">
        <TabsList className={isAdmin ? "grid w-full grid-cols-4" : "grid w-full grid-cols-2"}>
          <TabsTrigger value="target-allotment">Target Allotment</TabsTrigger>
          <TabsTrigger value="paddy-lifted">Paddy Lifted</TabsTrigger>
          {isAdmin && <TabsTrigger value="processing">Processing</TabsTrigger>}
          {isAdmin && <TabsTrigger value="supply">Supply</TabsTrigger>}
        </TabsList>
        <TabsContent value="target-allotment" className="space-y-4">
          <TargetAllotment />
        </TabsContent>
        <TabsContent value="paddy-lifted" className="space-y-4">
          <PaddyLifted />
        </TabsContent>
        {isAdmin && (
            <TabsContent value="processing" className="space-y-4">
                <MandiProcessing />
            </TabsContent>
        )}
        {isAdmin && (
            <TabsContent value="supply" className="space-y-4">
                <MandiSupply />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
