'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Car } from '@/lib/rentprog-api-server';
import MediaUpload from './media-upload';
import { getServerImageUrl } from '@/lib/uploads';

interface CarsListProps {
  initialCars: Car[];
}

interface CarGroup {
  key: string;
  cars: Car[];
  name: string;
  yearRange: string;
  uniqueColors: string[];
  carType?: string;
  minPrice: number | null;
  maxPrice: number | null;
}

interface ServicePricing {
  calmPricePerDay: number;
  cascoPricePerDay: number;
  fullCascoPricePerDay: number;
}

interface GroupTariff {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  startDayMonth: string | null;
  endDayMonth: string | null;
  prices: number[];
}

const BUCKET_LABELS = ['1-2 дня', '3-7 дней', '8-15 дней', '16-31 дней', '32+ дня'];

export default function CarsList({ initialCars }: CarsListProps) {
  const [cars] = useState<Car[]>(initialCars);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'year'>('id');
  const [selectedGroup, setSelectedGroup] = useState<CarGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'cars' | 'media'>('cars');
  const [groupMedia, setGroupMedia] = useState<
    Array<{
      id: string;
      type: 'image' | 'video';
      fileName: string;
      filePath: string;
      fileSize: number;
      order: number;
    }>
  >([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [rutubeUrl, setRutubeUrl] = useState('');
  const [savingRutubeLink, setSavingRutubeLink] = useState(false);
  const [deletingRutubeLink, setDeletingRutubeLink] = useState(false);
  const [groupPricing, setGroupPricing] = useState<ServicePricing>({
    calmPricePerDay: 2000,
    cascoPricePerDay: 1000,
    fullCascoPricePerDay: 3000,
  });
  const [savingGroupPricing, setSavingGroupPricing] = useState(false);
  const [groupTariffs, setGroupTariffs] = useState<GroupTariff[]>([]);
  const [loadingGroupTariffs, setLoadingGroupTariffs] = useState(false);
  const [savingGroupTariffs, setSavingGroupTariffs] = useState(false);
  const [groupTariffError, setGroupTariffError] = useState('');
  const imageMedia = useMemo(
    () => groupMedia.filter((item) => item.type === 'image'),
    [groupMedia]
  );

  // Group cars by model name
  const carGroups = useMemo(() => {
    const grouped = new Map<string, Car[]>();

    cars.forEach((car) => {
      // Create a unique key based on car name (without year)
      let key = '';
      if (car.car_name) {
        key = car.car_name.trim();
        // Remove year from car_name if it's at the end (e.g., "BMW X5 2020" -> "BMW X5")
        key = key.replace(/\s+\d{4}$/, '').trim();
      } else {
        const make = (car.make || '').trim();
        const model = (car.model || '').trim();
        key = `${make}_${model}`.trim();
      }

      if (!key && car.code) {
        key = car.code.split('_')[0] || car.code;
      }

      if (!key && car.id) {
        key = `car_${car.id}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(car);
    });

    // Convert to CarGroup array
    const groups: CarGroup[] = [];
    grouped.forEach((groupCars, key) => {
      const years = groupCars
        .map((c) => c.year)
        .filter((year): year is number => year !== undefined && year !== null)
        .sort((a, b) => a - b);

      const minYear = years[0];
      const maxYear = years[years.length - 1];
      const yearRange =
        years.length === 0
          ? ''
          : years.length === 1
            ? String(minYear)
            : minYear === maxYear
              ? String(minYear)
              : `${minYear}-${maxYear}`;

      const colors = new Set<string>();
      groupCars.forEach((c) => {
        if (c.color) {
          colors.add(c.color.trim());
        }
      });
      const uniqueColors = Array.from(colors).filter(Boolean);

      // Calculate price range
      let minPrice: number | null = null;
      let maxPrice: number | null = null;

      groupCars.forEach((car) => {
        if (car.prices && Array.isArray(car.prices) && car.prices.length > 0) {
          car.prices.forEach((priceItem) => {
            if (typeof priceItem === 'object' && priceItem.values) {
              priceItem.values.forEach((val) => {
                if (minPrice === null || val < minPrice) minPrice = val;
                if (maxPrice === null || val > maxPrice) maxPrice = val;
              });
            } else if (typeof priceItem === 'number') {
              if (minPrice === null || priceItem < minPrice)
                minPrice = priceItem;
              if (maxPrice === null || priceItem > maxPrice)
                maxPrice = priceItem;
            }
          });
        }
      });

      const firstCar = groupCars[0];
      const groupName =
        firstCar.car_name?.replace(/\s+\d{4}$/, '').trim() ||
        `${firstCar.make || ''} ${firstCar.model || ''}`.trim() ||
        firstCar.code ||
        `Car ${firstCar.id}`;

      groups.push({
        key,
        cars: groupCars,
        name: groupName,
        yearRange,
        uniqueColors,
        carType: firstCar.car_type,
        minPrice,
        maxPrice,
      });
    });

    return groups;
  }, [cars]);

  // Get unique car types from groups
  const carTypes = useMemo(() => {
    const types = new Set<string>();
    carGroups.forEach((group) => {
      if (group.carType) {
        types.add(group.carType);
      }
    });
    return Array.from(types).sort();
  }, [carGroups]);

  // Filter and sort car groups
  const filteredGroups = useMemo(() => {
    let filtered = [...carGroups];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (group) =>
          group.name.toLowerCase().includes(query) ||
          group.cars.some(
            (car) =>
              car.id?.toString().includes(query) ||
              car.color?.toLowerCase().includes(query) ||
              car.code?.toLowerCase().includes(query) ||
              car.number?.toLowerCase().includes(query)
          )
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((group) => group.carType === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'year': {
          const aYear = a.cars[0]?.year || 0;
          const bYear = b.cars[0]?.year || 0;
          return bYear - aYear;
        }
        case 'id':
        default: {
          const aId = a.cars[0]?.id || 0;
          const bId = b.cars[0]?.id || 0;
          return aId - bId;
        }
      }
    });

    return filtered;
  }, [carGroups, searchQuery, filterType, sortBy]);

  // Fetch media for selected group
  useEffect(() => {
    if (selectedGroup && isModalOpen && activeTab === 'media') {
      fetchGroupMedia(selectedGroup.key);
    }
  }, [selectedGroup, isModalOpen, activeTab]);

  // Fetch Rutube video link for selected group
  useEffect(() => {
    if (!selectedGroup || !isModalOpen || activeTab !== 'media') return;

    const encodedGroupKey = encodeURIComponent(selectedGroup.key);
    fetch(`/api/admin/cars/${encodedGroupKey}/video-link`)
      .then((res) => res.json())
      .then((data) => {
        setRutubeUrl(String(data?.url || ''));
      })
      .catch((error) => {
        console.error('Error fetching rutube link:', error);
        setRutubeUrl('');
      });
  }, [selectedGroup, isModalOpen, activeTab]);

  // Fetch per-group service pricing for selected group
  useEffect(() => {
    if (!selectedGroup || !isModalOpen || activeTab !== 'cars') return;

    const query = encodeURIComponent(selectedGroup.key);
    fetch(`/api/admin/car-service-pricing?groupKey=${query}`)
      .then((res) => res.json())
      .then((data) => {
        setGroupPricing({
          calmPricePerDay: Number(data?.calmPricePerDay ?? 2000),
          cascoPricePerDay: Number(data?.cascoPricePerDay ?? 1000),
          fullCascoPricePerDay: Number(data?.fullCascoPricePerDay ?? 3000),
        });
      })
      .catch((error) => {
        console.error('Error fetching service pricing:', error);
      });
  }, [selectedGroup, isModalOpen, activeTab]);

  // Fetch admin-managed group tariffs for selected group
  useEffect(() => {
    if (!selectedGroup || !isModalOpen || activeTab !== 'cars') return;

    let cancelled = false;
    setLoadingGroupTariffs(true);
    setGroupTariffError('');

    const encodedGroupKey = encodeURIComponent(selectedGroup.key);
    fetch(`/api/admin/car-group-pricing/${encodedGroupKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setGroupTariffs(Array.isArray(data?.tariffs) ? data.tariffs : []);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Error fetching group tariffs:', error);
        setGroupTariffError('Ошибка загрузки тарифов');
      })
      .finally(() => {
        if (!cancelled) setLoadingGroupTariffs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGroup, isModalOpen, activeTab]);

  const fetchGroupMedia = async (groupKey: string) => {
    setLoadingMedia(true);
    try {
      const encodedGroupKey = encodeURIComponent(groupKey);
      const response = await fetch(`/api/admin/cars/${encodedGroupKey}/media`);
      const data = await response.json();
      if (response.ok) {
        setGroupMedia(data.media || []);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleMediaUploadSuccess = () => {
    if (selectedGroup) {
      fetchGroupMedia(selectedGroup.key);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!selectedGroup) return;

    if (!confirm('Вы уверены, что хотите удалить этот файл?')) {
      return;
    }

    try {
      const encodedGroupKey = encodeURIComponent(selectedGroup.key);
      const response = await fetch(
        `/api/admin/cars/${encodedGroupKey}/media?id=${mediaId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setGroupMedia(groupMedia.filter((m) => m.id !== mediaId));
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при удалении файла');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Ошибка при удалении файла');
    }
  };

  const handleSetMainMedia = async (mediaId: string) => {
    if (!selectedGroup) return;

    try {
      const encodedGroupKey = encodeURIComponent(selectedGroup.key);
      const response = await fetch(`/api/admin/cars/${encodedGroupKey}/media`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaId }),
      });

      const data = await response.json();

      if (response.ok) {
        setGroupMedia(data.media || []);
      } else {
        alert(data.error || 'Ошибка при смене главного фото');
      }
    } catch (error) {
      console.error('Error setting main media:', error);
      alert('Ошибка при смене главного фото');
    }
  };

  const handleSaveRutubeLink = async () => {
    if (!selectedGroup) return;
    const encodedGroupKey = encodeURIComponent(selectedGroup.key);
    const url = rutubeUrl.trim();

    setSavingRutubeLink(true);
    try {
      const response = await fetch(`/api/admin/cars/${encodedGroupKey}/video-link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || 'Ошибка сохранения ссылки на видео');
      }
    } catch (error) {
      console.error('Error saving rutube link:', error);
      alert('Ошибка сохранения ссылки на видео');
    } finally {
      setSavingRutubeLink(false);
    }
  };

  const handleDeleteRutubeLink = async () => {
    if (!selectedGroup) return;
    const encodedGroupKey = encodeURIComponent(selectedGroup.key);

    setDeletingRutubeLink(true);
    try {
      const response = await fetch(`/api/admin/cars/${encodedGroupKey}/video-link`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || 'Ошибка удаления ссылки на видео');
        return;
      }
      setRutubeUrl('');
    } catch (error) {
      console.error('Error deleting rutube link:', error);
      alert('Ошибка удаления ссылки на видео');
    } finally {
      setDeletingRutubeLink(false);
    }
  };

  const handlePricingChange = (field: keyof ServicePricing, value: string) => {
    const parsed = Number(value.replace(/[^\d]/g, ''));
    setGroupPricing((prev) => ({
      ...prev,
      [field]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  const handleSavePricing = async () => {
    if (!selectedGroup?.key) return;

    setSavingGroupPricing(true);
    try {
      const response = await fetch('/api/admin/car-service-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupKey: selectedGroup.key,
          calmPricePerDay: groupPricing.calmPricePerDay,
          cascoPricePerDay: groupPricing.cascoPricePerDay,
          fullCascoPricePerDay: groupPricing.fullCascoPricePerDay,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || 'Ошибка сохранения цен услуг');
      }
    } catch (error) {
      console.error('Error saving service pricing:', error);
      alert('Ошибка сохранения цен услуг');
    } finally {
      setSavingGroupPricing(false);
    }
  };

  const normalizeDayMonthInput = (value: string): string => {
    const m = value.replace(/[^\d.]/g, '').match(/^(\d{1,2})\.?(\d{1,2})?$/);
    if (!m) return '';
    const day = (m[1] || '').slice(0, 2);
    const month = (m[2] || '').slice(0, 2);
    return month ? `${day}.${month}` : day;
  };

  const handleTariffFieldChange = (
    index: number,
    field: keyof GroupTariff,
    value: string | boolean
  ) => {
    setGroupTariffs((prev) => {
      if (field === 'isDefault') {
        return prev.map((tariff, i) => {
          const isDefault = i === index ? Boolean(value) : false;
          return {
            ...tariff,
            isDefault,
            startDayMonth: isDefault ? null : tariff.startDayMonth,
            endDayMonth: isDefault ? null : tariff.endDayMonth,
          };
        });
      }

      return prev.map((tariff, i) => {
        if (i !== index) return tariff;
        if (field === 'startDayMonth' || field === 'endDayMonth') {
          return {
            ...tariff,
            [field]:
              typeof value === 'string'
                ? normalizeDayMonthInput(value)
                : String(value),
          };
        }
        if (field === 'isActive') {
          return { ...tariff, isActive: Boolean(value) };
        }
        if (field === 'name') {
          return { ...tariff, name: String(value) };
        }
        return tariff;
      });
    });
  };

  const handleTariffPriceChange = (
    tariffIndex: number,
    bucketIndex: number,
    value: string
  ) => {
    const parsed = Number(value.replace(/[^\d]/g, ''));
    setGroupTariffs((prev) =>
      prev.map((tariff, i) => {
        if (i !== tariffIndex) return tariff;
        const prices = [...tariff.prices];
        prices[bucketIndex] = Number.isFinite(parsed) ? parsed : 0;
        while (prices.length < 5) prices.push(prices[prices.length - 1] || 0);
        return { ...tariff, prices: prices.slice(0, 5) };
      })
    );
  };

  const handleAddSeasonTariff = () => {
    setGroupTariffs((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        name: `Сезон ${prev.filter((t) => !t.isDefault).length + 1}`,
        isDefault: false,
        isActive: true,
        order: prev.length,
        startDayMonth: '',
        endDayMonth: '',
        prices: [0, 0, 0, 0, 0],
      },
    ]);
  };

  const handleRemoveTariff = (index: number) => {
    setGroupTariffs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveTariff = (index: number, direction: -1 | 1) => {
    setGroupTariffs((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = temp;
      return next.map((item, i) => ({ ...item, order: i }));
    });
  };

  const handleSaveGroupTariffs = async () => {
    if (!selectedGroup?.key) return;
    setGroupTariffError('');

    const activeDefaults = groupTariffs.filter((t) => t.isActive && t.isDefault);
    if (activeDefaults.length !== 1) {
      setGroupTariffError('Должен быть ровно один активный базовый тариф');
      return;
    }

    setSavingGroupTariffs(true);
    try {
      const encodedGroupKey = encodeURIComponent(selectedGroup.key);
      const payload = groupTariffs.map((tariff, idx) => ({
        id: tariff.id,
        name: tariff.name,
        isDefault: tariff.isDefault,
        isActive: tariff.isActive,
        order: idx,
        startDayMonth: tariff.isDefault ? null : tariff.startDayMonth || null,
        endDayMonth: tariff.isDefault ? null : tariff.endDayMonth || null,
        prices: tariff.prices,
      }));

      const response = await fetch(
        `/api/admin/car-group-pricing/${encodedGroupKey}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tariffs: payload }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setGroupTariffError(data?.error || 'Ошибка сохранения тарифов');
        return;
      }
      setGroupTariffs(Array.isArray(data?.tariffs) ? data.tariffs : []);
    } catch (error) {
      console.error('Error saving group tariffs:', error);
      setGroupTariffError('Ошибка сохранения тарифов');
    } finally {
      setSavingGroupTariffs(false);
    }
  };

  const getColorClass = (color?: string): string => {
    if (!color) return 'bg-gray-300';
    const colorLower = color.toLowerCase();
    if (colorLower.includes('белый') || colorLower.includes('white'))
      return 'bg-white border border-gray-300';
    if (colorLower.includes('черный') || colorLower.includes('black'))
      return 'bg-black';
    if (
      colorLower.includes('серый') ||
      colorLower.includes('gray') ||
      colorLower.includes('grey')
    )
      return 'bg-gray-500';
    if (colorLower.includes('серебристый') || colorLower.includes('silver'))
      return 'bg-gray-400';
    if (colorLower.includes('красный') || colorLower.includes('red'))
      return 'bg-red-600';
    if (colorLower.includes('синий') || colorLower.includes('blue'))
      return 'bg-blue-600';
    if (colorLower.includes('зеленый') || colorLower.includes('green'))
      return 'bg-green-600';
    if (colorLower.includes('желтый') || colorLower.includes('yellow'))
      return 'bg-yellow-400';
    if (colorLower.includes('оранжевый') || colorLower.includes('orange'))
      return 'bg-orange-500';
    if (colorLower.includes('коричневый') || colorLower.includes('brown'))
      return 'bg-amber-800';
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full min-w-0">
      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Поиск по названию, ID, цвету..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter by Type */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-filter text-gray-400"></i>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none cursor-pointer"
            >
              <option value="all">Все типы</option>
              {carTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>

          {/* Sort */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-sort text-gray-400"></i>
            </div>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'id' | 'name' | 'year')
              }
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none cursor-pointer"
            >
              <option value="id">По ID</option>
              <option value="name">По названию</option>
              <option value="year">По году</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <i className="fas fa-chevron-down text-gray-400"></i>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Найдено:{' '}
          <span className="font-semibold text-indigo-600">
            {filteredGroups.length}
          </span>{' '}
          групп из <span className="font-semibold">{carGroups.length}</span> (
          <span className="font-semibold">{cars.length}</span> автомобилей)
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        {filteredGroups.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <i className="fas fa-car text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 text-lg">Автомобили не найдены</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-hashtag mr-2"></i>ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-car mr-2"></i>Автомобиль
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-tag mr-2"></i>Тип
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-calendar mr-2"></i>Годы
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-palette mr-2"></i>Цвета
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-ruble-sign mr-2"></i>Цена
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-list mr-2"></i>Количество
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <i className="fas fa-cog mr-2"></i>Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGroups.map((group) => {
                const firstCar = group.cars[0];
                return (
                  <tr
                    key={group.key}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        #{firstCar.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {(firstCar.image || firstCar.avatar_url) && (
                          <img
                            src={getServerImageUrl(
                              firstCar.image || firstCar.avatar_url
                            )}
                            alt={group.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/img/no-image.png';
                            }}
                          />
                        )}
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {group.name}
                          </div>
                          {firstCar.code && (
                            <div className="text-xs text-gray-500 mt-1">
                              Код: {firstCar.code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        <i className="fas fa-tag mr-1"></i>
                        {group.carType || 'Не указано'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {group.yearRange || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {group.uniqueColors.slice(0, 5).map((color, idx) => (
                          <span
                            key={idx}
                            className={`w-6 h-6 rounded-full border border-gray-300 ${getColorClass(color)}`}
                            title={color}
                          ></span>
                        ))}
                        {group.uniqueColors.length > 5 && (
                          <span className="text-xs text-gray-500 ml-1">
                            +{group.uniqueColors.length - 5}
                          </span>
                        )}
                        {group.uniqueColors.length === 0 && (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {group.minPrice !== null ? (
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">
                            от {group.minPrice.toLocaleString('ru-RU')} ₽
                          </div>
                          {group.maxPrice !== null &&
                            group.maxPrice !== group.minPrice && (
                              <div className="text-xs text-gray-500">
                                до {group.maxPrice.toLocaleString('ru-RU')} ₽
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {group.cars.length}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setActiveTab('cars');
                            setIsModalOpen(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors gap-2"
                        >
                          <i className="fas fa-list"></i>
                          Все ({group.cars.length})
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedGroup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 z-[2000] flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  {selectedGroup.cars.length} автомобилей в группе
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-xl text-black"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('cars')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'cars'
                        ? 'text-gray-900 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <i className="fas fa-car mr-2"></i>
                    Автомобили
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('media');
                      if (selectedGroup) {
                        fetchGroupMedia(selectedGroup.key);
                      }
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'media'
                        ? 'text-gray-900 border-b-2 border-indigo-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <i className="fas fa-images mr-2"></i>
                    Медиа
                  </button>
                </div>
              </div>

              {/* Cars Tab */}
              {activeTab === 'cars' && (
                <div>
                  <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-indigo-900">
                        Тарифы аренды группы (базовый + сезонные)
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAddSeasonTariff}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-indigo-700 border border-indigo-300 rounded-lg bg-white hover:bg-indigo-100"
                        >
                          <i className="fas fa-plus"></i>
                          Добавить сезон
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveGroupTariffs}
                          disabled={savingGroupTariffs || loadingGroupTariffs}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {savingGroupTariffs ? 'Сохранение...' : 'Сохранить тарифы'}
                        </button>
                      </div>
                    </div>

                    {groupTariffError && (
                      <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {groupTariffError}
                      </div>
                    )}

                    {loadingGroupTariffs ? (
                      <div className="py-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-indigo-600"></div>
                        <p className="text-xs text-gray-600 mt-2">Загрузка тарифов...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {groupTariffs.map((tariff, tariffIndex) => (
                          <div
                            key={tariff.id || `${tariffIndex}`}
                            className="rounded-lg border border-indigo-200 bg-white p-3"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                              <div className="md:col-span-3">
                                <label className="block text-[11px] text-gray-700 mb-1">
                                  Название
                                </label>
                                <input
                                  type="text"
                                  value={tariff.name}
                                  onChange={(e) =>
                                    handleTariffFieldChange(
                                      tariffIndex,
                                      'name',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-md"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-[11px] text-gray-700 mb-1">
                                  С
                                </label>
                                <input
                                  type="text"
                                  placeholder="DD.MM"
                                  value={tariff.startDayMonth || ''}
                                  disabled={tariff.isDefault}
                                  onChange={(e) =>
                                    handleTariffFieldChange(
                                      tariffIndex,
                                      'startDayMonth',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-md disabled:bg-gray-100"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-[11px] text-gray-700 mb-1">
                                  По
                                </label>
                                <input
                                  type="text"
                                  placeholder="DD.MM"
                                  value={tariff.endDayMonth || ''}
                                  disabled={tariff.isDefault}
                                  onChange={(e) =>
                                    handleTariffFieldChange(
                                      tariffIndex,
                                      'endDayMonth',
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-md disabled:bg-gray-100"
                                />
                              </div>

                              <div className="md:col-span-2">
                                <label className="block text-[11px] text-gray-700 mb-1">
                                  Базовый
                                </label>
                                <input
                                  type="checkbox"
                                  checked={tariff.isDefault}
                                  onChange={(e) =>
                                    handleTariffFieldChange(
                                      tariffIndex,
                                      'isDefault',
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                              </div>
                              <div className="md:col-span-1">
                                <label className="block text-[11px] text-gray-700 mb-1">
                                  Активен
                                </label>
                                <input
                                  type="checkbox"
                                  checked={tariff.isActive}
                                  onChange={(e) =>
                                    handleTariffFieldChange(
                                      tariffIndex,
                                      'isActive',
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4"
                                />
                              </div>

                              <div className="md:col-span-2 flex items-center gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleMoveTariff(tariffIndex, -1)}
                                  className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50"
                                  title="Вверх"
                                >
                                  <i className="fas fa-arrow-up"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTariff(tariffIndex, 1)}
                                  className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50"
                                  title="Вниз"
                                >
                                  <i className="fas fa-arrow-down"></i>
                                </button>
                                {!tariff.isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTariff(tariffIndex)}
                                    className="px-2 py-1 text-xs border border-red-200 text-red-600 rounded-md hover:bg-red-50"
                                    title="Удалить"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
                              {BUCKET_LABELS.map((label, bucketIndex) => (
                                <div key={`${tariff.id}-${label}`}>
                                  <label className="block text-[11px] text-gray-700 mb-1">
                                    {label}
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={tariff.prices?.[bucketIndex] ?? 0}
                                    onChange={(e) =>
                                      handleTariffPriceChange(
                                        tariffIndex,
                                        bucketIndex,
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2.5 py-2 text-xs border border-gray-300 rounded-md"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {groupTariffs.length === 0 && (
                          <div className="rounded-lg border border-dashed border-indigo-300 p-4 text-xs text-indigo-700 bg-white">
                            Тарифы не найдены. Добавьте базовый и сезонные тарифы.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="text-sm font-semibold text-indigo-900 mb-3">
                      Цены услуг для всей группы (за сутки)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          Спокойствие
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={groupPricing.calmPricePerDay}
                          onChange={(e) =>
                            handlePricingChange('calmPricePerDay', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          КАСКО
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={groupPricing.cascoPricePerDay}
                          onChange={(e) =>
                            handlePricingChange('cascoPricePerDay', e.target.value)
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          Полное КАСКО
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={groupPricing.fullCascoPricePerDay}
                          onChange={(e) =>
                            handlePricingChange(
                              'fullCascoPricePerDay',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSavePricing}
                      disabled={savingGroupPricing}
                      className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {savingGroupPricing ? 'Сохранение...' : 'Сохранить цены группы'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {selectedGroup.cars.map((car) => (
                      <div
                        key={car.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                        {(car.image || car.avatar_url) && (
                          <img
                            src={getServerImageUrl(car.image || car.avatar_url)}
                            alt={car.car_name || 'Car'}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/img/no-image.png';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 mb-1">
                            {car.car_name || car.code || `ID: ${car.id}`}
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            {car.id && (
                              <div>
                                <span className="font-medium">ID:</span>{' '}
                                {car.id}
                              </div>
                            )}
                            {car.year && (
                              <div>
                                <span className="font-medium">Год:</span>{' '}
                                {car.year}
                              </div>
                            )}
                            {car.color && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Цвет:</span>
                                <span
                                  className={`w-4 h-4 rounded-full border border-gray-300 ${getColorClass(car.color)}`}
                                  title={car.color}
                                ></span>
                                <span>{car.color}</span>
                              </div>
                            )}
                            {car.code && (
                              <div>
                                <span className="font-medium">Код:</span>{' '}
                                {car.code}
                              </div>
                            )}
                            {car.number && (
                              <div>
                                <span className="font-medium">Номер:</span>{' '}
                                {car.number}
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <Link
                              href={`/product/${car.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors gap-2"
                            >
                              <i className="fas fa-external-link-alt"></i>
                              Просмотр
                            </Link>
                          </div>
                        </div>
                      </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Изображения и видео-ссылка
                  </h3>

                  <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Ссылка на видео RuTube (для всей группы)
                    </label>
                    <div className="flex flex-col md:flex-row gap-2">
                      <input
                        type="url"
                        placeholder="https://rutube.ru/video/..."
                        value={rutubeUrl}
                        onChange={(e) => setRutubeUrl(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleSaveRutubeLink}
                        disabled={savingRutubeLink || !rutubeUrl.trim()}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {savingRutubeLink ? 'Сохранение...' : 'Сохранить ссылку'}
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteRutubeLink}
                        disabled={deletingRutubeLink || !rutubeUrl.trim()}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60"
                      >
                        {deletingRutubeLink ? 'Удаление...' : 'Удалить ссылку'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Загрузка видеофайла отключена. Используется только ссылка RuTube.
                    </p>
                  </div>

                  {/* Upload Component */}
                  <div className="mb-6">
                    <MediaUpload
                      groupKey={selectedGroup.key}
                      onUploadSuccess={handleMediaUploadSuccess}
                    />
                  </div>

                  {/* Media Gallery */}
                  {loadingMedia ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                      <p className="text-sm text-gray-600 mt-2">Загрузка...</p>
                    </div>
                  ) : imageMedia.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-images text-4xl mb-2"></i>
                      <p>Изображения не загружены</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imageMedia.map((media) => {
                        const firstImage = imageMedia.find(
                          (item) => item.type === 'image'
                        );
                        const isMainImage =
                          media.type === 'image' && firstImage?.id === media.id;

                        return (
                          <div
                            key={media.id}
                            className="relative group border border-gray-200 rounded-lg overflow-hidden"
                          >
                            {isMainImage && (
                              <div className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-indigo-600 text-white text-[11px] font-medium">
                                Главное
                              </div>
                            )}
                            <img
                              src={getServerImageUrl(media.filePath)}
                              alt={media.fileName}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  '/img/no-image.png';
                              }}
                            />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex flex-col gap-2">
                              {!isMainImage && (
                                <button
                                  onClick={() => handleSetMainMedia(media.id)}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                >
                                  <i className="fas fa-star"></i>
                                  Сделать главным
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMedia(media.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                              >
                                <i className="fas fa-trash"></i>
                                Удалить
                              </button>
                            </div>
                          </div>
                          <div className="p-2 bg-white">
                            <p className="text-xs text-gray-600 truncate">
                              {media.fileName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {(media.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
