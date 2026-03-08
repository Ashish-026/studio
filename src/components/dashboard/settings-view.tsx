'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, User as UserIcon, AlertTriangle, RefreshCcw, Download, Upload, FileJson, Database } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect } from 'react';
import { Progress } from '../ui/progress';

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
    const calculateUsage = () => {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += (localStorage[key].length * 2); // Approximate bytes (UTF-16)
        }
      }
      const mbUsed = total / (1024 * 1024);
      const limit = 5; // Standard 5MB limit for safety
      setStorageUsage({
        used: mbUsed,
        percent: Math.min((mbUsed / limit) * 100, 100)
      });
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

  const handleBackupData = () => {
    const data: Record<string, string> = {};
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
    
    keys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) data[key] = val;
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `Mandi_Monitor_Backup_${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Backup Created",
      description: "Your mill records have been saved to your device.",
    });
  };

  const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value as string);
        });

        toast({
          title: "Restore Successful",
          description: "All records have been recovered. Reloading system...",
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Restore Failed",
          description: "This file is not a valid Mandi Monitor backup.",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    const keysToKeep = ['mandi-monitor-credentials-v2', 'mandi-monitor-mill', 'mandi-monitor-kms-year'];
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    toast({
      title: "Data Cleared",
      description: "All register records have been wiped. The app will now reload.",
    });

    setTimeout(() => {
      window.location.reload();
    }, 1500);
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
          <p className="text-muted-foreground">Manage authentication, data backups, and system security.</p>
        </div>
        <Card className="w-full md:w-72 bg-primary/5 border-primary/10 shadow-none">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-primary/60 uppercase">
              <span className="flex items-center gap-1"><Database className="h-3 w-3" /> Storage Usage</span>
              <span>{storageUsage.used.toFixed(2)} MB / 5 MB</span>
            </div>
            <Progress value={storageUsage.percent} className="h-2 bg-primary/10" />
            <p className="text-[10px] text-muted-foreground italic text-center">You can store ~10,000 procurement entries.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              <CardTitle>Data Portability</CardTitle>
            </div>
            <CardDescription>Move your mill data between devices without a server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
              <p className="text-sm font-medium">Export Records</p>
              <p className="text-xs text-muted-foreground">Download a secure JSON file containing every entry from your registers.</p>
              <Button onClick={handleBackupData} variant="outline" className="w-full bg-white hover:bg-primary/5 rounded-xl border-primary/20">
                <Download className="mr-2 h-4 w-4" />
                Backup to Local File
              </Button>
            </div>
            
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
              <p className="text-sm font-medium">Import Records</p>
              <p className="text-xs text-muted-foreground">Restore data from a previously saved backup file.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleRestoreData} 
                accept=".json" 
                className="hidden" 
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full bg-white hover:bg-primary/5 rounded-xl border-primary/20">
                <Upload className="mr-2 h-4 w-4" />
                Restore from Backup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>Permanent actions that cannot be undone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clearing records will remove all data from your Mandi, Labour, Stock, and Vehicle registers permanently from this device.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full rounded-xl">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Wipe System Database
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-none">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete all entries across all registers. Ensure you have a Backup File before proceeding.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllData} className="bg-destructive hover:bg-destructive/90 rounded-xl">
                    Yes, Wipe Everything
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
                  <FormItem><FormLabel>New Email</FormLabel><FormControl><Input placeholder="admin@mill.com" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={adminForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={adminForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">Update Admin Details</Button>
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
                  <FormItem><FormLabel>New Email</FormLabel><FormControl><Input placeholder="user@mill.com" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={userForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={userForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full rounded-xl">Update Staff Details</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
