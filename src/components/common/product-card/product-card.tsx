'use client';

import type { Car, PriceItem } from '@/lib/rentprog-api-server';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRentModal } from '@/contexts/rent-modal-context';
import { getServerImageUrl } from '@/lib/uploads';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  getPriceForDaysByBuckets,
  resolveTariffPricesForDate,
  type GroupTariffPricing,
} from '@/lib/group-pricing-client';

interface ProductCardProps {
  car: Car;
  cars?: Car[]; // Array of cars with same model but different colors
  index: number;
  yearRange?: string;
  uniqueColors?: string[];
  otherInfo?: React.ReactNode;
  resolvedDailyPrice?: number | null;
}

// Helper function to format car name
function formatCarName(car: Car): string {
  // Use car_name from API if available, otherwise fallback to make + model
  if (car.car_name) {
    return car.car_name;
  }
  const make = car.make || '';
  const model = car.model || '';
  return `${make} ${model}`.trim() || 'Автомобиль';
}

// Helper function to format price
function formatPrice(car: Car): string {
  // Use price_from if available
  if (car.price_from) {
    return car.price_from;
  }

  // Handle prices array structure (new API field name)
  const pricesArray = car.prices || car.price;

  if (Array.isArray(pricesArray) && pricesArray.length > 0) {
    // Find minimum price from all price items
    let minPrice: number | null = null;

    for (const priceItem of pricesArray) {
      if (
        priceItem &&
        typeof priceItem === 'object' &&
        'values' in priceItem &&
        Array.isArray(priceItem.values) &&
        priceItem.values.length > 0
      ) {
        const itemMinPrice = Math.min(...priceItem.values);
        if (minPrice === null || itemMinPrice < minPrice) {
          minPrice = itemMinPrice;
        }
      }
    }

    if (minPrice !== null) {
      return `от ${minPrice.toLocaleString('ru-RU')} ₽`;
    }
  }

  // Handle single number price (legacy)
  if (typeof car.price === 'number') {
    return `от ${car.price.toLocaleString('ru-RU')} ₽`;
  }

  return 'Цена по запросу';
}

// Helper function to format transmission
function formatTransmission(transmission?: string | null): string {
  if (!transmission) return '—';
  const transMap: { [key: string]: string } = {
    automatic: 'АКПП',
    manual: 'МКПП',
    cvt: 'Вариатор',
  };
  return transMap[transmission.toLowerCase()] || transmission;
}

// Helper function to format drive
function formatDrive(car: Car): string {
  // Use drive_unit from API (new field name)
  if (car.drive_unit) {
    return car.drive_unit;
  }
  // Fallback to drive field (legacy)
  if (car.drive) {
    const driveMap: { [key: string]: string } = {
      '4wd': 'Полный',
      fwd: 'Передний',
      rwd: 'Задний',
    };
    return driveMap[car.drive.toLowerCase()] || car.drive;
  }
  return '—';
}

// Helper function to get car image
function getCarImage(car: Car, index: number): string {
  // Use avatar_url from API if available
  if (car.avatar_url) return car.avatar_url;
  // Fallback to image field
  if (car.image) return car.image;
  // Fallback to placeholder images
  const placeholderImages = [
    '/img/car-img1.png',
    '/img/car-img2.png',
    '/img/car-img3.png',
    '/img/car-img4.png',
    '/img/car-img5.png',
    '/img/car-img6.png',
  ];
  return placeholderImages[index % placeholderImages.length];
}

function extractSeatNumbers(
  value: string | number | null | undefined
): number[] {
  if (value === undefined || value === null) return [];
  if (typeof value === 'number' && Number.isFinite(value)) return [value];
  if (typeof value === 'string') {
    const matches = value.match(/\d+/g);
    if (!matches) return [];
    return matches.map((m) => Number(m)).filter((n) => Number.isFinite(n));
  }
  return [];
}

// Helper function to get seats from group (e.g. "8 - 9")
function getSeats(cars: Car[] | undefined, currentCar: Car): string {
  const source = cars && cars.length > 0 ? cars : [currentCar];
  const values = Array.from(
    new Set(
      source.flatMap((c) => [
        ...extractSeatNumbers(
          c.number_seats as string | number | null | undefined
        ),
        ...extractSeatNumbers(c.seats as string | number | null | undefined),
      ])
    )
  ).sort((a, b) => a - b);

  if (values.length === 0) return '—';
  if (values.length === 1) return String(values[0]);
  return `${values[0]} - ${values[values.length - 1]}`;
}

