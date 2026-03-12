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
  const { targetAllocations, paddyLiftedItems } = useMandiData();
  const { labourers } = useLabourData();
  const { vehicles } = useVehicleData();
  const { totalStock } = useStockData();

  const reportDate = new Date();

  // CONSOLIDATION LOGIC for Mandi Section: Prevents repeated entries in PDF
  const consolidatedMandis = useMemo(() => {
    const summaryMap = new Map<string, { totalTarget: number; totalLifted: number; mandiId: string }>();

    // Aggregate targets
    (targetAllocations || []).forEach(allocation => {
      const entry = summaryMap.get(allocation.mandiName) || { totalTarget: 0, totalLifted: 0, mandiId: allocation.mandiIdNumber || 'N/A' };
      entry.totalTarget += (Number(allocation.target) || 0);
      if (allocation.mandiIdNumber && (entry.mandiId === 'N/A' || !entry.mandiId)) {
        entry.mandiId = allocation.mandiIdNumber;
      }
      summaryMap.set(allocation.mandiName, entry);
    });

    // Aggregate lifted paddy using Official weight (mandiWeight)
    (paddyLiftedItems || []).forEach(item => {
      const entry = summaryMap.get(item.mandiName) || { totalTarget: 0, totalLifted: 0, mandiId: 'N/A' };
      entry.totalLifted += (Number(item.mandiWeight) || 0);
      summaryMap.set(item.mandiName, entry);
    });

    return Array.from(summaryMap.entries()).map(([name, data]) => ({
      mandiName: name,
      ...data,
      balance: data.totalTarget - data.totalLifted
    })).sort((a, b) => a.mandiName.localeCompare(b.mandiName));
  }, [targetAllocations, paddyLiftedItems]);

  return (
    <div ref={ref} className="p-8 bg-white text-black w-[1000px] mx-auto min-h-screen">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-primary pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-widest text-primary">Mandi Monitor - Master Operational Report</h1>
        <div className="mt-4 grid grid-cols-2 text-left text-sm gap-2">
          <p><span className="font-bold">Mill Name:</span> {selectedMill?.name}</p>
          <p className="text-right"><span className="font-bold">KMS Year:</span> {selectedKmsYear}</p>
          <p><span className="font-bold">Location:</span> {selectedMill?.location}</p>
          <p className="text-right"><span className="font-bold">Generated On:</span> {format(reportDate, 'dd MMM yyyy, hh:mm a')}</p>
        </div>
      </div>

      {/* 1. Mandi Register Summary */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 border-l-4 border-primary pl-2 bg-muted/30 py-1">1. Mandi Register Summary (Consolidated)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mandi Name</TableHead>
              <TableHead>Mandi ID</TableHead>
              <TableHead className="text-right">Total Target (Qtl)</TableHead>
              <TableHead className="text-right">Total Lifted (Qtl)</TableHead>
              <TableHead className="text-right">Balance (Qtl)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consolidatedMandis.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center h-20">No Mandi records found.</TableCell></TableRow>
            ) : (
              consolidatedMandis.map(m => (
                <TableRow key={m.mandiName}>
                  <TableCell className="font-medium">{m.mandiName}</TableCell>
                  <TableCell>{m.mandiId}</TableCell>
                  <TableCell className="text-right">{formatNumber(m.totalTarget)}</TableCell>
                  <TableCell className="text-right">{formatNumber(m.totalLifted)}</TableCell>
                  <TableCell className="text-right font-bold">{formatNumber(m.balance)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {/* 2. Stock Inventory */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 border-l-4 border-primary pl-2 bg-muted/30 py-1">2. Current Stock Inventory (All Sources)</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="border p-4 rounded-lg text-center">
            <p className="text-xs uppercase text-muted-foreground font-bold">Paddy</p>
            <p className="text-lg font-bold">{formatNumber(totalStock.paddy)} Qtl</p>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <p className="text-xs uppercase text-muted-foreground font-bold">Rice</p>
            <p className="text-lg font-bold">{formatNumber(totalStock.rice)} Qtl</p>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <p className="text-xs uppercase text-muted-foreground font-bold">Bran</p>
            <p className="text-lg font-bold">{formatNumber(totalStock.bran)} Qtl</p>
          </div>
          <div className="border p-4 rounded-lg text-center">
            <p className="text-xs uppercase text-muted-foreground font-bold">Broken Rice</p>
            <p className="text-lg font-bold">{formatNumber(totalStock.brokenRice)} Qtl</p>
          </div>
        </div>
      </section>

      {/* 3. Labour Accounts */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 border-l-4 border-primary pl-2 bg-muted/30 py-1">3. Labour Account Statements</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker Name</TableHead>
              <TableHead className="text-right">Total Wages</TableHead>
              <TableHead className="text-right">Total Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {labourers.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center h-20">No Labour records found.</TableCell></TableRow>
            ) : (
              labourers.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(l.totalWages)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(l.totalPaid)}</TableCell>
                  <TableCell className={`text-right font-bold ${l.balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {formatCurrency(l.balance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {/* 4. Vehicle & Logistics */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 border-l-4 border-primary pl-2 bg-muted/30 py-1">4. Vehicle Owner Statements</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Owner / Agency</TableHead>
              <TableHead>Vehicle No.</TableHead>
              <TableHead className="text-right">Total Rent</TableHead>
              <TableHead className="text-right">Total Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center h-20">No Vehicle records found.</TableCell></TableRow>
            ) : (
              vehicles.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.ownerName}</TableCell>
                  <TableCell>{v.vehicleNumber}</TableCell>
                  <TableCell className="text-right">{formatCurrency(v.totalRent)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(v.totalPaid)}</TableCell>
                  <TableCell className="text-right font-bold text-destructive">{formatCurrency(v.balance)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      {/* Footer */}
      <div className="mt-20 pt-4 border-t border-gray-200 text-xs text-center text-gray-400 italic">
        This is a computer-generated master report from the Mandi Monitor management system. Data is stored locally on the operational device.
      </div>
    </div>
  );
});

MasterReport.displayName = 'MasterReport';
