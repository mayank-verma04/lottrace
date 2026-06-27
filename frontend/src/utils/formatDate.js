import { format, formatDistance } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export const formatEventDate = (isoString, timezone = 'UTC') => {
  if (!isoString) return 'N/A';
  const zoned = toZonedTime(new Date(isoString), timezone);
  return format(zoned, 'MMM d, yyyy h:mm a zzz');
};

export const timeAgo = (isoString) => {
  if (!isoString) return '';
  return formatDistance(new Date(isoString), new Date(), { addSuffix: true });
};

export const formatQuantity = (quantity, uom) => {
  return `${Number(quantity).toLocaleString()} ${uom}`;
};
