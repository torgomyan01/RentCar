export const DEFAULT_DAILY_INCLUDED_MILEAGE = 200;
export const DEFAULT_EXTRA_MILEAGE_PRICE_RUB = 15;

export function parseMileageInput(value?: string | null): number {
  if (!value) return 0;
  const digits = String(value).replace(/[^\d]/g, '');
  const parsed = Number(digits);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

export function getIncludedMileageLimit(
  rentalDays: number,
  dailyLimit?: number | null
): number {
  const normalizedDays =
    Number.isFinite(rentalDays) && rentalDays > 0 ? Math.floor(rentalDays) : 0;
  const perDay =
    typeof dailyLimit === 'number' && Number.isFinite(dailyLimit) && dailyLimit > 0
      ? dailyLimit
      : DEFAULT_DAILY_INCLUDED_MILEAGE;
  return normalizedDays * perDay;
}

export function getExtraMileageKm(
  requestedMileage: number,
  includedMileageLimit: number
): number {
  const requested =
    Number.isFinite(requestedMileage) && requestedMileage > 0
      ? Math.floor(requestedMileage)
      : 0;
  const included =
    Number.isFinite(includedMileageLimit) && includedMileageLimit > 0
      ? Math.floor(includedMileageLimit)
      : 0;
  return Math.max(0, requested - included);
}

export function getExtraMileageFee(
  extraMileageKm: number,
  pricePerKm?: number | null
): number {
  const km =
    Number.isFinite(extraMileageKm) && extraMileageKm > 0
      ? Math.floor(extraMileageKm)
      : 0;
  const rate =
    typeof pricePerKm === 'number' && Number.isFinite(pricePerKm) && pricePerKm > 0
      ? pricePerKm
      : DEFAULT_EXTRA_MILEAGE_PRICE_RUB;
  return km * rate;
}
