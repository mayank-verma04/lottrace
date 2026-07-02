import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useGetDashboardStats, useGetDashboardActivity } from '@/api/dashboard.api';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetDashboardActivity();

  // Compute mock chart data from activity feed if available
  const chartData = activity?.reduce((acc, event) => {
    const type = event.event_type;
    const existing = acc.find(item => item.name === type);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: type, count: 1 });
    }
    return acc;
  }, []) || [];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        subtitle="Overview of your LotTrace supply chain activities."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Lots" value={stats?.activeLots} loading={statsLoading} />
        <StatCard title="Locations" value={stats?.activeLocations} loading={statsLoading} />
        <StatCard title="Products" value={stats?.activeProducts} loading={statsLoading} />
        <StatCard 
          title="Compliance Gaps" 
          value={stats?.openComplianceGaps} 
          loading={statsLoading} 
          className={stats?.openComplianceGaps > 0 ? "text-red-600" : "text-green-600"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (by Type)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {activityLoading ? (
              <Skeleton className="w-full h-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" className="text-sm capitalize" />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No recent activity.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Events Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activity?.length > 0 ? (
              <div className="space-y-4">
                {activity.map((event) => (
                  <div key={event.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium capitalize">{event.event_type} Event</p>
                      <p className="text-xs text-gray-500">by {event.recordedByName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{format(new Date(event.event_datetime), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-gray-400">{format(new Date(event.event_datetime), 'h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">No recent events.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, className = "" }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className={`text-2xl font-bold ${className}`}>
            {value !== undefined ? value : '-'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
