import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_HOME_GROUPS = 6;

export async function GET() {
  try {
    const rows = await (prisma as any).homeCarGroupSelection.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      take: MAX_HOME_GROUPS,
    });

    return NextResponse.json({
      groupKeys: rows.map((row: any) => row.groupKey),
    });
  } catch (error: any) {
    console.error('GET public home-car-groups:', error);
    return NextResponse.json({ groupKeys: [] });
  }
}
