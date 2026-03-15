import { TaskLocationDetails } from '../firebase/types';

export const formatHours = (value: number, fractionDigits = 1): string => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const rounded = Number(value.toFixed(fractionDigits));
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return rounded
    .toFixed(fractionDigits)
    .replace(/\.0+$/, '')
    .replace(/(\.\d*[1-9])0+$/, '$1');
};

export const normalizeHoursInput = (value: string): string => {
  const sanitized = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const firstDotIndex = sanitized.indexOf('.');

  if (firstDotIndex === -1) {
    return sanitized;
  }

  return `${sanitized.slice(0, firstDotIndex + 1)}${sanitized.slice(firstDotIndex + 1).replace(/\./g, '')}`;
};

export const parseHoursInput = (value: string): number => {
  const normalized = normalizeHoursInput(value).trim();
  return normalized ? Number(normalized) : Number.NaN;
};

export const sanitizePhoneNumber = (value: string): string => value.replace(/\D/g, '').slice(0, 10);

export const formatLocationDetails = (details?: TaskLocationDetails | null): string | null => {
  if (!details) {
    return null;
  }

  const parts = [details.street, details.streetNumber, details.city]
    .map((part) => part?.trim())
    .filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return details.formatted?.trim() || null;
};

export const formatReverseGeocodedLocation = (details?: {
  street?: string | null;
  streetNumber?: string | null;
  city?: string | null;
  district?: string | null;
  subregion?: string | null;
  region?: string | null;
  name?: string | null;
  formattedAddress?: string | null;
} | null): string | null => {
  if (!details) {
    return null;
  }

  const street = details.street?.trim() || details.name?.trim() || undefined;
  const streetNumber = details.streetNumber?.trim() || undefined;
  const city = details.city?.trim() || details.district?.trim() || details.subregion?.trim() || details.region?.trim() || undefined;

  return formatLocationDetails({
    street,
    streetNumber,
    city,
    formatted: details.formattedAddress?.trim() || undefined,
  });
};