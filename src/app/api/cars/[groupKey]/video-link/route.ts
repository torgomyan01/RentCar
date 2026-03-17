import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey);

    const video = await prisma.carGroupMedia.findFirst({
      where: { groupKey, type: 'video' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ url: video?.filePath || '' });
  } catch (error: any) {
    console.error('GET public video-link:', error);
    return NextResponse.json({ url: '' });
  }
}
