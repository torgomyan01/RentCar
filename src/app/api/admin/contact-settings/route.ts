import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const row = await prisma.contactSettings.findUnique({
      where: { id: 'main' },
    });
    return NextResponse.json(row || {});
  } catch (error: any) {
    console.error('GET admin contact-settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch' },
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
    const {
      phone,
      phoneDisplay,
      email,
      address,
      whatsappUrl,
      telegramUrl,
      telegramUrl2,
      workHours,
      mapCenterLat,
      mapCenterLng,
      mapZoom,
    } = body;

    const data: Record<string, unknown> = {};
    if (phone !== undefined) data.phone = phone ?? null;
    if (phoneDisplay !== undefined) data.phoneDisplay = phoneDisplay ?? null;
    if (email !== undefined) data.email = email ?? null;
    if (address !== undefined) data.address = address ?? null;
    if (whatsappUrl !== undefined) data.whatsappUrl = whatsappUrl ?? null;
    if (telegramUrl !== undefined) data.telegramUrl = telegramUrl ?? null;
    if (telegramUrl2 !== undefined) data.telegramUrl2 = telegramUrl2 ?? null;
    if (workHours !== undefined) data.workHours = workHours ?? null;
    if (mapCenterLat !== undefined) data.mapCenterLat = mapCenterLat == null ? null : Number(mapCenterLat);
    if (mapCenterLng !== undefined) data.mapCenterLng = mapCenterLng == null ? null : Number(mapCenterLng);
    if (mapZoom !== undefined) data.mapZoom = mapZoom == null ? null : Number(mapZoom);

    const row = await prisma.contactSettings.upsert({
      where: { id: 'main' },
      create: { id: 'main', ...data } as any,
      update: data as any,
    });
    return NextResponse.json(row);
  } catch (error: any) {
    console.error('PUT admin contact-settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save' },
      { status: 500 }
    );
  }
}
