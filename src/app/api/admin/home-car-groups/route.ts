import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_HOME_GROUPS = 6;

function normalizeGroupKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const normalized = raw
    .map((v) => String(v || '').trim())
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index);
  return normalized.slice(0, MAX_HOME_GROUPS);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await (prisma as any).homeCarGroupSelection.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      groupKeys: rows.map((row: any) => row.groupKey),
      maxGroups: MAX_HOME_GROUPS,
    });
  } catch (error: any) {
    console.error('GET admin home-car-groups:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch home car groups' },
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
    const groupKeys = normalizeGroupKeys(body?.groupKeys);

    await prisma.$transaction(async (tx) => {
      await (tx as any).homeCarGroupSelection.updateMany({
        data: { isActive: false },
      });

      for (let i = 0; i < groupKeys.length; i += 1) {
        const groupKey = groupKeys[i];
        await (tx as any).homeCarGroupSelection.upsert({
          where: { groupKey },
          create: {
            groupKey,
            order: i,
            isActive: true,
          },
          update: {
            order: i,
            isActive: true,
          },
        });
      }
    });

    return NextResponse.json({ success: true, groupKeys });
  } catch (error: any) {
    console.error('PUT admin home-car-groups:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save home car groups' },
      { status: 500 }
    );
  }
}
