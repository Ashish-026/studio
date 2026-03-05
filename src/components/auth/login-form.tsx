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
import { Sprout } from 'lucide-react';

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
    return null;
  }

  const handleLoginSubmit = (values: z.infer<typeof formSchema>) => {
    login(values.email, values.password);
  };

  return (
    <Card className="w-full max-w-sm shadow-xl border-none bg-white/95 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
                <Sprout className="h-10 w-10 text-primary" />
            </div>
        </div>
        <CardTitle className="text-3xl font-headline text-primary">Mandi Monitor</CardTitle>
        <CardDescription className="text-muted-foreground/80">
            Professional Rice Mill Management
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
                    <Input placeholder="admin@mill.com" {...field} className="bg-muted/30" />
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
                    <Input type="password" placeholder="••••••••" {...field} className="bg-muted/30" />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02]">
                Log In
            </Button>
        </form>
        </Form>
      </CardContent>
    </Card>
  );
}
