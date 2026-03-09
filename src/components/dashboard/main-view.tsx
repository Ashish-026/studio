'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Tractor, Users, Car, Warehouse, FileText, Download, Briefcase, TrendingUp, Wallet, Package, Scale } from 'lucide-react';
import { downloadPdf } from '@/lib/pdf-utils';
import { useMill } from '@/hooks/use-mill';
import { useKmsYear } from '@/hooks/use-kms-year';
import { useMandiData } from '@/context/mandi-context';
import { useStockData } from '@/context/stock-context';
import { useLabourData } from '@/context/labour-context';
import { useVehicleData } from '@/context/vehicle-context';
import type { ViewState } from '@/app/page';
import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Badge } from '../ui/badge';

interface DashboardPageProps {
  onNavigate: (view: ViewState) => void;
}

const registers = [
  {
    title: 'Mandi Register',
    id: 'mandi' as ViewState,
    description: 'Official state targets & physical lifting.',
    icon: <Tractor className="h-6 w-6 text-primary" />,
    enabled: true,
  },
  {
    title: 'Private Register',
    id: 'private' as ViewState,
    description: 'Farmer purchases & private sales.',
    icon: <Briefcase className="h-6 w-6 text-primary" />,
    enabled: true,
  },
  {
    title: 'Stock Register',
    id: 'stock' as ViewState,
    description: 'Inventory summary & processing yields.',
    icon: <Warehouse className="h-6 w-6 text-primary" />,
    enabled: true,
  },
  {
    title: 'Labour Register',
    id: 'labour' as ViewState,
    description: 'Worker accounts & wage payments.',
    icon: <Users className="h-6 w-6 text-primary" />,
    enabled: true,
  },
  {
    title: 'Vehicle Register',
    id: 'vehicle' as ViewState,
    description: 'Agencies, trips, and rent status.',
    icon: <Car className="h-6 w-6 text-primary" />,
    enabled: true,
  }
];

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { selectedMill } = useMill();
  const { selectedKmsYear } = useKmsYear();
  
  // Data for Charts
  const { targetAllocations, paddyLiftedItems } = useMandiData();
  const { totalStock, purchases, sales } = useStockData();
  const { labourers } = useLabourData();
  const { vehicles } = useVehicleData();

  const handleDownloadMasterReport = () => {
    const fileName = `Master_Report_${selectedMill?.name || 'Mill'}_KMS_${selectedKmsYear || 'Year'}`;
    downloadPdf('master-report-pdf', fileName);
  };

  // Logic: Mandi Progress Chart Data
  const mandiChartData = useMemo(() => {
    const map = new Map<string, { target: number; lifted: number }>();
    targetAllocations.forEach(t => {
      const existing = map.get(t.mandiName) || { target: 0, lifted: 0 };
      existing.target += t.target;
      map.set(t.mandiName, existing);
    });
    paddyLiftedItems.forEach(l => {
      const existing = map.get(l.mandiName) || { target: 0, lifted: 0 };
      existing.lifted += l.totalPaddyReceived;
      map.set(l.mandiName, existing);
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      target: Math.round(data.target),
      lifted: Math.round(data.lifted)
    })).slice(0, 5); // Only show top 5 for clarity
  }, [targetAllocations, paddyLiftedItems]);

  // Logic: Stock Pie Data
  const stockChartData = useMemo(() => [
    { name: 'Paddy', value: Math.max(0, totalStock.paddy), color: 'hsl(var(--primary))' },
    { name: 'Rice', value: Math.max(0, totalStock.rice), color: 'hsl(var(--accent))' },
    { name: 'Byproducts', value: Math.max(0, totalStock.bran + totalStock.brokenRice), color: 'hsl(var(--muted-foreground))' },
  ], [totalStock]);

  // Logic: Financial Pulse
  const financialData = useMemo(() => {
    const farmerPayable = purchases.reduce((acc, p) => acc + p.balance, 0);
    const labourPayable = labourers.reduce((acc, l) => acc + l.balance, 0);
    const vehiclePayable = vehicles.reduce((acc, v) => acc + v.balance, 0);
    const totalReceivable = sales.reduce((acc, s) => acc + s.balance, 0);
    
    return [
      { name: 'Payables', amount: Math.round(farmerPayable + labourPayable + vehiclePayable), color: '#ef4444' },
      { name: 'Receivables', amount: Math.round(totalReceivable), color: '#22c55e' }
    ];
  }, [purchases, labourers, vehicles, sales]);

  const formatCurrency = (num: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline mb-1 text-primary">Operational Command</h1>
          <p className="text-muted-foreground font-medium">{selectedMill?.name} • KMS {selectedKmsYear}</p>
        </div>
        <Button 
          variant="outline" 
          size="lg" 
          className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-semibold rounded-xl"
          onClick={handleDownloadMasterReport}
        >
          <FileText className="mr-2 h-5 w-5" />
          Master Report (PDF)
          <Download className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* GRAPHIC OVERALL VIEW */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Mandi Progress Bar Chart */}
        <Card className="shadow-xl shadow-primary/5 border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Mandi Targets vs Lifting
            </CardTitle>
            <CardDescription>Performance across active mandis (Qtl)</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] pt-4">
            {mandiChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mandiChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  />
                  <Bar dataKey="target" name="Target" fill="rgba(0,0,0,0.05)" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="lifted" name="Lifted" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center italic text-muted-foreground text-sm">No targets registered yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Stock Distribution Donut */}
        <Card className="shadow-xl shadow-primary/5 border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Inventory Mix
            </CardTitle>
            <CardDescription>Current commodity distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] flex items-center justify-center">
            {totalStock.paddy + totalStock.rice > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stockChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center italic text-muted-foreground text-sm">Inventory is empty.</div>
            )}
          </CardContent>
        </Card>

        {/* Financial Pulse */}
        <Card className="shadow-xl shadow-primary/5 border-primary/5 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Financial Pulse
            </CardTitle>
            <CardDescription>Balance status summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {financialData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold opacity-60 uppercase tracking-tighter">{item.name}</span>
                  <span className="text-lg font-black" style={{ color: item.color }}>{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-out" 
                    style={{ 
                      width: `${Math.min(100, (item.amount / (Math.max(financialData[0].amount, financialData[1].amount) || 1)) * 100)}%`,
                      backgroundColor: item.color 
                    }} 
                  />
                </div>
              </div>
            ))}
            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-primary opacity-40" />
                  <span className="text-xs font-bold opacity-60">NET POSITION</span>
                </div>
                <span className="font-black text-primary">
                  {formatCurrency(financialData[1].amount - financialData[0].amount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QUICK NAVIGATION ICONS */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 px-1">Navigation Registers</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {registers.map((register) => (
            <Card 
              key={register.id} 
              className="group cursor-pointer hover:shadow-lg hover:ring-1 hover:ring-primary/20 transition-all rounded-2xl border-none shadow-md bg-white overflow-hidden active:scale-95"
              onClick={() => onNavigate(register.id)}
            >
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/5 group-hover:bg-primary/10 transition-colors text-primary">
                  {register.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-primary">{register.title}</h3>
                  <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{register.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
