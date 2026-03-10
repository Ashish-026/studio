'use client';

import React, { forwardRef } from 'react';
import type { PaddyLifted } from '@/lib/types';
import { format, isValid } from 'date-fns';
import { Separator } from '../ui/separator';

interface PaddyLiftingSlipProps {
  entry: PaddyLifted;
  millName: string;
  millLocation: string;
}

export const PaddyLiftingSlip = forwardRef<HTMLDivElement, PaddyLiftingSlipProps>(({ entry, millName, millLocation }, ref) => {
  const formattedDate = isValid(entry.date) ? format(entry.date, 'dd MMM yyyy, hh:mm a') : 'N/A';

  return (
    <div ref={ref} className="p-8 bg-white text-black w-[800px] mx-auto min-h-[1000px] border">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black uppercase tracking-widest text-primary">{millName}</h1>
        <p className="text-xs uppercase font-bold text-muted-foreground">{millLocation}</p>
        <div className="mt-4 flex justify-between items-center bg-muted/20 p-2 border-y-2 border-black/10">
          <p className="text-xs font-bold">PROCUREMENT SLIP</p>
          <p className="text-xs font-mono">RECORD ID: #{entry.id.slice(-6)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
        <div className="space-y-2">
          <p><span className="font-bold opacity-60">FARMER:</span> <span className="font-black text-lg">{entry.farmerName}</span></p>
          <p><span className="font-bold opacity-60">MANDI SOURCE:</span> <span className="font-bold">{entry.mandiName}</span></p>
          <p><span className="font-bold opacity-60">DATE:</span> <span className="font-bold">{formattedDate}</span></p>
        </div>
        <div className="space-y-2 text-right">
          <p><span className="font-bold opacity-60">TOKEN NO:</span> <span className="font-bold">{entry.tokenNumber || 'N/A'}</span></p>
          <p><span className="font-bold opacity-60">VEHICLE:</span> <span className="font-bold uppercase">{entry.vehicleNumber || entry.vehicleType || 'N/A'}</span></p>
        </div>
      </div>

      <Separator className="bg-black/20 mb-6" />

      {entry.individualBagWeights && entry.individualBagWeights.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase mb-4 opacity-60 tracking-widest">Individual Bag Weights (KG)</h3>
          <div className="grid grid-cols-8 gap-2">
            {entry.individualBagWeights.map((w, i) => (
              <div key={i} className="border p-1 text-center">
                <p className="text-[8px] opacity-40 leading-none mb-1">{i + 1}</p>
                <p className="text-xs font-bold">{parseFloat(String(w)).toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center border-2 border-dashed border-muted rounded-xl mb-8">
          <p className="text-xs text-muted-foreground italic">No individual bag weights recorded.</p>
        </div>
      )}

      <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/10">
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold opacity-60 uppercase tracking-tighter">Gross Actual Weight:</span>
              <span className="font-bold">{(parseFloat(String(entry.totalPaddyReceived || 0)) * 100).toLocaleString()} KG</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold opacity-60 uppercase tracking-tighter">Mandi Standard Wt:</span>
              <span className="font-bold">{(parseFloat(String(entry.mandiWeight || 0)) * 100).toLocaleString()} KG</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Total Official Quantity</p>
            <p className="text-4xl font-black text-primary">{parseFloat(String(entry.mandiWeight || 0)).toFixed(2)} <span className="text-sm opacity-60">QTL</span></p>
          </div>
        </div>
      </div>

      <div className="mt-32 grid grid-cols-2 gap-20">
        <div className="text-center border-t border-black pt-2"><p className="text-[10px] font-bold uppercase">Farmer Signature</p></div>
        <div className="text-center border-t border-black pt-2"><p className="text-[10px] font-bold uppercase">For {millName}</p></div>
      </div>
    </div>
  );
});

PaddyLiftingSlip.displayName = 'PaddyLiftingSlip';
