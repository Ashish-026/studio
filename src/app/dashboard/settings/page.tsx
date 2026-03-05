'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ShieldCheck, User as UserIcon } from 'lucide-react';

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

  if (user?.role !== 'admin') {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p>Only administrators can change login credentials.</p>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 md:px-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">Account Settings</h1>
      <p className="text-muted-foreground mb-8">Update the login email and password for the system.</p>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
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
                  <FormItem><FormLabel>New Email</FormLabel><FormControl><Input placeholder="admin@mill.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={adminForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={adminForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Update Admin Details</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
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
                  <FormItem><FormLabel>New Email</FormLabel><FormControl><Input placeholder="user@mill.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={userForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={userForm.control} name="confirmPassword" render={({ field }) => (
                  <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full">Update Staff Details</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
