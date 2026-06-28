import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, ArrowLeft, MoreVertical, Edit2, Ban, History, Package } from 'lucide-react';

import { useGetLot, useUpdateLot, useVoidLot } from '@/api/lots.api';
import { useGetEvents } from '@/api/events.api';
import { usePermissions } from '@/hooks/usePermissions';

import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { formatEventDate } from '@/utils/formatDate';

const updateSchema = z.object({
  quantity: z.coerce.number().positive('Must be positive').optional(),
  notes: z.string().optional().nullable(),
});

const voidSchema = z.object({
  voidReason: z.string().min(1, 'Reason is required'),
});

const getStatusBadge = (status) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>;
    case 'recalled':
      return <Badge variant="destructive">Recalled</Badge>;
    case 'void':
      return <Badge variant="secondary">Void</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const LotDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: lot, isLoading: isLotLoading, isError: isLotError } = useGetLot(id);
  const { data: eventsData, isLoading: isEventsLoading } = useGetEvents({ lotId: id, limit: 100 });
  const updateMutation = useUpdateLot();
  const voidMutation = useVoidLot();

  const [editOpen, setEditOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm({
    resolver: zodResolver(updateSchema),
  });

  const { register: registerVoid, handleSubmit: handleVoidSubmit, reset: resetVoid, formState: { errors: voidErrors } } = useForm({
    resolver: zodResolver(voidSchema),
    defaultValues: { voidReason: '' },
  });

  const onEditOpen = () => {
    resetEdit({ quantity: lot.quantity, notes: lot.notes || '' });
    setEditOpen(true);
  };

  const onEdit = (data) => {
    updateMutation.mutate({ lotId: id, data }, {
      onSuccess: () => setEditOpen(false),
    });
  };

  const onVoid = (data) => {
    voidMutation.mutate({ lotId: id, voidReason: data.voidReason }, {
      onSuccess: () => setVoidOpen(false),
    });
  };

  if (isLotLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-48 col-span-2" />
          <Skeleton className="h-48 col-span-1" />
        </div>
      </div>
    );
  }

  if (isLotError || !lot) {
    return (
      <EmptyState
        icon={Layers}
        title="Lot not found"
        description="The lot you're looking for doesn't exist or you don't have access."
        action={<Button onClick={() => navigate('/lots')}>Back to Lots</Button>}
      />
    );
  }

  const isVoid = lot.status === 'void';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/lots')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={lot.traceabilityLotCode}
          subtitle={`Product: ${lot.productName}`}
          action={
            <div className="flex items-center gap-3">
              {getStatusBadge(lot.status)}
              
              {can('events.create') && !isVoid && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEditOpen}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Details
                    </DropdownMenuItem>
                    {can('org_admin') && (
                      <DropdownMenuItem onClick={() => setVoidOpen(true)} className="text-destructive focus:text-destructive">
                        <Ban className="h-4 w-4 mr-2" />
                        Void Lot
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lot Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Product</dt>
                  <dd className="font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <Link to={`/products/${lot.productId}`} className="text-primary hover:underline">
                      {lot.productName}
                    </Link>
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Quantity</dt>
                  <dd className="font-medium">{Number(lot.quantity).toLocaleString()} {lot.uom}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Traceability Lot Code (TLC)</dt>
                  <dd className="font-mono text-xs bg-muted p-1 rounded w-fit">{lot.traceabilityLotCode}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground">Created At</dt>
                  <dd className="font-medium">{new Date(lot.createdAt).toLocaleString()}</dd>
                </div>
                {isVoid && lot.voidReason && (
                  <div className="flex flex-col gap-1 sm:col-span-2 mt-2 p-3 bg-destructive/10 rounded-md border border-destructive/20 text-destructive">
                    <dt className="font-semibold flex items-center gap-1">
                      <Ban className="h-3 w-3" /> Voided Reason
                    </dt>
                    <dd>{lot.voidReason}</dd>
                  </div>
                )}
                {lot.notes && (
                  <div className="flex flex-col gap-1 sm:col-span-2 pt-2">
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="whitespace-pre-wrap">{lot.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Event Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                Event Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEventsLoading ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : eventsData?.data?.length > 0 ? (
                <div className="relative border-l-2 border-muted ml-3 space-y-6">
                  {eventsData.data.map((event, index) => (
                    <div key={event.id} className="relative pl-6">
                      <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-background ${event.status === 'void' ? 'bg-destructive' : 'bg-primary'}`} />
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <Link to={`/events/${event.id}`} className="font-semibold text-primary hover:underline capitalize">
                            {event.event_type} Event
                          </Link>
                          {event.status === 'void' && (
                            <Badge variant="destructive" className="ml-2 text-[10px] h-4">VOID</Badge>
                          )}
                          <p className="text-sm text-muted-foreground mt-0.5">
                            at {event.location_name}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground sm:text-right">
                          <p>{formatEventDate(event.event_datetime)}</p>
                          <p className="text-xs">by {event.recorded_by_name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-md">
                  <p>No events recorded for this lot.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lot</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEdit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" step="any" {...registerEdit('quantity')} />
              {editErrors.quantity && <p className="text-sm text-destructive">{editErrors.quantity.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...registerEdit('notes')} rows={4} />
              {editErrors.notes && <p className="text-sm text-destructive">{editErrors.notes.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Void Lot
            </DialogTitle>
            <DialogDescription>
              This will mark the lot as voided. It cannot be used in future events. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVoidSubmit(onVoid)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="voidReason">Reason for voiding *</Label>
              <Textarea id="voidReason" {...registerVoid('voidReason')} placeholder="e.g. Entered by mistake" required />
              {voidErrors.voidReason && <p className="text-sm text-destructive">{voidErrors.voidReason.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVoidOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={voidMutation.isPending}>
                {voidMutation.isPending ? 'Voiding...' : 'Void Lot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LotDetailPage;
