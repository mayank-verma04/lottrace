import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ClipboardList } from 'lucide-react';

import { useCreateEvent, useGetAttachmentUploadUrl, useAddAttachment } from '@/api/events.api';
import { useGetLocations } from '@/api/locations.api';
import { useGetLots } from '@/api/lots.api';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const CTE_TYPES = [
  { value: 'creation', label: 'Creation' },
  { value: 'receiving', label: 'Receiving' },
  { value: 'transformation', label: 'Transformation' },
  { value: 'shipping', label: 'Shipping' },
];

const SHOWS_INPUTS = ['receiving', 'transformation', 'shipping'];
const SHOWS_OUTPUTS = ['creation', 'receiving', 'transformation'];

const emptyLotRow = () => ({ lotId: '', quantity: 1, uom: 'kg' });

export default function RecordEventPage() {
  const navigate = useNavigate();
  const { mutateAsync: createEvent, isPending } = useCreateEvent();

  // Fetch enough lots/locations so dropdowns are fully populated
  const { data: locationsData } = useGetLocations({ limit: 100 });
  const { data: lotsData } = useGetLots({ limit: 100 });

  const [formData, setFormData] = useState({
    eventType: 'receiving',
    locationId: '',
    eventDatetime: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);

  const setSelect = (field) => (val) =>
    setFormData((prev) => ({ ...prev, [field]: val }));
  const setInput = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const updateRow = (setter) => (index, field, value) => {
    setter((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: field === 'quantity' ? Number(value) : value,
      };
      return next;
    });
  };

  const removeRow = (setter) => (index) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const updateInput = updateRow(setInputs);
  const updateOutput = updateRow(setOutputs);
  const removeInput = removeRow(setInputs);
  const removeOutput = removeRow(setOutputs);

  const { mutateAsync: getUploadUrl } = useGetAttachmentUploadUrl();
  const { mutateAsync: addAttachment } = useAddAttachment();

  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        eventDatetime: new Date(formData.eventDatetime).toISOString(),
        source: 'manual',
        kdePayload: {},
        inputs: inputs.filter((i) => i.lotId),
        outputs: outputs.filter((o) => o.lotId),
      };
      
      const res = await createEvent(payload);
      const eventId = res.data.data.id;

      if (files.length > 0) {
        for (const file of files) {
          const urlRes = await getUploadUrl({ eventId, payload: { filename: file.name, contentType: file.type } });
          const { uploadUrl, key } = urlRes.data.data;
          
          await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });

          await addAttachment({
            eventId,
            payload: { key, filename: file.name, contentType: file.type, sizeBytes: file.size }
          });
        }
      }

      toast.success('Event recorded successfully');
      navigate('/events');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record event');
    }
  };

  // API returns camelCase keys
  const lots = lotsData?.data ?? [];
  const locations = locationsData?.data ?? [];

  const LotRows = ({ items, updateFn, removeFn, addFn, title }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addFn}>
          <Plus data-icon="inline-start" />
          Add Lot
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">No lots added yet.</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 items-end">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Label className="text-xs text-muted-foreground">Lot</Label>
              <Select
                value={item.lotId}
                onValueChange={(val) => updateFn(i, 'lotId', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lot…" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={String(lot.id)}>
                      {lot.traceabilityLotCode}
                      {lot.productName ? ` — ${lot.productName}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 w-24 shrink-0">
              <Label className="text-xs text-muted-foreground">Qty</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateFn(i, 'quantity', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5 w-20 shrink-0">
              <Label className="text-xs text-muted-foreground">UOM</Label>
              <Input
                value={item.uom}
                onChange={(e) => updateFn(i, 'uom', e.target.value)}
                placeholder="kg"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive shrink-0 mb-0.5"
              onClick={() => removeFn(i)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Record Event"
        subtitle="Capture a Critical Tracking Event (CTE) for FSMA 204 compliance"
        action={
          <Button type="submit" form="record-event-form" disabled={isPending}>
            <ClipboardList data-icon="inline-start" />
            {isPending ? 'Saving…' : 'Save Event'}
          </Button>
        }
      />

      <form id="record-event-form" onSubmit={onSubmit} className="flex flex-col gap-6">
        {/* Core details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={setSelect('eventType')}
                >
                  <SelectTrigger id="eventType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CTE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="locationId">Location *</Label>
                <Select
                  value={formData.locationId}
                  onValueChange={setSelect('locationId')}
                >
                  <SelectTrigger id="locationId">
                    <SelectValue placeholder="Select location…" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eventDatetime">Date &amp; Time *</Label>
                <Input
                  id="eventDatetime"
                  type="datetime-local"
                  value={formData.eventDatetime}
                  onChange={setInput('eventDatetime')}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input lots */}
        {SHOWS_INPUTS.includes(formData.eventType) && (
          <LotRows
            items={inputs}
            updateFn={updateInput}
            removeFn={removeInput}
            addFn={() => setInputs((prev) => [...prev, emptyLotRow()])}
            title="Input Lots"
          />
        )}

        {/* Output lots */}
        {SHOWS_OUTPUTS.includes(formData.eventType) && (
          <LotRows
            items={outputs}
            updateFn={updateOutput}
            removeFn={removeOutput}
            addFn={() => setOutputs((prev) => [...prev, emptyLotRow()])}
            title="Output Lots"
          />
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={setInput('notes')}
              placeholder="Optional notes or context for this event"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="file"
              multiple
              onChange={handleFileChange}
              className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {files.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                {files.length} file(s) selected
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending} className="min-w-32">
            {isPending ? 'Saving…' : 'Save Event'}
          </Button>
        </div>
      </form>
    </div>
  );
}
