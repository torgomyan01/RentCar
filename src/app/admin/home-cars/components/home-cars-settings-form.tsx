'use client';

import { useEffect, useMemo, useState } from 'react';
import { getServerImageUrl } from '@/lib/uploads';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MAX_HOME_GROUPS = 6;

interface GroupOption {
  key: string;
  title: string;
  totalCars: number;
  previewImage?: string;
}

interface HomeCarsSettingsFormProps {
  options: GroupOption[];
}

interface SortableSelectedCardProps {
  item: GroupOption;
  index: number;
  onRemove: (key: string) => void;
}

function SortableSelectedCard({
  item,
  index,
  onRemove,
}: SortableSelectedCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm p-3 select-none ${
        isDragging ? 'opacity-80 ring-2 ring-red-200' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-20 h-16 rounded-md overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
          {item.previewImage ? (
            <img
              src={getServerImageUrl(item.previewImage)}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="/img/no-image.png"
              alt={item.title}
              className="w-full h-full object-cover opacity-70"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">
            {index + 1}. {item.title}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {item.totalCars} авто в группе
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            Перетащите карточку для сортировки
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-300 text-xs text-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-50"
          {...attributes}
          {...listeners}
        >
          <i className="fas fa-grip-vertical" />
          Drag & Drop
        </button>
        <button
          type="button"
          className="px-2 py-1 rounded border border-red-300 text-red-600 text-sm hover:bg-red-50"
          onClick={() => onRemove(item.key)}
        >
          Убрать
        </button>
      </div>
    </div>
  );
}

export default function HomeCarsSettingsForm({
  options,
}: HomeCarsSettingsFormProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/home-car-groups');
        if (!res.ok) throw new Error('Failed to load settings');
        const data = await res.json();
        const keys = Array.isArray(data?.groupKeys)
          ? data.groupKeys.map((v: unknown) => String(v || '').trim()).filter(Boolean)
          : [];
        if (!cancelled) setSelectedKeys(keys.slice(0, MAX_HOME_GROUPS));
      } catch {
        if (!cancelled) {
          setMessage({
            type: 'error',
            text: 'Не удалось загрузить текущие настройки',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const selectedOptions = useMemo(() => {
    const map = new Map(options.map((item) => [item.key, item]));
    return selectedKeys
      .map((key) => map.get(key))
      .filter((item): item is GroupOption => Boolean(item));
  }, [options, selectedKeys]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleToggle = (groupKey: string) => {
    setMessage(null);
    setSelectedKeys((prev) => {
      if (prev.includes(groupKey)) {
        return prev.filter((v) => v !== groupKey);
      }
      if (prev.length >= MAX_HOME_GROUPS) {
        setMessage({
          type: 'error',
          text: `Можно выбрать максимум ${MAX_HOME_GROUPS} групп`,
        });
        return prev;
      }
      return [...prev, groupKey];
    });
  };

  const handleReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSelectedKeys((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/home-car-groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupKeys: selectedKeys }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Ошибка сохранения');
      }
      setMessage({ type: 'success', text: 'Настройки сохранены' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || 'Ошибка при сохранении',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <i className="fas fa-spinner fa-spin text-2xl mr-2" />
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-sm text-gray-700 mb-2">
          Выбрано: <b>{selectedKeys.length}</b> / {MAX_HOME_GROUPS}
        </div>
        <p className="text-xs text-gray-500">
          Выберите группы автомобилей и настройте порядок отображения в блоке
          "Наши автомобили" на главной странице.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-gray-900">
          Порядок на главной странице
        </h3>
        {selectedOptions.length === 0 ? (
          <div className="text-sm text-gray-500">Пока ничего не выбрано</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleReorder}
          >
            <SortableContext
              items={selectedKeys}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {selectedOptions.map((item, index) => (
                  <SortableSelectedCard
                    key={item.key}
                    item={item}
                    index={index}
                    onRemove={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-semibold text-gray-900">
          Все группы автомобилей
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {options.map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer ${
                selectedSet.has(item.key)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedSet.has(item.key)}
                onChange={() => handleToggle(item.key)}
              />
              <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                {item.previewImage ? (
                  <img
                    src={getServerImageUrl(item.previewImage)}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="/img/no-image.png"
                    alt={item.title}
                    className="w-full h-full object-cover opacity-70"
                  />
                )}
              </div>
              <span className="min-w-0">
                <span className="block font-medium text-gray-900 truncate">
                  {item.title}
                </span>
                <span className="block text-xs text-gray-500">
                  {item.totalCars} авто
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="min-h-[44px] px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Сохранение...' : 'Сохранить настройки'}
      </button>
    </div>
  );
}
