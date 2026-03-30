import MainTemplate from '@/components/common/main-template/main-template';
import ContactBlock from '@/components/layout/contact/contact-block';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import type { ContactSettings } from '@/hooks/use-contact-settings';

export const metadata: Metadata = {
  title: 'Контакты',
  description:
    'Контакты компании по аренде авто: телефон, адрес, мессенджеры и форма обратной связи.',
  alternates: {
    canonical: '/contact',
  },
};

const DEFAULT_SETTINGS: ContactSettings = {
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

export default async function ContactPage() {
  const row = await prisma.contactSettings.findUnique({
    where: { id: 'main' },
  });

  const settings: ContactSettings = {
    phone: row?.phone ?? DEFAULT_SETTINGS.phone,
    phoneDisplay: row?.phoneDisplay ?? DEFAULT_SETTINGS.phoneDisplay,
    email: row?.email ?? DEFAULT_SETTINGS.email,
    address: row?.address ?? DEFAULT_SETTINGS.address,
    whatsappUrl: row?.whatsappUrl ?? DEFAULT_SETTINGS.whatsappUrl,
    telegramUrl: row?.telegramUrl ?? DEFAULT_SETTINGS.telegramUrl,
    telegramUrl2: row?.telegramUrl2 ?? DEFAULT_SETTINGS.telegramUrl2,
    workHours: row?.workHours ?? DEFAULT_SETTINGS.workHours,
    mapCenterLat: row?.mapCenterLat ?? DEFAULT_SETTINGS.mapCenterLat,
    mapCenterLng: row?.mapCenterLng ?? DEFAULT_SETTINGS.mapCenterLng,
    mapZoom: row?.mapZoom ?? DEFAULT_SETTINGS.mapZoom,
  };

  return (
    <MainTemplate minHeight={true} headerAnimation={false}>
      <ContactBlock initialSettings={settings} />
    </MainTemplate>
  );
}
