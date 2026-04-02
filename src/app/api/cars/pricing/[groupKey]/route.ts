import { NextResponse } from 'next/server';
import { getGroupPricing } from '@/lib/car-group-pricing';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey || '').trim();
    if (!groupKey) {
      return NextResponse.json({ error: 'Invalid group key' }, { status: 400 });
    }

    const payload = await getGroupPricing(groupKey);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('GET /api/cars/pricing/[groupKey] error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

