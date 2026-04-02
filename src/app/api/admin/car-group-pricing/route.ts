import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGroupPricing } from '@/lib/car-group-pricing';

function isAdminSession(session: any): boolean {
  return Boolean(session && (session.user as any)?.role === 'admin');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdminSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupKey = decodeURIComponent(
      request.nextUrl.searchParams.get('groupKey') || ''
    ).trim();
    if (!groupKey) {
      return NextResponse.json({ error: 'groupKey is required' }, { status: 400 });
    }

    const payload = await getGroupPricing(groupKey);
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('GET /api/admin/car-group-pricing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch group pricing' },
      { status: 500 }
    );
  }
}

