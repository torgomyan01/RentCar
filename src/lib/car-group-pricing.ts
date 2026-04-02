import type { Car, PriceItem } from '@/lib/rentprog-api-server';
import { rentprogApiServer } from '@/lib/rentprog-api-server';
import { getCarGroupKey } from '@/lib/car-group-key';
import { prisma } from '@/lib/prisma';

export type PricingBucket = 0 | 1 | 2 | 3 | 4;

export interface GroupTariffDto {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  startDayMonth: string | null;
  endDayMonth: string | null;
  prices: number[];
}

export interface GroupPricingPayload {
  groupKey: string;
  tariffs: GroupTariffDto[];
}

const DEFAULT_PRICES = [2500, 2250, 2000, 1900, 1700];

function normalizePrices(values: number[] | undefined | null): number[] {
  const safe = Array.isArray(values)
    ? values.filter((v) => Number.isFinite(v) && v > 0)
    : [];
  if (safe.length === 0) return [...DEFAULT_PRICES];
  const result = [...safe];
  while (result.length < 5) {
    result.push(result[result.length - 1] || 0);
  }
  return result.slice(0, 5);
}

type SeasonLike = {
  id?: number | string | null;
  season_id?: number | string | null;
  start_date?: string;
  end_date?: string;
};

function getSeasonId(season: SeasonLike): string | null {
  if (season.id !== undefined && season.id !== null) return String(season.id);
  if (season.season_id !== undefined && season.season_id !== null) {
    return String(season.season_id);
  }
  return null;
}

