'use client';

import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import MainTemplate from '@/components/common/main-template/main-template';
import Breadcrumbs from '@/components/common/breadcrumbs/breadcrumbs';
import type { Car } from '@/lib/rentprog-api-server';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { Tooltip } from '@heroui/react';
import { useRentModal } from '@/contexts/rent-modal-context';
import { getServerImageUrl } from '@/lib/uploads';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  calculateExtraTimeFee,
  EXTRA_TIME_FEE_PER_EVENT_RUB,
} from '@/lib/business-hours-fee';
import {
  DEFAULT_DAILY_INCLUDED_MILEAGE,
  DEFAULT_EXTRA_MILEAGE_PRICE_RUB,
  getExtraMileageFee,
  getExtraMileageKm,
  getIncludedMileageLimit,
  parseMileageInput,
} from '@/lib/mileage-pricing';
import {
  getPhoneDigits,
  phoneMaskOnBlur,
  phoneMaskForceCaretToEnd,
  phoneMaskOnFocus,
  phoneMaskOnKeyDown,
} from '@/lib/phone-mask';
import { InputMask } from '@react-input/mask';

type SeasonLike = {
  id?: number | string | null;
  season_id?: number | string | null;
  start_date?: string;
  end_date?: string;
};

type GroupTariffPricing = {
  id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  order: number;
  startDayMonth: string | null;
  endDayMonth: string | null;
  prices: number[];
};

