'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import MainTemplate from '@/components/common/main-template/main-template';
import SearchHeader from '@/app/search/components/search-header';
import Breadcrumbs from '@/components/common/breadcrumbs/breadcrumbs';
import type { Car, PriceItem } from '@/lib/rentprog-api-server';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

// Helper function to extract prices array from car
function extractPrices(car: Car): number[] {
  const pricesArray = car.prices || car.price;

  if (Array.isArray(pricesArray) && pricesArray.length > 0) {
    if (
      typeof pricesArray[0] === 'object' &&
      pricesArray[0] !== null &&
      'values' in pricesArray[0]
    ) {
      const firstPriceItem = pricesArray[0] as PriceItem;
      if (
        Array.isArray(firstPriceItem.values) &&
        firstPriceItem.values.length >= 5
      ) {
        return firstPriceItem.values.slice(0, 5);
      }
    }
  }

  // Fallback: return default prices if not available
  return [2500, 2250, 2000, 1900, 1700];
}

// Helper function to format car name
function formatCarName(car: Car): string {
  if (car.car_name) {
    return car.car_name;
  }
  const make = car.make || '';
  const model = car.model || '';
  return `${make} ${model}`.trim() || 'Автомобиль';
}

// Helper function to get car image
function getCarImage(car: Car, index: number = 0): string {
  if (car.avatar_url) return car.avatar_url;
  if (car.image) return car.image;
  return `/img/slider-img1.png`; // Fallback image
}

// Helper function to format fuel type
function formatFuel(fuel: string | undefined): string {
  if (!fuel) return '—';
  const fuelMap: Record<string, string> = {
    petrol: 'Бензин',
    diesel: 'Дизель',
    gas: 'Газ',
    electric: 'Электрический',
    hybrid: 'Гибридный',
  };
  return fuelMap[fuel.toLowerCase()] || fuel;
}

// Helper function to format transmission
function formatTransmission(transmission: string | null | undefined): string {
  if (!transmission) return '—';
  const transMap: Record<string, string> = {
    automatic: 'АКПП',
    manual: 'МКПП',
    cvt: 'Вариатор',
  };
  return transMap[transmission.toLowerCase()] || transmission;
}

// Helper function to format drive unit
function formatDriveUnit(drive: string | undefined): string {
  if (!drive) return '—';
  const driveMap: Record<string, string> = {
    front: 'Передний привод',
    rear: 'Задний привод',
    all: 'Полный привод',
    '4wd': 'Полный привод',
  };
  return driveMap[drive.toLowerCase()] || drive;
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

// Helper function to calculate days between dates
function calculateDays(
  startDateStr: string | null,
  endDateStr: string | null
): number {
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
}

// Helper function to format date for display
function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('-');
    return `${day}.${month}.${year} (${timePart})`;
  } catch {
    return dateStr;
  }
}

interface ProductClientProps {
  car: Car;
  allCars: Car[];
}

