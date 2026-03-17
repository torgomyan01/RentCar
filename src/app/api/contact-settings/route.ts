import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULTS = {
  phone: '+79005001010',
  phoneDisplay: '+7 (900) 500‒10‒10',
  email: 'Rentcar_info@gmail.com',
  address: 'г. Москва, ул. Удальцова, д. 36, эт. 3 ком 13-18',
  whatsappUrl: 'https://wa.me/79857396760',
  telegramUrl: 'https://t.me/ArendaAutoMoscow',
  telegramUrl2: 'https://t.me/aaaallleeexxxx',
  workHours: 'Работаем Пн-Вс с 9:00 до 21:00',
  mapCenterLat: 55.751574,
  mapCenterLng: 37.573856,
  mapZoom: 15,
};

export async function GET() {
  try {
    const row = await prisma.contactSettings.findUnique({
      where: { id: 'main' },
    });
    if (!row) {
      return NextResponse.json(DEFAULTS);
    }
    return NextResponse.json({
      phone: row.phone ?? DEFAULTS.phone,
      phoneDisplay: row.phoneDisplay ?? DEFAULTS.phoneDisplay,
      email: row.email ?? DEFAULTS.email,
      address: row.address ?? DEFAULTS.address,
      whatsappUrl: row.whatsappUrl ?? DEFAULTS.whatsappUrl,
      telegramUrl: row.telegramUrl ?? DEFAULTS.telegramUrl,
      telegramUrl2: row.telegramUrl2 ?? DEFAULTS.telegramUrl2,
      workHours: row.workHours ?? DEFAULTS.workHours,
      mapCenterLat: row.mapCenterLat ?? DEFAULTS.mapCenterLat,
      mapCenterLng: row.mapCenterLng ?? DEFAULTS.mapCenterLng,
      mapZoom: row.mapZoom ?? DEFAULTS.mapZoom,
    });
  } catch (error: any) {
    console.error('GET contact-settings:', error);
    return NextResponse.json(DEFAULTS);
  }
}
