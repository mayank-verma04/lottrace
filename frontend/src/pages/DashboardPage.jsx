import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        subtitle="Overview of your LotTrace supply chain activities."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Lots</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Coming soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Coming soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
