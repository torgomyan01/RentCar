'use client';

import { useState, useEffect, useMemo } from 'react';
import MainTemplate from '@/components/common/main-template/main-template';
import SearchHeader from './components/search-header';
import ProductCard from '@/components/common/product-card/product-card';
import CatalogTabs from '@/components/common/catalog-tabs/catalog-tabs';
import RentalInfo from '@/components/common/rental-info/rental-info';
import { getFreeCars } from '@/app/actions/cars';
import type { Car } from '@/lib/rentprog-api-server';
import { useAppSelector } from '@/store/store';
import { useSearchParams } from 'next/navigation';

function SearchPage() {
  const searchParams = useSearchParams();
  const { cars: allCars } = useAppSelector((state) => state.cars);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState<string[]>(['all']);
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

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
        types.add(car.car_type.trim());
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
      (car) => car.car_type && activeTabs.includes(car.car_type)
    );
  }, [cars, activeTabs]);

  const groupedCars = useMemo(
    () => groupCarsByModel(filteredCars),
    [filteredCars]
  );
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

  // Calculate number of days between start_date and end_date
  const calculateDays = (
    startDateStr: string | null,
    endDateStr: string | null
  ): number => {
    if (!startDateStr || !endDateStr) return 0;

    try {
      // Parse date from format "DD-MM-YYYY H:mm"
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

      // Calculate difference in milliseconds
      const diffTime = end.getTime() - start.getTime();

      // Convert to days (round up to include partial days)
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

  const hasExtraTimeFee = useMemo(() => {
    const parseTimeToMinutes = (dateTime?: string | null): number | null => {
      if (!dateTime) return null;
      const timePart = dateTime.trim().split(' ').pop() || '';
      const match = timePart.match(/^(\d{1,2})[:.](\d{2})$/);
      if (!match) return null;
      const h = Number(match[1]);
      const m = Number(match[2]);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
      if (h < 0 || h > 23 || m < 0 || m > 59) return null;
      return h * 60 + m;
    };

    const startMinutes = parseTimeToMinutes(startDate);
    const endMinutes = parseTimeToMinutes(endDate);
    if (startMinutes === null || endMinutes === null) return false;

    const businessStart = 9 * 60;
    const businessEnd = 18 * 60;
    const isOutside = (minutes: number) =>
      minutes < businessStart || minutes > businessEnd;

    return isOutside(startMinutes) || isOutside(endMinutes);
  }, [startDate, endDate]);

  // Calculate included mileage (200 km per day)
  const includedMileage = useMemo(() => {
    const dailyMileageLimit = 200; // km per day
    return rentalDays * dailyMileageLimit;
  }, [rentalDays]);

  return (
    <MainTemplate headerAnimation={false} headerConent={<SearchHeader />}>
      <div className="catalog-wrap">
        <div className="container">
          <div className="found">
            <h3>найдено автомобилей</h3>
            <span className="num">{groupedCars.length}</span>
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
            {!loading && !error && (
              <>
                {groupedCars.length > 0 ? (
                  groupedCars.map((carGroup, index) => {
                    const mainCar = carGroup[0];
                    const groupKey = getCarGroupKey(mainCar);
                    const fullCarGroup = allCarsByGroup.get(groupKey) || carGroup;

                    return (
                      <div key={mainCar.id || mainCar.car_name || index}>
                        <ProductCard
                          car={mainCar}
                          cars={fullCarGroup}
                          index={index}
                          yearRange={getYearRange(fullCarGroup)}
                          uniqueColors={getUniqueColors(fullCarGroup)}
                          otherInfo={
                            <RentalInfo
                              car={mainCar}
                              rentalDays={rentalDays}
                              includedMileage={includedMileage}
                              startDateTime={startDate}
                              endDateTime={endDate}
                              hasExtraTimeFee={hasExtraTimeFee}
                            />
                          }
                        />
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Автомобили не найдены</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainTemplate>
  );
}

export default SearchPage;
