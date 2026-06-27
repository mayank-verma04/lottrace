import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Plus, Search, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useGetLots, useCreateLot } from '@/api/lots.api';
import { useGetProducts } from '@/api/products.api';
import { usePermissions } from '@/hooks/usePermissions';

import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

const createSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  traceabilityLotCode: z.string().min(1, 'Lot code is required'),
  quantity: z.coerce.number().positive('Must be positive'),
  uom: z.string().min(1, 'Unit of measure is required'),
  notes: z.string().optional(),
});

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

const LotsListPage = () => {
  const [params, setParams] = useState({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const { can } = usePermissions();

  const queryParams = { ...params, ...(search && { search }) };
  const { data, isLoading, isError, refetch } = useGetLots(queryParams);
  const { data: productsData } = useGetProducts({ limit: 100, isActive: 'true' });
  const createMutation = useCreateLot();

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: { productId: '', traceabilityLotCode: '', quantity: '', uom: '', notes: '' },
  });

  const selectedProductId = watch('productId');

  const onProductChange = (val) => {
    setValue('productId', val);
    const prod = productsData?.data?.find(p => p.id === val);
    if (prod && prod.default_uom) {
      setValue('uom', prod.default_uom);
    }
  };

  const onCreateSubmit = (formData) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        setCreateOpen(false);
        reset();
      },
    });
  };

  const columns = [
    {
      accessorKey: 'traceability_lot_code',
      header: 'Lot Code',
      cell: ({ row }) => (
        <Link 
          to={`/lots/${row.original.id}`} 
          className="font-medium text-primary hover:underline flex items-center gap-2"
        >
          <Layers className="h-4 w-4 text-muted-foreground" />
          {row.original.traceability_lot_code}
        </Link>
      ),
    },
    {
      accessorKey: 'product_name',
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.original.product_name}</span>
          {row.original.product_sku && (
            <span className="text-xs text-muted-foreground">SKU: {row.original.product_sku}</span>
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Package}
        title="Failed to load lots"
        description="Something went wrong. Please try again."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const lots = data?.data || [];
  const pagination = data?.pagination;
  const products = productsData?.data || [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lots"
        subtitle="Manage inventory lots and traceability codes"
        action={
          can('events.create') && ( // using events.create since it implies operator
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Lot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Lot</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onCreateSubmit)} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="productId">Product *</Label>
                    <Select value={selectedProductId} onValueChange={onProductChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="traceabilityLotCode">Traceability Lot Code *</Label>
                    <Input id="traceabilityLotCode" {...register('traceabilityLotCode')} placeholder="e.g. LOT-2024-001" />
                    {errors.traceabilityLotCode && <p className="text-sm text-destructive">{errors.traceabilityLotCode.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input id="quantity" type="number" step="any" {...register('quantity')} />
                      {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="uom">Unit of Measure *</Label>
                      <Input id="uom" {...register('uom')} />
                      {errors.uom && <p className="text-sm text-destructive">{errors.uom.message}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" {...register('notes')} placeholder="Optional context" rows={3} />
                    {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lot code or product..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setParams(p => ({ ...p, page: 1 })); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Data */}
      {!lots.length ? (
        <EmptyState
          icon={Layers}
          title="No lots found"
          description="Lots represent specific batches of products in your supply chain."
          action={
            can('events.create') && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Lot
              </Button>
            )
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={lots}
          pagination={pagination}
          onPaginationChange={setParams}
        />
      )}
    </div>
  );
};

export default LotsListPage;
