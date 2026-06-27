import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Search,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  AlertTriangle,
  Layers,
  Package,
  Zap,
} from 'lucide-react';

import { useGetLots } from '@/api/lots.api';
import { useForwardTrace, useBackwardTrace, useFullTrace } from '@/api/trace.api';

import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const DIRECTION_OPTIONS = [
  { value: 'full', label: 'Full Trace', icon: ArrowLeftRight },
  { value: 'forward', label: 'Forward', icon: ArrowRight },
  { value: 'backward', label: 'Backward', icon: ArrowLeft },
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'active':
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
    case 'recalled':
      return <Badge variant="destructive">Recalled</Badge>;
    case 'void':
      return <Badge variant="secondary">Void</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const TracePage = () => {
  const [selectedLotId, setSelectedLotId] = useState('');
  const [direction, setDirection] = useState('full');
  const [lotSearch, setLotSearch] = useState('');

  // Fetch lots for the selector
  const { data: lotsData, isLoading: lotsLoading } = useGetLots({ limit: 100, ...(lotSearch && { search: lotSearch }) });
  const lots = lotsData?.data || [];

  // Trace queries — enabled only when lot is selected
  const forwardQuery = useForwardTrace(direction === 'forward' || direction === 'full' ? selectedLotId : null);
  const backwardQuery = useBackwardTrace(direction === 'backward' || direction === 'full' ? selectedLotId : null);
  const fullQuery = useFullTrace(direction === 'full' ? selectedLotId : null);

  // Pick the active result based on direction
  const getActiveQuery = () => {
    if (direction === 'full') return fullQuery;
    if (direction === 'forward') return forwardQuery;
    return backwardQuery;
  };

  const activeQuery = getActiveQuery();
  const traceData = activeQuery.data?.data;
  const isTracing = activeQuery.isLoading;
  const traceError = activeQuery.isError;

  // Table columns for trace results
  const columns = [
    {
      accessorKey: 'traceabilityLotCode',
      header: 'Lot Code',
      cell: ({ row }) => (
        <Link
          to={`/lots/${row.original.id}`}
          className="font-medium text-primary hover:underline flex items-center gap-2"
        >
          <Layers className="h-4 w-4 text-muted-foreground" />
          {row.original.traceabilityLotCode}
          {row.original.isStart && (
            <Badge variant="outline" className="text-xs ml-1">Start</Badge>
          )}
        </Link>
      ),
    },
    {
      accessorKey: 'productName',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.productName || '—'}</span>
          {row.original.productSku && (
            <span className="text-xs text-muted-foreground">SKU: {row.original.productSku}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => (
        <span className="text-sm">
          {Number(row.original.quantity).toLocaleString()} {row.original.uom}
        </span>
      ),
    },
    {
      accessorKey: 'hop',
      header: 'Hop',
      cell: ({ row }) => (
        <Badge variant="secondary" className="font-mono text-xs">
          {row.original.hop}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'actions',
      header: '',
      cell: ({ row }) => {
        if (row.original.isStart) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedLotId(row.original.id);
            }}
            className="text-xs"
          >
            <GitBranch className="h-3 w-3 mr-1" />
            Trace
          </Button>
        );
      },
    },
  ];

  // Find selected lot label
  const selectedLot = lots.find((l) => l.id === selectedLotId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trace"
        subtitle="Track any lot forward or backward through your supply chain"
      />

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            Trace Query
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Lot selector */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Select Lot</label>
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lot to trace…" />
                </SelectTrigger>
                <SelectContent>
                  {/* Search filter inside the content */}
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="Search lots..."
                      value={lotSearch}
                      onChange={(e) => setLotSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  {lotsLoading && (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">Loading lots…</div>
                  )}
                  {!lotsLoading && lots.length === 0 && (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">No lots found</div>
                  )}
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.traceabilityLotCode}
                      {lot.productName ? ` — ${lot.productName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Direction selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Direction</label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No lot selected */}
      {!selectedLotId && (
        <EmptyState
          icon={GitBranch}
          title="Select a lot to begin"
          description="Choose a lot from the dropdown above to trace its path through the supply chain."
        />
      )}

      {/* Loading */}
      {selectedLotId && isTracing && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      )}

      {/* Error */}
      {selectedLotId && traceError && (
        <EmptyState
          icon={AlertTriangle}
          title="Trace failed"
          description="Something went wrong running the trace. Please try again."
          action={<Button onClick={() => activeQuery.refetch()}>Retry</Button>}
        />
      )}

      {/* Results */}
      {selectedLotId && !isTracing && !traceError && traceData && (
        <div className="flex flex-col gap-4">
          {/* Summary bar */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {selectedLot?.traceabilityLotCode || traceData.startLot?.traceabilityLotCode}
              </span>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              {traceData.nodes?.length || 0} lots traced
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              {traceData.hops || 0} hops deep
            </div>
            {traceData.cached && (
              <>
                <Separator orientation="vertical" className="h-5" />
                <Badge variant="outline" className="text-xs">Cached</Badge>
              </>
            )}
          </div>

          {/* Truncation warning */}
          {traceData.truncated && (
            <div className="flex items-center gap-2 p-3 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Trace truncated at 50 hops. The full supply chain may extend further.
            </div>
          )}

          {/* Tabs: Table / Tree */}
          <Tabs defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="tree">Tree</TabsTrigger>
            </TabsList>

            <TabsContent value="table">
              {traceData.nodes?.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={traceData.nodes}
                />
              ) : (
                <EmptyState
                  icon={GitBranch}
                  title="No connected lots"
                  description="This lot has no linked events in the selected direction."
                />
              )}
            </TabsContent>

            <TabsContent value="tree">
              <Card>
                <CardContent className="pt-6">
                  <TraceTree
                    nodes={traceData.nodes || []}
                    edges={traceData.edges || []}
                    direction={direction}
                    onSelectLot={(lotId) => setSelectedLotId(lotId)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

/**
 * Visual tree representation of trace chain.
 * Groups lots by hop level, connects with event type labels.
 */
const TraceTree = ({ nodes, edges, direction, onSelectLot }) => {
  if (!nodes || nodes.length === 0) {
    return (
      <EmptyState
        icon={GitBranch}
        title="No connected lots"
        description="This lot has no linked events in the selected direction."
      />
    );
  }

  // Group nodes by hop
  const hopGroups = {};
  nodes.forEach((node) => {
    const hop = node.hop ?? 0;
    if (!hopGroups[hop]) hopGroups[hop] = [];
    hopGroups[hop].push(node);
  });

  const sortedHops = Object.keys(hopGroups)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-6">
      {sortedHops.map((hop, hopIdx) => (
        <div key={hop}>
          {/* Hop level label */}
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="font-mono text-xs">
              Hop {hop}
            </Badge>
            {hop === 0 && (
              <span className="text-xs text-muted-foreground">Starting point</span>
            )}
          </div>

          {/* Lot cards at this hop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hopGroups[hop].map((node) => (
              <div
                key={node.id}
                className={`relative rounded-lg border p-3 transition-colors ${
                  node.isStart
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <Link
                      to={`/lots/${node.id}`}
                      className="text-sm font-medium text-primary hover:underline truncate"
                    >
                      {node.traceabilityLotCode}
                    </Link>
                    <span className="text-xs text-muted-foreground truncate">
                      {node.productName || 'Unknown product'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Number(node.quantity).toLocaleString()} {node.uom}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {getStatusBadge(node.status)}
                    {!node.isStart && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => onSelectLot(node.id)}
                      >
                        <GitBranch className="h-3 w-3 mr-1" />
                        Trace
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Connector arrow between hops */}
          {hopIdx < sortedHops.length - 1 && (
            <div className="flex justify-center py-2">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <div className="w-px h-4 bg-border" />
                <ArrowRight className="h-4 w-4 rotate-90" />
                <div className="w-px h-4 bg-border" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TracePage;
