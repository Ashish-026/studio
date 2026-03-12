'use client';

import { useMemo } from 'react';
import { useMandiData } from '@/context/mandi-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend,
  LabelList,
  Cell
} from 'recharts';
import { Badge } from '../ui/badge';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

type MandiSummaryData = {
  mandiName: string;
  mandiId: string;
  totalTarget: number;
  totalLifted: number;
  balance: number;
  percent: number;
};

export function MandiSummary() {
  const { targetAllocations, paddyLiftedItems } = useMandiData();

  const mandiSummary = useMemo(() => {
    const summaryMap = new Map<string, { totalTarget: number; totalLifted: number; mandiId: string }>();

    // Aggregate targets with safety checks
    (targetAllocations || []).forEach(allocation => {
      if (!allocation || !allocation.mandiName) return;
      const entry = summaryMap.get(allocation.mandiName) || { totalTarget: 0, totalLifted: 0, mandiId: allocation.mandiIdNumber || 'N/A' };
      entry.totalTarget += (Number(allocation.target) || 0);
      if (!entry.mandiId || entry.mandiId === 'N/A') entry.mandiId = allocation.mandiIdNumber || 'N/A';
      summaryMap.set(allocation.mandiName, entry);
    });

    // Aggregate lifted paddy based on Official Weight (mandiWeight)
    (paddyLiftedItems || []).forEach(item => {
      if (!item || !item.mandiName) return;
      const entry = summaryMap.get(item.mandiName) || { totalTarget: 0, totalLifted: 0, mandiId: 'N/A' };
      entry.totalLifted += (Number(item.mandiWeight) || 0);
      summaryMap.set(item.mandiName, entry);
    });

    const summaryArray: MandiSummaryData[] = [];
    summaryMap.forEach((value, key) => {
      const percent = value.totalTarget > 0 ? (value.totalLifted / value.totalTarget) * 100 : 0;
      summaryArray.push({
        mandiName: key,
        mandiId: value.mandiId,
        totalTarget: value.totalTarget,
        totalLifted: value.totalLifted,
        balance: value.totalTarget - value.totalLifted,
        percent: Math.min(100, percent)
      });
    });

    return summaryArray.sort((a,b) => a.mandiName.localeCompare(b.mandiName));
  }, [targetAllocations, paddyLiftedItems]);

  const chartData = useMemo(() => mandiSummary.map(item => ({
    name: item.mandiName,
    Target: Math.round(item.totalTarget),
    Lifted: Math.round(item.totalLifted),
    Efficiency: `${item.percent.toFixed(0)}%`
  })), [mandiSummary]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-xl border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Procurement & Efficiency Analytics
                    </CardTitle>
                    <CardDescription>Target vs. Actual official weight completion.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  layout="vertical" 
                  margin={{ top: 20, right: 80, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 700, fill: 'hsl(var(--primary))' }} 
                    width={100}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Bar dataKey="Target" name="Total Allotted" fill="rgba(0,0,0,0.05)" radius={[0, 6, 6, 0]} barSize={25} />
                  <Bar dataKey="Lifted" name="Actual Lifted" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={25}>
                    <LabelList dataKey="Efficiency" position="right" style={{ fontSize: '11px', fontWeight: '900', fill: 'hsl(var(--primary))' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center italic text-muted-foreground text-sm">No data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/5">
          <CardTitle className="text-lg font-bold text-primary uppercase tracking-widest">Mandi Ledger Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
                <TableRow>
                    <TableHead className="font-bold py-4 pl-6">Mandi Name</TableHead>
                    <TableHead className="text-right font-bold py-4">Target (Qtl)</TableHead>
                    <TableHead className="text-right font-bold py-4">Lifted (Qtl)</TableHead>
                    <TableHead className="text-right font-bold py-4 pr-6">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {mandiSummary.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center h-32 opacity-50">No records found.</TableCell></TableRow>
                )}
                {mandiSummary.map((item) => (
                    <TableRow key={item.mandiName} className="hover:bg-primary/5 transition-colors border-primary/5">
                        <TableCell className="font-bold text-primary pl-6">{item.mandiName}</TableCell>
                        <TableCell className="text-right font-medium">{item.totalTarget.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-medium">{item.totalLifted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right pr-6">
                            <Badge variant="outline" className={`font-black text-[10px] ${item.balance <= 0 ? 'bg-green-500/10 text-green-700 border-green-200' : 'bg-primary/5 text-primary'}`}>
                                {item.balance <= 0 ? 'COMPLETED' : `${item.percent.toFixed(0)}%`}
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
