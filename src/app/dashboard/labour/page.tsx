import { LabourDashboard } from '@/components/labour/labour-dashboard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function LabourPage() {
  return (
    <div className="container py-8 px-4 md:px-6">
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Labour Register</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">Labour Register</h1>
        <p className="text-muted-foreground mb-8">
            Manage records for labour and related activities.
        </p>
        <LabourDashboard />
    </div>
    );
}
