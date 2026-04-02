import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getGroupPricing } from '@/lib/car-group-pricing';

type TariffInput = {
  id?: string;
  name?: string;
  isDefault?: boolean;
  isActive?: boolean;
  order?: number;
  startDayMonth?: string | null;
  endDayMonth?: string | null;
  prices?: number[];
};

function isAdminSession(session: any): boolean {
  return Boolean(session && (session.user as any)?.role === 'admin');
}

function normalizeDayMonth(value: string | null | undefined): string | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const m = String(value).trim().match(/^(\d{1,2})\.(\d{1,2})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(day) || !Number.isFinite(month)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`;
}

function normalizePrices(values: unknown): number[] {
  const arr = Array.isArray(values) ? values : [];
  const safe = arr
    .map((v) => Number(v))
    .map((v) => (Number.isFinite(v) && v >= 0 ? Math.round(v) : 0));
  while (safe.length < 5) safe.push(safe[safe.length - 1] ?? 0);
  return safe.slice(0, 5);
}

function normalizeTariffInput(input: TariffInput, fallbackOrder: number): TariffInput {
  const name = String(input?.name || '').trim();
  const startDayMonth = normalizeDayMonth(input?.startDayMonth);
  const endDayMonth = normalizeDayMonth(input?.endDayMonth);
  const isDefault = Boolean(input?.isDefault);
  return {
    id: input?.id ? String(input.id) : undefined,
    name: name || (isDefault ? 'Базовый тариф' : `Сезон ${fallbackOrder + 1}`),
    isDefault,
    isActive: input?.isActive !== false,
    order: Number.isFinite(Number(input?.order)) ? Number(input?.order) : fallbackOrder,
    startDayMonth: isDefault ? null : startDayMonth,
    endDayMonth: isDefault ? null : endDayMonth,
    prices: normalizePrices(input?.prices),
  };
}

function validateTariffs(tariffs: TariffInput[]): string | null {
  if (!Array.isArray(tariffs) || tariffs.length === 0) {
    return 'At least one tariff is required';
  }

  const activeDefaults = tariffs.filter((t) => t.isActive !== false && t.isDefault);
  if (activeDefaults.length !== 1) {
    return 'Exactly one active default tariff is required';
  }

  const seasonalRanges = new Set<string>();
  for (const tariff of tariffs) {
    if (tariff.isDefault) continue;
    if (tariff.isActive === false) continue;
    if (!tariff.startDayMonth || !tariff.endDayMonth) {
      return `Season "${tariff.name}" must have start and end day-month`;
    }
    const key = `${tariff.startDayMonth}-${tariff.endDayMonth}`;
    if (seasonalRanges.has(key)) {
      return `Duplicate active season range: ${key}`;
    }
    seasonalRanges.add(key);
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdminSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey || '').trim();
    if (!groupKey) {
      return NextResponse.json({ error: 'Invalid group key' }, { status: 400 });
    }

    const payload = await getGroupPricing(groupKey);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('GET /api/admin/car-group-pricing/[groupKey] error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch group pricing' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdminSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey || '').trim();
    if (!groupKey) {
      return NextResponse.json({ error: 'Invalid group key' }, { status: 400 });
    }

    const body = await request.json();
    const rawTariffs = Array.isArray(body?.tariffs) ? (body.tariffs as TariffInput[]) : [];
    const tariffs = rawTariffs.map((row, idx) => normalizeTariffInput(row, idx));
    const validationError = validateTariffs(tariffs);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await (prisma as any).$transaction(async (tx: any) => {
      await tx.carGroupTariffPrice.deleteMany({
        where: {
          tariff: {
            groupKey,
          },
        },
      });
      await tx.carGroupTariff.deleteMany({ where: { groupKey } });

      for (let i = 0; i < tariffs.length; i += 1) {
        const tariff = tariffs[i];
        const created = await tx.carGroupTariff.create({
          data: {
            groupKey,
            name: tariff.name,
            isDefault: Boolean(tariff.isDefault),
            isActive: tariff.isActive !== false,
            order: Number.isFinite(Number(tariff.order)) ? Number(tariff.order) : i,
            startDayMonth: tariff.startDayMonth ?? null,
            endDayMonth: tariff.endDayMonth ?? null,
          },
        });

        await tx.carGroupTariffPrice.createMany({
          data: (tariff.prices || []).map((price, bucketIndex) => ({
            tariffId: created.id,
            bucketIndex,
            price: Math.round(Number(price) || 0),
          })),
        });
      }
    });

    const payload = await getGroupPricing(groupKey);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('PUT /api/admin/car-group-pricing/[groupKey] error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save group pricing' },
      { status: 500 }
    );
  }
}

