'use client';

import { useMemo, useState } from 'react';
import { Tooltip } from '@heroui/react';
import type { Car, PriceItem } from '@/lib/rentprog-api-server';
import {
  calculateExtraTimeFee,
  EXTRA_TIME_FEE_PER_EVENT_RUB,
} from '@/lib/business-hours-fee';
import {
  getExtraMileageFee,
  getExtraMileageKm,
  getIncludedMileageLimit,
} from '@/lib/mileage-pricing';

interface RentalInfoProps {
  car: Car;
  rentalDays: number;
  includedMileage: number;
  requestedMileage?: number;
  startDateTime?: string | null;
  endDateTime?: string | null;
  extraTimeFeeAmount?: number;
}

// Helper function to extract prices array from car
function extractPrices(car: Car): number[] {
  // Check if prices array exists
  const pricesArray = car.prices || car.price;

  if (Array.isArray(pricesArray) && pricesArray.length > 0) {
    // If it's PriceItem[] format, extract values from first price item
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
        // Return first 5 values (corresponding to day ranges)
        return firstPriceItem.values.slice(0, 5);
      } else if (firstPriceItem.values.length > 0) {
        // If less than 5 values, pad with last value
        const values = [...firstPriceItem.values];
        while (values.length < 5) {
          values.push(values[values.length - 1] || 0);
        }
        return values.slice(0, 5);
      }
    }
    // If it's already number array
    if (typeof pricesArray[0] === 'number') {
      const numArray = pricesArray as unknown as number[];
      if (numArray.length >= 5) {
        return numArray.slice(0, 5);
      } else {
        // Pad with last value if less than 5
        const padded = [...numArray];
        while (padded.length < 5) {
          padded.push(padded[padded.length - 1] || 0);
        }
        return padded.slice(0, 5);
      }
    }
  }

  // Fallback: return default prices if not available
  return [5000, 4000, 4000, 3500, 3500];
}

// Get price based on rental days
function getPriceForDays(prices: number[], days: number): number {
  if (prices.length < 5) {
    // If prices array is shorter, use last price
    return prices[prices.length - 1] || 0;
  }

  if (days <= 2) {
    return prices[0];
  } else if (days >= 3 && days <= 7) {
    return prices[1];
  } else if (days >= 8 && days <= 15) {
    return prices[2];
  } else if (days >= 16 && days <= 31) {
    return prices[3];
  } else {
    // 31+ days
    return prices[4];
  }
}

// Format days text in Russian
function formatDaysText(days: number): string {
  if (days === 1) {
    return 'сутки';
  } else if (days >= 2 && days <= 4) {
    return 'суток';
  } else {
    return 'суток';
  }
}

