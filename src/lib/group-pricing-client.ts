export type GroupTariffPricing = {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  startDayMonth: string | null;
  endDayMonth: string | null;
  prices: number[];
};

function normalizePrices(values: number[] | undefined | null): number[] {
  const safe = Array.isArray(values)
    ? values.filter((v) => Number.isFinite(v) && v > 0)
    : [];
  if (safe.length === 0) return [2500, 2250, 2000, 1900, 1700];
  const result = [...safe];
  while (result.length < 5) result.push(result[result.length - 1] || 0);
  return result.slice(0, 5);
}

function parseSearchDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const raw = String(dateStr).trim();
  const m = raw.match(/\b(\d{1,4})[.\-/](\d{1,2})[.\-/](\d{1,4})\b/);
  if (!m) return null;

  let day = 0;
  let month = 0;
  let year = 0;
  const p1 = Number(m[1]);
  const p2 = Number(m[2]);
  const p3 = Number(m[3]);
  if (m[1].length === 4) {
    year = p1;
    month = p2;
    day = p3;
  } else if (m[3].length === 4) {
    day = p1;
    month = p2;
    year = p3;
  } else {
    return null;
  }
  if (!day || !month || !year) return null;

  return new Date(year, month - 1, day);
}

function parseSeasonDayMonth(
  value: string | null | undefined
): { day: number; month: number } | null {
  const parts = String(value || '')
    .trim()
    .split('.');
  if (parts.length < 2) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }
  return { day, month };
}

function getSeasonWindowForDate(
  startDayMonth: string | null,
  endDayMonth: string | null,
  referenceDate: Date
): { startDate: Date; endDate: Date } | null {
  const startPart = parseSeasonDayMonth(startDayMonth);
  const endPart = parseSeasonDayMonth(endDayMonth);
  if (!startPart || !endPart) return null;

  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const crossesYear =
    startPart.month > endPart.month ||
    (startPart.month === endPart.month && startPart.day > endPart.day);

  let startDate: Date;
  let endDate: Date;

  if (!crossesYear) {
    startDate = new Date(ref.getFullYear(), startPart.month - 1, startPart.day);
    endDate = new Date(ref.getFullYear(), endPart.month - 1, endPart.day);
  } else {
    const currentYearStart = new Date(
      ref.getFullYear(),
      startPart.month - 1,
      startPart.day
    );
    if (ref >= currentYearStart) {
      startDate = currentYearStart;
      endDate = new Date(ref.getFullYear() + 1, endPart.month - 1, endPart.day);
    } else {
      startDate = new Date(
        ref.getFullYear() - 1,
        startPart.month - 1,
        startPart.day
      );
      endDate = new Date(ref.getFullYear(), endPart.month - 1, endPart.day);
    }
  }

  return { startDate, endDate };
}

export function getPriceForDaysByBuckets(prices: number[], days: number): number {
  if (days <= 2) return prices[0] || 0;
  if (days <= 7) return prices[1] || 0;
  if (days <= 15) return prices[2] || 0;
  if (days <= 31) return prices[3] || 0;
  return prices[4] || 0;
}

export function resolveTariffPricesForDate(
  tariffs: GroupTariffPricing[],
  startDateStr: string | null
): number[] {
  const parsedReferenceDate = parseSearchDate(startDateStr) || new Date();
  const referenceDate = new Date(
    parsedReferenceDate.getFullYear(),
    parsedReferenceDate.getMonth(),
    parsedReferenceDate.getDate()
  );

  const activeTariffs = Array.isArray(tariffs)
    ? tariffs.filter((tariff) => tariff && tariff.isActive !== false)
    : [];
  const defaultTariff =
    activeTariffs.find((tariff) => tariff.isDefault) || activeTariffs[0] || null;
  const seasonalTariffs = activeTariffs.filter(
    (tariff) => !tariff.isDefault && tariff.startDayMonth && tariff.endDayMonth
  );

  for (const tariff of seasonalTariffs) {
    const window = getSeasonWindowForDate(
      tariff.startDayMonth,
      tariff.endDayMonth,
      referenceDate
    );
    if (!window) continue;
    if (referenceDate >= window.startDate && referenceDate <= window.endDate) {
      return normalizePrices(tariff.prices);
    }
  }

  return normalizePrices(defaultTariff?.prices);
}