// Helper function to get engine power
function getEnginePower(car: Car): string {
  // Use engine_power from API
  if (car.engine_power !== undefined && car.engine_power !== null) {
    return `${car.engine_power} л.с`;
  }
  // Fallback to power field
  if (car.power !== undefined && car.power !== null) {
    return `${car.power} л.с`;
  }
  return '—';
}

// Helper function to get engine capacity
function getEngineCapacity(car: Car): string {
  // Use engine_capacity from API (can be string or number)
  if (car.engine_capacity !== undefined && car.engine_capacity !== null) {
    const capacity = String(car.engine_capacity);
    // If it already contains "л." or "л", return as is, otherwise add "л."
    if (capacity.includes('л')) {
      return capacity;
    }
    return `${capacity} л.`;
  }
  // Fallback to engine_volume field
  if (car.engine_volume !== undefined && car.engine_volume !== null) {
    return `${car.engine_volume} л.`;
  }
  return '—';
}

// Helper function to get number of doors
function getDoors(car: Car): string {
  if (car.number_doors !== undefined && car.number_doors !== null) {
    return String(car.number_doors);
  }
  return '—';
}

// Helper function to format fuel type
function formatFuel(fuel?: string | null): string {
  if (!fuel) return '—';
  const fuelMap: { [key: string]: string } = {
    petrol: 'Бензин',
    diesel: 'Дизель',
    electric: 'Электрический',
    hybrid: 'Гибридный',
    gas: 'Газ',
  };
  return fuelMap[fuel.toLowerCase()] || fuel;
}

// Helper function to format car class
function formatCarClass(carClass?: string | null): string {
  if (!carClass) return '—';
  return carClass;
}

// Helper function to get color class name from color string
function getColorClass(color: string | null | undefined): string {
  if (!color) return '';
  const colorLower = color.toLowerCase().trim();

  // Map common color names to CSS classes
  const colorMap: { [key: string]: string } = {
    красный: 'red',
    red: 'red',
    черный: 'black',
    black: 'black',
    белый: 'white',
    white: 'white',
    серый: 'grey',
    grey: 'grey',
    gray: 'grey',
    синий: 'blue',
    blue: 'blue',
    зеленый: 'green',
    green: 'green',
    желтый: 'yellow',
    yellow: 'yellow',
    серебристый: 'silver',
    silver: 'silver',
    коричневый: 'brown',
    brown: 'brown',
    'черный.серый': 'black-grey',
  };

  return colorMap[colorLower] || 'default';
}

// Helper function to get year range from cars array
function getYearRange(cars: Car[] | undefined, currentCar: Car): string {
  if (!cars || cars.length <= 1) {
    return currentCar.year ? String(currentCar.year) : '—';
  }

  const years = cars
    .map((car) => car.year)
    .filter((year): year is number => year !== undefined && year !== null)
    .sort((a, b) => a - b);

  if (years.length === 0) return '—';
  if (years.length === 1) return String(years[0]);

  const minYear = years[0];
  const maxYear = years[years.length - 1];

  if (minYear === maxYear) {
    return String(minYear);
  }

  return `${minYear}-${maxYear}`;
}

const groupPricingCache = new Map<string, GroupTariffPricing[]>();

function parseQueryDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const [datePart, timePart] = dateStr.trim().split(' ');
  if (!datePart) return null;

  const separator = datePart.includes('-')
    ? '-'
    : datePart.includes('.')
      ? '.'
      : '/';
  const parts = datePart.split(separator).map(Number);
  if (parts.length !== 3 || parts.some((v) => !Number.isFinite(v))) return null;

  let day = 0;
  let month = 0;
  let year = 0;
  if (String(parts[0]).length === 4) {
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else {
    day = parts[0];
    month = parts[1];
    year = parts[2];
  }

  const [hours, minutes] = timePart
    ? timePart.split(':').map((v) => Number(v))
    : [0, 0];
  return new Date(
    year,
    month - 1,
    day,
    Number.isFinite(hours) ? hours : 0,
    Number.isFinite(minutes) ? minutes : 0
  );
}

