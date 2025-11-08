'use client';

import { useMemo } from 'react';
import { useMandiData } from '@/context/mandi-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { downloadPdf } from '@/lib/pdf-utils';

type MandiSummaryData = {
  mandiName: string;
  totalTarget: number;
  totalLifted: number;
  balance: number;
};

export function MandiSummary() {
  const { targetAllocations, paddyLiftedItems } = useMandiData();

  const mandiSummary = useMemo(() => {
    const summaryMap = new Map<string, { totalTarget: number; totalLifted: number }>();

    // Aggregate targets
    targetAllocations.forEach(allocation => {
      const entry = summaryMap.get(allocation.mandiName) || { totalTarget: 0, totalLifted: 0 };
      entry.totalTarget += allocation.target;
      summaryMap.set(allocation.mandiName, entry);
    });

    // Aggregate lifted paddy
    paddyLiftedItems.forEach(item => {
      const entry = summaryMap.get(item.mandiName) || { totalTarget: 0, totalLifted: 0 };
      entry.totalLifted += item.totalPaddyReceived;
      summaryMap.set(item.mandiName, entry);
    });

    const summaryArray: MandiSummaryData[] = [];
    summaryMap.forEach((value, key) => {
      summaryArray.push({
        mandiName: key,
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
            <Button variant="outline" size="sm" onClick={() => downloadPdf('mandi-summary-table', 'mandi-summary')}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div id="mandi-summary-table" className="border rounded-lg">
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Mandi Name</TableHead>
                    <TableHead className="text-right">Target Allotted (Qtl)</TableHead>
                    <TableHead className="text-right">Paddy Lifted (Qtl)</TableHead>
                    <TableHead className="text-right">Balance (Qtl)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {mandiSummary.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center">No mandi data available.</TableCell></TableRow>
                )}
                {mandiSummary.map((item) => (
                    <TableRow key={item.mandiName}>
                        <TableCell className="font-medium">{item.mandiName}</TableCell>
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
