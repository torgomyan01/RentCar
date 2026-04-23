import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = String((session?.user as any)?.role || '')
      .trim()
      .toLowerCase();

    if (!session || !['admin', 'manager'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid request id' }, { status: 400 });
    }

    const updated = await (prisma as any).leadRequest.update({
      where: { id },
      data: { isRead: true },
      select: { id: true, isRead: true },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('PATCH /api/admin/requests/[id]/read error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update request status' },
      { status: 500 }
    );
  }
}
