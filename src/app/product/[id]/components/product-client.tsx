'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
import { Tooltip } from '@heroui/react';
import { useRentModal } from '@/contexts/rent-modal-context';
import { getServerImageUrl } from '@/lib/uploads';

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
  const { openModal } = useRentModal();
  const urlStartDate = searchParams.get('start_date');
  const urlEndDate = searchParams.get('end_date');

  // State for dates selected in modal (if not in URL)
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string>('14:00');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('22:00');

  // Use URL dates if available, otherwise use selected dates from modal
  const startDate = urlStartDate || selectedStartDate;
  const endDate = urlEndDate || selectedEndDate;

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
  const [groupMedia, setGroupMedia] = useState<
    Array<{
      id: string;
      type: 'image' | 'video';
      fileName: string;
      filePath: string;
      fileSize: number;
    }>
  >([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const mediaFetchedRef = useRef<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

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

  // Get group key for fetching media
  const groupKey = useMemo(() => {
    const firstCar = carGroup[0];
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
  }, [carGroup]);

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
      if (response.ok) {
        setGroupMedia(data.media || []);
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
    {
      id: 'peace-package',
      name: 'Пакет «Спокойствие»',
      price: 5000,
      tooltip:
        'Это самый дорогостоящий, но и самый надёжный вариант. Страховая компания покрывает расходы в случае угона, ущерба, хищения и несчастного случая. Возмещается ущерб и в том случае, когда ДТП произошло по вине страхователя',
    },
    {
      id: 'casco',
      name: 'КАСКО',
      price: 2000,
      tooltip:
        'Это самый дорогостоящий, но и самый надёжный вариант. Страховая компания покрывает расходы в случае угона, ущерба, хищения и несчастного случая. Возмещается ущерб и в том случае, когда ДТП произошло по вине страхователя',
    },
    {
      id: 'casco-no-franchise',
      name: 'КАСКО без франшизы',
      price: 15000,
      tooltip:
        'Это самый дорогостоящий, но и самый надёжный вариант. Страховая компания покрывает расходы в случае угона, ущерба, хищения и несчастного случая. Возмещается ущерб и в том случае, когда ДТП произошло по вине страхователя',
    },
    {
      id: 'booster',
      name: 'Аренда бустера',
      price: 2000,
      tooltip:
        'Это самый дорогостоящий, но и самый надёжный вариант. Страховая компания покрывает расходы в случае угона, ущерба, хищения и несчастного случая. Возмещается ущерб и в том случае, когда ДТП произошло по вине страхователя',
    },
    {
      id: 'child-seat',
      name: 'Детское кресло',
      price: 1000,
      tooltip:
        'Это самый дорогостоящий, но и самый надёжный вариант. Страховая компания покрывает расходы в случае угона, ущерба, хищения и несчастного случая. Возмещается ущерб и в том случае, когда ДТП произошло по вине страхователя',
    },
    {
      id: 'extra-driver',
      name: 'Доп. водитель',
      price: 3000,
      tooltip:
        'Это самый дорогостоящий, но и самый надёжный вариант. Страховая компания покрывает расходы в случае угона, ущерба, хищения и несчастного случая. Возмещается ущерб и в том случае, когда ДТП произошло по вине страхователя',
    },
  ];

  const totalAdditionalPrice = useMemo(() => {
    return additionalOptions.reduce((sum, option) => {
      return sum + (selectedOptions[option.id] ? option.price : 0);
    }, 0);
  }, [selectedOptions]);

  // Get selected options for display
  const selectedOptionsList = useMemo(() => {
    return additionalOptions.filter((option) => selectedOptions[option.id]);
  }, [selectedOptions, additionalOptions]);

  const totalPrice = rentalPrice + totalAdditionalPrice;
  const deposit = 5000;

  const handleOptionToggle = (optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  // Helper function to format date for API (DD-MM-YYYY H:mm)
  const formatDateForAPI = useCallback((date: Date, time: string): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year} ${time}`;
  }, []);

  const handleBooking = useCallback(async () => {
    // Validate inputs
    if (!name.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Пожалуйста, введите имя',
      });
      return;
    }

    if (!phone.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Пожалуйста, введите номер телефона',
      });
      return;
    }

    // Check if dates are selected
    const currentStartDate = urlStartDate || selectedStartDate;
    const currentEndDate = urlEndDate || selectedEndDate;

    if (!currentStartDate || !currentEndDate) {
      // Open modal to select dates
      openModal({
        onSave: (
          newStartDate: Date,
          newEndDate: Date,
          newStartTime: string,
          newEndTime: string
        ) => {
          // Save dates to state
          const formattedStartDate = formatDateForAPI(
            newStartDate,
            newStartTime
          );
          const formattedEndDate = formatDateForAPI(newEndDate, newEndTime);

          setSelectedStartDate(formattedStartDate);
          setSelectedEndDate(formattedEndDate);
          setSelectedStartTime(newStartTime);
          setSelectedEndTime(newEndTime);

          // After modal closes and state updates, trigger booking again
          setTimeout(() => {
            handleBooking();
          }, 200);
        },
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Randomly select a car from the group
      const randomCar = carGroup[Math.floor(Math.random() * carGroup.length)];

      // Format selected options
      const selectedOptionsText = selectedOptionsList
        .map((opt) => `${opt.name} - ${opt.price.toLocaleString('ru-RU')} ₽`)
        .join('\n');

      // Format car details
      const carDetails = `
🚗 *Автомобиль:*
• Модель: ${formatCarName(randomCar)}
• Год: ${randomCar.year || '—'}
• Цвет: ${randomCar.color || '—'}
• КПП: ${formatTransmission(randomCar.transmission)}
• Топливо: ${formatFuel(randomCar.fuel)}
• Привод: ${formatDriveUnit(randomCar.drive_unit)}
• Объем двигателя: ${randomCar.engine_capacity || '—'} л
• Класс: ${randomCar.car_class || '—'}
• Тип: ${randomCar.car_type || '—'}
• ID: ${randomCar.id || '—'}
• Код: ${randomCar.code || '—'}
      `.trim();

      // Format rental information
      const rentalInfo =
        startDate && endDate
          ? `
📅 *Период аренды:*
• Начало: ${formatDateDisplay(startDate)}
• Окончание: ${formatDateDisplay(endDate)}
• Количество суток: ${rentalDays}
• Включенный километраж: ${includedMileage.toLocaleString('ru-RU')} км
        `.trim()
          : '📅 *Период аренды:* не указан';

      // Format pricing
      const pricingInfo = `
💰 *Стоимость:*
• Аренда: ${rentalPrice.toLocaleString('ru-RU')} ₽
${selectedOptionsText ? `• Дополнительные опции:\n${selectedOptionsText}` : ''}
• Депозит: ${deposit.toLocaleString('ru-RU')} ₽
• Итого: ${totalPrice.toLocaleString('ru-RU')} ₽
      `.trim();

      // Format complete message (API will add its own header)
      const message = `
🆕 *Заявка на бронирование автомобиля*

👤 *Клиент:*
• Имя: ${name}
• Телефон: ${phone}

${carDetails}

${rentalInfo}

${pricingInfo}
      `.trim();

      // Send to Telegram
      const response = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus({
          type: 'success',
          message:
            'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
        });
        // Clear form
        setName('');
        setPhone('');
      } else {
        setSubmitStatus({
          type: 'error',
          message:
            data.error || 'Ошибка при отправке заявки. Попробуйте еще раз.',
        });
      }
    } catch (error: any) {
      console.error('Error sending booking:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Ошибка при отправке заявки. Попробуйте еще раз.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    name,
    phone,
    urlStartDate,
    urlEndDate,
    selectedStartDate,
    selectedEndDate,
    startDate,
    endDate,
    rentalDays,
    includedMileage,
    rentalPrice,
    selectedOptionsList,
    totalPrice,
    deposit,
    carGroup,
    openModal,
    formatDateForAPI,
  ]);

  const carName = formatCarName(car);

  // Get images from group media, fallback to car images
  const carImages = useMemo(() => {
    const groupImages = groupMedia
      .filter((m) => m.type === 'image')
      .map((m) => m.filePath);

    if (groupImages.length > 0) {
      return groupImages;
    }

    // Fallback to car images
    return [
      getCarImage(car, 0),
      getCarImage(car, 1),
      getCarImage(car, 2),
      getCarImage(car, 3),
    ].filter(Boolean);
  }, [groupMedia, car]);

  // Get video from group media
  const groupVideo = useMemo(() => {
    return groupMedia.find((m) => m.type === 'video');
  }, [groupMedia]);

  const handleVideoClick = () => {
    if (groupVideo) {
      setVideoUrl(getServerImageUrl(groupVideo.filePath));
      setIsVideoModalOpen(true);
    }
  };

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
                    {index === 0 && groupVideo && (
                      <div
                        className="play"
                        onClick={handleVideoClick}
                        style={{ cursor: 'pointer' }}
                      >
                        <img src="/img/play-icon.svg" alt="" />
                        <span>Видео обзор машины</span>
                      </div>
                    )}
                    <img
                      src={getServerImageUrl(image)}
                      alt={carName}
                      className="max-h-[600px] object-cover"
                    />
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
                    <img src={getServerImageUrl(image)} alt={carName} />
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
                      <h4>
                        {option.name}

                        <Tooltip
                          content={
                            <div className="tooltip2">
                              <h3>{option.name}</h3>
                              <span>{option.tooltip}</span>
                            </div>
                          }
                          placement="top"
                          classNames={{
                            content: 'px-4! py-1! max-w-[200px]!',
                          }}
                        >
                          <img src="/img/tooltip-icon.svg" alt="" />
                        </Tooltip>
                      </h4>
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

              {/* Display selected options */}
              {selectedOptionsList.map((option) => (
                <div key={option.id} className="sum-row">
                  <span>{option.name}</span>
                  <b>{option.price.toLocaleString('ru-RU')} ₽</b>
                </div>
              ))}

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

              <input
                type="text"
                placeholder="Введите имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
              <input
                type="tel"
                placeholder="Введите номер телефона"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
              />

              {submitStatus.type && (
                <div
                  className={`submit-status ${
                    submitStatus.type === 'success' ? 'success' : 'error'
                  }`}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    backgroundColor:
                      submitStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                    color:
                      submitStatus.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${
                      submitStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'
                    }`,
                  }}
                >
                  {submitStatus.message}
                </div>
              )}

              <button
                className="red-btn"
                onClick={handleBooking}
                disabled={isSubmitting}
                style={{
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Отправка...' : 'Забронировать автомобиль'}
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

      {/* Video Modal */}
      {isVideoModalOpen && videoUrl && (
        <div
          className="fixed inset-0 bg-black/50 bg-opacity-90 z-[3000] flex items-center justify-center p-4"
          onClick={() => setIsVideoModalOpen(false)}
          style={{
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div
            className="relative max-w-6xl w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow:
                '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              animation: 'scaleIn 0.3s ease-out',
            }}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                  <i className="fas fa-play text-white text-sm"></i>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Видео обзор машины
                  </h3>
                  <p className="text-gray-400 text-xs">Просмотр видео</p>
                </div>
              </div>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="w-12 h-12 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:rotate-90 border border-white border-opacity-20"
                aria-label="Закрыть"
              >
                <i className="fas fa-times text-black text-xl"></i>
              </button>
            </div>

            {/* Video Container */}
            <div className="relative w-full bg-black">
              <video
                src={getServerImageUrl(videoUrl)}
                className="w-full h-auto max-h-[85vh] object-contain"
                controls
                autoPlay
                style={{
                  minHeight: '400px',
                }}
              />

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-6 py-4">
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                <i className="fas fa-info-circle"></i>
                <span>Нажмите вне видео для закрытия</span>
              </div>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-red-600 opacity-50"></div>
            <div className="absolute top-0 right-0 w-20 h-20 border-t-4 border-r-4 border-red-600 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 border-b-4 border-l-4 border-red-600 opacity-50"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-red-600 opacity-50"></div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </MainTemplate>
  );
}
