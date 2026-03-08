'use client';

import { useMemo } from 'react';
import { useMandiData } from '@/context/mandi-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type MandiSummaryData = {
  mandiName: string;
  mandiId: string;
  totalTarget: number;
  totalLifted: number;
  balance: number;
};

export function MandiSummary() {
  const { targetAllocations, paddyLiftedItems } = useMandiData();

  const mandiSummary = useMemo(() => {
    const summaryMap = new Map<string, { totalTarget: number; totalLifted: number; mandiId: string }>();

    // Aggregate targets
    targetAllocations.forEach(allocation => {
      const entry = summaryMap.get(allocation.mandiName) || { totalTarget: 0, totalLifted: 0, mandiId: allocation.mandiIdNumber || 'N/A' };
      entry.totalTarget += allocation.target;
      // Ensure we keep an ID if one exists
      if (!entry.mandiId || entry.mandiId === 'N/A') entry.mandiId = allocation.mandiIdNumber || 'N/A';
      summaryMap.set(allocation.mandiName, entry);
    });

    // Aggregate lifted paddy
    paddyLiftedItems.forEach(item => {
      const entry = summaryMap.get(item.mandiName) || { totalTarget: 0, totalLifted: 0, mandiId: 'N/A' };
      entry.totalLifted += item.totalPaddyReceived;
      summaryMap.set(item.mandiName, entry);
    });

    const summaryArray: MandiSummaryData[] = [];
    summaryMap.forEach((value, key) => {
      summaryArray.push({
        mandiName: key,
        mandiId: value.mandiId,
        totalTarget: value.totalTarget,
        totalLifted: value.totalLifted,
        balance: value.totalTarget - value.totalLifted,
      });
    });

    return summaryArray.sort((a,b) => a.mandiName.localeCompare(b.mandiName));
  }, [targetAllocations, paddyLiftedItems]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Mandi-wise Summary</CardTitle>
                <CardDescription>Performance overview for each mandi.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div id="mandi-summary-table" className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Mandi Name</TableHead>
                    <TableHead>Mandi ID</TableHead>
                    <TableHead className="text-right">Target Allotted (Qtl)</TableHead>
                    <TableHead className="text-right">Paddy Lifted (Qtl)</TableHead>
                    <TableHead className="text-right">Balance (Qtl)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {mandiSummary.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center">No mandi data available.</TableCell></TableRow>
                )}
                {mandiSummary.map((item) => (
                    <TableRow key={item.mandiName}>
                        <TableCell className="font-medium">{item.mandiName}</TableCell>
                        <TableCell>{item.mandiId}</TableCell>
                        <TableCell className="text-right">{item.totalTarget.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">{item.totalLifted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className={`text-right font-semibold ${item.balance < 0 ? 'text-destructive' : ''}`}>{item.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
