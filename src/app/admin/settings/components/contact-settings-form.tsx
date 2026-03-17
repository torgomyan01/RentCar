'use client';

import { useState, useEffect } from 'react';

interface ContactSettingsData {
  phone?: string | null;
  phoneDisplay?: string | null;
  email?: string | null;
  address?: string | null;
  whatsappUrl?: string | null;
  telegramUrl?: string | null;
  telegramUrl2?: string | null;
  workHours?: string | null;
  mapCenterLat?: number | null;
  mapCenterLng?: number | null;
  mapZoom?: number | null;
}

const defaultForm: ContactSettingsData = {
  phone: '',
  phoneDisplay: '',
  email: '',
  address: '',
  whatsappUrl: '',
  telegramUrl: '',
  telegramUrl2: '',
  workHours: '',
  mapCenterLat: 55.751574,
  mapCenterLng: 37.573856,
  mapZoom: 15,
};

export default function ContactSettingsForm() {
  const [form, setForm] = useState<ContactSettingsData>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/contact-settings');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (!cancelled) {
          setForm({
            phone: data.phone ?? '',
            phoneDisplay: data.phoneDisplay ?? '',
            email: data.email ?? '',
            address: data.address ?? '',
            whatsappUrl: data.whatsappUrl ?? '',
            telegramUrl: data.telegramUrl ?? '',
            telegramUrl2: data.telegramUrl2 ?? '',
            workHours: data.workHours ?? '',
            mapCenterLat: data.mapCenterLat ?? 55.751574,
            mapCenterLng: data.mapCenterLng ?? 37.573856,
            mapZoom: data.mapZoom ?? 15,
          });
        }
      } catch (e) {
        if (!cancelled) setMessage({ type: 'error', text: 'Не удалось загрузить настройки' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (field: keyof ContactSettingsData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, [field]: v }));
    setMessage(null);
  };

  const handleNumberChange = (field: 'mapCenterLat' | 'mapCenterLng' | 'mapZoom') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value;
    const num = raw === '' ? null : parseFloat(raw);
    setForm((prev) => ({ ...prev, [field]: num }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/contact-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone || null,
          phoneDisplay: form.phoneDisplay || null,
          email: form.email || null,
          address: form.address || null,
          whatsappUrl: form.whatsappUrl || null,
          telegramUrl: form.telegramUrl || null,
          telegramUrl2: form.telegramUrl2 || null,
          workHours: form.workHours || null,
          mapCenterLat: form.mapCenterLat == null ? null : Number(form.mapCenterLat),
          mapCenterLng: form.mapCenterLng == null ? null : Number(form.mapCenterLng),
          mapZoom: form.mapZoom == null ? null : Number(form.mapZoom),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения');
      setMessage({ type: 'success', text: 'Настройки сохранены' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Ошибка при сохранении' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <i className="fas fa-spinner fa-spin text-2xl mr-2"></i>
        Загрузка...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Телефон (для ссылки tel:)
        </label>
        <input
          type="text"
          value={form.phone ?? ''}
          onChange={handleChange('phone')}
          placeholder="+79005001010"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Телефон (отображение)
        </label>
        <input
          type="text"
          value={form.phoneDisplay ?? ''}
          onChange={handleChange('phoneDisplay')}
          placeholder="+7 (900) 500‒10‒10"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Почта
        </label>
        <input
          type="email"
          value={form.email ?? ''}
          onChange={handleChange('email')}
          placeholder="Rentcar_info@gmail.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Адрес
        </label>
        <textarea
          value={form.address ?? ''}
          onChange={handleChange('address')}
          rows={2}
          placeholder="г. Москва, ул. Удальцова, д. 36..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp URL
        </label>
        <input
          type="url"
          value={form.whatsappUrl ?? ''}
          onChange={handleChange('whatsappUrl')}
          placeholder="https://wa.me/79857396760"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telegram URL
        </label>
        <input
          type="url"
          value={form.telegramUrl ?? ''}
          onChange={handleChange('telegramUrl')}
          placeholder="https://t.me/ArendaAutoMoscow"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telegram URL 2 (опционально)
        </label>
        <input
          type="url"
          value={form.telegramUrl2 ?? ''}
          onChange={handleChange('telegramUrl2')}
          placeholder="https://t.me/..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Режим работы
        </label>
        <input
          type="text"
          value={form.workHours ?? ''}
          onChange={handleChange('workHours')}
          placeholder="Работаем Пн-Вс с 9:00 до 21:00"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Широта карты
          </label>
          <input
            type="number"
            step="any"
            value={form.mapCenterLat ?? ''}
            onChange={handleNumberChange('mapCenterLat')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Долгота карты
          </label>
          <input
            type="number"
            step="any"
            value={form.mapCenterLng ?? ''}
            onChange={handleNumberChange('mapCenterLng')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Зум карты
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={form.mapZoom ?? ''}
            onChange={handleNumberChange('mapZoom')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="min-h-[44px] px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
      >
        {saving ? 'Сохранение...' : 'Сохранить настройки'}
      </button>
    </form>
  );
}