export default function ProductClient({ car, allCars }: ProductClientProps) {
  const searchParams = useSearchParams();
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, boolean>
  >({
    'peace-package': true,
    casco: true,
    'casco-no-franchise': false,
    booster: true,
    'child-seat': true,
    'extra-driver': false,
  });

  const rentalDays = useMemo(
    () => calculateDays(startDate, endDate),
    [startDate, endDate]
  );

  const includedMileage = useMemo(() => {
    if (!car?.extra_mileage_km) return 0;
    return rentalDays * car.extra_mileage_km;
  }, [rentalDays, car?.extra_mileage_km]);

  // Group cars by model (same car, different colors and years)
  const carGroup = useMemo(() => {
    const grouped = new Map<string, Car[]>();

    allCars.forEach((c) => {
      // Create a unique key based on car name or make+model (WITHOUT year)
      let key = '';
      if (c.car_name) {
        key = c.car_name.trim();
        // Remove year from car_name if it's at the end (e.g., "BMW X5 2020" -> "BMW X5")
        key = key.replace(/\s+\d{4}$/, '').trim();
      } else {
        const make = (c.make || '').trim();
        const model = (c.model || '').trim();
        key = `${make}_${model}`.trim();
      }

      if (!key && c.code) {
        key = c.code.split('_')[0] || c.code;
      }

      if (!key && c.id) {
        key = `car_${c.id}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(c);
    });

    // Find the group that contains the current car
    for (const group of grouped.values()) {
      if (group.some((c) => c.id === car.id)) {
        return group;
      }
    }
    return [car];
  }, [allCars, car]);

  // Get unique colors from car group
  const uniqueColors = useMemo(() => {
    const colors = new Set<string>();
    carGroup.forEach((c) => {
      if (c.color) {
        colors.add(c.color.trim());
      }
    });
    return Array.from(colors).filter(Boolean);
  }, [carGroup]);

  // Get year range from car group
  const yearRange = useMemo(() => {
    const years = carGroup
      .map((c) => c.year)
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
  }, [carGroup]);

  const prices = useMemo(() => {
    return extractPrices(car);
  }, [car]);

  const priceRanges = [
    { label: '1-2 дня', price: prices[0] },
    { label: '3-6 дней', price: prices[1] },
    { label: '7-14 дней', price: prices[2] },
    { label: '15-30 дней', price: prices[3] },
    { label: '30 + дней', price: prices[4] },
  ];

  // Calculate price based on rental days
  const getPriceForDays = (days: number): number => {
    if (days <= 2) return prices[0];
    if (days <= 7) return prices[1];
    if (days <= 15) return prices[2];
    if (days <= 31) return prices[3];
    return prices[4];
  };

  const rentalPrice = useMemo(() => {
    if (!rentalDays) return 0;
    return getPriceForDays(rentalDays) * rentalDays;
  }, [rentalDays, prices]);

  const additionalOptions = [
    { id: 'peace-package', name: 'Пакет «Спокойствие»', price: 5000 },
    { id: 'casco', name: 'КАСКО', price: 2000 },
    { id: 'casco-no-franchise', name: 'КАСКО без франшизы', price: 15000 },
    { id: 'booster', name: 'Аренда бустера', price: 2000 },
    { id: 'child-seat', name: 'Детское кресло', price: 1000 },
    { id: 'extra-driver', name: 'Доп. водитель', price: 3000 },
  ];

  const totalAdditionalPrice = useMemo(() => {
    return additionalOptions.reduce((sum, option) => {
      return sum + (selectedOptions[option.id] ? option.price : 0);
    }, 0);
  }, [selectedOptions]);

  const totalPrice = rentalPrice + totalAdditionalPrice;
  const deposit = 5000;

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const handleBooking = () => {
    // TODO: Implement booking logic
    console.log('Booking car:', car.id);
  };

  const carName = formatCarName(car);
  const carImages = [
    getCarImage(car, 0),
    getCarImage(car, 1),
    getCarImage(car, 2),
    getCarImage(car, 3),
  ].filter(Boolean);

  return (
    <MainTemplate headerAnimation={false} minHeight={true}>
      <div className="search-in-wrap">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Результаты поиска', href: '/search' },
              { label: `Аренда ${carName} - ${car.year || ''}г.в` },
            ]}
            showBackButton={true}
          />

          <h1>Аренда {carName}</h1>

          <div className="slider-wrapper">
            <div className="car-gallery">
              <Swiper
                modules={[Navigation, Thumbs]}
                thumbs={{ swiper: thumbsSwiper }}
                className="main-slider"
              >
                {carImages.map((image, index) => (
                  <SwiperSlide key={index}>
                    {index === 0 && (
                      <div className="play">
                        <img src="/img/play-icon.svg" alt="" />
                        <span>Видео обзор машины</span>
                      </div>
                    )}
                    <img src={image} alt={carName} />
                  </SwiperSlide>
                ))}
              </Swiper>

              <Swiper
                modules={[Navigation, Thumbs]}
                onSwiper={setThumbsSwiper}
                className="thumbs-slider"
                spaceBetween={10}
                slidesPerView={4}
              >
                {carImages.map((image, index) => (
                  <SwiperSlide key={index}>
                    <img src={image} alt={carName} />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <ul className="tooltip-list">
              <li>
                <span className="grey">Год выпуска</span>
                <span className="black">{yearRange || car.year || '—'}</span>
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
                <span className="black">
                  {car.power || car.engine_power
                    ? `${car.power || car.engine_power} л.с`
                    : '—'}
                </span>
              </li>
              <li>
                <span className="grey">Объем двигателя</span>
                <span className="black">
                  {car.engine_capacity ? `${car.engine_capacity} л.` : '—'}
                </span>
              </li>
              <li>
                <span className="grey">Количество мест</span>
                <span className="black">
                  {car.seats || car.number_seats || '—'}
                </span>
              </li>
              <li>
                <span className="grey">Привод</span>
                <span className="black">
                  {formatDriveUnit(car.drive_unit || car.drive)}
                </span>
              </li>
              <li>
                <span className="grey">Цвет</span>
                <div className="colors">
                  {uniqueColors.length > 0 ? (
                    uniqueColors.map((color, index) => (
                      <span
                        key={index}
                        className={getColorClass(color)}
                        title={color || undefined}
                      ></span>
                    ))
                  ) : car.color ? (
                    <span
                      className={getColorClass(car.color)}
                      title={car.color || undefined}
                    ></span>
                  ) : (
                    '—'
                  )}
                </div>
              </li>
            </ul>
          </div>

          <div className="search-info-list">
            <ul>
              {priceRanges.map((range, index) => (
                <li key={index}>
                  <span>{range.label}</span>
                  <b>{range.price.toLocaleString('ru-RU')} ₽</b>
                </li>
              ))}
            </ul>
            <div className="info-texts">
              <img src="/img/info-img.svg" alt="" />
              <p>
                <span className="red-text">Внимание!</span> Текущий тариф
                действует до 26 февраля 2026 года включительно
              </p>
            </div>
          </div>

          <div className="rent-layout">
            <div className="rent-options">
              {startDate && endDate && (
                <>
                  <div className="row">
                    <span>Дата:</span>
                    <b>
                      {formatDateDisplay(startDate)} –{' '}
                      {formatDateDisplay(endDate)}
                    </b>
                  </div>

                  <div className="row">
                    <span>Количество суток</span>
                    <b>{rentalDays} суток</b>
                  </div>

                  <div className="row">
                    <span>Включенный километраж</span>
                    <b>{includedMileage.toLocaleString('ru-RU')} км</b>
                  </div>
                </>
              )}

              <div className="row">
                <span>Перепробег</span>
                <b>
                  {car.extra_mileage_price
                    ? `${car.extra_mileage_price.toLocaleString('ru-RU')} ₽ / км`
                    : '15 ₽ / км'}
                </b>
              </div>

              <div className="options">
                {additionalOptions.map((option) => (
                  <div key={option.id} className="option">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={selectedOptions[option.id]}
                        onChange={() => handleOptionToggle(option.id)}
                      />
                      <span className="slider"></span>
                    </label>
                    <div className="texts">
                      <h4>{option.name}</h4>
                      <b>{option.price.toLocaleString('ru-RU')} ₽</b>
                    </div>
                  </div>
                ))}
              </div>

              <ul className="rent-list-items">
                <li>
                  <span>Возраст арендатора:</span>
                  <b>от 25 лет</b>
                </li>
                <li>
                  <span>Стаж вождения:</span>
                  <b>от 3 лет</b>
                </li>
                <li>
                  <span>Набор документов:</span>
                  <b>Паспорт, водительское удостоверение, ИНН или СНИЛС</b>
                </li>
              </ul>
            </div>

            <div className="rent-summary">
              <div className="sum-row">
                <span>Аренда</span>
                <b>{rentalPrice.toLocaleString('ru-RU')} ₽</b>
              </div>
              <div className="sum-row">
                <span>Депозит</span>
                <b>{deposit.toLocaleString('ru-RU')} ₽</b>
              </div>
              <p className="totla-text">
                Итоговая стоимость аренды автомобиля:
              </p>
              <div className="total">
                <div className="old">
                  {(totalPrice + deposit).toLocaleString('ru-RU')} ₽
                </div>
                <div className="new" id="totalPrice">
                  {totalPrice.toLocaleString('ru-RU')} ₽
                </div>
              </div>

              <input type="text" placeholder="Введите имя" />
              <input type="tel" placeholder="Введите номер телефона" />

              <button className="red-btn" onClick={handleBooking}>
                Забронировать автомобиль
              </button>

              <p className="note">
                Оставляя заявку, вы даете согласие на обработку{' '}
                <a href="/offer">персональных данных</a> и соглашаетесь с{' '}
                <a href="/privacy">политикой конфиденциальности</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainTemplate>
  );
}