function calculateRentalDaysFromQuery(
  startDateStr: string | null,
  endDateStr: string | null
): number {
  const startDate = parseQueryDate(startDateStr);
  const endDate = parseQueryDate(endDateStr);
  if (!startDate || !endDate) return 0;

  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function ProductCard({
  car,
  cars,
  index,
  yearRange: providedYearRange,
  uniqueColors: providedUniqueColors,
  otherInfo,
  resolvedDailyPrice,
}: ProductCardProps) {
  const { openModal } = useRentModal();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  // Get all unique colors from cars array
  const allColors = useMemo(() => {
    if (providedUniqueColors && providedUniqueColors.length > 0) {
      return providedUniqueColors;
    }
    return cars && cars.length > 1
      ? Array.from(new Set(cars.map((c) => c.color).filter(Boolean)))
      : car.color
        ? [car.color]
        : [];
  }, [providedUniqueColors, cars, car.color]);

  // Get year range from cars array
  const yearRange = providedYearRange || getYearRange(cars, car);

  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [groupMediaImage, setGroupMediaImage] = useState<string | null>(null);
  const [groupTariffs, setGroupTariffs] = useState<GroupTariffPricing[]>([]);
  const mediaFetchedRef = useRef<Set<string>>(new Set());

  // Calculate group key (same logic as product-client.tsx)
  const groupKey = useMemo(() => {
    const firstCar = cars && cars.length > 0 ? cars[0] : car;
    if (!firstCar) return '';

    let key = '';
    if (firstCar.car_name) {
      key = firstCar.car_name.trim();
      key = key.replace(/\s+\d{4}$/, '').trim();
    } else {
      const make = (firstCar.make || '').trim();
      const model = (firstCar.model || '').trim();
      key = `${make}_${model}`.trim();
    }

    if (!key && firstCar.code) {
      key = firstCar.code.split('_')[0] || firstCar.code;
    }

    if (!key && firstCar.id) {
      key = `car_${firstCar.id}`;
    }

    return key;
  }, [car, cars]);

  // Fetch group media
  const fetchGroupMedia = useCallback(async (key: string) => {
    // Prevent duplicate fetches
    if (mediaFetchedRef.current.has(key)) {
      return;
    }

    try {
      mediaFetchedRef.current.add(key);
      const encodedGroupKey = encodeURIComponent(key);
      const response = await fetch(`/api/cars/${encodedGroupKey}/media`);
      const data = await response.json();
      if (response.ok && data.media && data.media.length > 0) {
        // Get first image from group media
        const firstImage = data.media.find((m: any) => m.type === 'image');
        if (firstImage) {
          setGroupMediaImage(firstImage.filePath);
        }
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      // Remove from cache on error so it can retry
      mediaFetchedRef.current.delete(key);
    }
  }, []);

  useEffect(() => {
    if (groupKey && !mediaFetchedRef.current.has(groupKey)) {
      fetchGroupMedia(groupKey);
    }
  }, [groupKey, fetchGroupMedia]);

  useEffect(() => {
    if (!groupKey || !startDate || !endDate) {
      setGroupTariffs([]);
      return;
    }

    const cached = groupPricingCache.get(groupKey);
    if (cached) {
      setGroupTariffs(cached);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const encodedGroupKey = encodeURIComponent(groupKey);
        const response = await fetch(`/api/cars/pricing/${encodedGroupKey}`);
        const data = await response.json();
        const tariffs = Array.isArray(data?.tariffs)
          ? (data.tariffs as GroupTariffPricing[])
          : [];
        groupPricingCache.set(groupKey, tariffs);
        if (!cancelled) {
          setGroupTariffs(tariffs);
        }
      } catch (error) {
        console.error('Failed to fetch product card pricing:', error);
        if (!cancelled) {
          setGroupTariffs([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupKey, startDate, endDate]);

  const seasonalDailyPriceFromQuery = useMemo(() => {
    if (!startDate || !endDate || !groupKey || groupTariffs.length === 0) {
      return null;
    }
    const rentalDays = calculateRentalDaysFromQuery(startDate, endDate);
    if (rentalDays <= 0) return null;

    const pricesByDate = resolveTariffPricesForDate(groupTariffs, startDate);
    const price = getPriceForDaysByBuckets(pricesByDate, rentalDays);
    return Number.isFinite(price) && price > 0 ? price : null;
  }, [groupTariffs, groupKey, startDate, endDate]);

  const cardDisplayPrice = useMemo(() => {
    if (
      typeof resolvedDailyPrice === 'number' &&
      Number.isFinite(resolvedDailyPrice) &&
      resolvedDailyPrice > 0
    ) {
      return resolvedDailyPrice;
    }
    return seasonalDailyPriceFromQuery;
  }, [resolvedDailyPrice, seasonalDailyPriceFromQuery]);

  const productUrl = useMemo(() => {
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const mileage = searchParams.get('mileage');

    const query = new URLSearchParams();
    if (startDate) query.set('start_date', startDate);
    if (endDate) query.set('end_date', endDate);
    if (mileage) query.set('mileage', mileage);
    if (pathname === '/search') query.set('from', 'search');
    if (pathname === '/catalog') query.set('from', 'catalog');

    const queryString = query.toString();
    return queryString
      ? `/product/${car.id}?${queryString}`
      : `/product/${car.id}`;
  }, [car.id, searchParams, pathname]);

  const handleTooltipClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTooltipOpen(!isTooltipOpen);
  };

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsTooltipOpen(false);
      }
    };

    if (isTooltipOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTooltipOpen]);

  const seatsDisplay = useMemo(() => getSeats(cars, car), [cars, car]);

  // Ցուցադրել միայն բազայում ավելացված նկարները; եթե չկա — դատարկ դաշտ + «Բեռնեք նկարները»
  const hasDbImage = !!groupMediaImage;

  return (
    <div className="car-item">
      <div className="img-wrap">
        <Link href={productUrl} className="img">
          {hasDbImage ? (
            <img
              src={getServerImageUrl(groupMediaImage)}
              alt={formatCarName(car)}
            />
          ) : (
            <div
              className="product-card-no-image w-full! h-[250px]!"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                background: 'rgba(0,0,0,0.04)',
                color: '#666',
                fontSize: '14px',
                textAlign: 'center',
                padding: '16px',
              }}
            >
              <span style={{ marginBottom: 8, opacity: 0.8 }}>
                Загрузите изображения
              </span>
            </div>
          )}
        </Link>

        <div className="tooltip-icon" onClick={handleTooltipClick}>
          <img
            src="/img/tooltip-icon.svg"
            alt=""
            style={{ cursor: 'pointer' }}
          />
        </div>
        <div
          ref={tooltipRef}
          className={`tooltip-info ${isTooltipOpen ? 'open' : ''}`}
          style={{ display: isTooltipOpen ? 'block' : 'none' }}
        >
          <ul className="tooltip-list">
            <li>
              <span className="grey">Год выпуска</span>
              <span className="black">{yearRange}</span>
            </li>
            <li>
              <span className="grey">Коробка</span>
              <span className="black">
                {formatTransmission(car.transmission)}
              </span>
            </li>
            <li>
              <span className="grey">Топливо</span>
              <span className="black">{formatFuel(car.fuel)}</span>
            </li>
            <li>
              <span className="grey">Мощность</span>
              <span className="black">{getEnginePower(car)}</span>
            </li>
            <li>
              <span className="grey">Объем двигателя</span>
              <span className="black">{getEngineCapacity(car)}</span>
            </li>
            <li>
              <span className="grey">Количество мест</span>
              <span className="black">{seatsDisplay}</span>
            </li>
            {/* <li>
              <span className="grey">Количество дверей</span>
              <span className="black">{getDoors(car)}</span>
            </li> */}
            <li>
              <span className="grey">Класс</span>
              <span className="black">{formatCarClass(car.car_class)}</span>
            </li>
            <li>
              <span className="grey">Цвет</span>
              {allColors.length > 0 ? (
                <div className="colors">
                  {allColors.map((color, idx) => (
                    <span
                      key={idx}
                      className={getColorClass(color)}
                      title={color || undefined}
                    ></span>
                  ))}
                </div>
              ) : (
                <span className="black">—</span>
              )}
            </li>
            {car.is_air && (
              <li>
                <span className="grey">Кондиционер</span>
                <span className="black">Да</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <span className="name">{formatCarName(car)}</span>
      <ul className="list">
        <li>
          <span>Вместимость</span>
          <b>{seatsDisplay !== '—' ? `${seatsDisplay} мест` : '—'}</b>
        </li>
        <li>
          <span>Коробка</span>
          <b>{formatTransmission(car.transmission)}</b>
        </li>
        <li>
          <span>Привод</span>
          <b>{formatDrive(car)}</b>
        </li>
        <li>
          <span>Год выпуска</span>
          <b>{yearRange}</b>
        </li>
      </ul>
      {otherInfo ? (
        otherInfo
      ) : (
        <>
          <div className="price-info">
            <span>Стоимость аренды</span>
            <b className="price">
              {typeof cardDisplayPrice === 'number' &&
              Number.isFinite(cardDisplayPrice) &&
              cardDisplayPrice > 0
                ? `${cardDisplayPrice.toLocaleString('ru-RU')} ₽/сутки`
                : formatPrice(car)}
            </b>
          </div>
        </>
      )}

      <div className="buttons gap-[10px]!">
        <button
          type="button"
          className="red-btn text-[14px]!"
          onClick={(e) => {
            e.preventDefault();
            openModal({ car, contactOnly: true });
          }}
        >
          Оставить заявку
        </button>
        <Link href={productUrl} className="border-btn">
          Подробнее
        </Link>
      </div>
    </div>
  );
}

export default ProductCard;
