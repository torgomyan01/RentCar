'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Car } from '@/lib/rentprog-api-server';
import MediaUpload from './media-upload';

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
    }>
  >([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      <div className="overflow-x-auto">
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center">
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
                            src={firstCar.image || firstCar.avatar_url}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {selectedGroup.cars.map((car) => (
                    <div
                      key={car.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {(car.image || car.avatar_url) && (
                          <img
                            src={car.image || car.avatar_url}
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
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Медиа файлы
                  </h3>

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
                  ) : groupMedia.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-images text-4xl mb-2"></i>
                      <p>Медиа файлы не загружены</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {groupMedia.map((media) => (
                        <div
                          key={media.id}
                          className="relative group border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {media.type === 'image' ? (
                            <img
                              src={media.filePath}
                              alt={media.fileName}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  '/img/no-image.png';
                              }}
                            />
                          ) : (
                            <video
                              src={media.filePath}
                              className="w-full h-48 object-cover"
                              controls
                            />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => handleDeleteMedia(media.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                              <i className="fas fa-trash"></i>
                              Удалить
                            </button>
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
                      ))}
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
