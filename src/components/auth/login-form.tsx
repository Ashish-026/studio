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

const usernameSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

const otpSchema = z.object({
    otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

export function LoginForm() {
  const { login, verifyOtp, user, loading, authStep, currentUsername, resetAuthStep } = useAuth();
  const router = useRouter();

  const usernameForm = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);
  
  if (loading || user) {
    return null; // Or a loading spinner
  }

  const handleUsernameSubmit = (values: z.infer<typeof usernameSchema>) => {
    login(values);
  };

  const handleOtpSubmit = (values: z.infer<typeof otpSchema>) => {
    verifyOtp(values.otp);
  };

  const handleBack = () => {
    resetAuthStep();
    usernameForm.reset();
    otpForm.reset();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
            <Tractor className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-headline">Mandi Monitor</CardTitle>
        <CardDescription>
            {authStep === 'otp' ? `Enter the OTP sent for ${currentUsername}` : 'Enter your credentials to access your dashboard'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authStep === 'credentials' && (
            <Form {...usernameForm}>
            <form onSubmit={usernameForm.handleSubmit(handleUsernameSubmit)} className="space-y-6">
                <FormField
                control={usernameForm.control}
                name="username"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                        <Input placeholder="admin or user" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                Request OTP
                </Button>
            </form>
            </Form>
        )}

        {authStep === 'otp' && (
            <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
                    <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>One-Time Password</FormLabel>
                            <FormControl>
                                <Input type="text" placeholder="123456" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex flex-col space-y-2">
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                            Log In
                        </Button>
                        <Button type="button" variant="outline" className="w-full" onClick={handleBack}>
                            Back
                        </Button>
                    </div>
                </form>
            </Form>
        )}

      </CardContent>
    </Card>
  );
}