function normalizeDayMonth(value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = String(value).trim().split('.');
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
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`;
}

function mapDbRowsToPayload(groupKey: string, rows: any[]): GroupPricingPayload {
  const tariffs = rows
    .map((row) => {
      const prices = new Array(5).fill(0);
      (row.prices || []).forEach((priceRow: any) => {
        const idx = Number(priceRow.bucketIndex);
        if (idx >= 0 && idx <= 4) prices[idx] = Number(priceRow.price) || 0;
      });
      return {
        id: String(row.id),
        name: String(row.name || ''),
        isDefault: Boolean(row.isDefault),
        isActive: Boolean(row.isActive),
        order: Number(row.order || 0),
        startDayMonth: row.startDayMonth || null,
        endDayMonth: row.endDayMonth || null,
        prices: normalizePrices(prices),
      } as GroupTariffDto;
    })
    .sort((a, b) => a.order - b.order);

  return { groupKey, tariffs };
}

async function buildSeedTariffsFromCrm(groupKey: string): Promise<
  Array<{
    name: string;
    isDefault: boolean;
    isActive: boolean;
    order: number;
    startDayMonth: string | null;
    endDayMonth: string | null;
    prices: number[];
  }>
> {
  const allCars = await rentprogApiServer.getAllCarsFull();
  const groupCar = allCars.find((car) => getCarGroupKey(car) === groupKey);
  if (!groupCar?.id) return [];

  const details = await rentprogApiServer.getCarDataWithBookings(groupCar.id);
  const seasons = Array.isArray((details as any)?.seasons)
    ? ((details as any).seasons as SeasonLike[])
    : [];
  const pricesArray = (details as any)?.prices || (details as any)?.price || [];

  // Legacy array of numbers -> only default tariff.
  if (Array.isArray(pricesArray) && typeof pricesArray[0] === 'number') {
    return [
      {
        name: 'Базовый тариф',
        isDefault: true,
        isActive: true,
        order: 0,
        startDayMonth: null,
        endDayMonth: null,
        prices: normalizePrices(pricesArray as number[]),
      },
    ];
  }

  const items = Array.isArray(pricesArray) ? (pricesArray as PriceItem[]) : [];
  const defaultItem =
    items.find((item) => item && item.season_id == null) || items[0] || null;
  const seasonalItems = items.filter((item) => item && item.season_id != null);
  const seasonalById = new Map<string, PriceItem>();
  seasonalItems.forEach((item) => {
    if (item?.season_id == null) return;
    seasonalById.set(String(item.season_id), item);
  });

  const result: Array<{
    name: string;
    isDefault: boolean;
    isActive: boolean;
    order: number;
    startDayMonth: string | null;
    endDayMonth: string | null;
    prices: number[];
  }> = [];

  if (defaultItem) {
    result.push({
      name: 'Базовый тариф',
      isDefault: true,
      isActive: true,
      order: 0,
      startDayMonth: null,
      endDayMonth: null,
      prices: normalizePrices(defaultItem.values),
    });
  }

  seasons.forEach((season, index) => {
    const seasonId = getSeasonId(season);
    const seasonPrice = seasonId ? seasonalById.get(seasonId) : undefined;
    if (!seasonPrice) return;

    const startDayMonth = normalizeDayMonth(season.start_date);
    const endDayMonth = normalizeDayMonth(season.end_date);
    result.push({
      name:
        startDayMonth && endDayMonth
          ? `Сезон ${startDayMonth}-${endDayMonth}`
          : `Сезон ${index + 1}`,
      isDefault: false,
      isActive: true,
      order: result.length,
      startDayMonth,
      endDayMonth,
      prices: normalizePrices(seasonPrice.values),
    });
  });

  if (result.length === 0) {
    result.push({
      name: 'Базовый тариф',
      isDefault: true,
      isActive: true,
      order: 0,
      startDayMonth: null,
      endDayMonth: null,
      prices: [...DEFAULT_PRICES],
    });
  }

  return result;
}

export async function ensureGroupPricingSeeded(groupKey: string): Promise<void> {
  const normalizedGroupKey = String(groupKey || '').trim();
  if (!normalizedGroupKey) return;

  const existingCount = await (prisma as any).carGroupTariff.count({
    where: { groupKey: normalizedGroupKey },
  });
  if (existingCount > 0) return;

  const seedTariffs = await buildSeedTariffsFromCrm(normalizedGroupKey);
  if (seedTariffs.length === 0) return;

  await (prisma as any).$transaction(async (tx: any) => {
    const checkCount = await tx.carGroupTariff.count({
      where: { groupKey: normalizedGroupKey },
    });
    if (checkCount > 0) return;

    for (const tariff of seedTariffs) {
      const created = await tx.carGroupTariff.create({
        data: {
          groupKey: normalizedGroupKey,
          name: tariff.name,
          isDefault: tariff.isDefault,
          isActive: tariff.isActive,
          order: tariff.order,
          startDayMonth: tariff.startDayMonth,
          endDayMonth: tariff.endDayMonth,
        },
      });

      await tx.carGroupTariffPrice.createMany({
        data: tariff.prices.map((price, idx) => ({
          tariffId: created.id,
          bucketIndex: idx as PricingBucket,
          price: Math.round(Number(price) || 0),
        })),
      });
    }
  });
}

export async function getGroupPricing(groupKey: string): Promise<GroupPricingPayload> {
  const normalizedGroupKey = String(groupKey || '').trim();
  if (!normalizedGroupKey) {
    return {
      groupKey: '',
      tariffs: [
        {
          id: 'default',
          name: 'Базовый тариф',
          isDefault: true,
          isActive: true,
          order: 0,
          startDayMonth: null,
          endDayMonth: null,
          prices: [...DEFAULT_PRICES],
        },
      ],
    };
  }

  await ensureGroupPricingSeeded(normalizedGroupKey);

  const rows = await (prisma as any).carGroupTariff.findMany({
    where: { groupKey: normalizedGroupKey },
    include: { prices: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });

  if (!rows.length) {
    return {
      groupKey: normalizedGroupKey,
      tariffs: [
        {
          id: 'default',
          name: 'Базовый тариф',
          isDefault: true,
          isActive: true,
          order: 0,
          startDayMonth: null,
          endDayMonth: null,
          prices: [...DEFAULT_PRICES],
        },
      ],
    };
  }

  return mapDbRowsToPayload(normalizedGroupKey, rows);
}

