'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import MainTemplate from '@/components/common/main-template/main-template';
import SearchHeader from './components/search-header';
import ProductCard from '@/components/common/product-card/product-card';
import CatalogTabs from '@/components/common/catalog-tabs/catalog-tabs';
import RentalInfo from '@/components/common/rental-info/rental-info';
import { getFreeCars } from '@/app/actions/cars';
import type { Car } from '@/lib/rentprog-api-server';
import { useAppSelector } from '@/store/store';
import { useSearchParams } from 'next/navigation';
import { calculateExtraTimeFee } from '@/lib/business-hours-fee';
import {
  getExtraMileageFee,
  getExtraMileageKm,
  getIncludedMileageLimit,
  parseMileageInput,
} from '@/lib/mileage-pricing';
import {
  getPriceForDaysByBuckets,
  resolveTariffPricesForDate,
  type GroupTariffPricing,
} from '@/lib/group-pricing-client';

function normalizeCarType(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'минивен') return 'минивэн';
  return normalized;
}

// Цена на карточке отображается как "от X ₽".
// Для сортировки берём именно минимальное значение цены из car.prices/price_from,
// чтобы группировки и порядок были согласованы с тем, что видит пользователь.
function getCarMinDisplayedPrice(car: Car): number {
  const pricesArray = car.prices || car.price;

  if (Array.isArray(pricesArray) && pricesArray.length > 0) {
    if (typeof pricesArray[0] === 'object' && pricesArray[0] !== null) {
      let minPrice: number | null = null;

      for (const priceItem of pricesArray as any[]) {
        if (
          priceItem &&
          typeof priceItem === 'object' &&
          'values' in priceItem &&
          Array.isArray(priceItem.values) &&
          priceItem.values.length > 0
        ) {
          const values = priceItem.values.filter(
            (v: any) => typeof v === 'number' && Number.isFinite(v)
          ) as number[];
          if (values.length === 0) continue;

          const itemMin = Math.min(...values);
          if (minPrice === null || itemMin < minPrice) minPrice = itemMin;
        }
      }

      return minPrice ?? Infinity;
    }

    if (typeof pricesArray[0] === 'number') {
      const nums = (pricesArray as unknown as number[]).filter((v) =>
        Number.isFinite(v)
      );
      return nums.length ? Math.min(...nums) : Infinity;
    }
  }

  if (typeof car.price === 'number' && Number.isFinite(car.price)) {
    return car.price > 0 ? car.price : Infinity;
  }

  if (typeof car.price_from === 'string') {
    const parsed = Number(car.price_from.replace(/[^\d]/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : Infinity;
  }

  return Infinity;
}

function getGroupMinDisplayedPrice(cars: Car[]): number {
  const values = cars
    .map((car) => getCarMinDisplayedPrice(car))
    .filter((v) => Number.isFinite(v));
  return values.length > 0 ? Math.min(...values) : Infinity;
}

function extractFivePricesForSort(car: Car): number[] {
  const pricesArray = car.prices || car.price;

  if (Array.isArray(pricesArray) && pricesArray.length > 0) {
    if (
      typeof pricesArray[0] === 'object' &&
      pricesArray[0] !== null &&
      'values' in pricesArray[0]
    ) {
      const firstItem = pricesArray[0] as { values?: number[] };
      if (Array.isArray(firstItem.values) && firstItem.values.length > 0) {
        const values = firstItem.values.filter(
          (v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0
        );
        if (values.length > 0) {
          const padded = [...values];
          while (padded.length < 5) padded.push(padded[padded.length - 1] || 0);
          return padded.slice(0, 5);
        }
      }
    }

    if (typeof pricesArray[0] === 'number') {
      const nums = (pricesArray as unknown as number[]).filter(
        (v) => Number.isFinite(v) && v > 0
      );
      if (nums.length > 0) {
        const padded = [...nums];
        while (padded.length < 5) padded.push(padded[padded.length - 1] || 0);
        return padded.slice(0, 5);
      }
    }
  }

  if (typeof car.price === 'number' && Number.isFinite(car.price) && car.price > 0) {
    return [car.price, car.price, car.price, car.price, car.price];
  }

  if (typeof car.price_from === 'string') {
    const parsed = Number(car.price_from.replace(/[^\d]/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) {
      return [parsed, parsed, parsed, parsed, parsed];
    }
  }

  return [Infinity, Infinity, Infinity, Infinity, Infinity];
}

function getFinalCardTotalForSort(
  car: Car,
  rentalDays: number,
  requestedMileage: number,
  extraTimeFeeAmount: number,
  overridePrices?: number[]
): number {
  if (!rentalDays || rentalDays < 1) return Infinity;

  const prices =
    Array.isArray(overridePrices) && overridePrices.length > 0
      ? overridePrices
      : extractFivePricesForSort(car);
  const dailyPrice = getPriceForDaysByBuckets(prices, rentalDays);
  if (!Number.isFinite(dailyPrice) || dailyPrice <= 0) return Infinity;

  const rentalTotal = dailyPrice * rentalDays;
  const includedMileage = getIncludedMileageLimit(rentalDays, car.extra_mileage_km);
  const extraMileageKm = getExtraMileageKm(requestedMileage, includedMileage);
  const extraMileageFee = getExtraMileageFee(extraMileageKm, car.extra_mileage_price);

  return rentalTotal + extraTimeFeeAmount + extraMileageFee;
}

function SearchPage() {
  const searchParams = useSearchParams();
  const { cars: allCars } = useAppSelector((state) => state.cars);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState<string[]>(['all']);
  const [groupPricingMap, setGroupPricingMap] = useState<
    Record<string, GroupTariffPricing[]>
  >({});
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);
  const lastAutoScrollKeyRef = useRef('');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const mileageParam = searchParams.get('mileage') || '';
  const requestedMileage = useMemo(
    () => parseMileageInput(searchParams.get('mileage')),
    [searchParams]
  );

  // Merge freeCars with allCars data by id
  const mergeCarsData = (freeCars: Car[], allCars: Car[]): Car[] => {
    // Create a map of allCars by id for quick lookup
    const allCarsMap = new Map<number, Car>();
    allCars.forEach((car) => {
      if (car.id) {
        allCarsMap.set(car.id, car);
      }
    });

    // Merge freeCars with allCars data
    return freeCars.map((freeCar) => {
      if (freeCar.id && allCarsMap.has(freeCar.id)) {
        // Merge: freeCar data takes precedence for availability info,
        // but allCars provides complete car details
        const fullCarData = allCarsMap.get(freeCar.id)!;
        return {
          ...fullCarData, // Start with full car data
          ...freeCar, // Override with freeCar data (availability info)
          // Preserve important fields from fullCarData that might not be in freeCar
          prices: fullCarData.prices || freeCar.prices,
          price_from: fullCarData.price_from || freeCar.price_from,
        };
      }
      // If car not found in allCars, return freeCar as is
      return freeCar;
    });
  };

  useEffect(() => {
    const fetchCars = async () => {
      if (!startDate || !endDate) {
        setError('Пожалуйста, укажите даты начала и окончания');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const freeCars = await getFreeCars(startDate, endDate);

        // Merge freeCars with allCars to get complete car information
        const mergedCars =
          allCars.length > 0 ? mergeCarsData(freeCars, allCars) : freeCars;

        setCars(mergedCars);
      } catch (err: any) {
        console.error('Error fetching free cars:', err);
        setError('Не удалось загрузить автомобили');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [startDate, endDate, allCars]);

  // Calculate number of days between start_date and end_date
  const calculateDays = (
    startDateStr: string | null,
    endDateStr: string | null
  ): number => {
    if (!startDateStr || !endDateStr) return 0;

    try {
      const parseDate = (dateStr: string): Date => {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart
          ? timePart.split(':').map(Number)
          : [0, 0];
        return new Date(year, month - 1, day, hours, minutes);
      };

      const start = parseDate(startDateStr);
      const end = parseDate(endDateStr);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.error('Error calculating days:', error);
      return 0;
    }
  };

  const rentalDays = useMemo(
    () => calculateDays(startDate, endDate),
    [startDate, endDate]
  );

  // Group cars by model/name (same car, different colors and years)
  const getCarGroupKey = (car: Car): string => {
    let key = '';
    if (car.car_name) {
      key = car.car_name.trim();
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

    return key;
  };

  const groupCarsByModel = (cars: Car[]): Car[][] => {
    const grouped = new Map<string, Car[]>();

    cars.forEach((car) => {
      const key = getCarGroupKey(car);

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(car);
    });

    return Array.from(grouped.values());
  };

  // Helper function to get unique colors from car group
  const getUniqueColors = (carGroup: Car[]): string[] => {
    const colors = new Set<string>();
    carGroup.forEach((car) => {
      if (car.color) {
        colors.add(car.color.trim());
      }
    });
    return Array.from(colors).filter(Boolean);
  };

  // Helper function to get year range from car group
  const getYearRange = (carGroup: Car[]): string => {
    const years = carGroup
      .map((car) => car.year)
      .filter((year): year is number => year !== undefined && year !== null)
      .sort((a, b) => a - b);

    if (years.length === 0) return '';
    if (years.length === 1) return String(years[0]);

    const minYear = years[0];
    const maxYear = years[years.length - 1];

    if (minYear === maxYear) {
      return String(minYear);
    }

    return `${minYear}-${maxYear}`;
  };

  // Get unique car types from cars data
  const getCarTypes = (carsData: Car[]): string[] => {
    const types = new Set<string>();
    carsData.forEach((car) => {
      if (car.car_type && car.car_type.trim()) {
        types.add(normalizeCarType(car.car_type));
      }
    });
    return Array.from(types).sort();
  };

  // Generate tabs dynamically from car types (memoized)
  const tabs = useMemo(
    () => [
      { id: 'all', label: 'Все' },
      ...getCarTypes(cars).map((carType) => ({
        id: carType,
        label: carType,
      })),
    ],
    [cars]
  );

  // Filter cars by active tabs (using car_type)
  const filteredCars = useMemo(() => {
    if (activeTabs.includes('all')) {
      return cars;
    }
    return cars.filter(
      (car) => car.car_type && activeTabs.includes(normalizeCarType(car.car_type))
    );
  }, [cars, activeTabs]);

  const filteredGroupKeys = useMemo(() => {
    const keys = new Set<string>();
    filteredCars.forEach((car) => {
      keys.add(getCarGroupKey(car));
    });
    return Array.from(keys).filter(Boolean);
  }, [filteredCars]);

  const isPricingRequired = Boolean(startDate && endDate && rentalDays > 0);
  const missingPricingKeys = useMemo(
    () =>
      isPricingRequired
        ? filteredGroupKeys.filter((key) => groupPricingMap[key] === undefined)
        : [],
    [isPricingRequired, filteredGroupKeys, groupPricingMap]
  );
  const pricingReady = !isPricingRequired || missingPricingKeys.length === 0;

  useEffect(() => {
    if (!isPricingRequired || missingPricingKeys.length === 0) return;

    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        missingPricingKeys.map(async (groupKey) => {
          try {
            const encodedGroupKey = encodeURIComponent(groupKey);
            const response = await fetch(`/api/cars/pricing/${encodedGroupKey}`);
            const data = await response.json();
            const tariffs = Array.isArray(data?.tariffs)
              ? (data.tariffs as GroupTariffPricing[])
              : [];
            return [groupKey, tariffs] as const;
          } catch (error) {
            console.error('Failed to fetch group pricing for sort:', error);
            return [groupKey, [] as GroupTariffPricing[]] as const;
          }
        })
      );

      if (cancelled) return;

      setGroupPricingMap((prev) => {
        const next = { ...prev };
        entries.forEach(([groupKey, tariffs]) => {
          next[groupKey] = tariffs;
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [isPricingRequired, missingPricingKeys]);

  const allCarsByGroup = useMemo(() => {
    const grouped = new Map<string, Car[]>();
    allCars.forEach((car) => {
      const key = getCarGroupKey(car);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(car);
    });
    return grouped;
  }, [allCars]);

  const extraTimeFeeInfo = useMemo(() => {
    return calculateExtraTimeFee(startDate, endDate);
  }, [startDate, endDate]);
  const extraTimeFeeAmount = extraTimeFeeInfo.totalFee;

  const groupedCarsData = useMemo(() => {
    const grouped = groupCarsByModel(filteredCars);

    const resolveGroupDailyPrice = (groupKey: string, groupCars: Car[]): number => {
      const fallbackMin = getGroupMinDisplayedPrice(groupCars);
      if (!startDate || rentalDays <= 0) {
        return fallbackMin;
      }

      const tariffs = groupPricingMap[groupKey];
      if (!Array.isArray(tariffs) || tariffs.length === 0) {
        return fallbackMin;
      }

      const pricesByDate = resolveTariffPricesForDate(tariffs, startDate);
      const selectedPrice = getPriceForDaysByBuckets(pricesByDate, rentalDays);
      if (Number.isFinite(selectedPrice) && selectedPrice > 0) {
        return selectedPrice;
      }
      return fallbackMin;
    };

    const rows = grouped.map((carGroup) => {
      const mainCar = carGroup[0];
      const groupKey = getCarGroupKey(mainCar);
      const fullCarGroup = allCarsByGroup.get(groupKey) || carGroup;
      const tariffs = groupPricingMap[groupKey];
      const resolvedTariffPrices =
        startDate &&
        rentalDays > 0 &&
        Array.isArray(tariffs) &&
        tariffs.length > 0
          ? resolveTariffPricesForDate(tariffs, startDate)
          : null;
      const resolvedDailyPrice = resolvedTariffPrices
        ? getPriceForDaysByBuckets(resolvedTariffPrices, rentalDays)
        : resolveGroupDailyPrice(groupKey, fullCarGroup);
      const sortTotal = getFinalCardTotalForSort(
        mainCar,
        rentalDays,
        requestedMileage,
        extraTimeFeeAmount,
        resolvedTariffPrices || undefined
      );
      return {
        groupKey,
        mainCar,
        fullCarGroup,
        resolvedTariffPrices,
        resolvedDailyPrice,
        sortTotal,
      };
    });

    rows.sort((a, b) => {
      if (a.sortTotal !== b.sortTotal) {
        return a.sortTotal - b.sortTotal;
      }
      return (a.mainCar.car_name || '').localeCompare(
        b.mainCar.car_name || '',
        'ru-RU'
      );
    });

    return rows;
  }, [
    filteredCars,
    allCarsByGroup,
    startDate,
    rentalDays,
    requestedMileage,
    extraTimeFeeAmount,
    groupPricingMap,
  ]);

  // Calculate included mileage (200 km per day)
  const includedMileage = useMemo(() => {
    const dailyMileageLimit = 200; // km per day
    return rentalDays * dailyMileageLimit;
  }, [rentalDays]);

  useEffect(() => {
    if (loading || !pricingReady || !startDate || !endDate) return;

    const searchKey = `${startDate}|${endDate}|${mileageParam}`;
    if (lastAutoScrollKeyRef.current === searchKey) return;

    const anchor = resultsAnchorRef.current;
    if (!anchor) return;

    lastAutoScrollKeyRef.current = searchKey;
    requestAnimationFrame(() => {
      const top = anchor.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({
        top: Math.max(top, 0),
        behavior: 'smooth',
      });
    });
  }, [loading, pricingReady, startDate, endDate, mileageParam]);

  return (
    <MainTemplate headerAnimation={false} headerConent={<SearchHeader />}>
      <div className="catalog-wrap">
        <div className="container">
          <div className="found" id="search-results" ref={resultsAnchorRef}>
            <h3>найдено автомобилей</h3>
            <span className="num">{groupedCarsData.length}</span>
          </div>
          <CatalogTabs
            tabs={tabs}
            activeTabs={activeTabs}
            onTabChange={setActiveTabs}
          />
          <div className="found-tab-wrap">
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Загрузка автомобилей...</p>
              </div>
            )}
            {error && (
              <div
                style={{ textAlign: 'center', padding: '40px', color: 'red' }}
              >
                <p>{error}</p>
              </div>
            )}
            {!loading && !error && !pricingReady && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>Загружаем тарифы...</p>
              </div>
            )}
            {!loading && !error && (
              <>
                {pricingReady && groupedCarsData.length > 0 ? (
                  groupedCarsData.map((row, index) => {
                    return (
                      <div key={row.mainCar.id || row.mainCar.car_name || index}>
                        <ProductCard
                          car={row.mainCar}
                          cars={row.fullCarGroup}
                          index={index}
                          yearRange={getYearRange(row.fullCarGroup)}
                          uniqueColors={getUniqueColors(row.fullCarGroup)}
                          resolvedDailyPrice={row.resolvedDailyPrice}
                          otherInfo={
                            <RentalInfo
                              car={
                                row.resolvedTariffPrices
                                  ? ({
                                      ...row.mainCar,
                                      prices: [
                                        {
                                          values: row.resolvedTariffPrices,
                                        } as any,
                                      ],
                                    } as Car)
                                  : row.mainCar
                              }
                              rentalDays={rentalDays}
                              includedMileage={includedMileage}
                              requestedMileage={requestedMileage}
                              startDateTime={startDate}
                              endDateTime={endDate}
                              extraTimeFeeAmount={extraTimeFeeAmount}
                            />
                          }
                        />
                      </div>
                    );
                  })
                ) : pricingReady ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Автомобили не найдены</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </MainTemplate>
  );
}

export default SearchPage;