function InlineSkeleton({
  width = 92,
  height = 18,
  className = '',
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <span
      className={`inline-block animate-pulse rounded-md bg-[#ececec] ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

function normalizePrices(values: number[] | undefined | null): number[] {
  const safe = Array.isArray(values)
    ? values.filter((v) => Number.isFinite(v) && v > 0)
    : [];
  if (safe.length === 0) return [2500, 2250, 2000, 1900, 1700];
  const result = [...safe];
  while (result.length < 5) {
    result.push(result[result.length - 1] || 0);
  }
  return result.slice(0, 5);
}

function parseSearchDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const raw = String(dateStr).trim();
  const dateMatch = raw.match(/\b(\d{1,4})[.\-/](\d{1,2})[.\-/](\d{1,4})\b/);
  if (!dateMatch) return null;

  let day = 0;
  let month = 0;
  let year = 0;

  const part1 = Number(dateMatch[1]);
  const part2 = Number(dateMatch[2]);
  const part3 = Number(dateMatch[3]);
  const part1Len = dateMatch[1].length;
  const part3Len = dateMatch[3].length;

  // Support both DD-MM-YYYY and YYYY-MM-DD.
  if (part1Len === 4) {
    year = part1;
    month = part2;
    day = part3;
  } else if (part3Len === 4) {
    day = part1;
    month = part2;
    year = part3;
  } else {
    return null;
  }

  if (!day || !month || !year) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const timeMatch = raw.match(/(\d{1,2}):(\d{2})/);
  const hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;

  return new Date(year, month - 1, day, hours || 0, minutes || 0);
}

function getSeasonId(season: SeasonLike): number | string | null {
  if (season.id !== undefined && season.id !== null) return season.id;
  if (season.season_id !== undefined && season.season_id !== null)
    return season.season_id;
  return null;
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

function getRutubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const value = url.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('rutube')) return null;

    const path = parsed.pathname.replace(/\/+$/, '');
    if (path.includes('/play/embed/')) {
      return parsed.toString();
    }

    const match = path.match(/\/video\/([a-zA-Z0-9]+)/);
    if (match?.[1]) {
      return `https://rutube.ru/play/embed/${match[1]}`;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function shouldUseImageOptimizer(src: string): boolean {
  return Boolean(src) && !src.startsWith('/api/');
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

function parseSeasonDayMonth(
  value: string
): { day: number; month: number } | null {
  const parts = String(value || '')
    .trim()
    .split('.');
  if (parts.length < 2) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    day < 1 ||
    day > 31 ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }
  return { day, month };
}

function getSeasonWindowForDate(
  season: SeasonLike,
  referenceDate: Date
): { startDate: Date; endDate: Date; seasonId: number | string | null } | null {
  const startPart = parseSeasonDayMonth(season.start_date || '');
  const endPart = parseSeasonDayMonth(season.end_date || '');
  if (!startPart || !endPart) return null;

  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const crossesYear =
    startPart.month > endPart.month ||
    (startPart.month === endPart.month && startPart.day > endPart.day);

  let startDate: Date;
  let endDate: Date;

  if (!crossesYear) {
    startDate = new Date(ref.getFullYear(), startPart.month - 1, startPart.day);
    endDate = new Date(ref.getFullYear(), endPart.month - 1, endPart.day);
  } else {
    const currentYearStart = new Date(
      ref.getFullYear(),
      startPart.month - 1,
      startPart.day
    );
    if (ref >= currentYearStart) {
      startDate = currentYearStart;
      endDate = new Date(ref.getFullYear() + 1, endPart.month - 1, endPart.day);
    } else {
      startDate = new Date(
        ref.getFullYear() - 1,
        startPart.month - 1,
        startPart.day
      );
      endDate = new Date(ref.getFullYear(), endPart.month - 1, endPart.day);
    }
  }

  return { startDate, endDate, seasonId: getSeasonId(season) };
}

function getNextSeasonStartDate(
  startDayMonth: string | null | undefined,
  referenceDate: Date
): Date | null {
  const startPart = parseSeasonDayMonth(String(startDayMonth || ''));
  if (!startPart) return null;

  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  let candidate = new Date(ref.getFullYear(), startPart.month - 1, startPart.day);
  if (candidate <= ref) {
    candidate = new Date(ref.getFullYear() + 1, startPart.month - 1, startPart.day);
  }
  return candidate;
}

function getPreviousDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d;
}

function resolvePricingFromAdminTariffs(
  tariffs: GroupTariffPricing[],
  startDateStr: string | null
): {
  prices: number[];
  tariffWarningDate: Date | null;
  shouldShowTariffWarning: boolean;
} {
  const parsedReferenceDate = parseSearchDate(startDateStr) || new Date();
  const referenceDate = new Date(
    parsedReferenceDate.getFullYear(),
    parsedReferenceDate.getMonth(),
    parsedReferenceDate.getDate()
  );

  const activeTariffs = Array.isArray(tariffs)
    ? tariffs.filter((tariff) => tariff && tariff.isActive !== false)
    : [];

  const defaultTariff =
    activeTariffs.find((tariff) => tariff.isDefault) || activeTariffs[0] || null;
  const seasonalTariffs = activeTariffs.filter(
    (tariff) => !tariff.isDefault && tariff.startDayMonth && tariff.endDayMonth
  );
  const hasSeasonalTariffs = seasonalTariffs.length > 0;

  for (const tariff of seasonalTariffs) {
    const window = getSeasonWindowForDate(
      {
        id: tariff.id,
        start_date: tariff.startDayMonth || '',
        end_date: tariff.endDayMonth || '',
      },
      referenceDate
    );
    if (!window) continue;
    if (referenceDate >= window.startDate && referenceDate <= window.endDate) {
      return {
        prices: normalizePrices(tariff.prices),
        tariffWarningDate: window.endDate,
        shouldShowTariffWarning: true,
      };
    }
  }

  let nearestSeasonStart: Date | null = null;
  for (const tariff of seasonalTariffs) {
    const nextStart = getNextSeasonStartDate(tariff.startDayMonth, referenceDate);
    if (!nextStart) continue;
    if (!nearestSeasonStart || nextStart < nearestSeasonStart) {
      nearestSeasonStart = nextStart;
    }
  }

  return {
    prices: normalizePrices(defaultTariff?.prices),
    tariffWarningDate: nearestSeasonStart
      ? getPreviousDay(nearestSeasonStart)
      : null,
    shouldShowTariffWarning: hasSeasonalTariffs,
  };
}

interface ProductClientProps {
  car: Car;
  allCars: Car[];
}

interface ServicePricing {
  calmPricePerDay: number;
  cascoPricePerDay: number;
  fullCascoPricePerDay: number;
  minAgeYears: number;
  minExperienceYears: number;
}

/** price = итог за период; при billing === 'perDay' price = pricePerDay * суток */
interface AdditionalOption {
  id: string;
  name: string;
  price: number;
  billing: 'perDay' | 'once';
  pricePerDay?: number;
  tooltip: string;
  showTooltip: boolean;
}

interface PricePeriodRange {
  min: number;
  max: number;
  label: string;
}

function parsePricePeriods(raw: unknown): PricePeriodRange[] {
  if (!Array.isArray(raw)) {
    return [
      { min: 1, max: 2, label: '1-2 дня' },
      { min: 3, max: 7, label: '3-7 дней' },
      { min: 8, max: 15, label: '8-15 дней' },
      { min: 16, max: 31, label: '16-31 дней' },
      { min: 32, max: Number.POSITIVE_INFINITY, label: '32 + дней' },
    ];
  }

  const parsed = raw
    .map((value) => String(value || '').trim())
    .map((value) => {
      const m = value.match(/(\d+)\s*-\s*(\d+)/);
      if (!m) return null;
      const min = Number(m[1]);
      const max = Number(m[2]);
      if (
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        min <= 0 ||
        max < min
      ) {
        return null;
      }
      return { min, max, label: `${min}-${max} дней` };
    })
    .filter((v): v is PricePeriodRange => Boolean(v));

  if (parsed.length === 0) {
    return [
      { min: 1, max: 2, label: '1-2 дня' },
      { min: 3, max: 7, label: '3-7 дней' },
      { min: 8, max: 15, label: '8-15 дней' },
      { min: 16, max: 31, label: '16-31 дней' },
      { min: 32, max: Number.POSITIVE_INFINITY, label: '32 + дней' },
    ];
  }

  const lastMax = parsed[parsed.length - 1].max;
  parsed.push({
    min: lastMax + 1,
    max: Number.POSITIVE_INFINITY,
    label: `${lastMax + 1} + дней`,
  });

  return parsed;
}

export default function ProductClient({ car, allCars }: ProductClientProps) {
  const { openModal } = useRentModal();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mileage, setMileage] = useState('');

  // State for dates selected in modal (if not in URL)
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);

  const startDateFromQuery = searchParams.get('start_date');
  const endDateFromQuery = searchParams.get('end_date');
  const mileageFromQuery = searchParams.get('mileage');
  const fromPage = searchParams.get('from');

  const backToCatalogHref = useMemo(() => {
    if (fromPage === 'catalog') return '/catalog';
    if (fromPage === 'search' && (!startDateFromQuery || !endDateFromQuery)) {
      return '/search';
    }
    if (!startDateFromQuery || !endDateFromQuery) return '/catalog';

    const query = new URLSearchParams({
      start_date: startDateFromQuery,
      end_date: endDateFromQuery,
    });
    if (mileageFromQuery) query.set('mileage', mileageFromQuery);
    return `/search?${query.toString()}`;
  }, [fromPage, startDateFromQuery, endDateFromQuery, mileageFromQuery]);
  const hasSearchPeriodInQuery = Boolean(
    startDateFromQuery && endDateFromQuery
  );

  // Use GET params first, fallback to dates selected in modal
  const startDate = startDateFromQuery || selectedStartDate;
  const endDate = endDateFromQuery || selectedEndDate;

  useEffect(() => {
    setMileage(mileageFromQuery || '');
  }, [mileageFromQuery]);

  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, boolean>
  >({
    'peace-package': false,
    casco: false,
    'casco-no-franchise': false,
    booster: false,
    'child-seat': false,
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
  const [groupVideoLink, setGroupVideoLink] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const mediaFetchedRef = useRef<Set<string>>(new Set());
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalIndex, setImageModalIndex] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showBookingSuccessPopup, setShowBookingSuccessPopup] = useState(false);
  const [activeOptionTooltipId, setActiveOptionTooltipId] = useState<
    string | null
  >(null);
  const [isMobileTooltipViewport, setIsMobileTooltipViewport] = useState(false);
  const [mobileTooltipModal, setMobileTooltipModal] = useState<{
    title: string;
    content: ReactNode;
  } | null>(null);
  const [carDetails, setCarDetails] = useState<Car | null>(null);
  const [isCarDetailsLoading, setIsCarDetailsLoading] = useState(
    Boolean(car?.id)
  );
  const [groupTariffs, setGroupTariffs] = useState<GroupTariffPricing[]>([]);
  const [isGroupPricingLoading, setIsGroupPricingLoading] = useState(
    Boolean(car?.id)
  );
  const [servicePricing, setServicePricing] = useState<ServicePricing>({
    calmPricePerDay: 2000,
    cascoPricePerDay: 1000,
    fullCascoPricePerDay: 3000,
    minAgeYears: 25,
    minExperienceYears: 3,
  });

  const rentalDays = useMemo(
    () => calculateDays(startDate, endDate),
    [startDate, endDate]
  );

  const requestedMileage = useMemo(() => parseMileageInput(mileage), [mileage]);
  const resolvedCar = useMemo(
    () => (carDetails ? { ...car, ...carDetails } : car),
    [car, carDetails]
  );

  // Parse eligibility years with sanity bounds to ignore unrelated fields (e.g. mileage limits).
  const parseMinYears = (
    value: unknown,
    { min = 1, max = 100 }: { min?: number; max?: number } = {}
  ): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
      const n = Math.floor(value);
      return n >= min && n <= max ? n : null;
    }
    const s = String(value);
    const match = s.match(/\d+/);
    if (!match) return null;
    const n = Number(match[0]);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };

  const renterMinAgeYears = useMemo(() => {
    if (
      Number.isFinite(servicePricing.minAgeYears) &&
      servicePricing.minAgeYears >= 18 &&
      servicePricing.minAgeYears <= 80
    ) {
      return Math.floor(servicePricing.minAgeYears);
    }
    const carAny = resolvedCar as any;
    const candidates = [
      carAny.min_age,
      carAny.minAge,
      carAny.age_min,
      carAny.driver_min_age,
      carAny.min_driver_age,
      carAny.required_age,
      carAny.age,
    ];

    return (
      parseMinYears(
        candidates.find((v) => v !== null && v !== undefined),
        {
          min: 18,
          max: 80,
        }
      ) ?? 25
    );
  }, [resolvedCar, servicePricing.minAgeYears]);

  const driverMinExperienceYears = useMemo(() => {
    if (
      Number.isFinite(servicePricing.minExperienceYears) &&
      servicePricing.minExperienceYears >= 1 &&
      servicePricing.minExperienceYears <= 60
    ) {
      return Math.floor(servicePricing.minExperienceYears);
    }
    const carAny = resolvedCar as any;
    const candidates = [
      carAny.min_experience,
      carAny.min_experience_years,
      carAny.experience_min,
      carAny.driver_experience_min,
      carAny.driving_experience_min,
      carAny.min_driver_experience,
      carAny.required_experience,
      carAny.experience_years,
      carAny.stazh,
      carAny.experience,
    ];

    return (
      parseMinYears(
        candidates.find((v) => v !== null && v !== undefined),
        {
          min: 1,
          max: 60,
        }
      ) ?? 3
    );
  }, [resolvedCar, servicePricing.minExperienceYears]);
  const includedMileage = useMemo(() => {
    return getIncludedMileageLimit(rentalDays, resolvedCar?.extra_mileage_km);
  }, [rentalDays, resolvedCar?.extra_mileage_km]);
  const extraMileageKm = useMemo(
    () => getExtraMileageKm(requestedMileage, includedMileage),
    [requestedMileage, includedMileage]
  );
  const extraMileageFee = useMemo(
    () => getExtraMileageFee(extraMileageKm, resolvedCar?.extra_mileage_price),
    [extraMileageKm, resolvedCar?.extra_mileage_price]
  );
  const perDayMileageLimit = useMemo(() => {
    const value = resolvedCar?.extra_mileage_km;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value);
    }
    return DEFAULT_DAILY_INCLUDED_MILEAGE;
  }, [resolvedCar?.extra_mileage_km]);
  const mileageLimitDisplay = useMemo(() => {
    if (startDate && endDate && rentalDays > 0) {
      return `${includedMileage.toLocaleString('ru-RU')} км`;
    }
    return `${perDayMileageLimit.toLocaleString('ru-RU')} км/сутки`;
  }, [startDate, endDate, rentalDays, includedMileage, perDayMileageLimit]);
  const extraMileagePricePerKm = useMemo(() => {
    const value = resolvedCar?.extra_mileage_price;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }
    return DEFAULT_EXTRA_MILEAGE_PRICE_RUB;
  }, [resolvedCar?.extra_mileage_price]);

  useEffect(() => {
    let cancelled = false;

    const fetchCarDetails: () => Promise<void> = async () => {
      if (!car?.id) {
        if (!cancelled) setIsCarDetailsLoading(false);
        return;
      }
      if (!cancelled) setIsCarDetailsLoading(true);
      try {
        const response = await axios.get<{ car?: Car }>(
          `/api/cars/${car.id}/data`
        );
        const data = response.data;

        if (!cancelled && data.car) {
          setCarDetails(data.car);
        }
      } catch (error) {
        console.error('Failed to fetch car_data_with_bookings:', error);
      } finally {
        if (!cancelled) setIsCarDetailsLoading(false);
      }
    };

    fetchCarDetails();
    return () => {
      cancelled = true;
    };
  }, [car?.id]);

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

  useEffect(() => {
    let cancelled = false;

    const fetchGroupPricing = async () => {
      if (!groupKey) {
        if (!cancelled) {
          setGroupTariffs([]);
          setIsGroupPricingLoading(false);
        }
        return;
      }

      setIsGroupPricingLoading(true);
      try {
        const encodedGroupKey = encodeURIComponent(groupKey);
        const response = await fetch(`/api/cars/pricing/${encodedGroupKey}`);
        const data = await response.json();
        if (!cancelled) {
          setGroupTariffs(Array.isArray(data?.tariffs) ? data.tariffs : []);
        }
      } catch (error) {
        console.error('Failed to fetch group pricing:', error);
        if (!cancelled) {
          setGroupTariffs([]);
        }
      } finally {
        if (!cancelled) {
          setIsGroupPricingLoading(false);
        }
      }
    };

    fetchGroupPricing();

    return () => {
      cancelled = true;
    };
  }, [groupKey]);

  const showCalculatedLoader =
    (Boolean(car?.id) && isCarDetailsLoading) || isGroupPricingLoading;

  useEffect(() => {
    let cancelled = false;

    const fetchServicePricing = async () => {
      if (!groupKey) return;
      try {
        const encodedGroupKey = encodeURIComponent(groupKey);
        const response = await fetch(
          `/api/cars/service-pricing/${encodedGroupKey}`
        );
        if (!response.ok) return;

        const data: Partial<ServicePricing> = await response.json();
        if (!cancelled) {
          setServicePricing({
            calmPricePerDay: Number(data?.calmPricePerDay ?? 2000),
            cascoPricePerDay: Number(data?.cascoPricePerDay ?? 1000),
            fullCascoPricePerDay: Number(data?.fullCascoPricePerDay ?? 3000),
            minAgeYears: Number(data?.minAgeYears ?? 25),
            minExperienceYears: Number(data?.minExperienceYears ?? 3),
          });
        }
      } catch (error) {
        console.error('Failed to fetch service pricing:', error);
      }
    };

    fetchServicePricing();
    return () => {
      cancelled = true;
    };
  }, [groupKey]);

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

  useEffect(() => {
    let cancelled = false;

    const fetchVideoLink = async () => {
      if (!groupKey) return;
      try {
        const encodedGroupKey = encodeURIComponent(groupKey);
        const response = await fetch(`/api/cars/${encodedGroupKey}/video-link`);
        if (!response.ok) return;
        const data: { url?: string } = await response.json();
        if (!cancelled) {
          setGroupVideoLink((data?.url || '').trim());
        }
      } catch (error) {
        console.error('Error fetching video link:', error);
      }
    };

    fetchVideoLink();
    return () => {
      cancelled = true;
    };
  }, [groupKey]);

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

  const seatsRange = useMemo(() => {
    const values = Array.from(
      new Set(
        carGroup.flatMap((c) => [
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
  }, [carGroup]);

  const pricingForSelectedDate = useMemo(() => {
    return resolvePricingFromAdminTariffs(groupTariffs, startDate);
  }, [groupTariffs, startDate]);
  const prices = pricingForSelectedDate.prices;
  const pricePeriods = useMemo(() => {
    const sourceCar = resolvedCar as any;
    return parsePricePeriods(sourceCar?.price_periods);
  }, [resolvedCar]);

  const priceRanges = useMemo(
    () =>
      pricePeriods.map((range, index) => ({
        label: range.label,
        price: prices[index] ?? prices[prices.length - 1] ?? 0,
      })),
    [pricePeriods, prices]
  );
  const tariffValidUntilText = useMemo(() => {
    const warningDate = pricingForSelectedDate.tariffWarningDate;
    if (!warningDate) return null;

    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(warningDate);
  }, [pricingForSelectedDate.tariffWarningDate]);
  const shouldShowTariffWarning = pricingForSelectedDate.shouldShowTariffWarning;

  // Calculate daily price based on CRM price_periods and selected tariff prices.
  const getPriceForDays = (days: number): number => {
    if (!days || days < 1) return prices[0] ?? 0;
    const idx = pricePeriods.findIndex(
      (range) => days >= range.min && days <= range.max
    );
    if (idx >= 0) return prices[idx] ?? prices[prices.length - 1] ?? 0;
    return prices[prices.length - 1] ?? 0;
  };
  const getTariffLabelForDays = (days: number): string => {
    if (!days || days < 1) return '';
    const range = pricePeriods.find((r) => days >= r.min && days <= r.max);
    return range?.label || pricePeriods[pricePeriods.length - 1]?.label || '';
  };

  const rentalPrice = useMemo(() => {
    if (!rentalDays) return 0;
    return getPriceForDays(rentalDays) * rentalDays;
  }, [rentalDays, prices]);

  const additionalOptions: AdditionalOption[] = useMemo(() => {
    return [
      {
        id: 'peace-package',
        name: 'Доп. водитель',
        billing: 'once',
        price: 1000,
        tooltip: '',
        showTooltip: false,
      },
      {
        id: 'booster',
        name: 'Пакет "Спокойствие"',
        billing: 'perDay',
        pricePerDay: servicePricing.calmPricePerDay,
        price: servicePricing.calmPricePerDay * rentalDays,
        tooltip:
          'Опция подразумевает освобождение от ответственности за повреждение лобового стекла, стекла фар, бокового стекла и стекла двери транспортного средства в размере его стоимости и работ по замене, освобождение от ответственности за повреждение и утрату шин и дисков.',
        showTooltip: true,
      },
      {
        id: 'casco',
        name: 'Детское кресло',
        billing: 'once',
        price: 1000,
        tooltip: '',
        showTooltip: false,
      },
      {
        id: 'child-seat',
        name: 'КАСКО ',
        billing: 'perDay',
        pricePerDay: servicePricing.cascoPricePerDay,
        price: servicePricing.cascoPricePerDay * rentalDays,
        tooltip:
          'Опция снижает финансовую ответственность Арендатора до 100.000 рублей. В случае повреждения автомобиля или невозврата по своей вине, либо обоюдной вине, либо если виновное лицо не установлено: если ущерб автомобилю не превышает франшизу 100.000 рублей, то Арендатор возмещает размер причиненного ущерба; если ущерб автомобилю превышает франшизу 100.000 рублей, то арендатор выплачивает сумму в размере франшизы; опция покрывает ущерб при наличии надлежащего оформления документов из правоохранительных органов и возврата ключей и документов на автомобиль. Опция не покрывает химчистку салона.',
        showTooltip: true,
      },
      {
        id: 'casco-no-franchise',
        name: 'Аренда бустера',
        billing: 'once',
        price: 1000,
        tooltip: '',
        showTooltip: false,
      },
      {
        id: 'extra-driver',
        name: 'Полное КАСКО',
        billing: 'perDay',
        pricePerDay: servicePricing.fullCascoPricePerDay,
        price: servicePricing.fullCascoPricePerDay * rentalDays,
        tooltip:
          'Опция покрывает ущерб, возникший в результате угона или повреждения автомобиля. Опция покрывает ущерб при наличии надлежащего оформления документов из правоохранительных органов и возврата ключей и документов на автомобиль. Опция не покрывает химчистку салона.',
        showTooltip: true,
      },
    ];
  }, [rentalDays, servicePricing]);

  const totalAdditionalPrice = useMemo(() => {
    return additionalOptions.reduce((sum, option) => {
      return sum + (selectedOptions[option.id] ? option.price : 0);
    }, 0);
  }, [selectedOptions, additionalOptions]);

  // Get selected options for display
  const selectedOptionsList = useMemo(() => {
    return additionalOptions.filter((option) => selectedOptions[option.id]);
  }, [selectedOptions, additionalOptions]);

  // Discount baseline: the most expensive daily tariff
  const maxDailyPrice = useMemo(() => {
    if (!prices || prices.length === 0) return 0;
    return Math.max(...prices);
  }, [prices]);

  const oldRentalPrice = useMemo(() => {
    if (!rentalDays || !maxDailyPrice) return 0;
    return maxDailyPrice * rentalDays;
  }, [maxDailyPrice, rentalDays]);

  const extraTimeFeeInfo = useMemo(() => {
    return calculateExtraTimeFee(startDate, endDate);
  }, [startDate, endDate]);
  const extraTimeFee = extraTimeFeeInfo.totalFee;

  const totalPrice =
    rentalPrice + totalAdditionalPrice + extraTimeFee + extraMileageFee;
  const deposit = useMemo(() => {
    if (
      typeof resolvedCar?.deposit === 'number' &&
      Number.isFinite(resolvedCar.deposit)
    ) {
      return resolvedCar.deposit;
    }
    return null;
  }, [resolvedCar?.deposit]);
  const depositAmount = deposit ?? 0;
  const depositDisplay =
    deposit !== null ? `${deposit.toLocaleString('ru-RU')} ₽` : '—';
  const finalTotalWithDeposit = totalPrice + depositAmount;
  const oldTotalWithDeposit =
    oldRentalPrice +
    totalAdditionalPrice +
    extraTimeFee +
    extraMileageFee +
    depositAmount;
  const showOldTotalWithDiscount = oldTotalWithDeposit > finalTotalWithDeposit;

  const handleOptionToggle = (optionId: string) => {
    // Страховки: можно выбрать только одну из трёх — Пакет "Спокойствие", КАСКО, Полное КАСКО
    const insuranceOptions = new Set(['booster', 'child-seat', 'extra-driver']);

    setSelectedOptions((prev) => {
      const nextValue = !prev[optionId];

      if (insuranceOptions.has(optionId)) {
        return {
          ...prev,
          booster: false,
          'child-seat': false,
          'extra-driver': false,
          [optionId]: nextValue,
        };
      }

      return {
        ...prev,
        [optionId]: nextValue,
      };
    });
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

    if (!getPhoneDigits(phone)) {
      setSubmitStatus({
        type: 'error',
        message: 'Пожалуйста, введите номер телефона',
      });
      return;
    }

    // Check if dates are selected
    const currentStartDate = startDate;
    const currentEndDate = endDate;

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
        .map((opt) => {
          if (
            opt.billing === 'perDay' &&
            opt.pricePerDay != null &&
            rentalDays > 0
          ) {
            return `${opt.name}: ${rentalDays} сут. × ${opt.pricePerDay.toLocaleString('ru-RU')} ₽/сут = ${opt.price.toLocaleString('ru-RU')} ₽`;
          }
          return `${opt.name} — ${opt.price.toLocaleString('ru-RU')} ₽ (за период)`;
        })
        .join('\n');

      // Format car details
      const carDetails = `
🚗 *Автомобиль:*
• Модель: ${formatCarName(randomCar)}
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
      const totalWithoutDeposit = totalPrice;
      const totalWithDeposit = totalPrice + depositAmount;
      const pricingInfo = `
💰 *Стоимость:*
• Аренда: ${rentalPrice.toLocaleString('ru-RU')} ₽
${selectedOptionsText ? `• Дополнительные опции:\n${selectedOptionsText}` : ''}
• Доплата за Нерабоч время: ${
        extraTimeFee > 0
          ? `+ ${extraTimeFee.toLocaleString('ru-RU')} ₽ (${extraTimeFeeInfo.eventsCount} × ${EXTRA_TIME_FEE_PER_EVENT_RUB.toLocaleString('ru-RU')} ₽)`
          : 'нет'
      }
• Пробег поездки: ${
        requestedMileage > 0
          ? `${requestedMileage.toLocaleString('ru-RU')} км`
          : 'не указан'
      }
• Включенный километраж: ${includedMileage.toLocaleString('ru-RU')} км
• Перепробег: ${
        extraMileageKm > 0
          ? `${extraMileageKm.toLocaleString('ru-RU')} км (+ ${extraMileageFee.toLocaleString('ru-RU')} ₽)`
          : 'нет'
      }
• Депозит: ${depositDisplay}
• Итого аренда (без депозита): ${totalWithoutDeposit.toLocaleString('ru-RU')} ₽
• Итого к оплате (с депозитом): ${totalWithDeposit.toLocaleString('ru-RU')} ₽
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
        setSubmitStatus({ type: null, message: '' });
        setShowBookingSuccessPopup(true);
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
    selectedStartDate,
    selectedEndDate,
    startDate,
    endDate,
    rentalDays,
    includedMileage,
    requestedMileage,
    extraMileageKm,
    extraMileageFee,
    rentalPrice,
    selectedOptionsList,
    totalPrice,
    depositAmount,
    finalTotalWithDeposit,
    depositDisplay,
    extraTimeFee,
    extraTimeFeeInfo.eventsCount,
    carGroup,
    openModal,
    formatDateForAPI,
  ]);

  const carName = formatCarName(resolvedCar);

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
      getCarImage(resolvedCar, 0),
      getCarImage(resolvedCar, 1),
      getCarImage(resolvedCar, 2),
      getCarImage(resolvedCar, 3),
    ].filter((image) => !image.includes('rentprog'));
  }, [groupMedia, resolvedCar]);

  // Սբռոս gallery loading при смене машины
  useEffect(() => {
    setGalleryLoaded(false);
  }, [car?.id]);

  // Если изображений нет — сразу считаем галерею «загруженной»
  useEffect(() => {
    if (carImages.length === 0) {
      setGalleryLoaded(true);
    }
  }, [carImages.length]);

  const handleGalleryImageLoad = useCallback(() => {
    // Դարձնում ենք loaded արդեն առաջին հաջող բեռնվելուց հետո,
    // որպեսզի չկախվենք Swiper-ի lazy-loading-ից.
    setGalleryLoaded(true);
  }, []);

  const handleVideoClick = () => {
    if (groupVideoLink) {
      setVideoReady(false);
      setVideoUrl(groupVideoLink);
      setIsVideoModalOpen(true);
    }
  };
  const rutubeEmbedUrl = useMemo(() => getRutubeEmbedUrl(videoUrl), [videoUrl]);

  const parseDateTimeForModal = (dateTime: string | null) => {
    if (!dateTime) return null;
    const [datePart, timePart = '09:00'] = dateTime.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    if (!day || !month || !year) return null;
    return {
      date: new Date(year, month - 1, day),
      time: timePart,
    };
  };

  const handleFindCarsDateClick = () => {
    const parsedStart = parseDateTimeForModal(startDate);
    const parsedEnd = parseDateTimeForModal(endDate);

    openModal({
      initialStartDate: parsedStart?.date,
      initialEndDate: parsedEnd?.date,
      onSave: (
        newStartDate: Date,
        newEndDate: Date,
        newStartTime: string,
        newEndTime: string
      ) => {
        const formattedStartDate = formatDateForAPI(newStartDate, newStartTime);
        const formattedEndDate = formatDateForAPI(newEndDate, newEndTime);

        setSelectedStartDate(formattedStartDate);
        setSelectedEndDate(formattedEndDate);
      },
    });
  };

  const handleFindCarsSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      // If dates are missing, open modal only to fill the inputs
      handleFindCarsDateClick();
      return;
    }

    const query = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    if (mileage.trim()) {
      query.set('mileage', mileage.trim());
    }
    router.push(`/search?${query.toString()}`);
  };

  const handleMileageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setMileage(value);
    }
  };

  const isMobileGalleryViewport = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  }, []);

  const openGalleryLightbox = useCallback(
    (index: number) => {
      if (isMobileGalleryViewport()) return;
      setImageModalIndex(index);
      setIsImageModalOpen(true);
    },
    [isMobileGalleryViewport]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => {
      if (mq.matches) setIsImageModalOpen(false);
    };
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const closeBookingSuccessPopup = useCallback(() => {
    setShowBookingSuccessPopup(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => {
      const isMobile = mq.matches;
      setIsMobileTooltipViewport(isMobile);
      if (!isMobile) {
        setMobileTooltipModal(null);
      }
    };
    mq.addEventListener('change', onChange);
    onChange();
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <MainTemplate headerAnimation={false} minHeight={true}>
      <div className="search-in-wrap">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Каталог автомобилей', href: backToCatalogHref },
              { label: `Аренда ${carName} - ${car.year || ''}г.в` },
            ]}
            showBackButton={true}
            backHref={backToCatalogHref}
          />

          <h1>Аренда {carName}</h1>

          <div className="slider-wrapper">
            <div className="car-gallery relative min-lg:min-h-[400px]">
              {!galleryLoaded && (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[30px] bg-gray-100"
                  aria-hidden="true"
                >
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600" />
                  <span className="text-sm font-medium text-gray-600">
                    Загрузка изображений...
                  </span>
                </div>
              )}
              <div
                className={`gallery-sliders ${
                  galleryLoaded
                    ? 'opacity-100'
                    : 'opacity-0 pointer-events-none'
                }`}
                style={{ transition: 'opacity 0.25s ease-out' }}
              >
                <Swiper
                  modules={[Navigation, Thumbs]}
                  thumbs={{ swiper: thumbsSwiper }}
                  navigation
                  className="main-slider h-[250px]! sm:h-[350px]! lg:h-[473px]!"
                >
                  {carImages.map((image, index) => (
                    <SwiperSlide key={index} className="h-[350px] lg:h-[473px]">
                      {(() => {
                        const resolvedImageSrc = getServerImageUrl(image);
                        const optimizeImage = shouldUseImageOptimizer(resolvedImageSrc);
                        return (
                          <>
                      {index === 0 && groupVideoLink && (
                        <div
                          className="play"
                          onClick={handleVideoClick}
                          style={{ cursor: 'pointer' }}
                        >
                          <img src="/img/play-icon.svg" alt="" />
                          <span>Видеообзор машины</span>
                        </div>
                      )}
                      <Image
                        src={resolvedImageSrc}
                        alt={carName}
                        className="h-[350px] lg:h-[473px] object-cover rounded-[30px] cursor-default min-[768px]:cursor-zoom-in"
                        width={761}
                        height={473}
                        unoptimized={!optimizeImage}
                        onLoad={handleGalleryImageLoad}
                        onClick={() => openGalleryLightbox(index)}
                      />
                          </>
                        );
                      })()}
                    </SwiperSlide>
                  ))}
                </Swiper>

                <Swiper
                  modules={[Navigation, Thumbs]}
                  onSwiper={setThumbsSwiper}
                  className="thumbs-slider"
                  watchSlidesProgress
                  slideToClickedSlide
                  watchOverflow
                  spaceBetween={10}
                  slidesPerView={5}
                  direction="vertical"
                  breakpoints={{
                    0: {
                      direction: 'horizontal',
                      slidesPerView: 4,
                      spaceBetween: 10,
                    },
                    1024: {
                      direction: 'vertical',
                      slidesPerView: 5,
                      spaceBetween: 12,
                    },
                  }}
                >
                  {carImages.map((image, index) => (
                    <SwiperSlide key={index}>
                      {(() => {
                        const resolvedImageSrc = getServerImageUrl(image);
                        const optimizeImage = shouldUseImageOptimizer(resolvedImageSrc);
                        return (
                          <Image
                            src={resolvedImageSrc}
                            alt={carName}
                            width={200}
                            height={150}
                            unoptimized={!optimizeImage}
                          />
                        );
                      })()}
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            </div>

            <ul className="tooltip-list">
              <li>
                <span className="grey">Год выпуска</span>
                <span className="black">
                  {yearRange || resolvedCar.year || '—'}
                </span>
              </li>
              <li>
                <span className="grey">Коробка</span>
                <span className="black">
                  {formatTransmission(resolvedCar.transmission)}
                </span>
              </li>
              <li>
                <span className="grey">Топливо</span>
                <span className="black">{formatFuel(resolvedCar.fuel)}</span>
              </li>
              <li>
                <span className="grey">Мощность</span>
                <span className="black">
                  {resolvedCar.power || resolvedCar.engine_power
                    ? `${resolvedCar.power || resolvedCar.engine_power} л.с`
                    : '—'}
                </span>
              </li>
              <li>
                <span className="grey">Объем двигателя</span>
                <span className="black">
                  {resolvedCar.engine_capacity
                    ? `${resolvedCar.engine_capacity} л.`
                    : '—'}
                </span>
              </li>
              <li>
                <span className="grey">Количество мест</span>
                <span className="black">{seatsRange}</span>
              </li>
              <li>
                <span className="grey">Привод</span>
                <span className="black">
                  {formatDriveUnit(resolvedCar.drive_unit || resolvedCar.drive)}
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
                  ) : resolvedCar.color ? (
                    <span
                      className={getColorClass(resolvedCar.color)}
                      title={resolvedCar.color || undefined}
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
                  <b>
                    {showCalculatedLoader ? (
                      <InlineSkeleton
                        width={96}
                        height={20}
                        className="align-middle"
                      />
                    ) : (
                      `${range.price.toLocaleString('ru-RU')} ₽`
                    )}
                  </b>
                </li>
              ))}
            </ul>
            {showCalculatedLoader && (
              <div className="info-texts" aria-busy="true">
                <img src="/img/info-img.svg" alt="" />
                <p>
                  <span className="block">
                    <InlineSkeleton width={210} height={12} />
                  </span>
                  <span className="mt-1 block">
                    <InlineSkeleton width={170} height={12} />
                  </span>
                </p>
              </div>
            )}
            {!showCalculatedLoader &&
              fromPage !== 'search' &&
              shouldShowTariffWarning &&
              tariffValidUntilText && (
                <div className="info-texts">
                  <img src="/img/info-img.svg" alt="" />
                  <p>
                    <span className="red-text">Внимание!</span> Текущий тариф
                    действует до {tariffValidUntilText} включительно
                  </p>
                </div>
              )}
          </div>

          {hasSearchPeriodInQuery ? (
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
                    {requestedMileage > 0 && (
                      <div className="row">
                        <span>Пробег поездки</span>
                        <b>{requestedMileage.toLocaleString('ru-RU')} км</b>
                      </div>
                    )}
                  </>
                )}

                <div className="row">
                  <span>Перепробег</span>
                  <b>
                    {resolvedCar.extra_mileage_price
                      ? `${resolvedCar.extra_mileage_price.toLocaleString('ru-RU')} ₽ / км`
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

                          {option.showTooltip && (
                            <Tooltip
                              content={
                                <div className="tooltip2">
                                  <h3>{option.name}</h3>
                                  <span>{option.tooltip}</span>
                                </div>
                              }
                              placement="top"
                              isOpen={activeOptionTooltipId === option.id}
                              onOpenChange={(open) =>
                                setActiveOptionTooltipId(
                                  open ? option.id : null
                                )
                              }
                              classNames={{
                                content: 'px-4! py-1! max-w-[260px]!',
                              }}
                            >
                              <button
                                type="button"
                                className="inline-flex items-center justify-center"
                                aria-label={`Информация об опции ${option.name}`}
                                onClick={(e) => {
                                  if (isMobileTooltipViewport) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMobileTooltipModal({
                                      title: option.name,
                                      content: <span>{option.tooltip}</span>,
                                    });
                                    return;
                                  }
                                  setActiveOptionTooltipId((prev) =>
                                    prev === option.id ? null : option.id
                                  );
                                }}
                              >
                                <img src="/img/tooltip-icon.svg" alt="" />
                              </button>
                            </Tooltip>
                          )}
                        </h4>
                        <b className="option-price-line">
                          {option.billing === 'perDay' &&
                          option.pricePerDay != null ? (
                            <>
                              {option.pricePerDay.toLocaleString('ru-RU')} ₽
                              <span className="option-price-unit">/сутки</span>
                            </>
                          ) : (
                            <>
                              {option.price.toLocaleString('ru-RU')} ₽
                              <span className="option-price-unit">
                                {' '}
                                за период
                              </span>
                            </>
                          )}
                        </b>
                      </div>
                    </div>
                  ))}
                </div>

                <ul className="rent-list-items">
                  <li>
                    <span>Возраст арендатора:</span>
                    <b>от {renterMinAgeYears} лет</b>
                  </li>
                  <li>
                    <span>Стаж вождения:</span>
                    <b>от {driverMinExperienceYears} лет</b>
                  </li>
                  <li>
                    <span>Набор документов:</span>
                    <b>Паспорт, водительское удостоверение</b>
                  </li>
                </ul>
              </div>

              <div className="rent-summary">
                <div className="sum-row">
                  <span className="sum-row-label-with-hint">
                    Аренда
                    {rentalDays > 0 && (
                      <Tooltip
                        content={
                          <div className="tooltip2">
                            <span>
                              {showCalculatedLoader ? (
                                <InlineSkeleton width={150} height={14} />
                              ) : (
                                <>
                                  Расчёт: {rentalDays} суток ×{' '}
                                  {getPriceForDays(rentalDays).toLocaleString(
                                    'ru-RU'
                                  )}{' '}
                                  ₽/сутки
                                  <br />
                                  Тариф: {getTariffLabelForDays(rentalDays)}
                                </>
                              )}
                            </span>
                          </div>
                        }
                        placement="top"
                        classNames={{
                          content: 'px-4! py-1! max-w-[280px]!',
                        }}
                      >
                        <button
                          type="button"
                          className="sum-row-hint-btn"
                          aria-label="Как посчитана аренда"
                          onClick={(e) => {
                            if (!isMobileTooltipViewport) return;
                            e.preventDefault();
                            e.stopPropagation();
                            setMobileTooltipModal({
                              title: 'Как посчитана аренда',
                              content: showCalculatedLoader ? (
                                <span>Загрузка расчета...</span>
                              ) : (
                                <span>
                                  Расчёт: {rentalDays} суток ×{' '}
                                  {getPriceForDays(rentalDays).toLocaleString(
                                    'ru-RU'
                                  )}{' '}
                                  ₽/сутки
                                  <br />
                                  Тариф: {getTariffLabelForDays(rentalDays)}
                                </span>
                              ),
                            });
                          }}
                        >
                          <img src="/img/tooltip-icon.svg" alt="" />
                        </button>
                      </Tooltip>
                    )}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {!showCalculatedLoader && oldRentalPrice > rentalPrice && (
                      <>
                        <span
                          style={{
                            textDecoration: 'line-through',
                            opacity: 0.65,
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          {oldRentalPrice.toLocaleString('ru-RU')} ₽
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: '#d9534f',
                            fontWeight: 500,
                          }}
                        >
                          Скидка по тарифу
                        </span>
                      </>
                    )}
                    <b>
                      {showCalculatedLoader ? (
                        <InlineSkeleton
                          width={104}
                          height={22}
                          className="align-middle"
                        />
                      ) : (
                        `${rentalPrice.toLocaleString('ru-RU')} ₽`
                      )}
                    </b>
                  </div>
                </div>

                {/* Display selected options */}
                {selectedOptionsList.map((option, index) => (
                  <motion.div
                    key={option.id}
                    className="sum-row"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <span className="sum-row-label-with-hint">
                      {option.name}
                      <Tooltip
                        content={
                          <div className="tooltip2">
                            {option.billing === 'perDay' &&
                            option.pricePerDay != null ? (
                              rentalDays > 0 ? (
                                <span>
                                  Расчёт: {rentalDays} суток ×{' '}
                                  {option.pricePerDay.toLocaleString('ru-RU')}{' '}
                                  ₽/сутки ={' '}
                                  {option.price.toLocaleString('ru-RU')} ₽
                                </span>
                              ) : (
                                <span>
                                  Ставка:{' '}
                                  {option.pricePerDay.toLocaleString('ru-RU')}{' '}
                                  ₽/сутки (итог после выбора дат)
                                </span>
                              )
                            ) : (
                              <span>Фиксированная сумма за период аренды</span>
                            )}
                          </div>
                        }
                        placement="top"
                        classNames={{
                          content: 'px-4! py-1! max-w-[280px]!',
                        }}
                      >
                        <button
                          type="button"
                          className="sum-row-hint-btn"
                          aria-label="Как посчитана опция"
                          onClick={(e) => {
                            if (!isMobileTooltipViewport) return;
                            e.preventDefault();
                            e.stopPropagation();
                            setMobileTooltipModal({
                              title: `Как посчитана опция: ${option.name}`,
                              content:
                                option.billing === 'perDay' &&
                                option.pricePerDay != null ? (
                                  rentalDays > 0 ? (
                                    <span>
                                      Расчёт: {rentalDays} суток ×{' '}
                                      {option.pricePerDay.toLocaleString(
                                        'ru-RU'
                                      )}{' '}
                                      ₽/сутки ={' '}
                                      {option.price.toLocaleString('ru-RU')} ₽
                                    </span>
                                  ) : (
                                    <span>
                                      Ставка:{' '}
                                      {option.pricePerDay.toLocaleString('ru-RU')}{' '}
                                      ₽/сутки (итог после выбора дат)
                                    </span>
                                  )
                                ) : (
                                  <span>Фиксированная сумма за период аренды</span>
                                ),
                            });
                          }}
                        >
                          <img src="/img/tooltip-icon.svg" alt="" />
                        </button>
                      </Tooltip>
                    </span>
                    <b>{option.price.toLocaleString('ru-RU')} ₽</b>
                  </motion.div>
                ))}

                {extraTimeFee > 0 && (
                  <div className="sum-row">
                    <span>
                    Нераб. время ({extraTimeFeeInfo.eventsCount} ×{' '}
                      {EXTRA_TIME_FEE_PER_EVENT_RUB.toLocaleString('ru-RU')} ₽)
                    </span>
                    <b>+ {extraTimeFee.toLocaleString('ru-RU')} ₽</b>
                  </div>
                )}
                {extraMileageFee > 0 && (
                  <div className="sum-row">
                    <span>
                      Перепробег (+{extraMileageKm.toLocaleString('ru-RU')} км)
                    </span>
                    <b>+ {extraMileageFee.toLocaleString('ru-RU')} ₽</b>
                  </div>
                )}

                <div className="sum-row">
                  <span>Депозит</span>
                  <b>
                    {showCalculatedLoader ? (
                      <InlineSkeleton
                        width={90}
                        height={20}
                        className="align-middle"
                      />
                    ) : (
                      depositDisplay
                    )}
                  </b>
                </div>
                <p className="totla-text">
                  Итоговая стоимость аренды автомобиля:
                </p>
                <div className="total">
                  {!showCalculatedLoader && showOldTotalWithDiscount && (
                    <div className="old">
                      {oldTotalWithDeposit.toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                  <div className="new" id="totalPrice">
                    {showCalculatedLoader ? (
                      <InlineSkeleton
                        width={140}
                        height={30}
                        className="align-middle"
                      />
                    ) : (
                      `${finalTotalWithDeposit.toLocaleString('ru-RU')} ₽`
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Введите имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
                <InputMask
                  mask="+7 ___-___-__-__"
                  replacement={{ _: /\d/ }}
                  showMask={true}
                  type="tel"
                  placeholder="+7 ___-___-__-__"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => phoneMaskOnKeyDown(e, phone, setPhone)}
                  onMouseDown={(e) => {
                    // Ensure mask placeholders are visible on first click
                    setIsPhoneFocused(true);
                    phoneMaskOnFocus(phone, setPhone, e.currentTarget);
                    phoneMaskForceCaretToEnd(e.currentTarget);
                  }}
                  onBlur={() => {
                    setIsPhoneFocused(false);
                    phoneMaskOnBlur(phone, setPhone);
                  }}
                  onFocus={(e) => {
                    setIsPhoneFocused(true);
                    phoneMaskOnFocus(phone, setPhone, e.currentTarget);
                  }}
                  inputMode="tel"
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
                  disabled={isSubmitting || showCalculatedLoader}
                  style={{
                    opacity: isSubmitting || showCalculatedLoader ? 0.6 : 1,
                    cursor:
                      isSubmitting || showCalculatedLoader
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  {isSubmitting ? (
                    'Отправка...'
                  ) : showCalculatedLoader ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Загружаем тарифы...
                    </span>
                  ) : (
                    'Забронировать автомобиль'
                  )}
                </button>

                <p className="note">
                  Оставляя заявку, вы даете согласие на обработку{' '}
                  <a href="/offer">персональных данных</a> и соглашаетесь с{' '}
                  <a href="/privacy">политикой конфиденциальности</a>
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-full border-t border-gray-200 py-6 sm:py-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:w-auto flex items-center justify-between gap-4 sm:gap-10 text-[15px] sm:text-[18px] text-[#373737]">
                  <span>Депозит</span>
                  <b className="text-[18px] sm:text-[21px] text-right">
                    {showCalculatedLoader ? (
                      <InlineSkeleton
                        width={96}
                        height={20}
                        className="align-middle"
                      />
                    ) : (
                      depositDisplay
                    )}
                  </b>
                </div>
                <div className="w-full sm:w-auto flex items-center justify-between gap-4 sm:gap-10 text-[15px] sm:text-[18px] text-[#373737]">
                  <span>Включенный пробег</span>
                  <b className="text-[18px] sm:text-[21px] text-right">
                    {showCalculatedLoader ? (
                      <InlineSkeleton
                        width={122}
                        height={20}
                        className="align-middle"
                      />
                    ) : (
                      mileageLimitDisplay
                    )}
                  </b>
                </div>
                <div className="w-full sm:w-auto flex items-center justify-between gap-4 sm:gap-10 text-[15px] sm:text-[18px] text-[#373737]">
                  <span>Цена 1км перепробега</span>
                  <b className="text-[18px] sm:text-[21px] text-right">
                    {showCalculatedLoader ? (
                      <InlineSkeleton
                        width={116}
                        height={20}
                        className="align-middle"
                      />
                    ) : (
                      `${extraMileagePricePerKm.toLocaleString('ru-RU')} ₽ / км`
                    )}
                  </b>
                </div>
              </div>
              <div className="find-cars">
                <h2>ознакомьтесь с тарифами на другие даты</h2>
                <p>
                  Для ознакомления с тарифами на другие даты воспользуйтесь
                  формой подбора свободного авто
                </p>
                <form
                  className="find-cars-form"
                  onSubmit={handleFindCarsSubmit}
                >
                  <div className="input-wrap">
                    <span>* Доступен с</span>
                    <button
                      type="button"
                      className="date text-left"
                      onClick={() => handleFindCarsDateClick()}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      {startDate
                        ? formatDateDisplay(startDate)
                        : 'Выберите дату и время'}
                    </button>
                  </div>
                  <div className="input-wrap">
                    <span>* Доступен до</span>
                    <button
                      type="button"
                      className="date text-left"
                      onClick={() => handleFindCarsDateClick()}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                      }}
                    >
                      {endDate
                        ? formatDateDisplay(endDate)
                        : 'Выберите дату и время'}
                    </button>
                  </div>
                  <div className="input-wrap">
                    <div className="top">
                      <span>Пробег поездки</span>
                      <a href="https://trace.ati.su/" target="_blank">
                        Как рассчитать?
                      </a>
                    </div>
                    <input
                      type="text"
                      placeholder="Укажите пробег"
                      value={mileage}
                      onChange={handleMileageChange}
                    />
                    <span className="info-text">
                      <img src="/img/info-icon.svg" alt="" />
                      <span>Общий пробег влияет на стоимость поездки</span>
                    </span>
                  </div>
                  <button className="red-btn" type="submit">
                    Найти свободные авто
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {mobileTooltipModal && (
        <div
          className="fixed inset-0 z-3100 bg-black/60 flex items-end sm:items-center justify-center p-3"
          onClick={() => setMobileTooltipModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-4 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[16px] font-semibold text-[#202020] leading-5">
                {mobileTooltipModal.title}
              </h3>
              <button
                type="button"
                aria-label="Закрыть подсказку"
                className="h-8 w-8 shrink-0 rounded-full border border-gray-200 text-gray-600"
                onClick={() => setMobileTooltipModal(null)}
              >
                ×
              </button>
            </div>
            <div className="mt-3 text-[14px] leading-5 text-[#3d3d3d]">
              {mobileTooltipModal.content}
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal (full screen) */}
      {isImageModalOpen && carImages.length > 0 && (
        <div
          className="fixed inset-0 z-[2900] flex items-center justify-center p-4 bg-black/85"
          onClick={() => setIsImageModalOpen(false)}
          style={{
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <div
            className="relative max-w-6xl w-full max-h-[90vh] bg-gradient-to-br from-gray-950 via-black to-gray-900 rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.9)] border border-white/5"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'scaleIn 0.25s ease-out',
            }}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 to-transparent px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/60">
                  <i className="fas fa-image text-white text-xs sm:text-sm" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm sm:text-lg leading-tight">
                    Галерея автомобиля
                  </h3>
                  <p className="text-gray-400 text-[11px] sm:text-xs">
                    Кликните вне изображения, чтобы закрыть
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-white/5 hover:bg-white/15 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:rotate-90 border border-white/20 shadow-md"
                aria-label="Закрыть галерею"
              >
                <i className="fas fa-times text-white text-base sm:text-lg" />
              </button>
            </div>

            {/* Images Swiper */}
            <div className="w-full h-full bg-black pt-14 sm:pt-16 pb-8 sm:pb-10 px-3 sm:px-6">
              <Swiper
                modules={[Navigation]}
                navigation
                initialSlide={imageModalIndex}
                onSlideChange={(swiper) => {
                  setImageModalIndex(swiper.realIndex);
                }}
                className="main-slider"
              >
                {carImages.map((image, index) => (
                  <SwiperSlide key={index}>
                    {(() => {
                      const resolvedImageSrc = getServerImageUrl(image);
                      const optimizeImage = shouldUseImageOptimizer(resolvedImageSrc);
                      return (
                        <div className="flex items-center justify-center w-full h-full">
                          <Image
                            src={resolvedImageSrc}
                            alt={carName}
                            width={1400}
                            height={900}
                            className="w-full h-auto max-h-[78vh] sm:max-h-[80vh] object-contain rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.85)]"
                            unoptimized={!optimizeImage}
                          />
                        </div>
                      );
                    })()}
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Counter bottom-left */}
              <div className="absolute bottom-4 left-4 z-30 px-3 py-1.5 rounded-full bg-black/70 border border-white/10 text-[11px] sm:text-xs text-gray-200 flex items-center gap-2">
                <i className="fas fa-images text-[10px] sm:text-xs text-red-400" />
                <span>
                  {imageModalIndex + 1} / {carImages.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    Видеообзор автомобиля
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
              {/* Loading overlay while видео подготавливается */}
              {!videoReady && !rutubeEmbedUrl && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-400 border-t-red-600" />
                  <span className="text-sm font-medium text-gray-200">
                    Подготовка видео...
                  </span>
                </div>
              )}

              {rutubeEmbedUrl ? (
                <iframe
                  src={rutubeEmbedUrl}
                  className="w-full h-[75vh]"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Видеообзор автомобиля"
                />
              ) : (
                <video
                  src={getServerImageUrl(videoUrl)}
                  className={`w-full h-auto max-h-[85vh] object-contain transition-opacity duration-200 ${
                    videoReady ? 'opacity-100' : 'opacity-0'
                  }`}
                  controls
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onCanPlay={() => setVideoReady(true)}
                  style={{
                    minHeight: '400px',
                  }}
                />
              )}

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

      {showBookingSuccessPopup && (
        <div
          className="fixed inset-0 z-[3200] flex items-center justify-center bg-black/55 p-4"
          onClick={closeBookingSuccessPopup}
        >
          <div
            className="w-full max-w-md rounded-[28px] bg-white p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="text-[24px] font-semibold leading-tight text-[#222]">
              Бронь создана
            </h3>
            <p className="mt-3 text-[16px] leading-6 text-[#444]">
              Бронь создана, ожидайте звонка менеджера.
            </p>
            <button
              type="button"
              className="red-btn mt-5 w-full"
              onClick={closeBookingSuccessPopup}
            >
              Закрыть
            </button>
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