function RentalInfo({
  car,
  rentalDays,
  requestedMileage = 0,
  startDateTime,
  endDateTime,
  extraTimeFeeAmount: extraTimeFeeAmountProp,
}: RentalInfoProps) {
  const [tooltipMileageOpen, setTooltipMileageOpen] = useState(false);
  const [tooltipExtraOpen, setTooltipExtraOpen] = useState(false);
  const [tooltipExtraMileageOpen, setTooltipExtraMileageOpen] = useState(false);

  // Extract prices from car
  const prices = useMemo(() => extractPrices(car), [car]);

  // Calculate price based on rentalDays
  const calculatedPrice = useMemo(() => {
    return getPriceForDays(prices, rentalDays);
  }, [prices, rentalDays]);

  // Calculate total price (price per day * days)
  const totalPrice = useMemo(() => {
    return calculatedPrice * rentalDays;
  }, [calculatedPrice, rentalDays]);

  // Calculate maximum mileage: rentalDays * extra_mileage_km per day
  const maxMileage = useMemo(() => {
    return getIncludedMileageLimit(rentalDays, car.extra_mileage_km);
  }, [rentalDays, car.extra_mileage_km]);

  const computedExtraTimeFee = useMemo(() => {
    return calculateExtraTimeFee(startDateTime, endDateTime);
  }, [startDateTime, endDateTime]);

  const extraTimeFeeAmount =
    extraTimeFeeAmountProp ?? computedExtraTimeFee.totalFee;
  const hasExtraTimeFee = extraTimeFeeAmount > 0;
  const extraMileageKm = useMemo(
    () => getExtraMileageKm(requestedMileage, maxMileage),
    [requestedMileage, maxMileage]
  );
  const extraMileageFee = useMemo(
    () => getExtraMileageFee(extraMileageKm, car.extra_mileage_price),
    [extraMileageKm, car.extra_mileage_price]
  );
  const finalTotalPrice = totalPrice + extraTimeFeeAmount + extraMileageFee;

  return (
    <>
      <ul className="list-border">
        <li>
          <span className="grey-text">Количество суток</span>
          <span className="black-text">
            {rentalDays} {formatDaysText(rentalDays)}
          </span>
        </li>
        {car.extra_mileage_km && (
          <li>
            <span className="grey-text">Включенный километраж</span>
            <Tooltip
              content={`Вы можете проехать максимум ${maxMileage} км согласно указанному количеству дней`}
              placement="top"
              isOpen={tooltipMileageOpen}
              onOpenChange={setTooltipMileageOpen}
              classNames={{
                content: 'px-4! py-1!',
              }}
            >
              <span
                className="black-text"
                style={{ cursor: 'help' }}
                role="button"
                tabIndex={0}
                onClick={() => setTooltipMileageOpen((o) => !o)}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') &&
                  setTooltipMileageOpen((o) => !o)
                }
              >
                {maxMileage} км
              </span>
            </Tooltip>
          </li>
        )}
        {requestedMileage > 0 && (
          <li>
            <span className="grey-text">Пробег поездки</span>
            <span className="black-text">
              {requestedMileage.toLocaleString('ru-RU')} км
            </span>
          </li>
        )}
        {extraMileageKm > 0 && (
          <li>
            <span className="grey-text">Перепробег</span>
            <span className="black-text">
              +{extraMileageKm.toLocaleString('ru-RU')} км (
              {extraMileageFee.toLocaleString('ru-RU')} ₽)
            </span>
          </li>
        )}
      </ul>
      <div className="price-info">
        <div className="top-info">
          <span>
            Стоимость аренды
            {hasExtraTimeFee && (
              <>
                {' '}
                +{' '}
                <b>
                  {Math.round(
                    extraTimeFeeAmount / EXTRA_TIME_FEE_PER_EVENT_RUB
                  ) * EXTRA_TIME_FEE_PER_EVENT_RUB}{' '}
                  ₽
                </b>
                <Tooltip
                  content={`Доплата 2 000 ₽ за каждое событие вне 09:00–18:00 (выдача и/или возврат). Сейчас: ${Math.round(extraTimeFeeAmount / EXTRA_TIME_FEE_PER_EVENT_RUB)} × ${EXTRA_TIME_FEE_PER_EVENT_RUB.toLocaleString('ru-RU')} ₽.`}
                  placement="top"
                  isOpen={tooltipExtraOpen}
                  onOpenChange={setTooltipExtraOpen}
                  classNames={{
                    content: 'px-4! py-1!',
                  }}
                >
                  <span
                    role="button"
                    tabIndex={0}
                    className="inline-flex cursor-pointer align-middle"
                    onClick={() => setTooltipExtraOpen((o) => !o)}
                    onKeyDown={(e) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      setTooltipExtraOpen((o) => !o)
                    }
                  >
                    <img src="/img/tooltip-icon.svg" alt="" />
                  </span>
                </Tooltip>
              </>
            )}
            {extraMileageFee > 0 && (
              <>
                {' '}
                <Tooltip
                  content={`Доплата за перепробег: ${extraMileageKm.toLocaleString(
                    'ru-RU'
                  )} км × ${(car.extra_mileage_price || 15).toLocaleString(
                    'ru-RU'
                  )} ₽/км.`}
                  placement="top"
                  isOpen={tooltipExtraMileageOpen}
                  onOpenChange={setTooltipExtraMileageOpen}
                  classNames={{
                    content: 'px-4! py-1!',
                  }}
                >
                  <b
                    className="ml-2 inline-flex items-center gap-1 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => setTooltipExtraMileageOpen((o) => !o)}
                    onKeyDown={(e) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      setTooltipExtraMileageOpen((o) => !o)
                    }
                  >
                    +{extraMileageFee.toLocaleString('ru-RU')} ₽
                  </b>
                </Tooltip>
              </>
            )}
          </span>
        </div>
        <div className="prices">
          <span className="new-price">
            {finalTotalPrice.toLocaleString('ru-RU')} ₽
          </span>
          <span className="old-price">
            {calculatedPrice.toLocaleString('ru-RU')} ₽/сутки
          </span>
        </div>
      </div>
    </>
  );
}

export default RentalInfo;
