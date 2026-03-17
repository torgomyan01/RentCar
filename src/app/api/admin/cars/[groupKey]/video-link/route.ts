import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function normalizeUrl(value: unknown): string {
  return String(value ?? '').trim();
}

function isRutubeUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('rutube.ru') || lower.includes('rutube');
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey);

    const video = await prisma.carGroupMedia.findFirst({
      where: { groupKey, type: 'video' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ url: video?.filePath || '' });
  } catch (error: any) {
    console.error('GET admin video-link:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch video link' },
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
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey);
    const body = await request.json();
    const url = normalizeUrl(body?.url);

    if (!url) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    if (!isRutubeUrl(url)) {
      return NextResponse.json(
        { error: 'Разрешены только ссылки RuTube' },
        { status: 400 }
      );
    }

    const existing = await prisma.carGroupMedia.findFirst({
      where: { groupKey, type: 'video' },
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      await prisma.carGroupMedia.update({
        where: { id: existing.id },
        data: {
          filePath: url,
          fileName: 'rutube-link',
          fileSize: 0,
          mimeType: 'text/uri-list',
          order: 0,
        },
      });

      await prisma.carGroupMedia.deleteMany({
        where: { groupKey, type: 'video', id: { not: existing.id } },
      });
    } else {
      await prisma.carGroupMedia.create({
        data: {
          groupKey,
          type: 'video',
          fileName: 'rutube-link',
          filePath: url,
          fileSize: 0,
          mimeType: 'text/uri-list',
          order: 0,
        },
      });
    }

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('PUT admin video-link:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save video link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ groupKey: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const groupKey = decodeURIComponent(resolvedParams.groupKey);

    await prisma.carGroupMedia.deleteMany({
      where: { groupKey, type: 'video' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE admin video-link:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete video link' },
      { status: 500 }
    );
  }
}
