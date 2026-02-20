export const BUSINESS_HOURS_START_MINUTES = 9 * 60; // 09:00
export const BUSINESS_HOURS_END_MINUTES = 18 * 60; // 18:00
export const EXTRA_TIME_FEE_RUB = 3000;

export function parseTimeToMinutes(dateTimeOrTime?: string | null): number | null {
  if (!dateTimeOrTime) return null;

  const timePart = dateTimeOrTime.trim().split(' ').pop() || '';
  const match = timePart.match(/^(\d{1,2})[:.](\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

export function isOutsideBusinessHours(minutes: number): boolean {
  return (
    minutes < BUSINESS_HOURS_START_MINUTES ||
    minutes > BUSINESS_HOURS_END_MINUTES
  );
}

export function hasExtraTimeFee(
  startDateTime?: string | null,
  endDateTime?: string | null
): boolean {
  const startMinutes = parseTimeToMinutes(startDateTime);
  const endMinutes = parseTimeToMinutes(endDateTime);

  if (startMinutes === null || endMinutes === null) {
    return false;
  }

  return (
    isOutsideBusinessHours(startMinutes) || isOutsideBusinessHours(endMinutes)
  );
}
