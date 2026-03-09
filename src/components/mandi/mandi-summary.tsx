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
  Cell
} from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Badge } from '../ui/badge';
import { TrendingUp, BarChart3 } from 'lucide-react';

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
  })), [mandiSummary]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRAPHICAL CHART */}
        <Card className="lg:col-span-2 shadow-xl border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Lifting Progress Chart
            </CardTitle>
            <CardDescription>Comparison of Target Allotment vs Actual Procurement</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--primary))' }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} />
                  <Bar dataKey="Target" fill="rgba(0,0,0,0.05)" radius={[6, 6, 0, 0]} barSize={35} />
                  <Bar dataKey="Lifted" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center italic text-muted-foreground text-sm">Add Mandi targets to see visual progress.</div>
            )}
          </CardContent>
        </Card>

        {/* QUICK STATS LIST */}
        <Card className="shadow-xl border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Efficiency List
            </CardTitle>
            <CardDescription>Completion status by Mandi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {mandiSummary.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm italic">No data available.</div>
            ) : mandiSummary.map((item) => (
              <div key={item.mandiName} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-primary">{item.mandiName}</span>
                    <span className="text-[10px] uppercase opacity-50 font-bold">{item.mandiId}</span>
                  </div>
                  <span className="text-sm font-black text-primary">{item.percent.toFixed(1)}%</span>
                </div>
                <Progress value={item.percent} className="h-2 bg-primary/10" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* DETAILED TABLE */}
      <Card className="shadow-xl border-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-primary/5">
          <div className="flex justify-between items-center">
              <div>
                  <CardTitle className="text-lg font-bold text-primary uppercase tracking-widest">Consolidated Mandi Ledger</CardTitle>
                  <CardDescription>Detailed numeric summary of all official records.</CardDescription>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
                <TableRow className="border-none">
                    <TableHead className="font-bold py-4 pl-6">Mandi Name</TableHead>
                    <TableHead className="font-bold py-4">Mandi ID</TableHead>
                    <TableHead className="text-right font-bold py-4">Target (Qtl)</TableHead>
                    <TableHead className="text-right font-bold py-4">Lifted (Qtl)</TableHead>
                    <TableHead className="text-right font-bold py-4 pr-6">Balance (Qtl)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {mandiSummary.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center h-32 opacity-50">No mandi data available.</TableCell></TableRow>
                )}
                {mandiSummary.map((item) => (
                    <TableRow key={item.mandiName} className="hover:bg-primary/5 transition-colors border-primary/5">
                        <TableCell className="font-bold text-primary pl-6">{item.mandiName}</TableCell>
                        <TableCell className="text-xs font-medium opacity-60">{item.mandiId}</TableCell>
                        <TableCell className="text-right font-medium">{item.totalTarget.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-medium">{item.totalLifted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right pr-6">
                            <Badge variant="outline" className={`font-black text-xs h-7 min-w-20 justify-center rounded-lg ${item.balance < 0 ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-green-500/10 text-green-700 border-green-200'}`}>
                                {item.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
