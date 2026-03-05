'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Tractor, Users, Car, Warehouse, FileText, Download } from 'lucide-react';
import { downloadPdf } from '@/lib/pdf-utils';
import { useMill } from '@/hooks/use-mill';
import { useKmsYear } from '@/hooks/use-kms-year';

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
  const { selectedMill } = useMill();
  const { selectedKmsYear } = useKmsYear();

  const handleDownloadMasterReport = () => {
    const fileName = `Master_Report_${selectedMill?.name || 'Mill'}_KMS_${selectedKmsYear || 'Year'}`;
    downloadPdf('master-report-pdf', fileName);
  };

  return (
    <div className="container py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Select a register to view or manage data.</p>
        </div>
        <Button 
          variant="outline" 
          size="lg" 
          className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-semibold"
          onClick={handleDownloadMasterReport}
        >
          <FileText className="mr-2 h-5 w-5" />
          Download Master Report (PDF)
          <Download className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {registers.map((register) => (
          <Card key={register.title} className={`flex flex-col ${!register.enabled ? 'bg-muted/50' : 'hover:border-primary/50 transition-colors shadow-sm'}`}>
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
