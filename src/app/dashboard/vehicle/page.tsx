import { VehicleDashboard } from '@/components/vehicle/vehicle-dashboard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function VehiclePage() {
  return (
    <div className="container py-8 px-4 md:px-6">
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Vehicle Register</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">Vehicle Register</h1>
        <p className="text-muted-foreground mb-8">
            Manage vehicle details and rent payments.
        </p>
        <VehicleDashboard />
    </div>
    );
}
