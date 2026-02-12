'use client';

import { useMemo } from 'react';
import { Tooltip } from '@heroui/react';
import type { Car, PriceItem } from '@/lib/rentprog-api-server';

interface RentalInfoProps {
  car: Car;
  rentalDays: number;
  includedMileage: number;
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

function RentalInfo({ car, rentalDays }: RentalInfoProps) {
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
    if (car.extra_mileage_km) {
      return rentalDays * car.extra_mileage_km;
    }
    return 0;
  }, [rentalDays, car.extra_mileage_km]);

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
              classNames={{
                content: 'px-4! py-1!',
              }}
            >
              <span className="black-text" style={{ cursor: 'help' }}>
                {maxMileage} км
              </span>
            </Tooltip>
          </li>
        )}
      </ul>
      <div className="price-info">
        <div className="top-info">
          <span>
            Стоимость аренды + <b>3 000 ₽</b>
            <Tooltip
              content="Это стоимость дополнительных услуг, таких как страхование, мойка и т.д."
              placement="top"
              classNames={{
                content: 'px-4! py-1!',
              }}
            >
              <img src="/img/tooltip-icon.svg" alt="" />
            </Tooltip>
          </span>
        </div>
        <div className="prices">
          <span className="new-price">
            {totalPrice.toLocaleString('ru-RU')} ₽
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
