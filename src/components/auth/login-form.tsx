'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { Factory as MillIcon } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginForm() {
  const { login, user, loading } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });
  
  // NOTE: Redirection is now handled by the parent AppController state, 
  // not by router.push, to prevent 404 errors on server-independent devices.
  
  if (loading || user) {
    return null;
  }

  const handleLoginSubmit = (values: z.infer<typeof formSchema>) => {
    login(values.email, values.password);
  };

  return (
    <Card className="w-full max-w-sm shadow-2xl border-none bg-white/95 backdrop-blur-md">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/10 p-4 rounded-3xl">
                <MillIcon className="h-12 w-12 text-primary" />
            </div>
        </div>
        <CardTitle className="text-4xl font-headline text-primary">Mandi Monitor</CardTitle>
        <CardDescription className="text-muted-foreground font-medium text-base">
            Professional Mill Management
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
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                    <Input placeholder="admin@mill.com" {...field} className="bg-muted/30 h-12 rounded-xl" />
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
                    <Input type="password" placeholder="••••••••" {...field} className="bg-muted/30 h-12 rounded-xl" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-8 text-xl rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95">
                Log In
            </Button>
        </form>
        </Form>
      </CardContent>
    </Card>
  );
}
