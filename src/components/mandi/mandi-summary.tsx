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

    // Aggregate targets
    targetAllocations.forEach(allocation => {
      const entry = summaryMap.get(allocation.mandiName) || { totalTarget: 0, totalLifted: 0, mandiId: allocation.mandiIdNumber || 'N/A' };
      entry.totalTarget += allocation.target;
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
        {/* MERGED PERFORMANCE & EFFICIENCY ANALYTICS */}
        <Card className="shadow-xl border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Procurement & Efficiency Analytics
                    </CardTitle>
                    <CardDescription>Target vs. Actual procurement with completion rates.</CardDescription>
                </div>
                <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary/10" /> Target</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Actual</div>
                </div>
            </div>
          </CardHeader>
          <CardContent className="h-[450px] pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  layout="vertical" 
                  margin={{ top: 20, right: 80, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
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
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} />
                  <Bar dataKey="Target" name="Total Allotted" fill="rgba(0,0,0,0.05)" radius={[0, 6, 6, 0]} barSize={25} />
                  <Bar dataKey="Lifted" name="Actual Lifted" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={25}>
                    <LabelList 
                        dataKey="Efficiency" 
                        position="right" 
                        style={{ fontSize: '11px', fontWeight: '900', fill: 'hsl(var(--primary))', paddingLeft: '10px' }} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center italic text-muted-foreground text-sm">Add Mandi targets to see unified analytics.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/5">
          <CardTitle className="text-lg font-bold text-primary uppercase tracking-widest">Mandi Ledger Summary</CardTitle>
          <CardDescription>Numeric breakdown of official procurement records.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
                <TableRow className="border-none">
                    <TableHead className="font-bold py-4 pl-6">Mandi Name</TableHead>
                    <TableHead className="font-bold py-4">Mandi ID</TableHead>
                    <TableHead className="text-right font-bold py-4">Target (Qtl)</TableHead>
                    <TableHead className="text-right font-bold py-4">Lifted (Qtl)</TableHead>
                    <TableHead className="text-right font-bold py-4 pr-6">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {mandiSummary.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center h-32 opacity-50">No data available.</TableCell></TableRow>
                )}
                {mandiSummary.map((item) => (
                    <TableRow key={item.mandiName} className="hover:bg-primary/5 transition-colors border-primary/5">
                        <TableCell className="font-bold text-primary pl-6">{item.mandiName}</TableCell>
                        <TableCell className="text-xs font-medium opacity-60">{item.mandiId}</TableCell>
                        <TableCell className="text-right font-medium">{item.totalTarget.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-medium">{item.totalLifted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right pr-6">
                            <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className={`font-black text-[10px] h-6 min-w-20 justify-center rounded-lg ${item.balance <= 0 ? 'bg-green-500/10 text-green-700 border-green-200' : 'bg-primary/5 text-primary border-primary/10'}`}>
                                    {item.balance <= 0 ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                                    {item.balance <= 0 ? 'COMPLETED' : `${item.percent.toFixed(0)}% DONE`}
                                </Badge>
                                <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">
                                    Bal: {item.balance.toLocaleString('en-IN', { maximumFractionDigits: 1 })} Qtl
                                </span>
                            </div>
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
