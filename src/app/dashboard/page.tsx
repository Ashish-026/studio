import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building, Tractor, Users, Car, Warehouse } from 'lucide-react';

const registers = [
  {
    title: 'Mandi Register',
    description: 'Manage official state civil supplies corporation data.',
    href: '/dashboard/mandi',
    icon: <Tractor className="h-8 w-8 text-primary" />,
    enabled: true,
  },
  {
    title: 'Labour Register',
    description: 'Maintain records for labour and related activities.',
    href: '/dashboard/labour',
    icon: <Users className="h-8 w-8 text-primary" />,
    enabled: true,
  },
  {
    title: 'Vehicle Register',
    description: 'Manage vehicle details and rent payments.',
    href: '/dashboard/vehicle',
    icon: <Car className="h-8 w-8 text-primary" />,
    enabled: true,
  },
  {
    title: 'Stock Register',
    description: 'Manage purchases, sales, processing, and view stock.',
    href: '/dashboard/stock',
    icon: <Warehouse className="h-8 w-8 text-primary" />,
    enabled: true,
  }
];

export default function DashboardPage() {
  return (
    <div className="container py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Select a register to view or manage data.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {registers.map((register) => (
          <Card key={register.title} className={`flex flex-col ${!register.enabled ? 'bg-muted/50' : 'hover:border-primary/50 transition-colors'}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-2">
                <CardTitle className="text-xl font-semibold">{register.title}</CardTitle>
                <CardDescription>{register.description}</CardDescription>
              </div>
              {register.icon}
            </CardHeader>
            <CardContent className="flex-grow flex items-end">
              <Button asChild variant="default" disabled={!register.enabled} className={`w-full ${register.enabled ? 'bg-primary' : ''}`}>
                <Link href={register.href}>
                  {register.enabled ? 'Open Register' : 'Coming Soon'}
                  {register.enabled && <ArrowRight className="ml-2 h-4 w-4" />}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
