import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULTS = {
  calmPricePerDay: 2000,
  cascoPricePerDay: 1000,
  fullCascoPricePerDay: 3000,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey || '').trim();

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
    });
  } catch (error: any) {
    console.error('GET /api/cars/service-pricing/[groupKey] error:', error);
    return NextResponse.json(DEFAULTS);
  }
}
