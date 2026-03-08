'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, User as UserIcon, AlertTriangle, RefreshCcw, Download, Upload, Database, Info, Smartphone, HardDrive, Cpu } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import * as db from '@/lib/db';
import { Badge } from '../ui/badge';

const settingsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const { user, updateCredentials } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, percent: 0 });
  
  useEffect(() => {
    const calculateUsage = async () => {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage || 0) / (1024 * 1024);
        const quotaMB = (estimate.quota || 100 * 1024 * 1024) / (1024 * 1024); 
        
        setStorageUsage({
          used: usedMB,
          percent: Math.min((usedMB / quotaMB) * 100, 100)
        });
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

  function onAdminSubmit(values: z.infer<typeof settingsSchema>) {
    updateCredentials('admin', values.email, values.password);
    adminForm.reset();
  }

  function onUserSubmit(values: z.infer<typeof settingsSchema>) {
    updateCredentials('user', values.email, values.password);
    userForm.reset();
  }

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
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `Mandi_Monitor_Master_Backup_${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Master Backup Created", description: "All database records have been exported." });
  };

  const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        for (const [key, value] of Object.entries(data)) {
          await db.setItem(key, value);
        }

        toast({ title: "Database Restored", description: "Records recovered. Reloading system..." });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast({ variant: "destructive", title: "Restore Failed", description: "Invalid backup file format." });
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    await db.clearAll();
    toast({ title: "System Wiped", description: "All internal records have been deleted." });
    setTimeout(() => window.location.reload(), 1500);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p>Only administrators can access system settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline mb-2 text-primary">System Settings</h1>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
              <Cpu className="h-3 w-3 mr-1" /> Standalone Native Mode
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Smartphone className="h-3 w-3 mr-1" /> High-Capacity Active
            </Badge>
          </div>
          <p className="text-muted-foreground">Manage authentication, high-capacity mobile storage, and master backups.</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="w-full md:w-80 bg-primary/5 border-primary/10 shadow-none cursor-help">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-primary/60 uppercase">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" /> Internal Data Usage
                    </span>
                    <span>{storageUsage.used.toFixed(2)} MB</span>
                  </div>
                  <Progress value={storageUsage.percent} className="h-2 bg-primary/10" />
                  <p className="text-[10px] text-muted-foreground italic text-center flex items-center justify-center gap-1">
                    <Info className="h-2.5 w-2.5" /> Using mobile internal database (IndexedDB).
                  </p>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs p-3">
              <p className="font-bold mb-1">Unlimited Storage Engine</p>
              <p>The app is now utilizing your phone's <strong>Internal Database (IndexedDB)</strong> instead of temporary browser memory. This allows for millions of bag weight entries without capacity errors.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle>Device Storage Management</CardTitle>
            </div>
            <CardDescription>Industrial-grade storage tools for large-scale mill operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your data is stored in a <strong>Standalone Sandbox</strong>. It uses your device's actual storage capacity, ensuring 100% offline access and speed.
              </p>
              <ul className="text-[11px] space-y-1 list-disc pl-4 text-muted-foreground">
                <li><strong>No Limits:</strong> Store thousands of farmers and millions of weights.</li>
                <li><strong>Safe Mode:</strong> Data is device-specific. Use backups to move data to new phones.</li>
                <li><strong>Total Privacy:</strong> No data ever leaves this phone unless you export it.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase opacity-60">Export</p>
                    <Button onClick={handleBackupData} variant="outline" className="w-full bg-white hover:bg-primary/5 rounded-xl border-primary/20 h-12">
                        <Download className="mr-2 h-4 w-4" />
                        Download Backup
                    </Button>
                </div>
                
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase opacity-60">Import</p>
                    <input type="file" ref={fileInputRef} onChange={handleRestoreData} accept=".json" className="hidden" />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full bg-white hover:bg-primary/5 rounded-xl border-primary/20 h-12">
                        <Upload className="mr-2 h-4 w-4" />
                        Load Records
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Danger Zone</CardTitle>
            </div>
            <CardDescription>Permanent actions that clear internal memory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wiping the database will remove all Mandi, Private, and Labour history from this device permanently.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full rounded-xl h-12">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Clear Mobile Database
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-none">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Local Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear every single record from this phone. Ensure you have a backup if you need this data later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                    Wipe Database
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-sm border-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Admin Credentials</CardTitle>
            </div>
            <CardDescription>Update the master administrator login details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...adminForm}>
              <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                <FormField control={adminForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>New Email</FormLabel><FormControl><Input placeholder="admin@mill.com" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={adminForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={adminForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-12">Update Admin Details</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              <CardTitle>Staff Credentials</CardTitle>
            </div>
            <CardDescription>Update the login for regular staff users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                <FormField control={userForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>New Email</FormLabel><FormControl><Input placeholder="user@mill.com" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={userForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={userForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} className="rounded-xl h-12" /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full rounded-xl h-12">Update Staff Details</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
