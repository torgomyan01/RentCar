import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const DEFAULTS = {
  calmPricePerDay: 2000,
  cascoPricePerDay: 1000,
  fullCascoPricePerDay: 3000,
  minAgeYears: 25,
  minExperienceYears: 3,
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupKeyRaw = request.nextUrl.searchParams.get('groupKey') || '';
    const groupKey = decodeURIComponent(groupKeyRaw).trim();

    if (!groupKey) {
      return NextResponse.json(DEFAULTS);
    }

    const row = await (prisma as any).carServicePricing.findUnique({
      where: { groupKey },
    });

    if (!row) {
      return NextResponse.json(DEFAULTS);
    }

    return NextResponse.json({
      calmPricePerDay: row.calmPricePerDay ?? DEFAULTS.calmPricePerDay,
      cascoPricePerDay: row.cascoPricePerDay ?? DEFAULTS.cascoPricePerDay,
      fullCascoPricePerDay:
        row.fullCascoPricePerDay ?? DEFAULTS.fullCascoPricePerDay,
      minAgeYears: row.minAgeYears ?? DEFAULTS.minAgeYears,
      minExperienceYears:
        row.minExperienceYears ?? DEFAULTS.minExperienceYears,
    });
  } catch (error: any) {
    console.error('GET admin car-service-pricing:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const groupKeyRaw = String(body?.groupKey ?? '');
    const groupKey = groupKeyRaw.trim();
    if (!groupKey) {
      return NextResponse.json({ error: 'Invalid groupKey' }, { status: 400 });
    }

    const calmPricePerDay = Number(body?.calmPricePerDay);
    const cascoPricePerDay = Number(body?.cascoPricePerDay);
    const fullCascoPricePerDay = Number(body?.fullCascoPricePerDay);
    const minAgeYears = Number(body?.minAgeYears);
    const minExperienceYears = Number(body?.minExperienceYears);

    const safe = (value: number, fallback: number) => {
      if (!Number.isFinite(value) || value < 0) return fallback;
      return Math.round(value);
    };
    const safeRange = (
      value: number,
      fallback: number,
      min: number,
      max: number
    ) => {
      if (!Number.isFinite(value)) return fallback;
      const rounded = Math.round(value);
      if (rounded < min || rounded > max) return fallback;
      return rounded;
    };

    const row = await (prisma as any).carServicePricing.upsert({
      where: { groupKey },
      create: {
        groupKey,
        calmPricePerDay: safe(calmPricePerDay, DEFAULTS.calmPricePerDay),
        cascoPricePerDay: safe(cascoPricePerDay, DEFAULTS.cascoPricePerDay),
        fullCascoPricePerDay: safe(
          fullCascoPricePerDay,
          DEFAULTS.fullCascoPricePerDay
        ),
        minAgeYears: safeRange(minAgeYears, DEFAULTS.minAgeYears, 18, 80),
        minExperienceYears: safeRange(
          minExperienceYears,
          DEFAULTS.minExperienceYears,
          1,
          60
        ),
      },
      update: {
        calmPricePerDay: safe(calmPricePerDay, DEFAULTS.calmPricePerDay),
        cascoPricePerDay: safe(cascoPricePerDay, DEFAULTS.cascoPricePerDay),
        fullCascoPricePerDay: safe(
          fullCascoPricePerDay,
          DEFAULTS.fullCascoPricePerDay
        ),
        minAgeYears: safeRange(minAgeYears, DEFAULTS.minAgeYears, 18, 80),
        minExperienceYears: safeRange(
          minExperienceYears,
          DEFAULTS.minExperienceYears,
          1,
          60
        ),
      },
    });

    return NextResponse.json(row);
  } catch (error: any) {
    console.error('PUT admin car-service-pricing:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save pricing' },
      { status: 500 }
    );
  }
}
