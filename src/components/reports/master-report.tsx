
'use client';

import React, { forwardRef, useMemo } from 'react';
import { useMandiData } from '@/context/mandi-context';
import { useLabourData } from '@/context/labour-context';
import { useVehicleData } from '@/context/vehicle-context';
import { useStockData } from '@/context/stock-context';
import { useMill } from '@/hooks/use-mill';
import { useKmsYear } from '@/hooks/use-kms-year';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(num);
};

export const MasterReport = forwardRef<HTMLDivElement>((props, ref) => {
  const { selectedMill } = useMill();
  const { selectedKmsYear } = useKmsYear();
  const { targetAllocations, paddyLiftedItems, processingHistory, stockReleases } = useMandiData();
  const { labourers } = useLabourData();
  const { vehicles } = useVehicleData();
  const { totalStock, purchases, sales } = useStockData();

  const reportDate = new Date();

  // Filter Physical vs Monetary for Mandi
  const physicalArrivals = useMemo(() => paddyLiftedItems.filter(i => i.entryType === 'physical'), [paddyLiftedItems]);
  const monetaryEntries = useMemo(() => paddyLiftedItems.filter(i => i.entryType === 'monetary'), [paddyLiftedItems]);

  return (
    <div ref={ref} className="p-8 bg-white text-black w-[1000px] mx-auto min-h-screen">
      {/* 1. Header */}
      <div className="text-center mb-10 border-b-4 border-primary pb-6">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-primary">{selectedMill?.name}</h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedMill?.location} • KMS {selectedKmsYear}</p>
        <div className="mt-6 bg-primary text-white py-2 px-8 inline-block rounded-full text-[10px] font-black uppercase tracking-widest">
          Master Operational Report • Generated {format(reportDate, 'dd MMM yyyy, hh:mm a')}
        </div>
      </div>

      {/* 2. Stock Inventory Summary */}
      <section className="mb-12">
        <h2 className="text-xs font-black mb-4 border-l-4 border-primary pl-3 uppercase tracking-widest text-primary/60">Current Stock Inventory</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-black/10 p-4 rounded-2xl text-center bg-primary/5">
            <p className="text-[8px] uppercase text-muted-foreground font-black tracking-widest mb-1">Paddy</p>
            <p className="text-xl font-black text-primary">{formatNumber(totalStock.paddy)} Qtl</p>
          </div>
          <div className="border border-black/10 p-4 rounded-2xl text-center bg-accent/10">
            <p className="text-[8px] uppercase text-muted-foreground font-black tracking-widest mb-1">Rice</p>
            <p className="text-xl font-black text-accent-foreground">{formatNumber(totalStock.rice)} Qtl</p>
          </div>
          <div className="border border-black/10 p-4 rounded-2xl text-center">
            <p className="text-[8px] uppercase text-muted-foreground font-black tracking-widest mb-1">Bran</p>
            <p className="text-xl font-black">{formatNumber(totalStock.bran)} Qtl</p>
          </div>
          <div className="border border-black/10 p-4 rounded-2xl text-center">
            <p className="text-[8px] uppercase text-muted-foreground font-black tracking-widest mb-1">Broken Rice</p>
            <p className="text-xl font-black">{formatNumber(totalStock.brokenRice)} Qtl</p>
          </div>
        </div>
      </section>

      {/* 3. Mandi Targets */}
      <section className="mb-12">
        <h2 className="text-xs font-black mb-4 border-l-4 border-primary pl-3 uppercase tracking-widest text-primary/60">Mandi Allotment Entries</h2>
        <Table className="border border-black/10 rounded-2xl overflow-hidden">
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="text-black font-black uppercase text-[9px]">Date</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Mandi Name</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">ID Number</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Target (Qtl)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targetAllocations.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center italic opacity-40">No entries.</TableCell></TableRow> : 
              targetAllocations.sort((a,b) => b.date.getTime() - a.date.getTime()).map(t => (
                <TableRow key={t.id} className="border-black/5">
                  <TableCell className="text-xs">{format(t.date, 'dd MMM yy')}</TableCell>
                  <TableCell className="text-xs font-bold">{t.mandiName}</TableCell>
                  <TableCell className="text-xs opacity-60">{t.mandiIdNumber || 'N/A'}</TableCell>
                  <TableCell className="text-right text-xs font-black text-primary">{formatNumber(t.target)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </section>

      {/* 4. Mandi Farmer Arrivals */}
      <section className="mb-12">
        <h2 className="text-xs font-black mb-4 border-l-4 border-primary pl-3 uppercase tracking-widest text-primary/60">Mandi Procurement (Farmer Arrivals)</h2>
        <Table className="border border-black/10 rounded-2xl overflow-hidden">
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="text-black font-black uppercase text-[9px]">Date</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Farmer</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Mandi</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Token</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Actual (Qtl)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Official (Qtl)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {physicalArrivals.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center italic opacity-40">No arrivals recorded.</TableCell></TableRow> :
              physicalArrivals.sort((a,b) => b.date.getTime() - a.date.getTime()).map(item => (
                <TableRow key={item.id} className="border-black/5">
                  <TableCell className="text-xs">{format(item.date, 'dd MMM yy')}</TableCell>
                  <TableCell className="text-xs font-bold">{item.farmerName}</TableCell>
                  <TableCell className="text-xs opacity-60">{item.mandiName}</TableCell>
                  <TableCell className="text-xs font-mono">{item.tokenNumber || '-'}</TableCell>
                  <TableCell className="text-right text-xs">{formatNumber(item.totalPaddyReceived)}</TableCell>
                  <TableCell className="text-right text-xs font-black text-primary">{formatNumber(item.mandiWeight)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </section>

      {/* 5. Mandi Processing & Yields */}
      <section className="mb-12">
        <h2 className="text-xs font-black mb-4 border-l-4 border-primary pl-3 uppercase tracking-widest text-primary/60">Mandi Processing History</h2>
        <Table className="border border-black/10 rounded-2xl overflow-hidden">
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="text-black font-black uppercase text-[9px]">Date</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Paddy Used (Qtl)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Rice Yield (Qtl)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Bran (Qtl)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Broken (Qtl)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Yield %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processingHistory.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center italic opacity-40">No records.</TableCell></TableRow> :
              processingHistory.sort((a,b) => b.date.getTime() - a.date.getTime()).map(p => (
                <TableRow key={p.id} className="border-black/5">
                  <TableCell className="text-xs">{format(p.date, 'dd MMM yy')}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{formatNumber(p.paddyUsed)}</TableCell>
                  <TableCell className="text-right text-xs font-black text-primary">{formatNumber(p.riceYield)}</TableCell>
                  <TableCell className="text-right text-xs">{formatNumber(p.branYield)}</TableCell>
                  <TableCell className="text-right text-xs">{formatNumber(p.brokenRiceYield)}</TableCell>
                  <TableCell className="text-right text-xs font-bold text-primary">{p.yieldPercentage.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </section>

      {/* 6. Mandi Rice Supply (Releases) */}
      <section className="mb-12">
        <h2 className="text-xs font-black mb-4 border-l-4 border-primary pl-3 uppercase tracking-widest text-primary/60">Mandi Stock Release (Supply)</h2>
        <Table className="border border-black/10 rounded-2xl overflow-hidden">
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="text-black font-black uppercase text-[9px]">Date</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Lot Number</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Godown / Destination</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Vehicle</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Quantity (Qtl)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockReleases.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center italic opacity-40">No releases.</TableCell></TableRow> :
              stockReleases.sort((a,b) => b.date.getTime() - a.date.getTime()).map(s => (
                <TableRow key={s.id} className="border-black/5">
                  <TableCell className="text-xs">{format(s.date, 'dd MMM yy')}</TableCell>
                  <TableCell className="text-xs font-bold">{s.lotNumber}</TableCell>
                  <TableCell className="text-xs opacity-60">{s.godownDetails}</TableCell>
                  <TableCell className="text-xs uppercase">{s.vehicleNumber || s.vehicleType || '-'}</TableCell>
                  <TableCell className="text-right text-xs font-black text-primary">{formatNumber(s.quantity)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </section>

      {/* 7. Private Purchases */}
      <section className="mb-12">
        <h2 className="text-xs font-black mb-4 border-l-4 border-primary pl-3 uppercase tracking-widest text-primary/60">Private Purchase Registry</h2>
        <Table className="border border-black/10 rounded-2xl overflow-hidden">
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="text-black font-black uppercase text-[9px]">Date</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Farmer / Item</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Quantity (Qtl)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Rate (₹)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Total (₹)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Balance (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center italic opacity-40">No private purchases.</TableCell></TableRow> :
              purchases.sort((a,b) => b.date.getTime() - a.date.getTime()).map(p => (
                <TableRow key={p.id} className="border-black/5">
                  <TableCell className="text-xs">{format(p.date, 'dd MMM yy')}</TableCell>
                  <TableCell className="text-xs">
                    <span className="font-bold">{p.farmerName}</span>
                    <br /><span className="text-[8px] uppercase opacity-50">{p.itemType} {p.isMandiExcess ? '(Excess)' : ''}</span>
                  </TableCell>
                  <TableCell className="text-right text-xs">{formatNumber(p.quantity)}</TableCell>
                  <TableCell className="text-right text-xs opacity-60">{p.rate.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs font-bold">{formatCurrency(p.totalAmount)}</TableCell>
                  <TableCell className={`text-right text-xs font-black ${p.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatCurrency(p.balance)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </section>

      {/* 8. Private Sales */}
      <section className="mb-12">
        <h2 className="text-xs font-black mb-4 border-l-4 border-accent pl-3 uppercase tracking-widest text-accent-foreground/60">Private Sales Registry</h2>
        <Table className="border border-black/10 rounded-2xl overflow-hidden">
          <TableHeader className="bg-accent/5">
            <TableRow>
              <TableHead className="text-black font-black uppercase text-[9px]">Date</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Customer / Item</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Quantity (Qtl)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Rate (₹)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Total (₹)</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Outstanding (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center italic opacity-40">No private sales.</TableCell></TableRow> :
              sales.sort((a,b) => b.date.getTime() - a.date.getTime()).map(s => (
                <TableRow key={s.id} className="border-black/5">
                  <TableCell className="text-xs">{format(s.date, 'dd MMM yy')}</TableCell>
                  <TableCell className="text-xs font-bold">{s.customerName} <br /><span className="text-[8px] uppercase opacity-50">{s.itemType}</span></TableCell>
                  <TableCell className="text-right text-xs">{formatNumber(s.quantity)}</TableCell>
                  <TableCell className="text-right text-xs opacity-60">{s.rate.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-xs font-bold">{formatCurrency(s.totalAmount)}</TableCell>
                  <TableCell className={`text-right text-xs font-black ${s.balance > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>{formatCurrency(s.balance)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </section>

      {/* 9. Labour Ledgers */}
      <section className="mb-12">
        <h2 className="text-xs font-black mb-4 border-l-4 border-primary pl-3 uppercase tracking-widest text-primary/60">Worker Wages & Accounts</h2>
        <Table className="border border-black/10 rounded-2xl overflow-hidden">
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="text-black font-black uppercase text-[9px]">Worker Name</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Total Wages</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Total Paid</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Balance (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labourers.map(l => (
              <TableRow key={l.id} className="border-black/5">
                <TableCell className="text-xs font-bold">{l.name}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(l.totalWages)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(l.totalPaid)}</TableCell>
                <TableCell className={`text-right text-xs font-black ${l.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(l.balance))} {l.balance < 0 ? '(Adv)' : ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* 10. Vehicle Owner Accounts */}
      <section className="mb-12">
        <h2 className="text-xs font-black mb-4 border-l-4 border-primary pl-3 uppercase tracking-widest text-primary/60">Logistics & Agency Accounts</h2>
        <Table className="border border-black/10 rounded-2xl overflow-hidden">
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="text-black font-black uppercase text-[9px]">Owner / Agency</TableHead>
              <TableHead className="text-black font-black uppercase text-[9px]">Vehicle No.</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Total Rent</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Total Paid</TableHead>
              <TableHead className="text-right text-black font-black uppercase text-[9px]">Outstanding (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map(v => (
              <TableRow key={v.id} className="border-black/5">
                <TableCell className="text-xs font-bold">{v.ownerName}</TableCell>
                <TableCell className="text-xs font-mono">{v.vehicleNumber}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(v.totalRent)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(v.totalPaid)}</TableCell>
                <TableCell className="text-right text-xs font-black text-destructive">{formatCurrency(v.balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Footer Signature Block */}
      <div className="mt-20 pt-12 border-t-2 border-primary flex justify-between">
        <div className="text-center">
          <div className="w-48 border-b border-black mb-2"></div>
          <p className="text-[10px] font-black uppercase opacity-40">Prepared By</p>
        </div>
        <div className="text-center">
          <div className="w-48 border-b border-black mb-2"></div>
          <p className="text-[10px] font-black uppercase opacity-40">Authorized Signatory</p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-[8px] text-muted-foreground italic">
          Computer generated report from Mandi Monitor. Data stored locally on device and synced via Master Backup.
        </p>
      </div>
    </div>
  );
});

MasterReport.displayName = 'MasterReport';
