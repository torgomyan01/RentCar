'use client';

import { useState, useEffect } from 'react';

export interface ContactSettings {
  phone: string;
  phoneDisplay: string;
  email: string;
  address: string;
  whatsappUrl: string;
  telegramUrl: string;
  telegramUrl2: string;
  workHours: string;
  mapCenterLat: number;
  mapCenterLng: number;
  mapZoom: number;
}

const DEFAULTS: ContactSettings = {
  phone: '+79005001010',
  phoneDisplay: '+7 (900) 500‒10‒10',
  email: 'Rentcar_info@gmail.com',
  address: 'г. Москва, ул. Удальцова, д. 36, эт. 3 ком 13-18',
  whatsappUrl: 'https://wa.me/79857396760',
  telegramUrl: 'https://t.me/ArendaAutoMoscow',
  telegramUrl2: 'https://t.me/aaaallleeexxxx',
  workHours: 'Работаем Пн-Сб с 9:00 до 21:00',
  mapCenterLat: 55.751574,
  mapCenterLng: 37.573856,
  mapZoom: 15,
};

export function useContactSettings(): {
  settings: ContactSettings;
  loading: boolean;
} {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/contact-settings')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setSettings({
          phone: data.phone ?? DEFAULTS.phone,
          phoneDisplay: data.phoneDisplay ?? DEFAULTS.phoneDisplay,
          email: data.email ?? DEFAULTS.email,
          address: data.address ?? DEFAULTS.address,
          whatsappUrl: data.whatsappUrl ?? DEFAULTS.whatsappUrl,
          telegramUrl: data.telegramUrl ?? DEFAULTS.telegramUrl,
          telegramUrl2: data.telegramUrl2 ?? DEFAULTS.telegramUrl2,
          workHours: data.workHours ?? DEFAULTS.workHours,
          mapCenterLat: data.mapCenterLat ?? DEFAULTS.mapCenterLat,
          mapCenterLng: data.mapCenterLng ?? DEFAULTS.mapCenterLng,
          mapZoom: data.mapZoom ?? DEFAULTS.mapZoom,
        });
      })
      .catch(() => {
        if (!cancelled) setSettings(DEFAULTS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loading };
}
