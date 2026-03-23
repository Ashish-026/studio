
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, User as UserIcon, AlertTriangle, RefreshCcw, Download, Upload, Info, Smartphone, HardDrive, Cpu, CloudOff, Eye, Key, Merge, Share2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import * as db from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const mergeArraysById = (oldArr: any[], newArr: any[]): any[] => {
  const map = new Map();
  (oldArr || []).forEach(item => { if(item && item.id) map.set(item.id, item); });
  
  (newArr || []).forEach(newItem => {
    if (!newItem || !newItem.id) return;
    if (!map.has(newItem.id)) {
      map.set(newItem.id, newItem);
    } else {
      const existingItem = map.get(newItem.id);
      const mergedItem = { ...existingItem, ...newItem };
      ['workEntries', 'payments', 'trips', 'purchases', 'sales'].forEach(subKey => {
        if (Array.isArray(existingItem[subKey]) && Array.isArray(newItem[subKey])) {
          mergedItem[subKey] = mergeArraysById(existingItem[subKey], newItem[subKey]);
        }
      });
      map.set(newItem.id, mergedItem);
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
};

const settingsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SettingsView() {
  const { user, updateCredentials, credentials } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, percent: 0 });
  const [showPasswords, setShowPasswords] = useState(false);
  
  useEffect(() => {
    const calculateUsage = async () => {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage || 0) / (1024 * 1024);
        const quotaMB = (estimate.quota || 100 * 1024 * 1024) / (1024 * 1024); 
        setStorageUsage({ used: usedMB, percent: Math.min((usedMB / quotaMB) * 100, 100) });
      }
    };
    calculateUsage();
  }, []);

  const adminForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const userForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const handleBackupData = async () => {
    const data: Record<string, any> = {};
    const keys = [
      'mandi-monitor-credentials-v2',
      'mandi-monitor-mill',
      'mandi-monitor-kms-year',
      'mandi-monitor-targets-v2',
      'mandi-monitor-lifting-v2',
      'mandi-monitor-releases-v2',
      'mandi-monitor-labour-v2',
      'mandi-monitor-vehicles-v2',
      'mandi-monitor-purchases',
      'mandi-monitor-sales',
      'mandi-monitor-processing',
      'mandi-monitor-mandi-proc',
      'mandi-monitor-transfers'
    ];
    for (const key of keys) {
      const val = await db.getItem(key);
      if (val) data[key] = val;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mandi_Master_Sync_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Sync File Created", description: "Share this file to other devices to sync data." });
  };

  const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        for (const [key, newValue] of Object.entries(importedData)) {
          if (key === 'mandi-monitor-credentials-v2') continue;
          const existingValue = await db.getItem<any>(key);
          if (Array.isArray(newValue)) {
            const merged = mergeArraysById(existingValue || [], newValue);
            await db.setItem(key, merged);
          } else {
            await db.setItem(key, newValue);
          }
        }
        toast({ title: "Sync Successful", description: "Records merged with your local database.", className: "bg-green-50 border-green-200" });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast({ variant: "destructive", title: "Sync Failed", description: "Invalid sync file." });
      }
    };
    reader.readAsText(file);
  };

  if (user?.role !== 'admin') return <div className="py-8 text-center text-destructive font-bold">Administrator Access Only</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline mb-2 text-primary">System Dashboard</h1>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200"><Cpu className="h-3 w-3 mr-1" /> Standalone Native</Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200"><CloudOff className="h-3 w-3 mr-1" /> 100% Server Independent</Badge>
          </div>
          <p className="text-muted-foreground">Local storage management and cross-device synchronization.</p>
        </div>
        <Card className="w-full md:w-80 bg-primary/5 border-primary/10 shadow-none">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-primary/60 uppercase">
              <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> Device Storage Used</span>
              <span>{storageUsage.used.toFixed(2)} MB</span>
            </div>
            <Progress value={storageUsage.percent} className="h-2 bg-primary/10" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 shadow-xl rounded-3xl overflow-hidden bg-primary/5">
        <CardHeader className="bg-white/80 border-b border-primary/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-2xl"><Share2 className="h-6 w-6 text-primary" /></div>
            <div>
              <CardTitle className="text-xl font-black text-primary uppercase tracking-tighter">Multi-Device Data Exchange</CardTitle>
              <CardDescription>Share your database across multiple phones or laptops.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm h-full">
                <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-3">1</div>
                <p className="text-sm font-bold text-primary mb-1">Export from Device A</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Click "Download Sync File" below. This captures all current records into a single file.</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm h-full">
                <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-3">2</div>
                <p className="text-sm font-bold text-primary mb-1">Transfer the File</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">Send the .json file to Device B via WhatsApp, Email, or USB Drive.</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-white p-4 rounded-2xl border border-primary/10 shadow-sm h-full">
                <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-3">3</div>
                <p className="text-sm font-bold text-primary mb-1">Merge into Device B</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">On Device B, click "Import & Merge". The app will combine both databases automatically.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button onClick={handleBackupData} size="lg" className="h-16 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
              <Download className="mr-3 h-6 w-6" /> Download Sync File
            </Button>
            <div>
              <input type="file" ref={fileInputRef} onChange={handleRestoreData} accept=".json" className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} size="lg" variant="outline" className="w-full h-16 rounded-2xl bg-white border-primary/20 text-primary font-bold text-lg shadow-xl hover:bg-primary/5 hover:scale-[1.02] transition-transform">
                <Upload className="mr-3 h-6 w-6" /> Import & Merge Records
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-accent/30 bg-accent/5 shadow-md rounded-3xl">
          <CardHeader>
            <div className="flex items-center gap-2"><Key className="h-5 w-5 text-accent-foreground" /><CardTitle>Access Summary</CardTitle></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-accent/10 space-y-2">
              <p className="text-[10px] font-bold opacity-50 uppercase">Admin: {credentials.admin.email}</p>
              <p className="text-[10px] font-bold opacity-50 uppercase">Staff: {credentials.user.email}</p>
              <Button variant="ghost" size="sm" onClick={() => setShowPasswords(!showPasswords)} className="h-7 text-[10px] p-0 font-black uppercase text-accent-foreground">
                {showPasswords ? 'Hide Secret Keys' : 'Reveal Secret Keys'}
              </Button>
              {showPasswords && (
                <div className="pt-2 text-xs font-mono">
                  <p>Admin Pwd: {credentials.admin.password}</p>
                  <p>Staff Pwd: {credentials.user.password}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5 rounded-3xl">
          <CardHeader><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /><CardTitle>Danger Zone</CardTitle></div></CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" className="w-full rounded-2xl h-14 font-bold shadow-lg shadow-destructive/20">Wipe Internal Memory</Button></AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl border-none">
                <AlertDialogHeader><AlertDialogTitle>Confirm System Wipe?</AlertDialogTitle><AlertDialogDescription>This clears everything from this device. Download a sync file first!</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => { await db.clearAll(); window.location.reload(); }} className="bg-destructive hover:bg-destructive/90 rounded-xl">Wipe Database</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
