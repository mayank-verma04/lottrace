import { useParams, Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Network, Box, MapPin, Package, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

import { useGetSimulation } from '@/api/recall.api';
import { PageHeader } from '@/components/common/PageHeader';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecallSimulationDetailPage() {
  const { id } = useParams();
  const { data: sim, isLoading } = useGetSimulation(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!sim) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Simulation not found</h2>
        <Button variant="link" asChild className="mt-4">
          <Link to="/recall">Back to Simulations</Link>
        </Button>
      </div>
    );
  }

  const { result_summary } = sim;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="link" asChild className="p-0 h-auto mb-4 text-muted-foreground">
          <Link to="/recall">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Simulations
          </Link>
        </Button>
        <PageHeader
          title={sim.name}
          description={`Run on ${format(new Date(sim.run_at), 'PPP at p')}`}
          icon={AlertTriangle}
          action={
            <Button asChild>
              <Link to={`/trace?lotId=${sim.triggering_lot_id}`}>
                <Network className="w-4 h-4 mr-2" />
                View Full Trace Tree
              </Link>
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-success-600" />
              Simulation Results
            </CardTitle>
            <CardDescription>
              Summary of impact identified by the trace engine
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sim.status === 'running' ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Trace engine is calculating impact...</p>
              </div>
            ) : sim.status === 'failed' ? (
              <div className="text-center py-8 text-destructive">
                <AlertTriangle className="w-8 h-8 mx-auto mb-4 opacity-50" />
                <p>Simulation failed to complete.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium text-muted-foreground">
                    <Box className="w-4 h-4 mr-2" />
                    Affected Lots
                  </div>
                  <div className="text-3xl font-bold">{result_summary?.affectedLots || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    Locations
                  </div>
                  <div className="text-3xl font-bold">{result_summary?.affectedLocations || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium text-muted-foreground">
                    <Package className="w-4 h-4 mr-2" />
                    Products
                  </div>
                  <div className="text-3xl font-bold">{result_summary?.affectedProducts || 0}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium text-muted-foreground">
                    <Network className="w-4 h-4 mr-2" />
                    Max Depth
                  </div>
                  <div className="text-3xl font-bold">{result_summary?.hops || 0} <span className="text-base font-normal text-muted-foreground">hops</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Status</span>
              <Badge variant={sim.status === 'complete' ? 'success' : sim.status === 'running' ? 'warning' : 'destructive'}>
                {sim.status === 'complete' ? 'Complete' : sim.status === 'running' ? 'Running' : 'Failed'}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground block mb-1">Run Date</span>
              <div className="font-medium">{format(new Date(sim.run_at), 'PPP')}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
