import { StockDashboard } from '@/components/stock/stock-dashboard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function StockPage() {
  return (
    <div className="container py-8 px-4 md:px-6">
        <Breadcrumb className="mb-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Stock Register</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-2">Stock Register</h1>
        <p className="text-muted-foreground mb-8">
            View a summary of available stock from all sources.
        </p>
        <StockDashboard />
    </div>
    );
}
