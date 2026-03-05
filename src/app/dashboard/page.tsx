'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Tractor, Users, Car, Warehouse, FileText, Download, Briefcase } from 'lucide-react';
import { downloadPdf } from '@/lib/pdf-utils';
import { useMill } from '@/hooks/use-mill';
import { useKmsYear } from '@/hooks/use-kms-year';

const registers = [
  {
    title: 'Mandi Register',
    description: 'Manage official state civil supplies corporation targets and lifting.',
    href: '/dashboard/mandi',
    icon: <Tractor className="h-8 w-8 text-primary" />,
    enabled: true,
  },
  {
    title: 'Private Register',
    description: 'Manage paddy and rice commerce with private farmers and customers.',
    href: '/dashboard/private',
    icon: <Briefcase className="h-8 w-8 text-primary" />,
    enabled: true,
  },
  {
    title: 'Stock Register',
    description: 'View total inventory summary and record processing yields.',
    href: '/dashboard/stock',
    icon: <Warehouse className="h-8 w-8 text-primary" />,
    enabled: true,
  },
  {
    title: 'Labour Register',
    description: 'Maintain accounts, work history, and payments for workers.',
    href: '/dashboard/labour',
    icon: <Users className="h-8 w-8 text-primary" />,
    enabled: true,
  },
  {
    title: 'Vehicle Register',
    description: 'Manage transport agencies, vehicle trips, and rent status.',
    href: '/dashboard/vehicle',
    icon: <Car className="h-8 w-8 text-primary" />,
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
          <h1 className="text-3xl font-bold tracking-tight font-headline mb-2 text-primary">Dashboard</h1>
          <p className="text-muted-foreground text-lg">Operational Command Center for {selectedMill?.name}</p>
        </div>
        <Button 
          variant="outline" 
          size="lg" 
          className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary font-semibold rounded-xl"
          onClick={handleDownloadMasterReport}
        >
          <FileText className="mr-2 h-5 w-5" />
          Download Master Report (PDF)
          <Download className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {registers.map((register) => (
          <Card key={register.title} className={`flex flex-col border-none shadow-md ${!register.enabled ? 'bg-muted/50' : 'hover:shadow-lg hover:ring-1 hover:ring-primary/20 transition-all group'}`}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-2">
                <CardTitle className="text-xl font-bold font-headline group-hover:text-primary transition-colors">{register.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{register.description}</CardDescription>
              </div>
              <div className="bg-primary/5 p-3 rounded-2xl group-hover:bg-primary/10 transition-colors">
                {register.icon}
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-end pt-4">
              <Button asChild variant="default" disabled={!register.enabled} className={`w-full py-6 rounded-xl font-semibold ${register.enabled ? 'bg-primary shadow-sm hover:shadow-md' : ''}`}>
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
