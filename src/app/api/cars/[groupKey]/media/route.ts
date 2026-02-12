import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey);

    const media = await prisma.carGroupMedia.findMany({
      where: { groupKey },
      orderBy: [{ type: 'asc' }, { order: 'asc' }],
    });

    return NextResponse.json({ media });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
