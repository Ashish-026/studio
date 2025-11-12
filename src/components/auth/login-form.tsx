'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Tractor } from 'lucide-react';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });
  
  useEffect(() => {
    if (!loading && user) {
      router.replace('/select-mill');
    }
  }, [user, loading, router]);
  
  if (loading || user) {
    return null; // Or a loading spinner
  }

  const handleLoginSubmit = (values: z.infer<typeof formSchema>) => {
    login(values.email, values.password);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
            <Tractor className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Mandi Monitor</CardTitle>
        <CardDescription>
            Sign in to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input placeholder="admin@example.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="password" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                Log In
            </Button>
        </form>
        </Form>
      </CardContent>
    </Card>
  );
}
