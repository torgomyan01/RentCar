export const BUSINESS_HOURS_START_MINUTES = 9 * 60; // 09:00
export const BUSINESS_HOURS_END_MINUTES = 18 * 60; // 18:00
export const EXTRA_TIME_FEE_PER_EVENT_RUB = 2000;

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
  return calculateExtraTimeFee(startDateTime, endDateTime).hasAnyExtraFee;
}

export function calculateExtraTimeFee(
  startDateTime?: string | null,
  endDateTime?: string | null
): {
  startOutside: boolean;
  endOutside: boolean;
  eventsCount: number;
  totalFee: number;
  hasAnyExtraFee: boolean;
} {
  const startMinutes = parseTimeToMinutes(startDateTime);
  const endMinutes = parseTimeToMinutes(endDateTime);

  if (startMinutes === null || endMinutes === null) {
    return {
      startOutside: false,
      endOutside: false,
      eventsCount: 0,
      totalFee: 0,
      hasAnyExtraFee: false,
    };
  }

  const startOutside = isOutsideBusinessHours(startMinutes);
  const endOutside = isOutsideBusinessHours(endMinutes);
  const eventsCount = Number(startOutside) + Number(endOutside);
  const totalFee = eventsCount * EXTRA_TIME_FEE_PER_EVENT_RUB;

  return {
    startOutside,
    endOutside,
    eventsCount,
    totalFee,
    hasAnyExtraFee: totalFee > 0,
  };
}
