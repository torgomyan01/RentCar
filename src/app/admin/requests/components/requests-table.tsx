'use client';

import { useMemo, useState } from 'react';

type RequestItem = {
  id: string;
  name: string;
  phone: string;
  message: string | null;
  isRead: boolean;
  createdAt: string;
};

export default function RequestsTable({
  initialRequests,
}: {
  initialRequests: RequestItem[];
}) {
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalCount = requests.length;
  const unreadCount = useMemo(
    () => requests.filter((r) => !r.isRead).length,
    [requests]
  );

  const markAsRead = async () => {
    if (!selected || selected.isRead) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/requests/${selected.id}/read`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to update status');
      }
      setRequests((prev) =>
        prev.map((item) =>
          item.id === selected.id ? { ...item, isRead: true } : item
        )
      );
      setSelected((prev) => (prev ? { ...prev, isRead: true } : prev));
    } catch (error) {
      console.error('Failed to mark request as read:', error);
      alert('Не удалось обновить статус заявки');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Всего: <b>{totalCount}</b>
        </div>
        <div className="text-sm text-red-600">
          Новых: <b>{unreadCount}</b>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Заявок пока нет</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Дата
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Имя
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Телефон
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Детали
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                  }`}
                >
                  <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString('ru-RU', {
                      timeZone: 'Europe/Moscow',
                    })}
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-medium">
                    {item.name}
                  </td>
                  <td className="p-4 text-sm text-gray-900">
                    <a
                      href={`tel:${item.phone}`}
                      className="underline decoration-dotted hover:text-red-600"
                    >
                      {item.phone}
                    </a>
                  </td>
                  <td className="p-4 text-sm text-gray-700">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 text-xs font-medium"
                    >
                      <i className="fas fa-eye text-gray-500" />
                      Открыть
                    </button>
                  </td>
                  <td className="p-4 text-sm">
                    {item.isRead ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                        Прочитано
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        Новая
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[1400] bg-black/45 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Детали заявки
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selected.createdAt).toLocaleString('ru-RU', {
                    timeZone: 'Europe/Moscow',
                  })}
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100"
                onClick={() => setSelected(null)}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Имя</p>
                <p className="text-sm text-gray-900 font-medium">{selected.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Телефон</p>
                <a
                  href={`tel:${selected.phone}`}
                  className="text-sm text-gray-900 underline decoration-dotted"
                >
                  {selected.phone}
                </a>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Сообщение</p>
                <div className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap wrap-break-word max-h-72 overflow-auto">
                  {selected.message || '—'}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm"
              >
                Закрыть
              </button>
              {!selected.isRead && (
                <button
                  type="button"
                  onClick={markAsRead}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg border border-red-600 bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-60"
                >
                  {isUpdating ? 'Сохраняем...' : 'Отметить как прочитано'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
